import React, { useState, useMemo, useId, Dispatch, SetStateAction } from 'react'; // <-- שינוי כאן: הוספת Dispatch ו-SetStateAction לייבוא
import { Project, ProjectStatus, User, Team, ProjectPayload, TeamPayload } from '../../types';
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

// שינוי 1: עדכון הממשק (Interface) של הפרופס
interface OverviewTabProps {
    projects: Project[];
    teamLeads: User[];
    users: User[];
    teams: Team[];
    refreshData: () => void;
    // פרופסים חדשים שיגיעו מ-Dashboard דרך TabView
    projectsView: 'active' | 'archived'; // מצב התצוגה הנוכחי (פעילים/ארכיון)
    setProjectsView: Dispatch<SetStateAction<'active' | 'archived'>>; // פונקציה לעדכון מצב התצוגה
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

// קומפוננטת Toggle ללא שינוי מהותי, רק קבלה של פרופסים חדשים
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

// שינוי 2: קבלת פרופסים חדשים ב-OverviewTab
const OverviewTab = ({ projects, teamLeads, users, refreshData, projectsView, setProjectsView }: OverviewTabProps) => {
    const { user, currentUserRole } = useAuth();
    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(null);

    const [statusFilter, setStatusFilter] = useState('all');
    const [teamFilter, setTeamFilter] = useState('all');
    
    const viewToggleLabelId = useId();
    const createProjectModalTitleId = useId();
    const createTeamModalTitleId = useId();
    const editModalTitleId = useId();
    const statusFilterId = useId();
    const teamFilterId = useId();

    const canManageOrg = currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN';

    const projectStatuses: ProjectStatus[] = ['מתוכנן', 'בתהליך', 'לקראת סיום', 'בסיכון', 'מוקפא', 'הושלם'];
    const projectTeams = useMemo(() => Array.from(new Set(projects.flatMap(p => p.team?.map(t => t.name) || []))), [projects]);

    // שינוי 3: השתמש ב-projectsView במקום view ב-useMemo
    const filteredProjects = useMemo(() => {
        console.log("OverviewTab: Re-calculating filteredProjects.");
        console.log("OverviewTab: Current projects prop:", projects);
        console.log("OverviewTab: Current projectsView state (from prop):", projectsView); // שינה את שם הלוג

        return projects
            .filter(p => (projectsView === 'active' ? !p.isArchived : p.isArchived)) // השתמש ב-projectsView
            .filter(p => statusFilter === 'all' || p.status === statusFilter)
            .filter(p => teamFilter === 'all' || p.team.some(t => t.name === teamFilter));
    }, [projects, projectsView, statusFilter, teamFilter]); // עדכן את התלויות

    const handleCreateProject = async (projectData: ProjectPayload) => {
        try {
            await api.createProject(projectData);
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
            await api.updateProject(projectToEdit.id, updatedData);
            refreshData();
            setProjectToEdit(null);
            // אם אתה רוצה שהלשונית תעבור למצב "פעילים" אם הפרויקט לא מאורכב,
            // או "ארכיון" אם הוא מאורכב, הוסף:
            // setProjectsView(projectToEdit.isArchived ? 'archived' : 'active');
            // אחרת, אין צורך לעדכן כאן, והטאב יישאר במקום.
        } catch (error) {
            console.error("Failed to update project:", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };

    const handleEdit = (id: string) => {
        const project = projects.find(p => p.id === id);
        if (project) {
            setProjectToEdit(project);
        }
    };
    
    // שינוי 4: עדכון handleArchive להשתמש ב-setProjectsView
    const handleArchive = async (id: string) => {
        const project = projects.find(p => p.id === id);
        if (!project) return;
        try {
            const newIsArchivedStatus = !project.isArchived; 
            await api.archiveProject(id, newIsArchivedStatus);
            console.log(`OverviewTab: Archive/Unarchive API call completed for project ${id}. Calling refreshData.`); 
            refreshData();
            console.log("OverviewTab: Setting projectsView to:", newIsArchivedStatus ? 'archived' : 'active');
            setProjectsView(newIsArchivedStatus ? 'archived' : 'active'); // השתמש בפונקציה מהפרופס
        } catch (error) {
             console.error("Failed to archive project:", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };

    const handleDelete = (id: string) => {
        setProjectToDeleteId(id);
    };

    const confirmDelete = async () => {
        if (projectToDeleteId) {
            try {
                await api.deleteProject(projectToDeleteId);
                refreshData();
                setProjectToDeleteId(null);
                // לאחר מחיקה, אין צורך לשנות את ה-projectsView, כי הפרויקט כבר לא קיים
                // והטאב הנוכחי אמור להישאר במקומו.
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

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-x-6 gap-y-4 justify-between items-center">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                    <div className="flex items-center gap-x-4">
                        <h2 className="text-2xl font-bold text-gray-800">כל הפרויקטים</h2>
                        <span id={viewToggleLabelId} className="sr-only">בחר תצוגת פרויקטים</span>
                        {/* שינוי 5: העברת פרופסים חדשים ל-ViewToggle */}
                        <ViewToggle view={projectsView} setView={setProjectsView} labelledby={viewToggleLabelId} /> 
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <FilterSelect id={statusFilterId} label="סינון לפי סטטוס" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={projectStatuses} defaultOption="כל הסטטוסים" />
                        <FilterSelect id={teamFilterId} label="סינון לפי צוות" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} options={projectTeams} defaultOption="כל הצוותים" />
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
                                onEdit={permissions.canEditOrArchive ? handleEdit : undefined}
                                onArchive={permissions.canEditOrArchive ? handleArchive : undefined}
                                onDelete={permissions.canDelete ? handleDelete : undefined}
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
        </div>
    );
};

export default OverviewTab;