import { useState, useEffect, useMemo, useCallback } from 'react';
import { Project, User, Team, Conversation, Notification, Membership, Message } from '../types';
import * as api from '../services/api';
import Header from '../components/Header';
import TabView from '../components/TabView';
import SettingsPage from './SettingsPage';
import { useAuth } from '../hooks/useAuth';
import { io, Socket } from 'socket.io-client';

// קבוע לשמירה ב-LocalStorage
const LAST_ACTIVE_TAB_KEY = 'lastActiveTab';

/**
 * 💡 Hook מותאם אישית לניהול נתוני הדשבורד.
 */
const useDashboardData = (currentOrgId: string | null, user: User | null, currentUserRole: string | null | undefined) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [orgMembers, setOrgMembers] = useState<Membership[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (signal?: AbortSignal) => {
        if (!currentOrgId || !user || !currentUserRole) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        console.log("Fetching latest data from server...");

        try {
            const [projectsResponse, archivedProjectsResponse, teamsResponse, orgMembersResponse, conversationsData] = await Promise.all([
                api.getProjects(user.id, currentUserRole, { page: 1, limit: 100, isArchived: false, signal }),
                api.getProjects(user.id, currentUserRole, { page: 1, limit: 100, isArchived: true, signal }),
                api.getTeams(user.id, currentUserRole, { page: 1, limit: 100, signal }),
                api.getUsersInOrg(user.id, currentUserRole, { page: 1, limit: 100, signal }),
                api.getConversations(user.id, currentUserRole, { signal }),
            ]);

            const teamsMap = new Map<string, Team>(teamsResponse.data.map(team => [team.id, team]));

            const enrichProjectData = (project: Project): Project => {
                const associatedTeams = (project.teams || [])
                    .map(teamRef => teamsMap.get(teamRef.id))
                    .filter((team): team is Team => !!team);

                return {
                    ...project,
                    teamLeads: project.projectTeamLeads?.map(leadRelation => leadRelation.user) || [],
                    teams: associatedTeams,
                };
            };

            const projectsWithCorrectData = projectsResponse.data.map(enrichProjectData);
            const archivedProjectsWithCorrectData = archivedProjectsResponse.data.map(enrichProjectData);

            // 💡 תיקון: חישוב סטטוס ואחוז השלמה על בסיס המשימות
            const calculateProjectStatus = (project: Project): Project => {
                if (!project.tasks || project.tasks.length === 0) {
                    return {
                        ...project,
                        completionPercentage: 0,
                        status: 'מתוכנן' as const
                    };
                }

                const completedTasks = project.tasks.filter(task => task.status === 'הושלם');
                const completionPercentage = Math.round((completedTasks.length / project.tasks.length) * 100);
                
                let status: Project['status'] = 'בתהליך';
                if (completionPercentage === 100) {
                    status = 'הושלם';
                } else if (project.tasks.some(task => task.status === 'תקוע')) {
                    status = 'בסיכון';
                } else if (completionPercentage === 0) {
                    status = 'מתוכנן';
                }

                return {
                    ...project,
                    completionPercentage,
                    status
                };
            };

            const projectsWithCalculatedStatus = projectsWithCorrectData.map(calculateProjectStatus);
            const archivedProjectsWithCalculatedStatus = archivedProjectsWithCorrectData.map(calculateProjectStatus);

            setProjects(projectsWithCalculatedStatus);
            setArchivedProjects(archivedProjectsWithCalculatedStatus);
            setTeams(teamsResponse.data);
            setOrgMembers(orgMembersResponse.data);
            setConversations(conversationsData);

        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.log('Fetch aborted');
                return;
            }
            console.error("Failed to fetch dashboard data:", err);
            setError(err.message || "Failed to fetch data.");
        } finally {
            setLoading(false);
        }
    }, [currentOrgId, user, currentUserRole]);

    const refreshData = useCallback(async () => {
        const abortController = new AbortController();
        await fetchData(abortController.signal);
    }, [fetchData]);

    return {
        projects,
        archivedProjects,
        teams,
        orgMembers,
        conversations,
        notifications,
        setNotifications,
        setConversations,
        setTeams,
        setProjects,
        setArchivedProjects,
        loading,
        error,
        setError,
        refreshData
    };
};

