

import React, { useState, useEffect, useMemo } from 'react';
import { Project, User, Team, Conversation, Notification, Membership } from '../types';
import * as api from '../services/api';
import Header from '../components/Header';
import TabView from '../components/TabView';
import SettingsPage from './SettingsPage';
import { useAuth } from '../hooks/useAuth';


const Dashboard = () => {
    const { user, currentOrgId } = useAuth();
    const [currentView, setCurrentView] = useState<'dashboard' | 'projectDetail' | 'settings'>('dashboard');
    const [socket, setSocket] = useState<WebSocket | null>(null);

    // State management for data from the API
    const [projects, setProjects] = useState<Project[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [orgMembers, setOrgMembers] = useState<Membership[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!currentOrgId) return;
        setLoading(true);
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
    };
    
    // Fetch initial data
    useEffect(() => {
        fetchData();
    }, [currentOrgId]);
    
    // WebSocket connection
    useEffect(() => {
      if (!currentOrgId || !user) return;

      const ws = new WebSocket('ws://localhost:3000');
      setSocket(ws);

      ws.onopen = () => {
          console.log('WebSocket connected');
          // Register user for notifications
          if (user?.id) {
             ws.send(JSON.stringify({ event: 'register_for_notifications', payload: user.id }));
          }
      };

      ws.onmessage = (event) => {
          try {
              const messageData = JSON.parse(event.data);
              
              // The server might send different event structures
              const eventName = messageData.event || messageData.type;
              const payload = messageData.payload || messageData;

              if (eventName === 'new_notification') {
                  setNotifications(prev => [payload, ...prev]);
              }
              
              if (eventName === 'new_message') {
                  const { conversationId, ...message } = payload;
                  setConversations(prev => prev.map(c => 
                      c.id === conversationId 
                          ? { ...c, messages: [...(c.messages || []), message] }
                          : c
                  ));
              }
          } catch (error) {
              console.error('Error parsing WebSocket message:', event.data, error);
          }
      };

      ws.onclose = () => {
          console.log('WebSocket disconnected');
          setSocket(null);
      };

      ws.onerror = (error) => {
          console.error('WebSocket error:', error);
      };

      return () => {
          ws.close();
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
                <TabView 
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
