// src/pages/tabs/OverviewTab.tsx

import React, { useState, useMemo, useId, Dispatch, SetStateAction } from 'react';
import { Project, ProjectStatus, User, Team, ProjectPayload, TeamPayload, FinanceEntryType } from '../../types';
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
//import SearchInput from '../../components/SearchInput';

interface OverviewTabProps {
    projects: Project[];
    teamLeads: User[];
    users: User[];
    teams: Team[];
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

const OverviewTab = ({ projects, teamLeads, users, teams, refreshData, projectsView, setProjectsView }: OverviewTabProps) => {
    const { user, currentUserRole } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [projectToArchive, setProjectToArchive] = useState<Project | null>(null);

    const [statusFilter, setStatusFilter] = useState('all'); // 💡 תיקון: הגדרת ה-state החסר
    const [teamFilter, setTeamFilter] = useState('all'); // 💡 תיקון: הגדרת ה-state החסר

    const canManageOrg = currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN';

    const projectStatuses: ProjectStatus[] = ['מתוכנן', 'בתהליך', 'לקראת סיום', 'בסיכון', 'מוקפא', 'הושלם'];
    const projectTeams = useMemo(() => Array.from(new Set(projects.flatMap(p => p.teams?.map(t => t.name) || []))), [projects]);

    const filteredProjects = useMemo(() => {
        const lowercasedSearch = searchTerm.toLowerCase();
        return projects
            .filter(p => (projectsView === 'active' ? !p.isArchived : p.isArchived))
            .filter(p => statusFilter === 'all' || p.status === statusFilter)
            .filter(p => teamFilter === 'all' || p.teams.some(t => t.name === teamFilter))
            .filter(project => project.title.toLowerCase().includes(lowercasedSearch));
    }, [projects, projectsView, statusFilter, teamFilter, searchTerm]);

    const handleCreateProject = async (projectData: ProjectPayload) => {
        try {
            const newProject = await api.createProject(projectData);

            if (projectData.monthlyBudgets) {
                // לולאה על כל תקציב חודשי כדי ליצור רשומות כספים
                projectData.monthlyBudgets.forEach(async budget => {
                    if (budget.incomeBudget && budget.incomeBudget > 0) {
                        await api.createFinanceEntry({
                            type: 'INCOME',
                            amount: budget.incomeBudget,
                            description: `תקציב הכנסה לפרויקט: ${newProject.title} עבור חודש ${budget.month}/${budget.year}`,
                            date: new Date(budget.year, budget.month - 1).toISOString(),
                            projectId: newProject.id,
                        });
                    }
                    if (budget.expenseBudget && budget.expenseBudget > 0) {
                        await api.createFinanceEntry({
                            type: 'EXPENSE',
                            amount: budget.expenseBudget,
                            description: `תקציב הוצאות לפרויקט: ${newProject.title} עבור חודש ${budget.month}/${budget.year}`,
                            date: new Date(budget.year, budget.month - 1).toISOString(),
                            projectId: newProject.id,
                        });
                    }
                });
            }

            refreshData();
            setIsCreateProjectModalOpen(false);
        } catch (error) {
            console.error("Failed to create project:", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };

    const handleCreateTeam = async (teamData: TeamPayload) => {
        try {
            await api.createTeam(teamData);
            refreshData();
            setIsCreateTeamModalOpen(false);
        } catch (error) {
            console.error("Failed to create team:", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };

    const handleUpdateProjectDetails = async (updatedData: Partial<ProjectPayload>) => {
        if (!projectToEdit) return;
        try {
            console.log("Sending update to server:", updatedData);
            // 💡 עדכון קריטי: שולחים את המבנה החדש של הנתונים
            const updatedProject = await api.updateProject(projectToEdit.id, updatedData);
            console.log("Server response after update:", updatedProject);

            if (updatedData.monthlyBudgets) {
                // 💡 עדכון: הוספת לוגיקה למניעת יצירת רשומות כפולות
                // נשווה בין התקציב החדש לישן לפני יצירת רשומת כספים חדשה
                updatedData.monthlyBudgets.forEach(async newBudget => {
                    const oldBudget = projectToEdit.monthlyBudgets?.find(b => b.year === newBudget.year && b.month === newBudget.month);

                    // בדיקה אם תקציב ההכנסה השתנה
                    if (newBudget.incomeBudget !== oldBudget?.incomeBudget) {
                        await api.createFinanceEntry({
                            type: 'INCOME',
                            amount: newBudget.incomeBudget,
                            description: `עדכון תקציב הכנסה: ${updatedProject.title} עבור חודש ${newBudget.month}/${newBudget.year}`,
                            date: new Date(newBudget.year, newBudget.month - 1, 1).toISOString(),
                            projectId: updatedProject.id,
                        });
                    }

                    // בדיקה אם תקציב ההוצאה השתנה
                    if (newBudget.expenseBudget !== oldBudget?.expenseBudget) {
                        await api.createFinanceEntry({
                            type: 'EXPENSE',
                            amount: newBudget.expenseBudget,
                            description: `עדכון תקציב הוצאות: ${updatedProject.title} עבור חודש ${newBudget.month}/${newBudget.year}`,
                            date: new Date(newBudget.year, newBudget.month - 1, 1).toISOString(),
                            projectId: updatedProject.id,
                        });
                    }
                });
            }

            refreshData();
            setProjectToEdit(null);
        } catch (error) {
            console.error("Failed to update project:", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };
    const handleEdit = (project: Project) => {
        setProjectToEdit(project);
    };

    const handleArchive = async (project: Project) => {
        if (!project) return;
        try {
            const newIsArchivedStatus = !project.isArchived;
            await api.archiveProject(project.id, newIsArchivedStatus);
            refreshData();
            setProjectsView(newIsArchivedStatus ? 'archived' : 'active');
        } catch (error) {
            console.error("Failed to archive project:", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };

    const handleDelete = (project: Project) => {
        setProjectToDelete(project);
    };

    const confirmDelete = async () => {
        if (projectToDelete) {
            try {
                await api.deleteProject(projectToDelete.id);
                refreshData();
                setProjectToDelete(null);
            } catch (error) {
                console.error("Failed to delete project:", error);
                alert(`Error: ${(error as Error).message}`);
            }
        }
    };

    const getProjectPermissions = (project: Project) => {
        const isTeamLeadOfProject = currentUserRole === 'TEAM_LEADER' && project.teamLeads.some(lead => lead.id === user?.id);
        const canEditOrArchive = canManageOrg || isTeamLeadOfProject;
        const canDelete = canManageOrg;

        return {
            canEditOrArchive,
            canDelete
        };
    };

    const viewToggleLabelId = useId();
    const createProjectModalTitleId = useId();
    const createTeamModalTitleId = useId();
    const editModalTitleId = useId();
    const deleteModalTitleId = useId();
    const statusFilterId = useId(); // 💡 תיקון: הגדרת משתנה ה-ID
    const teamFilterId = useId(); // 💡 תיקון: הגדרת משתנה ה-ID

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-x-6 gap-y-4 justify-between items-center">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                    <div className="flex items-center gap-x-4">
                        <h2 className="text-2xl font-bold text-gray-800">כל הפרויקטים</h2>
                        <span id={viewToggleLabelId} className="sr-only">בחר תצוגת פרויקטים</span>
                        <ViewToggle view={projectsView} setView={setProjectsView} labelledby={viewToggleLabelId} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        {/* 💡 תיקון: שימוש נכון במשתני ה-state */}
                        <FilterSelect
                            id={statusFilterId}
                            label="סינון לפי סטטוס"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={projectStatuses}
                            defaultOption="כל הסטטוסים"
                        />
                        <FilterSelect
                            id={teamFilterId}
                            label="סינון לפי צוות"
                            value={teamFilter}
                            onChange={(e) => setTeamFilter(e.target.value)}
                            options={projectTeams}
                            defaultOption="כל הצוותים"
                        />
                    </div>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                    {canManageOrg && (
                        <>
                            <button
                                onClick={() => setIsCreateProjectModalOpen(true)}
                                className="flex items-center space-x-2 space-x-reverse bg-[#4A2B2C] text-white px-4 py-2 rounded-lg shadow hover:bg-opacity-90 transition-colors"
                            >
                                <PlusIcon className="w-5 h-5" />
                                <span>צור פרויקט</span>
                            </button>
                            <button
                                onClick={() => setIsCreateTeamModalOpen(true)}
                                className="flex items-center space-x-2 space-x-reverse bg-white text-[#4A2B2C] border border-gray-300 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                            >
                                <PlusIcon className="w-5 h-5" />
                                <span>צור צוות</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProjects.map(project => {
                        const permissions = getProjectPermissions(project);
                        return (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onClick={() => setSelectedProject(project)}
                                onEdit={permissions.canEditOrArchive ? () => handleEdit(project) : undefined}
                                onArchive={permissions.canEditOrArchive ? () => handleArchive(project) : undefined}
                                onDelete={permissions.canDelete ? () => handleDelete(project) : undefined}
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
                    onSubmit={handleCreateTeam}
                    onCancel={() => setIsCreateTeamModalOpen(false)}
                />
            </Modal>

            <Modal isOpen={!!projectToEdit} onClose={() => setProjectToEdit(null)} titleId={editModalTitleId} size="md">
                {projectToEdit && (
                    <EditProjectForm
                        titleId={editModalTitleId}
                        project={projectToEdit}
                        onSubmit={handleUpdateProjectDetails}
                        onCancel={() => setProjectToEdit(null)}
                        teamLeads={teamLeads}
                        teams={teams} />
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
                isOpen={!!projectToDelete}
                onClose={() => setProjectToDelete(null)}
                onConfirm={confirmDelete}
                title="אישור מחיקה"
                message={`האם אתה בטוח שברצונך למחוק את הפרויקט "${projectToDelete?.title}"? פעולה זו היא בלתי הפיכה.`}
            />
        </div>
    );
};

export default OverviewTab;