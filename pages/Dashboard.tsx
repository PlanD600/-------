import { useState, useEffect, useMemo, useCallback } from 'react';
import { Project, User, Team, Conversation, Notification, Membership } from '../types';
import * as api from '../services/api';
import Header from '../components/Header';
import TabView from '../components/TabView';
import SettingsPage from './SettingsPage';
import { useAuth } from '../hooks/useAuth';
import { io, Socket } from 'socket.io-client'; // חשוב: ייבוא 'io' ו-'Socket'


const Dashboard = () => {
    const { user, currentOrgId } = useAuth();
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
    const [activeTab, setActiveTab] = useState('סקירה כללית');
    const [projectsView, setProjectsView] = useState<'active' | 'archived'>('active'); // <-- הוסף שורה זו


    // עוטפים את fetchData ב-useCallback כדי למנוע יצירה מחדש של הפונקציה בכל רינדור
    const fetchData = useCallback(async (signal?: AbortSignal) => {
        if (!currentOrgId) {
            setProjects([]); // נקה פרויקטים אם אין ארגון נבחר
            setTeams([]);
            setOrgMembers([]);
            setConversations([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        console.log("Fetching latest data from server...");
        try {
            const isArchivedFilter = projectsView === 'archived';
            const [projectsResponse, teamsResponse, orgMembersResponse, conversationsData] = await Promise.all([
                api.getProjects(1, 25, undefined, undefined, signal),
                api.getTeams(1, 25, undefined, undefined, signal),
                api.getUsersInOrg(1, 25, undefined, undefined, signal),
                api.getConversations(signal),
            ]);
            setProjects(projectsResponse.data);
            console.log("Projects after refresh (from server):", projectsResponse.data);

            setTeams(teamsResponse.data);
            setOrgMembers(orgMembersResponse.data);
            setConversations(conversationsData);
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Fetch aborted by user/component unmount:', error.message);
                return; // התעלם משגיאות שנובעות מביטול מכוון של קריאה
            }
            console.error("Failed to fetch dashboard data:", error);
            // Optionally, show an error message to the user
        } finally {
            setLoading(false);
        }
    }, [currentOrgId, activeTab, projectsView]); // <-- הוסף את projectsView כאן

    // שינוי: useEffect זה יכיל את ה-AbortController, והתלות `fetchData` הוסרה
    useEffect(() => {
        console.log('Dashboard useEffect triggered');
        console.log('currentOrgId:', currentOrgId);
        console.log('activeTab:', activeTab);
        console.log('projectsView:', projectsView); // יומן חדש כדי לוודא שזה עובד


        const abortController = new AbortController(); // יצירת AbortController חדש
        fetchData(abortController.signal); // קריאה ל-fetchData והעברת ה-signal

        return () => { // פונקציית ניקוי עבור useEffect
            console.log("Dashboard useEffect cleanup: Aborting fetch requests.");
            abortController.abort(); // ביטול כל קריאות ה-fetch שעדיין רצות
        };
        // השינוי המרכזי כאן: הסרת `fetchData` ממערך התלויות
    }, [currentOrgId, activeTab, projectsView]); // <-- זה התיקון המרכזי!

    // WebSocket connection - ללא שינוי, כי ה-AbortController לא משפיע על סוקטים
    useEffect(() => {
        if (!currentOrgId || !user) return;

        const newSocket = io('http://localhost:3000'); // Socket.IO משתמש ב-http/https, לא ws/wss באופן ישיר
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket.IO connected');
            // Register user for notifications
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
            // Socket.IO מטפל בדרך כלל בניסיונות חיבור מחדש אוטומטיים
        });

        newSocket.on('error_message', (data) => {
            console.error('Server error message:', data.message);
            // הצג הודעת שגיאה למשתמש אם יש צורך
        });

        return () => {
            // סגור את חיבור ה-Socket.IO כאשר הקומפוננטה נפרקת
            newSocket.disconnect();
        };
    }, [currentOrgId, user]);


    const usersInOrg = useMemo(() => orgMembers.map(m => m.user), [orgMembers]);

    const { teamLeads, teamMembers } = useMemo(() => {
        const leads = new Map<string, User>();
        const members: { id: string, name: string }[] = [];

        orgMembers.forEach(m => {
            members.push({ id: m.user.id, name: m.user.fullName });
            if (m.role === 'TEAM_LEADER' || m.role === 'ADMIN' || m.role === 'SUPER_ADMIN') {
                if (!leads.has(m.user.id)) {
                    leads.set(m.user.id, m.user);
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
            refreshData={() => fetchData(new AbortController().signal)} // עדכון כאן
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
                />
            </main>
        </div>
    );
};

export default Dashboard;