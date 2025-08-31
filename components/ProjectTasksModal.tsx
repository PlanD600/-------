import React, { useState, useId, useEffect, useMemo } from 'react';
import { Project, Task, TaskStatus, User, TaskPayload } from '../types';
import * as api from '../services/api';
import Modal from './Modal';
import AddTaskForm from './AddTaskForm';
import { PlusIcon, CloseIcon } from './icons';

interface ProjectTasksModalProps {
    isOpen: boolean;
    project: Project | null;
    onClose: () => void;
    users: User[];
    refreshProject: () => void;
}

const statusStyles: { [key in TaskStatus]: { bg: string; text: string; } } = {
    'הושלם': { bg: 'bg-green-100', text: 'text-green-800' },
    'בתהליך': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    'תקוע': { bg: 'bg-red-100', text: 'text-red-800' },
    'מתוכנן': { bg: 'bg-gray-100', text: 'text-gray-800' },
    'בסיכון': { bg: 'bg-red-200', text: 'text-red-900' },
};

const InfoItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div>
        <span className="text-gray-500 font-normal">{label}: </span>
        <span className="font-semibold text-gray-700">{value}</span>
    </div>
);

const ProjectTasksModal = ({ isOpen, project, onClose, users, refreshProject }: ProjectTasksModalProps) => {
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const mainModalTitleId = useId();
    const addTaskModalTitleId = useId();

    const fetchTasks = async () => {
        if (!project) return;
        setIsLoading(true);
        try {
            const response = await api.getTasksForProject(project.id);
            setTasks(response.data);
        } catch (error) {
            console.error("Failed to fetch tasks for project modal:", error);
            setTasks([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && project) {
            fetchTasks();
        }
    }, [isOpen, project]);


    // 💡 שימוש ב-useMemo כדי לסנן את רשימת המשתמשים הרלוונטיים לפרויקט הנוכחי.
    // הלוגיקה זהה לזו שהטמענו ב-TasksTab.
    const projectUsers = useMemo(() => {
        if (!project) return [];
        const relevantUserIds = new Set<string>();

        // 1. הוספת ראשי צוותים המשויכים ישירות לפרויקט
        project.teamLeads?.forEach(lead => {
            if (lead?.id) {
                relevantUserIds.add(lead.id);
            }
        });

        // 2. הוספת כל חברי הצוות וראשי הצוותים מהצוותים המשויכים לפרויקט
        project.teams?.forEach(team => {
            team.leadIds?.forEach(leadId => relevantUserIds.add(leadId));
            team.memberIds?.forEach(memberId => relevantUserIds.add(memberId));
        });

        // 3. סינון רשימת המשתמשים הכללית (`users`) כדי להחזיר רק את הרלוונטיים
        return users.filter(user => relevantUserIds.has(user.id));
    }, [project, users]);


    if (!project) return null;

    const handleAddTask = async (taskData: TaskPayload) => {
        try {
            const newTask = await api.createTask(project.id, taskData);

            if (taskData.expense && taskData.expense > 0) {
                await api.createFinanceEntry({
                    type: 'EXPENSE',
                    amount: taskData.expense,
                    description: `הוצאה על משימה: ${newTask.title}`,
                    date: new Date().toISOString(),
                    projectId: project.id,
                    taskId: newTask.id,
                });
            }

            await fetchTasks();
            // 💡 הסרת refreshProject() כדי למנוע רינדור מיותר של הדף
            setIsAddTaskModalOpen(false);
        } catch (error) {
            console.error("Failed to add task:", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} titleId={mainModalTitleId}>
                <div className="flex flex-col max-h-[85vh]">
                    <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200 px-4">
                        <h3 id={mainModalTitleId} className="text-xl font-bold text-[#3D2324] flex-1 truncate pr-4">
                            {project.title}
                        </h3>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 flex-shrink-0">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="mb-4 p-4 bg-gray-50 rounded-lg text-sm">
                        <p className="text-gray-600 mb-3 overflow-y-auto max-h-[100px] pr-2 break-words">
                            {project.description || 'אין תיאור לפרויקט זה.'}
                        </p>
                        <div className="grid grid-cols-1 gap-y-2 mt-4">
                            <InfoItem label="סטטוס" value={project.status} />
                            <InfoItem label="צוות" value={<span className="whitespace-normal break-words">{project.teams?.map(t => t.name).join(', ') || 'לא משויך'}</span>} />
                            <InfoItem
                                label={project.teamLeads && project.teamLeads.length > 1 ? "ראשי צוות" : "ראש צוות"}
                                value={<span className="whitespace-normal break-words">{project.teamLeads && project.teamLeads.length > 0 ? project.teamLeads.map(u => u.fullName).join(', ') : 'לא צוין'}</span>}
                            />
                            <InfoItem
                                label="תקופה"
                                value={`${project.startDate ? new Date(project.startDate).toLocaleDateString('he-IL') : ''} - ${project.endDate ? new Date(project.endDate).toLocaleDateString('he-IL') : ''}`}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 px-4 pr-2">
                        {isLoading ? (
                            <p className="text-center text-gray-500 py-8">טוען משימות...</p>
                        ) : tasks.length > 0 ? (
                            tasks.map(task => {
                                const style = statusStyles[task.status] || statusStyles['מתוכנן'];
                                return (
                                    <div key={task.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold text-gray-800 flex-1 pr-2 truncate">
                                                {task?.title}
                                            </p>
                                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${style.bg} ${style.text}`}>
                                                {task.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1 overflow-y-auto max-h-[60px] pr-2 break-words">
                                            {task?.description}
                                        </p>
                                        <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
                                            <span className="text-gray-500">משויך ל: </span>
                                            <span className="font-medium text-gray-700 whitespace-normal break-words">
                                                {task.assignees && task.assignees.length > 0 ? task.assignees.map(u => u.fullName).join(', ') : 'טרם שויך'}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <p className="text-center text-gray-500 py-8">אין משימות להצגה בפרויקט זה.</p>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 px-4">
                        <button
                            onClick={() => setIsAddTaskModalOpen(true)}
                            className="w-full flex items-center justify-center space-x-2 space-x-reverse bg-[#4A2B2C] text-white px-4 py-2 rounded-lg shadow hover:bg-opacity-90 transition-colors"
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span>הוסף משימה</span>
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isAddTaskModalOpen}
                onClose={() => setIsAddTaskModalOpen(false)}
                zIndex={60}
                size="sm"
                titleId={addTaskModalTitleId}
            >
                <AddTaskForm
                    titleId={addTaskModalTitleId}
                    onSubmit={handleAddTask}
                    onCancel={() => setIsAddTaskModalOpen(false)}
                    // 💡 כאן השתמשנו במשתנה המסונן במקום ברשימה המלאה
                    availableAssignees={projectUsers}
                />
            </Modal>
        </>
    );
};

export default ProjectTasksModal;