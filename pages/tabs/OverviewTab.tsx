// src/pages/tabs/OverviewTab.tsx

import React, { useState, useMemo, useId, Dispatch, SetStateAction } from 'react';
import { Project, ProjectStatus, User, Team, ProjectPayload, TeamPayload, Membership } from '../../types';
import * as api from '../../services/api';
import ProjectCard from '../../components/ProjectCard';
import Modal from '../../components/Modal';
import { PlusIcon } from '../../components/icons';
import ProjectTasksModal from '../../components/ProjectTasksModal';
import AddProjectForm from '../../components/AddProjectForm';
import EditProjectForm from '../../components/EditProjectForm';
import ConfirmationModal from '../../components/ConfirmationModal';
import TeamForm from '../../components/TeamForm';
import { useAuth } from '../../hooks/useAuth';


interface OverviewTabProps {
    projects: Project[];
    archivedProjects: Project[];
    teamLeads: User[];
    users: User[];
    teams: Team[];
    allMemberships: Membership[];
    refreshData: () => void;
    projectsView: 'active' | 'archived';
    setProjectsView: Dispatch<SetStateAction<'active' | 'archived'>>;
}

const FilterSelect = ({ label, value, onChange, options, defaultOption, id }: { id: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: string[], defaultOption: string }) => (
    <div>
        <label htmlFor={id} className="sr-only">{label}</label>
        <select
            id={id}
            value={value}
            onChange={onChange}
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#4A2B2C] focus:border-[#4A2B2C] block w-full p-2"
        >
            <option value="all">{defaultOption}</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const ViewToggle = ({ view, setView, labelledby }: { view: 'active' | 'archived', setView: (view: 'active' | 'archived') => void, labelledby: string }) => (
    <div role="radiogroup" aria-labelledby={labelledby} className="flex items-center rounded-lg bg-gray-200 p-1">
        <button
            role="radio"
            aria-checked={view === 'active'}
            onClick={() => setView('active')}
            className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${view === 'active' ? 'bg-white shadow-sm text-[#4A2B2C]' : 'text-gray-600 hover:bg-gray-100'}`}
        >
            פעילים
        </button>
        <button
            role="radio"
            aria-checked={view === 'archived'}
            onClick={() => setView('archived')}
            className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${view === 'archived' ? 'bg-white shadow-sm text-[#4A2B2C]' : 'text-gray-600 hover:bg-gray-100'}`}
        >
            ארכיון
        </button>
    </div>
);


