import React, { useState, useMemo, useEffect, useId, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as api from '../../services/api';
import { Project, Task, User, TaskPayload, Team, TaskStatus, ProjectStatus } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../../components/Modal';
import TaskDetailModal from '../../components/TaskDetailModal';
import EditTaskForm from '../../components/EditTaskForm';
import ConfirmationModal from '../../components/ConfirmationModal';
import { Gantt, Task as GanttTask, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import "./GanttResponsive.css";
import ProjectTasksModal from '../../components/ProjectTasksModal';

// --- רכיבים מותאמים אישית לרשימת המשימות ---

const CustomTaskListHeader = ({ headerHeight, fontFamily, fontSize, rowWidth }: { headerHeight: number; fontFamily: string; fontSize: string; rowWidth: string; }) => {
    return (
        <div
            className="task-list-header bg-gray-100 border-b border-gray-200"
            style={{ height: headerHeight, fontFamily: fontFamily, fontSize: fontSize, display: 'flex', alignItems: 'center' }}
        >
            <div
                className="task-list-header-cell"
                style={{
                    minWidth: rowWidth,
                    maxWidth: rowWidth,
                    borderRight: '1px solid #e2e8f0',
                    textAlign: 'right',
                    paddingRight: '15px',
                    fontWeight: 'bold',
                    color: '#4A5568'
                }}
            >
                שם המשימה
            </div>
        </div>
    );
};

const CustomTaskListTable = ({
    tasks,
    rowHeight,
    onExpanderClick,
}: {
    tasks: GanttTask[];
    rowHeight: number;
    onExpanderClick: (task: GanttTask) => void;
}) => {
    return (
        <div className="task-list-table-body" style={{ overflowY: 'hidden' }}>
            {tasks.map((task) => (
                <div
                    className="task-list-row flex items-center border-b border-gray-100"
                    style={{ height: rowHeight, paddingRight: `${task.type === 'task' ? 25 : 10}px` }}
                    key={task.id}
                >
                    <div className="flex-shrink-0 w-6 flex items-center justify-center">
                        {task.type === 'project' && (
                            <div
                                className={`cursor-pointer transform transition-transform ${task.hideChildren ? '-rotate-90' : ''}`}
                                onClick={() => onExpanderClick(task)}
                                style={{ fontSize: '1.2em' }}
                            >
                                ▼
                            </div>
                        )}
                    </div>
                    <div className="flex-grow overflow-hidden text-ellipsis whitespace-nowrap pr-2">
                        {task.name}
                    </div>
                </div>
            ))}
        </div>
    );
};


// --- רכיב הגאנט הראשי ---
const GanttTab = ({ projects, users, refreshData }: { projects: Project[], users: User[], refreshData: () => void }) => {
    // --- State & Refs ---
    const [localProjects, setLocalProjects] = useState<(Project & { isCollapsed?: boolean })[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
    const [view, setView] = useState<ViewMode>(ViewMode.Week);
    const [ganttColumnWidth, setGanttColumnWidth] = useState(150);
    const ganttContainerRef = useRef<HTMLDivElement>(null);
    const justDragged = useRef(false);
    const [viewingTask, setViewingTask] = useState<{ task: Task, project: Project } | null>(null);
    const [editingTask, setEditingTask] = useState<{ task: Task, project: Project } | null>(null);
    const [deletingTask, setDeletingTask] = useState<{ task: Task, project: Project } | null>(null);
    const [viewingProject, setViewingProject] = useState<Project | null>(null);
    const { user, currentUserRole } = useAuth();
    const viewTaskTitleId = useId();
    const editTaskTitleId = useId();
    const [teams, setTeams] = useState<Team[]>([]);
    
    useEffect(() => {
        const sortedProjects = projects.map(p => ({
            ...p,
            isCollapsed: false,
            tasks: (p.tasks || []).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        }));
        setLocalProjects(JSON.parse(JSON.stringify(sortedProjects)));
    }, [projects]);
    
    const selectedProject = useMemo(() => {
        if (!projects || projects.length === 0) return null;
        return projects.find(p => p.id === selectedProjectId);
    }, [projects, selectedProjectId]);
    
    const isManagerForProject = (project: Project | null): boolean => {
        if (!user || !project) return false;
        if (currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN') return true;
        return currentUserRole === 'TEAM_LEADER' && (project.teamLeads || []).some(lead => lead.id === user.id);
    };

    const visibleProjects = useMemo(() => {
        if (!user) return [];
        let projectsToDisplay = localProjects.filter(p => !p.isArchived);

        if (selectedProjectId !== 'all') {
            projectsToDisplay = projectsToDisplay.filter(p => p.id === selectedProjectId);
        }

        if (currentUserRole === 'EMPLOYEE') {
            return projectsToDisplay
                .map(project => {
                    const visibleTasks = (project.tasks || []).filter(task =>
                        task.assignees?.some(assignee => assignee.id === user.id)
                    );
                    return { ...project, tasks: visibleTasks }; // Always return the project, just with filtered tasks
                })
                .filter(p => (p.tasks || []).length > 0); // Only show projects that have tasks for this employee
        }

        return projectsToDisplay;
    }, [localProjects, user, currentUserRole, selectedProjectId]);

    const ganttTasks = useMemo((): GanttTask[] => {
        const tasksForGantt: GanttTask[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        visibleProjects.forEach(project => {
            if (project.startDate && project.endDate) {
                const projectStart = new Date(project.startDate);
                const projectEnd = new Date(project.endDate);

                if (projectStart <= projectEnd) {
                    tasksForGantt.push({
                        id: project.id,
                        name: project.title,
                        type: 'project',
                        start: projectStart,
                        end: projectEnd,
                        progress: project.completionPercentage || 0,
                        hideChildren: !!project.isCollapsed,
                        styles: { backgroundColor: '#a55eea', progressColor: '#8e44ad', progressSelectedColor: '#8e44ad', backgroundSelectedColor: '#a55eea' },
                        isDisabled: !isManagerForProject(project)
                    });

                    (project.tasks || []).forEach(task => {
                        if (task.startDate && task.endDate) {
                            const taskStart = new Date(task.startDate);
                            const taskEnd = new Date(task.endDate);

                            if (taskStart <= taskEnd) {
                                let barColor = task.color || '#3498db';
                                // This condition is where the TypeScript error was.
                                // The status can't be 'הושלם' and something else at the same time.
                                // Correct logic is to check if it's NOT completed and past the due date.
                                if (task.status === 'הושלם') {
                                    barColor = '#2ecc71';
                                } else if (taskEnd < today) { // Simplified condition
                                    barColor = '#e74c3c';
                                }

                                tasksForGantt.push({
                                    id: task.id,
                                    name: task.title,
                                    type: 'task',
                                    start: taskStart,
                                    end: taskEnd,
                                    progress: task.status === 'הושלם' ? 100 : 0,
                                    project: project.id,
                                    dependencies: (task as any).dependencies || [],
                                    styles: { backgroundColor: barColor, progressColor: barColor, backgroundSelectedColor: barColor, progressSelectedColor: barColor },
                                    isDisabled: !isManagerForProject(project)
                                });
                            }
                        }
                    });
                }
            }
        });
        return tasksForGantt;
    }, [visibleProjects, user, currentUserRole]);

    // --- Handlers ---
    const handleGoToToday = () => { /* ... implementation ... */ };
    const handleZoomToFit = () => { /* ... implementation ... */ };
    const toggleAllProjects = (collapse: boolean) => {
        setLocalProjects(prev => prev.map(p => ({ ...p, isCollapsed: collapse })));
    };
    const handleExportToPdf = () => { /* ... implementation ... */ };
    const handleViewChange = (newView: ViewMode) => {
        setView(newView);
        if (newView === ViewMode.Day) setGanttColumnWidth(65);
        else if (newView === ViewMode.Week) setGanttColumnWidth(150);
        else if (newView === ViewMode.Month) setGanttColumnWidth(250);
    };

    useEffect(() => {
        setTimeout(() => handleGoToToday(), 500);
    }, [ganttTasks, view]);

    const canUserChangeTaskStatus = (task: Task | null, project: Project | null): boolean => {
        if (!user || !task || !project) return false;
        if (isManagerForProject(project)) return true;
        return (task.assignees || []).some(assignee => assignee.id === user.id);
    };
    
    const handleTaskClick = (ganttTask: GanttTask) => {
        if (justDragged.current) {
            justDragged.current = false;
            return;
        }
        const project = localProjects.find(p => p.id === (ganttTask.project || ganttTask.id));
        if (!project) return;
        
        if (ganttTask.type === 'task') {
            const originalTask = (project.tasks || []).find(t => t.id === ganttTask.id);
            if (originalTask) setViewingTask({ task: originalTask, project });
        } else {
            setViewingProject(project);
        }
    };

    const handleTaskChange = async (ganttTask: GanttTask) => {
        if (ganttTask.type !== 'task' || !ganttTask.project) return;

        setTimeout(() => { justDragged.current = true; }, 100);
        
        const originalProject = localProjects.find(p => p.id === ganttTask.project);
        if (!originalProject || !isManagerForProject(originalProject)) {
            refreshData();
            return;
        }
        
        const originalTask = (originalProject.tasks || []).find(t => t.id === ganttTask.id);
        if (!originalTask) return;

        const updatedTaskData = {
            startDate: ganttTask.start.toISOString().split('T')[0],
            endDate: ganttTask.end.toISOString().split('T')[0],
        };

        setLocalProjects(prev => prev.map(p => 
            p.id === originalProject.id 
                ? { ...p, tasks: (p.tasks || []).map(t => t.id === ganttTask.id ? { ...t, ...updatedTaskData } : t) } 
                : p
        ));
        
        try {
            await api.updateTask(originalProject.id, ganttTask.id, updatedTaskData);
        } catch (err) {
            console.error("Failed to update task dates", err);
            alert("שגיאה בעדכון המשימה. מחזיר למצב הקודם.");
            setLocalProjects(prev => prev.map(p => 
                p.id === originalProject.id 
                    ? { ...p, tasks: (p.tasks || []).map(t => t.id === ganttTask.id ? originalTask : t) } 
                    : p
            ));
        } finally {
            setTimeout(() => { justDragged.current = false; }, 200);
        }
    };
    
    const handleUpdateTask = async (updatedTaskData: Partial<TaskPayload>) => { /* ... implementation ... */ };
    const confirmDeleteTask = async () => { /* ... implementation ... */ };
    const handleAddTaskComment = async (commentText: string) => { /* ... implementation ... */ };
    const handleUpdateTaskField = async (taskId: string, projectId: string, updates: Partial<TaskPayload>) => { /* ... implementation ... */ };

    return (
        <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
            {/* Header and Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                 <div className="flex flex-col">
                    <h2 className="text-3xl font-bold text-gray-800">תרשים גאנט</h2>
                 </div>
                 <div className="flex items-center gap-2 flex-wrap">
                    {/* ... קוד הכפתורים ... */}
                 </div>
            </div>

            <div ref={ganttContainerRef} className="gantt-responsive-container bg-white rounded-lg shadow-md border border-gray-200">
                {ganttTasks.length > 0 ? (
                    <Gantt
                        tasks={ganttTasks}
                        onClick={handleTaskClick}
                        onDateChange={handleTaskChange}
                        onExpanderClick={(task) => {
                            if (task.type === 'project') {
                                setLocalProjects(prev => prev.map(p => p.id === task.id ? { ...p, isCollapsed: !p.isCollapsed } : p));
                            }
                        }}
                        locale="he"
                        viewMode={view}
                        columnWidth={ganttColumnWidth}
                        listCellWidth="250px"
                        ganttHeight={600}
                        barCornerRadius={4}
                        todayColor="rgba(252, 74, 74, 0.43)"
                        TaskListHeader={CustomTaskListHeader}
                        TaskListTable={CustomTaskListTable}
                        rowHeight={40}
                    />
                ) : (
                    <div className="text-center p-8 text-gray-500 h-[600px] flex items-center justify-center">
                        <p>לא נמצאו פרויקטים להצגה. בחר פרויקט מהרשימה או צור פרויקט חדש.</p>
                    </div>
                )}
            </div>

            {/* Modals */}
             <TaskDetailModal isOpen={!!viewingTask} onClose={() => setViewingTask(null)} task={viewingTask?.task || null} project={viewingTask?.project || null} isManager={isManagerForProject(viewingTask?.project || null)} canUserChangeStatus={canUserChangeTaskStatus(viewingTask?.task || null, viewingTask?.project || null)} onUpdateTaskField={(taskId, updates) => { if (viewingTask) { handleUpdateTaskField(taskId, viewingTask.project.id, updates); } }} onEdit={() => { if (viewingTask) setEditingTask(viewingTask); setViewingTask(null); }} onDelete={() => { if (viewingTask) setDeletingTask(viewingTask); setViewingTask(null); }} onAddComment={handleAddTaskComment} titleId={viewTaskTitleId} />
             <ProjectTasksModal isOpen={!!viewingProject} project={viewingProject} onClose={() => setViewingProject(null)} refreshProject={refreshData} users={users} />
             <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)} size="sm" titleId={editTaskTitleId}>
                 {editingTask && <EditTaskForm titleId={editTaskTitleId} task={editingTask.task} onSubmit={handleUpdateTask} onCancel={() => setEditingTask(null)} users={users} />}
             </Modal>
             <ConfirmationModal isOpen={!!deletingTask} onClose={() => setDeletingTask(null)} onConfirm={confirmDeleteTask} title="אישור מחיקת משימה" message={`האם אתה בטוח שברצונך למחוק את המשימה "${deletingTask?.task?.title}"?`} />

        </div>
    );
};

export default GanttTab;