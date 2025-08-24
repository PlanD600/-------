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

const Dashboard = () => {
    const { user, currentOrgId, currentUserRole } = useAuth();
    const [currentView, setCurrentView] = useState<'dashboard' | 'projectDetail' | 'settings'>('dashboard');
    const [socket, setSocket] = useState<Socket | null>(null);

    const [activeSettingsCategory, setActiveSettingsCategory] = useState('profile');

    // State management for data from the API
    const [projects, setProjects] = useState<Project[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [orgMembers, setOrgMembers] = useState<Membership[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState(() => {
        const storedTab = localStorage.getItem(LAST_ACTIVE_TAB_KEY);
        return storedTab || 'overview';
    });

    const [projectsView, setProjectsView] = useState<'active' | 'archived'>('active');

    const fetchData = useCallback(async (signal?: AbortSignal) => {
        if (!currentOrgId || !user || !currentUserRole) {
            setProjects([]);
            setTeams([]);
            setOrgMembers([]);
            setConversations([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        console.log("Fetching latest data from server...");

        try {
            const [projectsResponse, teamsResponse, orgMembersResponse, conversationsData] = await Promise.all([
                api.getProjects(user.id, currentUserRole, { page: 1, limit: 100, signal }),
                api.getTeams(user.id, currentUserRole, { page: 1, limit: 100, signal }),
                api.getUsersInOrg(user.id, currentUserRole, { page: 1, limit: 100, signal }),
                api.getConversations(user.id, currentUserRole, { signal }),
            ]);
            
            // ✨ תיקון: מיפוי נכון של שדות הנתונים משמות שונים מהשרת
            const projectsWithCorrectData = projectsResponse.data.map(project => ({
                ...project,
                teamLeads: project.projectTeamLeads?.map(leadRelation => leadRelation.user) || [],
                teams: project.teams || [],
            }));

            setProjects(projectsWithCorrectData);
            setTeams(teamsResponse.data);
            setOrgMembers(orgMembersResponse.data);
            setConversations(conversationsData);

        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Fetch aborted by user/component unmount:', error.message);
                return;
            }
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }

    }, [currentOrgId, user, currentUserRole]);

    useEffect(() => {
        console.log('Dashboard useEffect triggered');
        console.log('currentOrgId:', currentOrgId);
        console.log('activeTab:', activeTab);
        console.log('projectsView:', projectsView);

        const abortController = new AbortController();
        fetchData(abortController.signal);

        return () => {
            console.log("Dashboard useEffect cleanup: Aborting fetch requests.");
            abortController.abort();
        };
    }, [currentOrgId, activeTab, projectsView, fetchData]);

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
    }, [currentOrgId, user]);


    const usersInOrg = useMemo(() => orgMembers
        .map(m => m.user)
        .filter((user, index, self) => user && self.findIndex(u => u.id === user.id) === index),
    [orgMembers]);


    const { teamLeads, teamMembers } = useMemo(() => {
        const leads = new Map<string, User>();
        const members: { id: string, name: string }[] = [];

        orgMembers.forEach(m => {
            if (m.user) {
                members.push({ id: m.user.id, name: m.user.fullName });
                if (m.role === 'TEAM_LEADER' || m.role === 'ADMIN' || m.role === 'SUPER_ADMIN') {
                    if (!leads.has(m.user.id)) {
                        leads.set(m.user.id, m.user);
                    }
                }
            }
        });

        return { teamLeads: Array.from(leads.values()), teamMembers: members };
    }, [orgMembers]);


    const handleNavigate = (view: 'settings' | 'dashboard') => {
        setCurrentView(view);
    }

    if (loading) {
        return <div className="p-8 text-center text-xl">טוען נתונים...</div>
    }

    if (currentView === 'settings') {
        return <SettingsPage
            onBack={() => setCurrentView('dashboard')}
            users={usersInOrg}
            teams={teams}
            allMemberships={orgMembers}
            refreshData={() => fetchData(new AbortController().signal)}
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
                    teamMembers={teamMembers}
                    teamLeads={teamLeads}
                    users={usersInOrg}
                    teams={teams}
                    setTeams={setTeams}
                    conversations={conversations}
                    setConversations={setConversations}
                    socket={socket}
                    refreshData={() => fetchData(new AbortController().signal)}
                    projectsView={projectsView}
                    setProjectsView={setProjectsView}
                    allMemberships={orgMembers}
                />
            </main>
        </div>
    );
};

export default Dashboard;