const OverviewTab = ({ projects, archivedProjects, teamLeads, users, teams, allMemberships, refreshData, projectsView, setProjectsView }: OverviewTabProps) => {
    const { user, currentUserRole } = useAuth();
    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isTeamsModalOpen, setIsTeamsModalOpen] = useState(false);
    const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
    const [teamToDeleteId, setTeamToDeleteId] = useState<string | null>(null);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(null);

    const [statusFilter, setStatusFilter] = useState('all');
    const [teamFilter, setTeamFilter] = useState('all');
    const [isCreatingTeam, setIsCreatingTeam] = useState(false);

    const viewToggleLabelId = useId();
    const createProjectModalTitleId = useId();
    const createTeamModalTitleId = useId();
    const editModalTitleId = useId();
    const teamsModalTitleId = useId();
    const editTeamModalTitleId = useId();
    const statusFilterId = useId();
    const teamFilterId = useId();

    const canManageOrg = currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN';

    const projectStatuses: ProjectStatus[] = ['מתוכנן', 'בתהליך', 'לקראת סיום', 'בסיכון', 'מוקפא', 'הושלם'];
    const projectTeams = useMemo(() => {
        const allProjects = [...projects, ...archivedProjects];
        return Array.from(new Set(allProjects.flatMap(p => p.teams?.map(t => t.name) || [])));
    }, [projects, archivedProjects]);

    const filteredProjects = useMemo(() => {
        const projectsToFilter = projectsView === 'active' ? projects : archivedProjects;
        return projectsToFilter
            .filter(p => statusFilter === 'all' || p.status === statusFilter)
            .filter(p => teamFilter === 'all' || p.teams.some(t => t.name === teamFilter));
    }, [projects, archivedProjects, projectsView, statusFilter, teamFilter]);

    const handleCreateProject = async (projectData: ProjectPayload) => {
        try {
            await api.createProject(projectData);
            refreshData();
            setIsCreateProjectModalOpen(false);
            // חזרה לתצוגת הפרויקטים הפעילים אחרי יצירת פרויקט
            setProjectsView('active');
        } catch (error) {
            console.error("Failed to create project:", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };

    const handleCreateTeam = async (teamData: TeamPayload) => {
        setIsCreatingTeam(true);
        try {
            await api.createTeam(teamData);
            refreshData();
            setIsCreateTeamModalOpen(false);
            // חזרה לתצוגת הפרויקטים הפעילים אחרי יצירת צוות
            setProjectsView('active');
        } catch (error) {
            console.error("Failed to create team:", error);
            alert(`Error: ${(error as Error).message}`);
        } finally {
            setIsCreatingTeam(false);
        }
    };

    const handleUpdateTeam = async (data: TeamPayload) => {
        if (!teamToEdit) return;
        try {
            await api.updateTeam(teamToEdit.id, data);
            refreshData();
            setTeamToEdit(null);
            setIsTeamsModalOpen(true);
        } catch (error) {
            console.error('Failed to update team:', error);
            alert(`Error: ${(error as Error).message}`);
        }
    };

    const handleDeleteTeam = async () => {
        if (!teamToDeleteId) return;
        try {
            await api.deleteTeam(teamToDeleteId);
            refreshData();
            setTeamToDeleteId(null);
        } catch (error) {
            console.error('Failed to delete team:', error);
            alert(`Error: ${(error as Error).message}`);
        }
    };

    const handleUpdateProjectDetails = async (updatedData: Partial<ProjectPayload>) => {
        if (!projectToEdit) return;
        try {
            await api.updateProject(projectToEdit.id, updatedData);
            refreshData();
            setProjectToEdit(null);
            // חזרה לתצוגת הפרויקטים הפעילים אחרי עדכון פרויקט
            setProjectsView('active');
        } catch (error) {
            console.error("Failed to update project:", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };

    const handleEdit = (id: string) => {
        // מחפש פרויקט ברשימת הפרויקטים הפעילים או בארכיון
        const project = projects.find(p => p.id === id) || archivedProjects.find(p => p.id === id);
        if (project) {
            setProjectToEdit(project);
        }
    };

    const handleArchive = async (id: string) => {
        // מחפש פרויקט ברשימת הפרויקטים הפעילים או בארכיון
        const project = projects.find(p => p.id === id) || archivedProjects.find(p => p.id === id);
        if (!project) return;
        try {
            const newIsArchivedStatus = !project.isArchived;
            await api.archiveProject(id, newIsArchivedStatus);
            refreshData();
            // אם הפרויקט עבר לארכיון, נשאר בתצוגת הארכיון
            // אם הפרויקט חזר מהארכיון, נחזור לתצוגת הפרויקטים הפעילים
            setProjectsView(newIsArchivedStatus ? 'archived' : 'active');
        } catch (error) {
            console.error("Failed to archive project:", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };

    const handleDelete = (id: string) => {
        // מחפש פרויקט ברשימת הפרויקטים הפעילים או בארכיון
        const project = projects.find(p => p.id === id) || archivedProjects.find(p => p.id === id);
        if (project) {
            setProjectToDeleteId(id);
        }
    };

    const confirmDelete = async () => {
        if (projectToDeleteId) {
            try {
                await api.deleteProject(projectToDeleteId);
                refreshData();
                setProjectToDeleteId(null);
                // אם הפרויקט שנמחק היה בארכיון, נחזור לתצוגת הפרויקטים הפעילים
                if (projectsView === 'archived') {
                    setProjectsView('active');
                }
            } catch (error) {
                console.error("Failed to delete project:", error);
                alert(`Error: ${(error as Error).message}`);
            }
        }
    };

    const getProjectPermissions = (project: Project) => {
        const isTeamLeadOfProject = currentUserRole === 'TEAM_LEADER' && project.teamLeads?.some(lead => lead.id === user?.id);
        const canEditOrArchive = canManageOrg || isTeamLeadOfProject;
        const canDelete = canManageOrg;

        return {
            canEditOrArchive,
            canDelete
        };
    };

    return (
        <div className="space-y-6">
            {/* ... קוד ה-JSX של הכותרת והפילטרים נשאר זהה ... */}
            <div className="flex flex-wrap gap-x-6 gap-y-4 justify-between items-center">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                    <div className="flex items-center gap-x-4">
                        <h2 className="text-2xl font-bold text-gray-800">כל הפרויקטים</h2>
                        <span id={viewToggleLabelId} className="sr-only">בחר תצוגת פרויקטים</span>
                        <ViewToggle view={projectsView} setView={setProjectsView} labelledby={viewToggleLabelId} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <FilterSelect id={statusFilterId} label="סינון לפי סטטוס" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={projectStatuses} defaultOption="כל הסטטוסים" />
                        <FilterSelect id={teamFilterId} label="סינון לפי צוות" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} options={projectTeams} defaultOption="כל הצוותים" />
                    </div>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                    {canManageOrg && (
                        <button onClick={() => setIsCreateProjectModalOpen(true)} className="...">
                            <PlusIcon />
                            <span>צור פרויקט</span>
                        </button>
                    )}
                    {canManageOrg && (
                        <button onClick={() => setIsCreateTeamModalOpen(true)} className="...">
                            <PlusIcon />
                            <span>צור צוות</span>
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setIsTeamsModalOpen(true)}
                    className="flex items-center space-x-2 space-x-reverse bg-white text-[#4A2B2C] border border-gray-300 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                >
                    <span>צוות</span>
                </button>
            </div>

            {/* ... קוד ה-JSX של רשימת הפרויקטים נשאר זהה ... */}
            {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProjects.map(project => {
                        const permissions = getProjectPermissions(project);
                        return (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onClick={() => {
                                    // מחפש פרויקט ברשימת הפרויקטים הפעילים או בארכיון
                                    const fullProject = projects.find(p => p.id === project.id) || archivedProjects.find(p => p.id === project.id);
                                    if (fullProject) {
                                        setSelectedProject(fullProject);
                                    }
                                }}
                                onEdit={canManageOrg ? handleEdit : undefined}
                                onArchive={canManageOrg ? handleArchive : undefined}
                                onDelete={canManageOrg ? handleDelete : undefined}
                            />
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-16 px-4 bg-gray-50 rounded-2xl">
                    <p className="text-gray-600">לא נמצאו פרויקטים התואמים את הסינון הנוכחי.</p>
                    <p className="text-gray-400 text-sm mt-2">אפשר לשנות את אפשרויות הסינון או ליצור פרויקט חדש.</p>
                </div>
            )}

            <Modal isOpen={isCreateProjectModalOpen} onClose={() => setIsCreateProjectModalOpen(false)} titleId={createProjectModalTitleId} size="md">
                <AddProjectForm
                    titleId={createProjectModalTitleId}
                    onSubmit={handleCreateProject}
                    onCancel={() => setIsCreateProjectModalOpen(false)}
                    teamLeads={teamLeads}
                    teams={teams}
                />
            </Modal>

            <Modal isOpen={isCreateTeamModalOpen} onClose={() => setIsCreateTeamModalOpen(false)} titleId={createTeamModalTitleId}>
                <TeamForm
                    titleId={createTeamModalTitleId}
                    users={users}
                    allMemberships={allMemberships}
                    onSubmit={handleCreateTeam}
                    onCancel={() => setIsCreateTeamModalOpen(false)}
                    isLoading={isCreatingTeam}
                />
            </Modal>

            {/* Teams list modal */}
            <Modal isOpen={isTeamsModalOpen} onClose={() => setIsTeamsModalOpen(false)} titleId={teamsModalTitleId}>
                <div className="space-y-4">
                    <h3 id={teamsModalTitleId} className="text-lg font-bold text-gray-800">צוותים</h3>
                    {(() => {
                        const userId = user?.id;
                        const userTeams = teams.filter(t => (t.leadIds?.includes(userId || '') || t.memberIds?.includes(userId || '')));
                        const teamsToShow = (currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN') ? teams : (currentUserRole === 'TEAM_LEADER' || currentUserRole === 'EMPLOYEE') ? (userTeams.slice(0, 1)) : [];

                        if (!teamsToShow || teamsToShow.length === 0) {
                            return <div className="text-gray-500">לא קיימים צוותים להצגה.</div>;
                        }

                        const getLeadNames = (team: Team) => {
                            if (team.leads && team.leads.length > 0) return team.leads.map(u => u.fullName).join(', ');
                            if (team.teamLeads && team.teamLeads.length > 0) return team.teamLeads.map(l => l.user.fullName).join(', ');
                            if (team.leadIds && team.leadIds.length > 0) {
                                const mapped = team.leadIds.map(id => users.find(u => u.id === id)?.fullName).filter(Boolean) as string[];
                                return mapped.join(', ');
                            }
                            return '—';
                        };
                        const getMemberNames = (team: Team) => {
                            if (team.members && team.members.length > 0) return team.members.map(u => u.fullName).join(', ');
                            if (team.memberIds && team.memberIds.length > 0) {
                                const mapped = team.memberIds.map(id => users.find(u => u.id === id)?.fullName).filter(Boolean) as string[];
                                return mapped.join(', ');
                            }
                            return '—';
                        };

                        return (
                            <div className="space-y-3">
                                {teamsToShow.map(team => (
                                    <div key={team.id} className="flex items-start justify-between p-4 bg-white border border-gray-200 rounded-lg">
                                        <div className="space-y-1">
                                            <div className="text-base font-semibold text-gray-900">{team.name}</div>
                                            <div className="text-sm text-gray-600"><span className="font-medium">ראש צוות:</span> {getLeadNames(team)}</div>
                                            <div className="text-sm text-gray-600"><span className="font-medium">חברי צוות:</span> {getMemberNames(team)}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            {((currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN') || (currentUserRole === 'TEAM_LEADER' && (team.leadIds?.includes(userId || '') || team.leads?.some(l => l.id === userId)))) && (
                                                <button onClick={() => { setTeamToEdit(team); setIsTeamsModalOpen(false); }} className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">עריכה</button>
                                            )}
                                            {(currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN') && (
                                                <button onClick={() => setTeamToDeleteId(team.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded-md">מחיקה</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            </Modal>

            {/* Edit team modal */}
            <Modal isOpen={!!teamToEdit} onClose={() => setTeamToEdit(null)} titleId={editTeamModalTitleId}>
                {teamToEdit && (
                    <TeamForm
                        titleId={editTeamModalTitleId}
                        team={teamToEdit}
                        users={users}
                        allMemberships={allMemberships}
                        onSubmit={handleUpdateTeam}
                        onCancel={() => setTeamToEdit(null)}
                    />
                )}
            </Modal>

            <Modal isOpen={!!projectToEdit} onClose={() => setProjectToEdit(null)} titleId={editModalTitleId} size="md">
                {projectToEdit && (
                    <EditProjectForm
                        titleId={editModalTitleId}
                        project={projectToEdit}
                        onSubmit={handleUpdateProjectDetails}
                        onCancel={() => setProjectToEdit(null)}
                        teamLeads={teamLeads}
                        teams={teams}
                    />
                )}
            </Modal>

            <ProjectTasksModal
                isOpen={!!selectedProject}
                project={selectedProject}
                onClose={() => setSelectedProject(null)}
                refreshProject={refreshData}
                users={users}
            />

            <ConfirmationModal
                isOpen={!!projectToDeleteId}
                onClose={() => setProjectToDeleteId(null)}
                onConfirm={confirmDelete}
                title="אישור מחיקה"
                message="האם אתה בטוח שברצונך למחוק פרויקט זה? פעולה זו היא בלתי הפיכה."
            />

            <ConfirmationModal
                isOpen={!!teamToDeleteId}
                onClose={() => setTeamToDeleteId(null)}
                onConfirm={handleDeleteTeam}
                title="מחיקת צוות"
                message="האם אתה בטוח שברצונך למחוק צוות זה? פעולה זו היא בלתי הפיכה."
            />
        </div>
    );
};

export default OverviewTab;