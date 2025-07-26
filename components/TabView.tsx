


import React, {  useMemo } from 'react';
import { Project, User, Team, Conversation } from '../types';
import OverviewTab from '../pages/tabs/OverviewTab';
import TasksTab from '../pages/tabs/TasksTab';
import FinanceTab from '../pages/tabs/FinanceTab';
import GanttTab from '../pages/tabs/GanttTab';
import ChatTab from '../pages/tabs/ChatTab';
import { useAuth } from '../hooks/useAuth';

interface TeamMember {
    id: string;
    name: string;
}

interface TabViewProps {
    activeTab: string; // הוסף את זה
    onTabChange: (tab: string) => void; // הוסף את זה
    projects: Project[];
    teamMembers: TeamMember[];
    teamLeads: User[];
    users: User[];
    teams: Team[];
    setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
    conversations: Conversation[];
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
    socket: WebSocket | null;
    refreshData: () => void;
}

const TabButton = ({ label, isActive, onClick, id, controlsId }: { label: string, isActive: boolean, onClick: () => void, id: string, controlsId: string }) => (
    <button
        id={id}
        role="tab"
        aria-selected={isActive}
        aria-controls={controlsId}
        onClick={onClick}
        className={`px-4 py-3 font-semibold text-sm transition-colors ${isActive
            ? 'text-[#4A2B2C] border-b-2 border-[#4A2B2C]'
            : 'text-gray-500 hover:text-gray-800'
            }`}
    >
        {label}
    </button>
);


const TabView = ({ activeTab,onTabChange, projects, teamMembers, teamLeads, users, teams, conversations, setConversations, socket, refreshData }: TabViewProps) => {
    const { memberships, currentOrgId } = useAuth();

    const currentUserRole = useMemo(() => {
        return memberships.find(m => m.organizationId === currentOrgId)?.role;
    }, [memberships, currentOrgId]);

    const canViewFinance = currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN';

    const tabs = useMemo(() => [
        { id: 'overview', label: 'מבט על', component: <OverviewTab projects={projects} teamLeads={teamLeads} users={users} teams={teams} refreshData={refreshData} /> },
        { id: 'tasks', label: 'משימות', component: <TasksTab projects={projects} teamMembers={teamMembers} refreshData={refreshData} users={users} /> },
        canViewFinance ? { id: 'finance', label: 'כספים', component: <FinanceTab projects={projects} refreshData={refreshData} /> } : null,
        { id: 'gantt', label: 'גאנט', component: <GanttTab projects={projects} teamMembers={teamMembers} users={users} refreshData={refreshData} /> },
        { id: 'chat', label: 'הודעות', component: <ChatTab conversations={conversations} setConversations={setConversations} users={users} socket={socket} /> }

    ].filter(Boolean) as { id: string, label: string, component: React.ReactNode }[], [projects, teamMembers, teamLeads, users, teams, conversations, socket, refreshData, canViewFinance]);


    return (
        <div>
            <div className="border-b border-gray-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <nav role="tablist" aria-label="ניווט ראשי" className="flex space-x-reverse space-x-4 px-4">
                    {tabs.map(tab => (
                        <TabButton
                            key={tab.id}
                            id={`tab-${tab.id}`}
                            controlsId={`tabpanel-${tab.id}`}
                            label={tab.label}
                            isActive={activeTab === tab.id}
                            onClick={() => onTabChange(tab.id)}
                        />
                    ))}
                </nav>
            </div>
            <div className="p-4 md:p-6 lg:p-8">
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        role="tabpanel"
                        id={`tabpanel-${tab.id}`}
                        aria-labelledby={`tab-${tab.id}`}
                        // Hide inactive tabs instead of unmounting them to preserve state and focus
                        style={{ display: activeTab === tab.id ? 'block' : 'none' }}
                    >
                        {tab.component}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TabView;