const ErrorPopup = ({ message, onClose }: { message: string, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
            <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white text-right" dir="rtl">
                <div className="mt-3 text-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">שגיאה!</h3>
                    <div className="mt-2 px-7 py-3">
                        <p className="text-sm text-gray-500">{message}</p>
                    </div>
                    <div className="items-center px-4 py-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-[#4A2B2C] text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4A2B2C]"
                        >
                            סגור
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user, currentOrgId, currentUserRole } = useAuth();
    const [currentView, setCurrentView] = useState<'dashboard' | 'projectDetail' | 'settings'>('dashboard');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [activeSettingsCategory, setActiveSettingsCategory] = useState('profile');

    const {
        projects, archivedProjects, teams, orgMembers, conversations, notifications,
        setNotifications, setConversations, setTeams, loading, error, setError, refreshData
    } = useDashboardData(currentOrgId, user, currentUserRole);

    const [activeTab, setActiveTab] = useState(() => {
        const storedTab = localStorage.getItem(LAST_ACTIVE_TAB_KEY);
        return storedTab || 'overview';
    });

    const [projectsView, setProjectsView] = useState<'active' | 'archived'>('active');

    // 💡 שינוי #1: הרמנו את ה-state של השיחה הפעילה לכאן
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

    useEffect(() => {
        if (currentOrgId && user) {
            refreshData();
        }
    }, [currentOrgId, user, refreshData]);

    useEffect(() => {
        localStorage.setItem(LAST_ACTIVE_TAB_KEY, activeTab);
    }, [activeTab]);

    // 💡 שינוי #2: כל הלוגיקה של הסוקט שופרה
    useEffect(() => {
        if (!currentOrgId || !user) return;

        const newSocket = io('https://api.mypland.com');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket.IO connected');
            if (user?.id) {
                newSocket.emit('register_for_notifications', user.id);
            }
        });

        newSocket.on('new_notification', (payload) => {
            console.log('New notification received:', payload);
            setNotifications(prev => [payload, ...prev]);
        });

        const handleNewMessage = (newMessagePayload: any) => {
            console.log('Handling new message with updated logic:', newMessagePayload);

            const conversationId = newMessagePayload.conversationId;

            // שלב 1: התאמת ההודעה החדשה לפורמט אחיד
            const formattedMessage: Message = {
                id: newMessagePayload.id,
                text: newMessagePayload.text,
                createdAt: newMessagePayload.timestamp,
                updatedAt: newMessagePayload.timestamp,
                sender: newMessagePayload.sender,
            };

            setConversations(prevConversations => {
                // שלב 2: מצא את השיחה שאנחנו צריכים לעדכן
                const targetConversation = prevConversations.find(c => c.id === conversationId);

                // אם מסיבה כלשהי השיחה לא קיימת בצד הלקוח, אל תעשה כלום
                if (!targetConversation) {
                    return prevConversations;
                }

                // שלב 3: צור אובייקט חדש ומעודכן עבור השיחה
                const updatedConversation = {
                    ...targetConversation,
                    // צור מערך הודעות חדש שמכיל את כל ההודעות הקודמות + החדשה
                    messages: [...(targetConversation.messages || []), formattedMessage],
                    // עדכן מונה הודעות שלא נקראו (אם זו לא השיחה הפעילה)
                    unreadCount: (targetConversation.id === activeConversationId) ? 0 : (targetConversation.unreadCount || 0) + 1,
                    // 💡 שינוי: עדכן את זמן העדכון האחרון כדי שהמיון יעבוד כראוי
                    updatedAt: new Date().toISOString(),
                };

                // שלב 4: צור רשימה חדשה של כל שאר השיחות (בלי הגרסה הישנה של השיחה שעדכנו)
                const otherConversations = prevConversations.filter(c => c.id !== conversationId);

                // 💡 שינוי: במקום להחזיר את השיחה המעודכנת בראש הרשימה,
                // נחזיר את הרשימה המלאה והקומפוננטה תמיין אותה אוטומטית
                return [updatedConversation, ...otherConversations];
            });
        };

        newSocket.on('new_message', handleNewMessage);

        newSocket.on('disconnect', () => console.log('Socket.IO disconnected'));
        newSocket.on('connect_error', (err) => console.error('Socket.IO connection error:', err));
        newSocket.on('error_message', (data) => console.error('Server error message:', data.message));

        return () => {
            newSocket.off('new_message', handleNewMessage);
            newSocket.disconnect();
        };
    }, [currentOrgId, user, setNotifications, setConversations, activeConversationId]);

    const { usersInOrg, teamLeads, teamMembers } = useMemo(() => {
        if (!orgMembers || orgMembers.length === 0) {
            return { usersInOrg: [], teamLeads: [], teamMembers: [] };
        }

        const validOrgMembers = orgMembers.filter((m): m is Membership & { user: User } => m.user != null);
        const uniqueUsers = Array.from(new Map(validOrgMembers.map(m => [m.user.id, m.user])).values());
        const leads = Array.from(new Map(validOrgMembers
            .filter(m => m.role === 'TEAM_LEADER' || m.role === 'ADMIN' || m.role === 'SUPER_ADMIN')
            .map(m => [m.user.id, m.user])
        ).values());

        const members = uniqueUsers.map(u => ({ id: u.id, name: u.fullName }));

        return {
            usersInOrg: uniqueUsers,
            teamLeads: leads,
            teamMembers: members,
        };
    }, [orgMembers]);

    const handleNavigate = useCallback((view: 'settings' | 'dashboard') => {
        setCurrentView(view);
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-xl">טוען נתונים...</div>;
    }

    if (currentView === 'settings') {
        return <SettingsPage
            onBack={() => setCurrentView('dashboard')}
            users={usersInOrg}
            teams={teams}
            allMemberships={orgMembers}
            refreshData={refreshData}
            activeCategory={activeSettingsCategory}
            setActiveCategory={setActiveSettingsCategory}
        />;
    }

    return (
        <div className="flex flex-col h-screen">
            <Header
                onNavigate={handleNavigate}
                notifications={notifications}
                setNotifications={setNotifications}
            />
            <main className="flex-1 overflow-y-auto">
                <TabView
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    projects={projects}
                    archivedProjects={archivedProjects}
                    teamMembers={teamMembers}
                    teamLeads={teamLeads}
                    users={usersInOrg}
                    teams={teams}
                    setTeams={setTeams}
                    conversations={conversations}
                    setConversations={setConversations}
                    socket={socket}
                    refreshData={refreshData}
                    projectsView={projectsView}
                    setProjectsView={setProjectsView}
                    allMemberships={orgMembers}
                    // 💡 שינוי #3: מעבירים את ה-state וה-setter לקומפוננטת הילד
                    activeConversationId={activeConversationId}
                    setActiveConversationId={setActiveConversationId}
                />
            </main>
            {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
        </div>
    );
};

export default Dashboard;