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

    // State management for data from the API
    const [projects, setProjects] = useState<Project[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [orgMembers, setOrgMembers] = useState<Membership[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('סקירה כללית'); 

    // עוטפים את fetchData ב-useCallback כדי למנוע יצירה מחדש של הפונקציה בכל רינדור
    const fetchData = useCallback(async () => {
        if (!currentOrgId) return;
        setLoading(true);
        console.log("Fetching latest data from server..."); // נוספה הדפסה לבדיקה
        try {
            const [projectsResponse, teamsResponse, orgMembersResponse, conversationsData] = await Promise.all([
                api.getProjects(),
                api.getTeams(),
                api.getUsersInOrg(),
                api.getConversations(),
            ]);
            setProjects(projectsResponse.data);
            setTeams(teamsResponse.data);
            setOrgMembers(orgMembersResponse.data);
            setConversations(conversationsData);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
            // Optionally, show an error message to the user
        } finally {
            setLoading(false);
        }
    }, [currentOrgId]); // התלות נשארת currentOrgId
    
    // useEffect זה יפעל רק פעם אחת כשהארגון משתנה, וגם בכל פעם שהטאב משתנה
    useEffect(() => {
        fetchData();
    }, [currentOrgId, activeTab, fetchData]); // הוספנו את activeTab ו-fetchData כתלויות
    
    // WebSocket connection - ללא שינוי
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
            refreshData={fetchData}
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
                {/* חשוב לוודא שהקומפוננטה TabView מקבלת את 
                  activeTab ו-setActiveTab כ-props כדי שהיא תוכל לעדכן את ה-state כאן
                */}
                <TabView 
                    activeTab={activeTab}
                    onTabChange={setActiveTab} // הוספנו onTabChange
                    projects={projects}
                    teamMembers={teamMembers}
                    teamLeads={teamLeads}
                    users={usersInOrg}
                    teams={teams}
                    setTeams={setTeams}
                    conversations={conversations}
                    setConversations={setConversations}
                    socket={socket}
                    refreshData={fetchData}
                />
            </main>
        </div>
    );
};

export default Dashboard;