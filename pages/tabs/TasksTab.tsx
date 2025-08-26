import React, { useState, useMemo, useId, useEffect } from 'react';
import { Project, Task, Comment, TaskStatus, User, TaskPayload } from '../../types';
import * as api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../../components/Modal';
import { PlusIcon } from '../../components/icons';
import AddTaskForm from '../../components/AddTaskForm';
import EditTaskForm from '../../components/EditTaskForm';
import ConfirmationModal from '../../components/ConfirmationModal';
import TaskListItem from '../../components/TaskListItem';
import TaskCardItem from '../../components/TaskCardItem';
import TaskDetailModal from '../../components/TaskDetailModal';

interface TeamMember {
    id: string;
    name: string;
}

interface TasksTabProps {
    projects: Project[];
    teamMembers: TeamMember[];
    refreshData: () => void;
    users: User[];
}

const ViewToggle = ({ view, setView, labelledby }: { view: 'list' | 'card', setView: (view: 'list' | 'card') => void, labelledby: string }) => (
    <div role="radiogroup" aria-labelledby={labelledby} className="flex items-center rounded-lg bg-gray-200 p-1 flex-shrink-0">
        <button
            role="radio"
            aria-checked={view === 'list'}
            onClick={() => setView('list')}
            className={`px-3 py-1 text-xs md:text-sm font-semibold rounded-md transition-colors ${view === 'list' ? 'bg-white shadow-sm text-[#4A2B2C]' : 'text-gray-600 hover:bg-gray-100'}`}
        >
            רשימה
        </button>
        <button
            role="radio"
            aria-checked={view === 'card'}
            onClick={() => setView('card')}
            className={`px-3 py-1 text-xs md:text-sm font-semibold rounded-md transition-colors ${view === 'card' ? 'bg-white shadow-sm text-[#4A2B2C]' : 'text-gray-600 hover:bg-gray-100'}`}
        >
            כרטיסיות
        </button>
    </div>
);

