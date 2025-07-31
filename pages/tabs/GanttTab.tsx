import React, { useState, useMemo, useEffect, useId, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as api from '../../services/api';
import { Project, Task, User, TaskPayload } from '../../types';
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

const CustomTaskListHeader = ({ headerHeight, fontFamily, fontSize, rowWidth }) => {
  return (
    <div
      className="task-list-header"
      style={{ height: headerHeight, fontFamily: fontFamily, fontSize: fontSize }}
    >
      <div
        className="task-list-header-cell"
        style={{
          minWidth: rowWidth,
          maxWidth: rowWidth,
          borderRight: '1px solid #e2e8f0',
          textAlign: 'right',
          paddingRight: '10px'
        }}
      >
        שם המשימה
      </div>
    </div>
  );
};

const CustomTaskListTable = ({ tasks, rowHeight, onExpanderClick }) => {
  return (
    <div className="task-list-table-body">
      {tasks.map((task) => (
        <div
          className="task-list-row"
          style={{ height: rowHeight }}
          key={task.id}
        >
          <div className="task-list-cell" style={{ minWidth: '100%', maxWidth: '100%' }}>
            <div
              className={task.hideChildren ? 'expander-closed' : 'expander-open'}
              onClick={() => task.type === 'project' && onExpanderClick(task)}
            >
              {task.type === 'project' && '▼'}
            </div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.name}
            </div>
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

    // --- Data Sync and Processing ---
    useEffect(() => {
        const sortedProjects = projects.map(p => ({
            ...p,
            isCollapsed: false,
            tasks: (p.tasks || []).sort((a, b) => a.displayOrder - b.displayOrder)
        }));
        setLocalProjects(JSON.parse(JSON.stringify(sortedProjects)));
    }, [projects]);

    const visibleProjects = useMemo(() => {
        if (!user) return [];
        let projectsToDisplay = localProjects;
        if (currentUserRole === 'EMPLOYEE') {
            projectsToDisplay = projectsToDisplay.map(project => ({
                ...project,
                tasks: (project.tasks || []).filter(task => task.assignees?.some(assignee => assignee.id === user.id))
            })).filter(project => (project.tasks || []).length > 0);
        }
        return selectedProjectId === 'all'
            ? projectsToDisplay.filter(p => !p.isArchived)
            : projectsToDisplay.filter(p => p.id === selectedProjectId);
    }, [localProjects, user, currentUserRole, selectedProjectId]);

    const ganttTasks = useMemo(() => {
        const tasksForGantt: GanttTask[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        visibleProjects.forEach(project => {
            if (project.startDate && project.endDate) {
                tasksForGantt.push({
                    id: project.id, name: project.title, type: 'project',
                    start: new Date(project.startDate), end: new Date(project.endDate),
                    progress: project.completionPercentage || 0, hideChildren: project.isCollapsed,
                    styles: { backgroundColor: '#a55eea', progressColor: '#8e44ad' }
                });
            }
            (project.tasks || []).forEach(task => {
                if (task.startDate && task.endDate) {
                    let barColor = '#3498db', progressColor = '#2980b9';
                    if (task.status === 'הושלם') { barColor = '#2ecc71'; progressColor = '#27ae60'; }
                    else if (new Date(task.endDate) < today) { barColor = '#e74c3c'; progressColor = '#c0392b'; }
                    tasksForGantt.push({
                        id: task.id, name: task?.title, type: 'task',
                        start: new Date(task.startDate), end: new Date(task.endDate),
                        progress: task.status === 'הושלם' ? 100 : 0,
                        project: project.id, dependencies: task.dependencies || [],
                        styles: { backgroundColor: barColor, progressColor: progressColor }
                    });
                }
            });
        });
        return tasksForGantt;
    }, [visibleProjects]);

    // --- Handlers ---
    const handleGoToToday = () => {
        if (!ganttContainerRef.current) return;

        let attempts = 0;
        const maxAttempts = 20;

        const findAndScroll = () => {
            const scrollableElement = ganttContainerRef.current?.querySelector<HTMLElement>('._CZjuD');

            if (scrollableElement) {
                console.log("Success! Found the correct scrollable element (._CZjuD). Scrolling...");

                let pixelsPerDay: number;
                switch (view) {
                    case ViewMode.Day: pixelsPerDay = ganttColumnWidth; break;
                    case ViewMode.Week: pixelsPerDay = ganttColumnWidth / 7; break;
                    case ViewMode.Month: pixelsPerDay = ganttColumnWidth / 30.44; break;
                    default: return;
                }

                const today = new Date();
                const cutoffDate = new Date(today.getFullYear(), 0, 1);
                const relevantTasks = ganttTasks.filter(t => t.end >= cutoffDate);
                if (relevantTasks.length === 0) return;

                const projectStartDate = relevantTasks.reduce((minDate, task) =>
                    task.start < minDate ? task.start : minDate,
                    relevantTasks[0].start
                );

                const timeDiff = today.getTime() - projectStartDate.getTime();
                const daysSinceStart = Math.max(0, timeDiff / (1000 * 3600 * 24));
                const scrollTarget = daysSinceStart * pixelsPerDay;

                const scrollableAreaWidth = scrollableElement.getBoundingClientRect().width;
                const finalScrollLeft = scrollTarget - (scrollableAreaWidth / 2);

                scrollableElement.scrollTo({
                    left: finalScrollLeft,
                    behavior: 'smooth'
                });

            } else {
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(findAndScroll, 100);
                } else {
                    console.error("Could not find the internal scrollable element (._CZjuD) after multiple attempts.");
                }
            }
        };

        findAndScroll();
    };

    const handleZoomToFit = () => {
        if (!ganttContainerRef.current || ganttTasks.length === 0) return;
        const dates = ganttTasks.map(t => t.start).concat(ganttTasks.map(t => t.end));
        const minDate = new Date(Math.min(...dates.map(date => date.getTime())));
        const maxDate = new Date(Math.max(...dates.map(date => date.getTime())));
        const durationInDays = Math.max(1, (maxDate.getTime() - minDate.getTime()) / (1000 * 3600 * 24));
        const containerWidth = ganttContainerRef.current.getBoundingClientRect().width - 250;
        setView(ViewMode.Day);
        setGanttColumnWidth(containerWidth / durationInDays);
    };

    const toggleAllProjects = (collapse: boolean) => {
        setLocalProjects(prev => prev.map(p => ({ ...p, isCollapsed: collapse })));
    };

    const handleExportToPdf = () => {
        const ganttElement = ganttContainerRef.current;
        if (!ganttElement) return;
        html2canvas(ganttElement, { scrollX: -window.scrollX, width: ganttElement.scrollWidth }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save("gantt-chart.pdf");
        });
    };

    const handleViewChange = (newView: ViewMode) => {
        setView(newView);
        if (newView === ViewMode.Day) setGanttColumnWidth(65);
        else if (newView === ViewMode.Week) setGanttColumnWidth(150);
        else if (newView === ViewMode.Month) setGanttColumnWidth(250);
    };
    
    useEffect(() => {
        setTimeout(() => handleGoToToday(), 100);
    }, [ganttTasks]);

    const isManagerForTask = (project: Project | null): boolean => {
        if (!user || !project) return false;
        if (currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN') return true;
        return currentUserRole === 'TEAM_LEADER' && project.teamLeads?.some(lead => lead.id === user.id);
    };

    const canUserChangeTaskStatus = (task: Task | null, project: Project | null): boolean => {
        if (!user || !task || !project) return false;
        if (isManagerForTask(project)) return true;
        return (task.assignees || []).some(assignee => assignee.id === user.id);
    };

    const handleTaskClick = (task: GanttTask) => {
        // 💡 התיקון: אם התרחשה גרירה, אל תפתח את המודל.
        if (justDragged.current) {
            justDragged.current = false; // איפוס הדגל
            return;
        }

        const project = localProjects.find(p => p.id === (task.project || task.id));
        if (!project) return;
        if (task.type === 'task') {
            const originalTask = (project.tasks || []).find(t => t.id === task.id);
            if (originalTask) setViewingTask({ task: originalTask, project });
        } else {
            setViewingProject(project);
        }
    };

    const handleTaskChange = async (task: GanttTask) => {
        const project = localProjects.find(p => p.id === (task.project || task.id));
        if (!project || task.type !== 'task') return;
        
        // 💡 התיקון: סמן שהתרחשה גרירה כדי למנוע פתיחת מודל.
        justDragged.current = true;

        const updatedTaskData = {
            startDate: task.start.toISOString().split('T')[0],
            endDate: task.end.toISOString().split('T')[0],
        };
        
        setLocalProjects(prev => prev.map(p => p.id === project.id ? { ...p, tasks: (p.tasks || []).map(t => t.id === task.id ? { ...t, ...updatedTaskData } : t) } : p));
        try {
            await api.updateTask(project.id, task.id, updatedTaskData);
        } catch (err) {
            console.error("Failed to update task dates", err);
            alert("שגיאה בעדכון המשימה.");
            refreshData();
        }
    };

    const handleUpdateTask = async (updatedTaskData: Partial<TaskPayload>) => {
        if (!editingTask) return;
        const { project, task } = editingTask;
        try {
            await api.updateTask(project.id, task.id, updatedTaskData);
            refreshData();
            setEditingTask(null);
        } catch (err) {
            console.error("Failed to update task", err);
            alert("שגיאה בעדכון המשימה.");
        }
    };

    const confirmDeleteTask = async () => {
        if (!deletingTask) return;
        const { task, project } = deletingTask;
        try {
            await api.deleteTask(project.id, task.id);
            refreshData();
            setDeletingTask(null);
            setViewingTask(null);
        } catch (err) {
            console.error("Failed to delete task", err);
            alert("שגיאה במחיקת המשימה.");
        }
    };

    const handleAddTaskComment = async (commentText: string) => {
        if (!viewingTask || !user) return;
        const { task, project } = viewingTask;
        try {
            const newComment = await api.addTaskComment(project.id, task.id, commentText);
            const optimisticUpdate = (currentTask: Task): Task => ({ ...currentTask, comments: [...(currentTask.comments || []), newComment] });
            setLocalProjects(prev => prev.map(p => p.id === project.id ? { ...p, tasks: (p.tasks || []).map(t => t.id === task.id ? optimisticUpdate(t) : t) } : p));
            setViewingTask(prev => prev ? { ...prev, task: optimisticUpdate(prev.task) } : null);
        } catch (error) {
            console.error("Failed to add comment", error);
            alert("שגיאה בהוספת תגובה.");
            refreshData();
        }
    };

    const handleUpdateTaskField = async (taskId: string, projectId: string, updates: Partial<TaskPayload>) => {
        try {
            const updatedTask = await api.updateTask(projectId, taskId, updates);
            setLocalProjects(prev => prev.map(p => p.id !== projectId ? p : { ...p, tasks: (p.tasks || []).map(t => t.id === taskId ? updatedTask : t) }));
            if (viewingTask?.task.id === taskId) {
                setViewingTask(prev => prev ? { ...prev, task: updatedTask } : null);
            }
        } catch (e) {
            console.error(e);
            alert("שגיאה בעדכון המשימה. סנכרון מחדש...");
            refreshData();
        }
    };

    // --- JSX Rendering ---
    return (
        <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-3xl font-bold text-gray-800">תרשים גאנט</h2>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center bg-gray-200 rounded-lg p-1" dir="ltr">
                        <button onClick={() => handleViewChange(ViewMode.Day)} className={`px-3 py-1 text-sm font-semibold rounded-md ${view === ViewMode.Day ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}>יום</button>
                        <button onClick={() => handleViewChange(ViewMode.Week)} className={`px-3 py-1 text-sm font-semibold rounded-md ${view === ViewMode.Week ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}>שבוע</button>
                        <button onClick={() => handleViewChange(ViewMode.Month)} className={`px-3 py-1 text-sm font-semibold rounded-md ${view === ViewMode.Month ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}>חודש</button>
                    </div>
                    <div className="flex items-center bg-gray-200 rounded-lg p-1">
                        <button onClick={handleGoToToday} title="עבור להיום" className="p-2 rounded-md hover:bg-gray-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg></button>
                        <button onClick={handleZoomToFit} title="הצג הכל" className="p-2 rounded-md hover:bg-gray-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm12 0a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                        <button onClick={() => toggleAllProjects(true)} title="כווץ הכל" className="p-2 rounded-md hover:bg-gray-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg></button>
                        <button onClick={() => toggleAllProjects(false)} title="הרחב הכל" className="p-2 rounded-md hover:bg-gray-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg></button>
                        <button onClick={handleExportToPdf} title="ייצא ל-PDF" className="p-2 rounded-md hover:bg-gray-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" /></svg></button>
                    </div>
                </div>
            </div>

            <div ref={ganttContainerRef} className="gantt-responsive-container bg-white rounded-lg shadow-md border border-gray-200">
                {ganttTasks.length > 0 ? (
                    <Gantt
                        tasks={ganttTasks}
                        onClick={handleTaskClick}
                        onDateChange={handleTaskChange}
                        onExpanderClick={(task) => {
                            setLocalProjects(prev => prev.map(p => p.id === task.id ? {...p, isCollapsed: !p.isCollapsed} : p));
                        }}
                        locale="he"
                        viewMode={view}
                        columnWidth={ganttColumnWidth}
                        listCellWidth="0"
                        ganttHeight={600}
                        barCornerRadius={4}
                        todayColor="rgba(252, 74, 74, 0.43)"
                        TaskListHeader={CustomTaskListHeader}
                        TaskListTable={CustomTaskListTable}
                        rowHeight={32}
                    />
                ) : (
                    <div className="text-center p-8 text-gray-500">לא נמצאו פריטים להצגה.</div>
                )}
            </div>

            {/* Modals */}
            <TaskDetailModal isOpen={!!viewingTask} onClose={() => setViewingTask(null)} task={viewingTask?.task || null} project={viewingTask?.project || null} isManager={isManagerForTask(viewingTask?.project || null)} canUserChangeStatus={canUserChangeTaskStatus(viewingTask?.task || null, viewingTask?.project || null)} onUpdateTaskField={(taskId, updates) => { if (viewingTask) { handleUpdateTaskField(taskId, viewingTask.project.id, updates); } }} onEdit={() => { if (viewingTask) setEditingTask(viewingTask); setViewingTask(null); }} onDelete={() => { if (viewingTask) setDeletingTask(viewingTask); setViewingTask(null); }} onAddComment={handleAddTaskComment} titleId={viewTaskTitleId} />
            <ProjectTasksModal isOpen={!!viewingProject} project={viewingProject} onClose={() => setViewingProject(null)} refreshProject={refreshData} users={users} />
            <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)} size="sm" titleId={editTaskTitleId}>
                {editingTask && <EditTaskForm titleId={editTaskTitleId} task={editingTask.task} onSubmit={handleUpdateTask} onCancel={() => setEditingTask(null)} users={users} />}
            </Modal>
            <ConfirmationModal isOpen={!!deletingTask} onClose={() => setDeletingTask(null)} onConfirm={confirmDeleteTask} title="אישור מחיקת משימה" message={`האם אתה בטוח שברצונך למחוק את המשימה "${deletingTask?.task?.title}"?`} />
        </div>
    );
};

export default GanttTab;