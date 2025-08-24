// src/pages/Dashboard.tsx

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Project, User, Team, Conversation, Notification, Membership } from '../types';
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
    const [orgMembers, setOrgMembers] = useState<User[]>([]);
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
            // ✅ תיקון: הקריאות לפונקציות ה-API עודכנו כדי להתאים לממשק החדש
            const [projectsResponse, archivedProjectsResponse, teamsResponse, orgMembersResponse, conversationsData] = await Promise.all([
                api.getProjects(user.id, currentUserRole, { page: 1, limit: 100, isArchived: false, signal }),
                api.getProjects(user.id, currentUserRole, { page: 1, limit: 100, isArchived: true, signal }),
                api.getTeams(user.id, currentUserRole, { page: 1, limit: 100, signal }),
                api.getUsersInOrg(user.id, currentUserRole, { page: 1, limit: 100, signal }),
                api.getConversations(user.id, currentUserRole, { signal }),
            ]);
            
            const projectsWithCorrectData = projectsResponse.data.map(project => ({
                ...project,
                teamLeads: project.projectTeamLeads?.map(leadRelation => leadRelation.user) || [],
                teams: project.teams || [],
            }));

            const archivedProjectsWithCorrectData = archivedProjectsResponse.data.map(project => ({
                ...project,
                teamLeads: project.projectTeamLeads?.map(leadRelation => leadRelation.user) || [],
                teams: project.teams || [],
            }));

            setProjects(projectsWithCorrectData);
            setArchivedProjects(archivedProjectsWithCorrectData);
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
        setNotifications, setConversations, setTeams, setProjects, setArchivedProjects, loading, error, setError, refreshData
    } = useDashboardData(currentOrgId, user, currentUserRole);

    const [activeTab, setActiveTab] = useState(() => {
        const storedTab = localStorage.getItem(LAST_ACTIVE_TAB_KEY);
        return storedTab || 'overview';
    });

    const [projectsView, setProjectsView] = useState<'active' | 'archived'>('active');

    useEffect(() => {
        console.log('Dashboard useEffect triggered');
        refreshData();
    }, [refreshData]);

    useEffect(() => {
        localStorage.setItem(LAST_ACTIVE_TAB_KEY, activeTab);
        console.log(`Tab changed to ${activeTab}. Saving to localStorage.`);
    }, [activeTab]);

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

        newSocket.on('new_message', (payload) => {
            console.log('New message received:', payload);
            const { conversationId, ...message } = payload;
            setConversations(prev => prev.map(c =>
                c.id === conversationId
                    ? { ...c, messages: [...(c.messages || []), message] }
                    : c
            ));
        });

        newSocket.on('disconnect', () => {
            console.log('Socket.IO disconnected');
            setSocket(null);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error);
        });

        newSocket.on('error_message', (data) => {
            console.error('Server error message:', data.message);
        });

        return () => {
            newSocket.disconnect();
        };
    }, [currentOrgId, user, setNotifications, setConversations]);

    // ✅ תיקון: שיפור ה-useMemo כדי להתמודד עם נתונים לא מלאים ולוודא שהם לא undefined.
    const { usersInOrg, teamLeads, teamMembers } = useMemo(() => {
        if (!orgMembers || orgMembers.length === 0) {
            return { usersInOrg: [], teamLeads: [], teamMembers: [] };
        }

        // Filter out any orgMembers with undefined or null user
        const validOrgMembers = orgMembers.filter(m => m.user != null);

        const uniqueUsers = validOrgMembers
            .map(m => m.user!)
            .filter((user, index, self) => self.findIndex(u => u.id === user.id) === index);

        const leads = new Map<string, User>();
        const members: { id: string, name: string }[] = [];

        validOrgMembers.forEach(m => {
            if (m.user) {
                members.push({ id: m.user.id, name: m.user.fullName });
                if (m.role === 'TEAM_LEADER' || m.role === 'ADMIN' || m.role === 'SUPER_ADMIN') {
                    if (!leads.has(m.user.id)) {
                        leads.set(m.user.id, m.user);
                    }
                }
            }
        });

        return {
            usersInOrg: uniqueUsers,
            teamLeads: Array.from(leads.values()),
            teamMembers: members.filter((member, index, self) => self.findIndex(m => m.id === member.id) === index),
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
                />
            </main>
            {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
        </div>
    );
};

export default Dashboard;