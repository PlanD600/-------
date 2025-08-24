import React, { useMemo, Dispatch, SetStateAction } from 'react';
import { Project, User, Team, Conversation, Membership } from '../types';
import OverviewTab from '../pages/tabs/OverviewTab';
import TasksTab from '../pages/tabs/TasksTab';
import FinanceTab from '../pages/tabs/FinanceTab';
import GanttTab from '../pages/tabs/GanttTab';
import ChatTab from '../pages/tabs/ChatTab';
import { useAuth } from '../hooks/useAuth';
import { Socket } from 'socket.io-client';

interface TeamMember {
    id: string;
    name: string;
}

interface TabViewProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    projects: Project[];
    archivedProjects: Project[];
    teamMembers: TeamMember[];
    teamLeads: User[];
    users: User[];
    teams: Team[];
    allMemberships: Membership[];
    setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
    conversations: Conversation[];
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
    socket: Socket | null;
    refreshData: () => void;
    projectsView: 'active' | 'archived';
    setProjectsView: Dispatch<SetStateAction<'active' | 'archived'>>;
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


const TabView = ({ activeTab, onTabChange, projects, archivedProjects, teamMembers, teamLeads, users, teams, allMemberships, conversations, setConversations, socket, refreshData, projectsView, setProjectsView }: TabViewProps) => {
    const { memberships, currentOrgId } = useAuth();

    const currentUserRole = useMemo(() => {
        return memberships.find(m => m.organizationId === currentOrgId)?.role;
    }, [memberships, currentOrgId]);

    const canViewFinance = currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN';

    const tabs = useMemo(() => [
        {
            id: 'overview',
            label: 'מבט על',
            component: (
                <OverviewTab
                    projects={projects}
                    archivedProjects={archivedProjects}
                    teamLeads={teamLeads}
                    users={users}
                    teams={teams}
                    allMemberships={allMemberships}
                    refreshData={refreshData}
                    projectsView={projectsView}
                    setProjectsView={setProjectsView}
                />
            )
        },
        { id: 'tasks', label: 'משימות', component: <TasksTab projects={projects} teamMembers={teamMembers} refreshData={refreshData} users={users} /> },
        canViewFinance ? { id: 'finance', label: 'כספים', component: <FinanceTab projects={projects} refreshData={refreshData} /> } : null,
        { id: 'gantt', label: 'גאנט', component: <GanttTab projects={projects} users={users} refreshData={refreshData} /> },
        { id: 'chat', label: 'הודעות', component: <ChatTab conversations={conversations} setConversations={setConversations} users={users} socket={socket} /> }

    ].filter(Boolean) as { id: string, label: string, component: React.ReactNode }[], [projects, archivedProjects, teamMembers, teamLeads, users, teams, conversations, socket, refreshData, canViewFinance, projectsView, setProjectsView, allMemberships]);


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