const TasksTab = ({ projects, teamMembers, refreshData, users }: TasksTabProps) => {
    const { user, currentUserRole } = useAuth();
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(false);

    const [userFilter, setUserFilter] = useState<string>('all');
    const [view, setView] = useState<'list' | 'card'>('list');

    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [taskToView, setTaskToView] = useState<Task | null>(null);

    const viewToggleLabelId = useId();
    const addTaskTitleId = useId();
    const editTaskTitleId = useId();
    const viewTaskTitleId = useId();
    const deleteTaskTitleId = useId();

    const selectedProject = useMemo(() => {
        if (!projects || projects.length === 0) return null;
        return projects.find(p => p.id === selectedProjectId);
    }, [projects, selectedProjectId]);
    const currentTaskToView = useMemo(() => tasks.find(t => t.id === taskToView?.id) || null, [tasks, taskToView]);


    // שלב 1: יצירת רשימת משתמשי הפרויקט (עובדים וראשי צוותים) ללא כפילויות
    const projectUsers = useMemo(() => {
        if (!selectedProject) return [];
        const userMap = new Map<string, User>();
        // הוספת ראשי צוותים
        if (selectedProject.teamLeads) {
            selectedProject.teamLeads.forEach(lead => {
                if (lead && lead.id) userMap.set(lead.id, lead);
            });
        }
        // הוספת חברי צוותים
        if (selectedProject.teams) {
            selectedProject.teams.forEach(team => {
                if (team.members) {
                    team.members.forEach(member => {
                        if (member && member.id) userMap.set(member.id, member);
                    });
                }
            });
        }
        return Array.from(userMap.values());
    }, [selectedProject]);

    // רשימת העובדים לסינון (רק ממשתמשי הפרויקט)
    const availableFilterUsers = useMemo(() => {
        return projectUsers;
    }, [projectUsers]);

    // רשימת העובדים לשיוך משימה (רק ממשתמשי הפרויקט)
    const availableUsersForTask = useMemo(() => {
        return projectUsers;
    }, [projectUsers]);


    useEffect(() => {
        const fetchTasks = async () => {
            if (!selectedProjectId) {
                setTasks([]);
                return;
            }
            setLoadingTasks(true);
            try {
                const response = await api.getTasksForProject(selectedProjectId);
                setTasks(response.data);
            } catch (error) {
                console.error("Failed to fetch tasks for project:", error);
                setTasks([]);
            } finally {
                setLoadingTasks(false);
            }
        };

        fetchTasks();
    }, [selectedProjectId]);

    // סינון משימות לפי משתמש שנבחר (לפי id)
    const filteredTasks = useMemo(() => {
        if (userFilter === 'all') {
            return tasks;
        }
        if (!availableFilterUsers || availableFilterUsers.length === 0) {
            return tasks;
        }
        const filteredUser = availableFilterUsers.find(member => member.id === userFilter);
        if (!filteredUser) return tasks;
        return tasks.filter(task => task.assignees?.some(assignee => assignee.id === filteredUser.id));
    }, [tasks, userFilter, availableFilterUsers]);

    const isManager = useMemo(() => {
        if (!user || !selectedProject) return false;
        if (currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN') return true;
        if (currentUserRole === 'TEAM_LEADER' && selectedProject.teamLeads?.some(lead => lead.id === user.id)) {
            return true;
        }
        return false;
    }, [user, selectedProject, currentUserRole]);

    const canUserChangeStatus = useMemo(() => {
        if (!user || !currentTaskToView || !selectedProject) return false;
        if (isManager) return true;
        if (currentTaskToView.assignees?.some(assignee => assignee.id === user.id)) {
            return true;
        }
        return false;
    }, [user, currentTaskToView, selectedProject, isManager]);


    const handleCreateTask = async (taskData: TaskPayload) => {
        if (!selectedProjectId) return;
        try {
            await api.createTask(selectedProjectId, taskData);
            const response = await api.getTasksForProject(selectedProjectId);
            setTasks(response.data);
            setIsAddTaskOpen(false);
        } catch (error) {
            console.error("Failed to create task", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };

    const handleUpdateTask = async (updatedTaskData: Partial<TaskPayload>) => {
        if (!selectedProjectId || !taskToEdit) return;

        try {
            await api.updateTask(selectedProjectId, taskToEdit.id, updatedTaskData);
            const response = await api.getTasksForProject(selectedProjectId);
            setTasks(response.data);
            setTaskToEdit(null);
        } catch (error) {
            console.error("Failed to update task", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };

    const handleUpdateTaskField = async (taskId: string, updates: Partial<TaskPayload>) => {
        if (!selectedProjectId) return;
        try {
            const updatedTask = await api.updateTask(selectedProjectId, taskId, updates);
            setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? updatedTask : t));
        } catch (error) {
            console.error("Failed to update task field", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };


    const confirmDeleteTask = async () => {
        const idToDelete = taskToDelete?.id;
        if (!selectedProjectId || !idToDelete) return;
        try {
            await api.deleteTask(selectedProjectId, idToDelete);
            setTasks(prevTasks => prevTasks.filter(t => t.id !== idToDelete));
            setTaskToDelete(null);
            setTaskToView(null);
        } catch (error) {
            console.error("Failed to delete task", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };

    const handleAddTaskComment = async (commentText: string) => {
        if (!currentTaskToView || !selectedProject || !user) return;

        try {
            const newComment = await api.addTaskComment(selectedProject.id, currentTaskToView.id, commentText);
            const updatedTask = { ...currentTaskToView, comments: [...currentTaskToView.comments, newComment] };
            setTasks(prevTasks => prevTasks.map(t => t.id === currentTaskToView.id ? updatedTask : t));
        } catch (error) {
            console.error("Failed to add comment", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">ניהול משימות</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                    <label htmlFor="project-select" className="sr-only">בחר פרויקט</label>
                    <select
                        id="project-select"
                        value={selectedProjectId}
                        onChange={(e) => {
                            setSelectedProjectId(e.target.value);
                            setUserFilter('all');
                        }}
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#4A2B2C] focus:border-[#4A2B2C] block w-full sm:w-auto p-2"
                    >
                        <option value="">-- בחר פרויקט --</option>
                        {projects.filter(p => !p.isArchived).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>

                    <label htmlFor="user-filter-select" className="sr-only">סנן לפי עובד</label>
                    <select
                        id="user-filter-select"
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                        disabled={!selectedProjectId}
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#4A2B2C] focus:border-[#4A2B2C] block w-full sm:w-auto p-2 disabled:opacity-50"
                    >
                        <option value="all">כל העובדים</option>
                        {availableFilterUsers.map(member => (
                            <option key={member.id} value={member.id}>{member.fullName}</option>
                        ))}
                    </select>

                    <span id={viewToggleLabelId} className="sr-only">בחר תצוגת משימות</span>
                    <ViewToggle view={view} setView={setView} labelledby={viewToggleLabelId} />
                    {isManager && (
                        <button
                            onClick={() => setIsAddTaskOpen(true)}
                            disabled={!selectedProjectId}
                            className="flex items-center space-x-2 space-x-reverse bg-[#4A2B2C] text-white px-3 py-2 text-sm rounded-lg shadow hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>הוסף משימה</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="min-h-[400px]">
                {!selectedProjectId ? (
                    <div className="text-center py-16 px-4 bg-gray-50 rounded-2xl">
                        <p className="text-gray-500">יש לבחור פרויקט כדי להציג את המשימות שלו.</p>
                    </div>
                ) : loadingTasks ? (
                    <div className="text-center py-16 text-gray-500">טוען משימות...</div>
                ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-16 px-4 bg-gray-50 rounded-2xl">
                        <p className="text-gray-500">
                            {tasks.length > 0
                                ? 'לא נמצאו משימות התואמות לסינון הנוכחי.'
                                : 'לא נמצאו משימות עבור פרויקט זה.'
                            }
                        </p>
                    </div>
                ) : view === 'list' ? (
                    <div className="space-y-3">
                        <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1.5fr)] gap-x-4 px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b">
                            <span>סטטוס</span>
                            <span>שם המשימה</span>
                            <span>תאריכים</span>
                            <span>משויכים</span>
                        </div>
                        {filteredTasks.map(task => (
                            <TaskListItem key={task.id} task={task} onView={() => setTaskToView(task)} />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredTasks.map(task => (
                            <TaskCardItem key={task.id} task={task} onView={() => setTaskToView(task)} />
                        ))}
                    </div>
                )}
            </div>

            <Modal isOpen={isAddTaskOpen} onClose={() => setIsAddTaskOpen(false)} titleId={addTaskTitleId} size="sm">
                <AddTaskForm titleId={addTaskTitleId} onSubmit={handleCreateTask} onCancel={() => setIsAddTaskOpen(false)} availableAssignees={availableUsersForTask} />
            </Modal>

            <Modal isOpen={!!taskToEdit} onClose={() => setTaskToEdit(null)} titleId={editTaskTitleId} size="sm">
                {taskToEdit && <EditTaskForm titleId={editTaskTitleId} task={taskToEdit} onSubmit={handleUpdateTask} onCancel={() => setTaskToEdit(null)} users={availableUsersForTask} />}
            </Modal>

            <TaskDetailModal
                isOpen={!!taskToView}
                onClose={() => setTaskToView(null)}
                project={selectedProject ?? null}
                task={currentTaskToView}
                isManager={isManager}
                canUserChangeStatus={canUserChangeStatus}
                onUpdateTaskField={handleUpdateTaskField}
                titleId={viewTaskTitleId}
                onEdit={() => {
                    if (currentTaskToView) setTaskToEdit(currentTaskToView);
                    setTaskToView(null);
                }}
                onDelete={() => {
                    if (currentTaskToView) setTaskToDelete(currentTaskToView);
                    setTaskToView(null);
                }}
                onAddComment={handleAddTaskComment}
            />

            <ConfirmationModal
                isOpen={!!taskToDelete}
                onClose={() => setTaskToDelete(null)}
                onConfirm={confirmDeleteTask}
                title="אישור מחיקת משימה"
                message={`האם אתה בטוח שברצונך למחוק את המשימה "${taskToDelete?.title}"? פעולה זו היא בלתי הפיכה.`}
            />
        </div>
    );
};

export default TasksTab;