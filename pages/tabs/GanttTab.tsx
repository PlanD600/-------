import React, { useState, useMemo, useEffect, useRef, useId } from 'react';
import * as api from '../../services/api';
import { Project, Task, Comment, TaskStatus, User, TaskPayload } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../../components/Modal';
import TaskDetailModal from '../../components/TaskDetailModal';
import EditTaskForm from '../../components/EditTaskForm';
import ConfirmationModal from '../../components/ConfirmationModal';
import { PlusIcon, MinusIcon, ArrowsPointingOutIcon } from '../../components/icons';
import ProjectTasksModal from '../../components/ProjectTasksModal';


interface TeamMember {
    id: string;
    name:string;
}

interface GanttTabProps {
    projects: Project[];
    teamMembers: TeamMember[];
    users: User[];
    refreshData: () => void;
}

const getDaysDiff = (date1: Date, date2: Date) => {
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    const diffTime = d2.getTime() - d1.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const GanttTab = ({ projects, teamMembers, users, refreshData }: GanttTabProps) => {
    const [localProjects, setLocalProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
    const [dateRange, setDateRange] = useState('year');
    const [customStartDate, setCustomStartDate] = useState<string | null>(null);
    const [customEndDate, setCustomEndDate] = useState<string | null>(null);

    const ganttContainerRef = useRef<HTMLDivElement>(null);
    const ganttAreaRef = useRef<HTMLDivElement>(null);
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

    const allowReordering = selectedProjectId !== 'all';

    const [pixelsPerDay, setPixelsPerDay] = useState(30);
    
    const [draggedTask, setDraggedTask] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<{ taskId: string; position: 'top' | 'bottom' } | null>(null);
    
    const [resizingTask, setResizingTask] = useState<{ taskId: string; projectId: string; handle: 'start' | 'end'; initialX: number; initialDate: Date; } | null>(null);
    const [movingTask, setMovingTask] = useState<{ taskId: string; projectId: string; initialX: number; initialStartDate: Date; initialEndDate: Date; } | null>(null);
    
    const clickStartRef = useRef<{x: number, y: number} | null>(null);

    const [viewingTask, setViewingTask] = useState<{ task: Task, project: Project } | null>(null);
    const [editingTask, setEditingTask] = useState<{ task: Task, project: Project } | null>(null);
    const [deletingTask, setDeletingTask] = useState<{ task: Task, project: Project } | null>(null);
    const [viewingProject, setViewingProject] = useState<Project | null>(null);
    
    const { user, currentUserRole } = useAuth();
    
    const viewTaskTitleId = useId();
    const editTaskTitleId = useId();

    useEffect(() => {
        setLocalProjects(JSON.parse(JSON.stringify(projects)));
    }, [projects]);
    
    const visibleProjects = useMemo(() => {
        if (!user) return [];
        let projectsToDisplay = localProjects.map(p => ({
            ...p,
            tasks: p.tasks || []
        }));

        if (currentUserRole === 'EMPLOYEE') {
            const employeeProjects: (Project & { tasks: Task[] })[] = [];
            for (const project of projectsToDisplay) {
                const assignedTasks = project.tasks.filter(task =>
                    task.assignees?.some(assignee => assignee.id === user.id)
                );
                if (assignedTasks.length > 0) {
                    employeeProjects.push({ ...project, tasks: assignedTasks });
                }
            }
            projectsToDisplay = employeeProjects;
        }

        return selectedProjectId === 'all'
            ? projectsToDisplay.filter(p => !p.isArchived)
            : projectsToDisplay.filter(p => p.id === selectedProjectId);
            
    }, [localProjects, user, currentUserRole, selectedProjectId]);

    const { chartData, chartStartDate, totalDays } = useMemo(() => {
        let allRelevantDates: Date[] = [];
        visibleProjects.forEach(p => {
            (p.tasks || []).forEach(t => {
                if (t.startDate) allRelevantDates.push(new Date(t.startDate));
                if (t.endDate) allRelevantDates.push(new Date(t.endDate));
            });
        });

        const now = new Date();
        let viewStartDate: Date;
        let viewEndDate: Date;
        
        if (dateRange === 'custom' && customStartDate && customEndDate) {
            viewStartDate = new Date(customStartDate);
            viewEndDate = new Date(customEndDate);
        } else {
            switch(dateRange) {
                case 'year':
                    viewStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    viewEndDate = new Date(now.getFullYear() + 1, now.getMonth(), 0);
                    break;
                case 'month':
                    viewStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    viewEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    break;
                case '3months':
                    viewStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    viewEndDate = new Date(now.getFullYear(), now.getMonth() + 3, 0);
                    break;
                default: // 'all'
                    if (allRelevantDates.length > 0) {
                        const dateTimestamps = allRelevantDates.map(d => d.getTime());
                        viewStartDate = new Date(Math.min(...dateTimestamps));
                        viewEndDate = new Date(Math.max(...dateTimestamps));
                    } else {
                        viewStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
                        viewEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    }
                    break;
            }
        }
        
        if (!viewStartDate || !viewEndDate || isNaN(viewStartDate.getTime()) || isNaN(viewEndDate.getTime())) {
            viewStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
            viewEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }

        viewStartDate.setDate(viewStartDate.getDate() - 7);
        viewEndDate.setDate(viewEndDate.getDate() + 7);
        
        const finalChartData = visibleProjects.map(p => {
             const tasksWithDates = (p.tasks || []).filter(t => t.startDate && t.endDate);
            let projectStartDate: Date | null = null;
            let projectEndDate: Date | null = null;
            if (tasksWithDates.length > 0) {
                const startDates = tasksWithDates.map(t => new Date(t.startDate!).getTime());
                const endDates = tasksWithDates.map(t => new Date(t.endDate!).getTime());
                projectStartDate = new Date(Math.min(...startDates));
                projectEndDate = new Date(Math.max(...endDates));
            }
            return { ...p, projectStartDate, projectEndDate };
        });

        const finalTotalDays = getDaysDiff(viewStartDate, viewEndDate) || 30;

        return {
            chartData: finalChartData,
            chartStartDate: viewStartDate,
            totalDays: finalTotalDays
        };
    }, [visibleProjects, dateRange, customStartDate, customEndDate]);

    const isManagerForTask = (project: Project | null) => {
        if (!user || !project) return false;
        if (currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN') return true;
        return currentUserRole === 'TEAM_LEADER' && project.teamLeads?.some(lead => lead.id === user.id);
    }

    const canUserEditTask = (task: Task | null, project: Project | null) => {
        if (!user || !task || !project) return false;
        return isManagerForTask(project);
    };

    const canUserChangeTaskStatus = (task: Task | null, project: Project | null) => {
        if (!user || !task || !project) return false;
        if (isManagerForTask(project)) return true;
        return task.assignees?.some(assignee => assignee.id === user.id);
    };
    
    const toggleProjectExpansion = (projectId: string) => {
        setExpandedProjects(prev => {
            const newSet = new Set(prev);
            if (newSet.has(projectId)) newSet.delete(projectId); else newSet.add(projectId);
            return newSet;
        });
    };
    
    const handleZoomIn = () => setPixelsPerDay(p => Math.min(p * 1.5, 200));
    const handleZoomOut = () => setPixelsPerDay(p => Math.max(p / 1.5, 5));
    const handleFitToScreen = () => {
        if (ganttContainerRef.current) {
            const containerWidth = ganttContainerRef.current.clientWidth - 224; // 224 is task list width
            if (totalDays > 0 && containerWidth > 0) setPixelsPerDay(containerWidth / totalDays);
        }
    };
    
    const handleBarMouseDown = (e: React.MouseEvent, type: 'task' | 'project', id: string, projectId: string) => {
        e.stopPropagation();
        clickStartRef.current = { x: e.clientX, y: e.clientY };
        
        const project = localProjects.find(p => p.id === projectId);
        if (type === 'task') {
            const task = project?.tasks?.find(t => t.id === id);
            if (!task || !task.startDate || !task.endDate || !canUserEditTask(task, project)) return;
            setMovingTask({ taskId: id, projectId, initialX: e.clientX, initialStartDate: new Date(task.startDate), initialEndDate: new Date(task.endDate) });
        }
    };
    
    const handleBarClick = (e: React.MouseEvent, type: 'task' | 'project', id: string, projectId: string) => {
        e.stopPropagation();
        if (movingTask || resizingTask) return;
        
        const endPos = { x: e.clientX, y: e.clientY };
        if (clickStartRef.current && Math.abs(endPos.x - clickStartRef.current.x) < 5 && Math.abs(endPos.y - clickStartRef.current.y) < 5) {
            if (type === 'task') {
                const project = localProjects.find(p => p.id === projectId);
                const task = project?.tasks?.find(t => t.id === id);
                if (task && project) setViewingTask({ task, project });
            } else if (type === 'project') {
                const project = localProjects.find(p => p.id === id);
                if (project) setViewingProject(project);
            }
        }
    };
    
    const handleResizeStart = (e: React.MouseEvent, taskId: string, handle: 'start' | 'end', projectId: string) => {
        e.preventDefault(); e.stopPropagation();
        const project = localProjects.find(p => p.id === projectId);
        const task = project?.tasks?.find(t => t.id === taskId);
        if (!task || !canUserEditTask(task, project)) return;
        
        const initialDateString = handle === 'start' ? task.startDate : task.endDate;
        if (!initialDateString) return;
        setResizingTask({ taskId, projectId, handle, initialX: e.clientX, initialDate: new Date(initialDateString) });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!document.body.classList.contains('unselectable')) {
                document.body.classList.add('unselectable');
            }
            if (resizingTask) {
                const rtlFactor = -1;
                const dayDiff = Math.round((resizingTask.initialX - e.clientX) / pixelsPerDay * rtlFactor);
                const newDate = new Date(resizingTask.initialDate);
                newDate.setDate(newDate.getDate() + dayDiff);
                const newDateString = newDate.toISOString().split('T')[0];

                setLocalProjects(prev => prev.map(p => p.id !== resizingTask.projectId ? p : { ...p, tasks: (p.tasks || []).map(t => {
                    if (t.id !== resizingTask.taskId) return t;
                    const currentStartDate = new Date(t.startDate!);
                    const currentEndDate = new Date(t.endDate!);
                    if (resizingTask.handle === 'start' && newDate < currentEndDate) return { ...t, startDate: newDateString };
                    if (resizingTask.handle === 'end' && newDate > currentStartDate) return { ...t, endDate: newDateString };
                    return t;
                })}));
            } else if (movingTask) {
                const rtlFactor = -1;
                const dayDiff = Math.round((movingTask.initialX - e.clientX) / pixelsPerDay * rtlFactor);
                const newStartDate = new Date(movingTask.initialStartDate); newStartDate.setDate(newStartDate.getDate() + dayDiff);
                const newEndDate = new Date(movingTask.initialEndDate); newEndDate.setDate(newEndDate.getDate() + dayDiff);
                setLocalProjects(prev => prev.map(p => p.id === movingTask.projectId ? { ...p, tasks: (p.tasks || []).map(t => t.id === movingTask.taskId ? { ...t, startDate: newStartDate.toISOString().split('T')[0], endDate: newEndDate.toISOString().split('T')[0] } : t) } : p));
            }
        };

        const handleMouseUp = async () => { 
            document.body.classList.remove('unselectable');
            let updatedTaskData: Partial<TaskPayload> | null = null;
            let taskId: string | null = null;
            let projectId: string | null = null;

            if (resizingTask || movingTask) {
                const action = resizingTask || movingTask;
                if (action) {
                    const project = localProjects.find(p => p.id === action.projectId);
                    const task = project?.tasks?.find(t => t.id === action.taskId);
                    if (task) {
                        updatedTaskData = { startDate: task.startDate, endDate: task.endDate };
                        taskId = task.id;
                        projectId = project.id;
                    }
                }
            }
            
            setResizingTask(null); 
            setMovingTask(null); 
            clickStartRef.current = null;

            if (updatedTaskData && taskId && projectId) {
                try {
                    await api.updateTask(projectId, taskId, updatedTaskData);
                    refreshData();
                } catch (err) {
                    console.error("Failed to update task dates", err);
                    alert("שגיאה בעדכון המשימה. מחזיר למצב הקודם.");
                    refreshData(); // Revert to server state
                }
            }
        };

        if (resizingTask || movingTask) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp, { once: true });
        }
        return () => { 
            window.removeEventListener('mousemove', handleMouseMove); 
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.classList.remove('unselectable');
        };
    }, [resizingTask, movingTask, pixelsPerDay, setLocalProjects, localProjects, refreshData]);

    const handleUpdateTaskField = async (taskId: string, projectId: string, updates: Partial<TaskPayload>) => {
        try {
            const updatedTask = await api.updateTask(projectId, taskId, updates);
            // Optimistically update local state for faster UI response
            setLocalProjects(prevProjects => prevProjects.map(p => {
                if (p.id !== projectId) return p;
                return {
                    ...p,
                    tasks: (p.tasks || []).map(t => t.id === taskId ? updatedTask : t)
                };
            }));
            if (viewingTask?.task.id === taskId) {
                 setViewingTask(prev => prev ? { ...prev, task: updatedTask } : null);
            }
        } catch(e) {
            console.error(e);
            alert("שגיאה בעדכון המשימה. סנכרון מחדש...");
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
           
           const optimisticUpdate = (currentTask: Task): Task => ({
             ...currentTask, 
             comments: [...currentTask.comments, newComment]
           });

           // Optimistically update the main local state
           setLocalProjects(prevProjects => prevProjects.map(p => 
               p.id === project.id 
               ? { ...p, tasks: (p.tasks || []).map(t => t.id === task.id ? optimisticUpdate(t) : t) }
               : p
           ));

           // Optimistically update the task in the detail view modal
           setViewingTask(prev => prev ? { ...prev, task: optimisticUpdate(prev.task) } : null);

        } catch(error) {
            console.error("Failed to add comment", error);
            alert("שגיאה בהוספת תגובה.");
            refreshData(); // Re-sync on error
        }
    };

    const timelineWidth = totalDays * pixelsPerDay;
    const todayPosition = getDaysDiff(chartStartDate, new Date());

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">תרשים גאנט</h2>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-2 bg-gray-50 rounded-xl border">
                <div className="w-full md:w-auto">
                    <select 
                        value={selectedProjectId} 
                        onChange={(e) => setSelectedProjectId(e.target.value)} 
                        className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#4A2B2C] focus:border-[#4A2B2C] block p-2"
                    >
                        <option value="all">כל הפרויקטים</option>
                        {projects.filter(p => !p.isArchived).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                </div>

                <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-2">
                     <select 
                        value={dateRange} 
                        onChange={e => setDateRange(e.target.value)} 
                        className="w-full sm:w-auto bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#4A2B2C] focus:border-[#4A2B2C] block p-2"
                    >
                        <option value="all">כל התקופה</option>
                        <option value="year">שנה מלאה</option>
                        <option value="month">חודש נוכחי</option>
                        <option value="3months">3 חודשים הבאים</option>
                        <option value="custom">טווח מותאם</option>
                    </select>
                    {dateRange === 'custom' && (
                        <div className="w-full sm:w-auto flex items-center gap-2">
                            <input type="date" value={customStartDate || ''} onChange={e => setCustomStartDate(e.target.value)} className="w-full sm:w-auto bg-white border border-gray-300 text-gray-900 text-sm rounded-lg p-1.5" />
                            <span className="text-gray-500">-</span>
                            <input type="date" value={customEndDate || ''} onChange={e => setCustomEndDate(e.target.value)} className="w-full sm:w-auto bg-white border border-gray-300 text-gray-900 text-sm rounded-lg p-1.5" />
                        </div>
                    )}
                </div>

                <div className="w-full md:w-auto flex justify-center">
                    <div className="flex items-center border border-gray-300 rounded-lg p-1 bg-white">
                        <button onClick={handleZoomOut} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md"><MinusIcon className="w-5 h-5"/></button>
                        <button onClick={handleFitToScreen} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md"><ArrowsPointingOutIcon className="w-5 h-5"/></button>
                        <button onClick={handleZoomIn} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md"><PlusIcon className="w-5 h-5"/></button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" ref={ganttContainerRef}>
                <div className="max-h-[70vh] min-h-[500px] overflow-auto relative">
                    <div className="relative flex" style={{ width: `${224 + timelineWidth}px` }}>
                        <div className="w-56 flex-shrink-0 sticky right-0 bg-white z-20 border-l border-gray-200">
                             <div className="h-14 flex items-center p-2 font-semibold text-gray-600 border-b border-gray-200 sticky top-0 bg-white z-10">משימה</div>
                             {chartData.map((projectGroup) => {
                                const isProjectExpanded = selectedProjectId === 'all' ? expandedProjects.has(projectGroup.id) : true;
                                return (
                                <React.Fragment key={projectGroup.id}>
                                    {selectedProjectId === 'all' && (
                                        <div 
                                            onClick={() => toggleProjectExpansion(projectGroup.id)} 
                                            className="flex items-center h-10 p-2 bg-gray-50 font-bold text-gray-700 border-b border-t select-none cursor-pointer hover:bg-gray-100"
                                        >
                                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 ml-2 transition-transform transform ${isProjectExpanded ? 'rotate-90' : ''}`}> <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /> </svg>
                                             <span className="truncate">{projectGroup.title}</span>
                                        </div>
                                    )}
                                    {isProjectExpanded && (projectGroup.tasks || []).map((task, index) => (
                                        <div key={task.id} className="relative h-10 flex items-center p-2 border-b border-gray-100 group">
                                            <div className="flex items-center w-full">
                                                <span className="text-gray-400 text-sm ml-2">{index + 1}.</span>
                                                <span className="truncate text-sm font-medium">{task.title}</span>
                                            </div>
                                        </div>
                                    ))}
                                </React.Fragment>
                             )})}
                        </div>
                        {/* Timeline */}
                        <div className="grow" ref={ganttAreaRef}>
                            <div className="sticky top-0 bg-white z-10">
                                <div className="relative h-7 flex border-b border-gray-200">{Array.from({ length: Math.ceil(totalDays) }).map((_, i) => { const d = new Date(chartStartDate); d.setDate(d.getDate() + i); if (d.getDate() === 1 || i === 0) { const monthName = d.toLocaleString('he-IL', { month: 'short', year: 'numeric' }); const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); const remainingDays = daysInMonth - d.getDate() + 1; const width = Math.min(remainingDays, totalDays - i) * pixelsPerDay; return (<div key={i} style={{width: `${width}px`}} className="text-center text-xs font-semibold text-gray-600 border-l">{monthName}</div>) } return null; })}</div>
                                <div className="relative h-7 flex">{Array.from({ length: Math.ceil(totalDays) }).map((_, i) => { const d = new Date(chartStartDate); d.setDate(d.getDate() + i); return (<div key={i} style={{width: `${pixelsPerDay}px`}} className="text-center text-xs text-gray-500 border-l">{d.getDate()}</div>)})}</div>
                            </div>
                             {todayPosition >= 0 && todayPosition < totalDays && (<div className="absolute top-0 bottom-0 border-r-2 border-red-500 z-10" style={{ right: `${todayPosition * pixelsPerDay}px` }}><div className="absolute -top-2 -right-3 bg-red-500 text-white text-[9px] px-1 rounded-full">היום</div></div>)}
                            {chartData.map((projectGroup) => {
                                const isProjectExpanded = selectedProjectId === 'all' ? expandedProjects.has(projectGroup.id) : true;
                                const canEditTasksInProject = isManagerForTask(projectGroup);
                                return (
                                <React.Fragment key={projectGroup.id}>
                                    {selectedProjectId === 'all' && (
                                        <div className="relative h-10 border-b border-t border-gray-200 bg-gray-50">
                                        {projectGroup.projectStartDate && projectGroup.projectEndDate &&
                                            <div onMouseUp={(e) => handleBarClick(e, 'project', projectGroup.id, projectGroup.id)} onMouseDown={(e) => clickStartRef.current = {x: e.clientX, y: e.clientY}} className="absolute h-6 top-1/2 -translate-y-1/2 bg-slate-400/50 rounded-full cursor-pointer" style={{ right: `${getDaysDiff(chartStartDate, projectGroup.projectStartDate) * pixelsPerDay}px`, width: `${(getDaysDiff(projectGroup.projectStartDate, projectGroup.projectEndDate) + 1) * pixelsPerDay}px` }} title={`${projectGroup.title}: ${getDaysDiff(projectGroup.projectStartDate, projectGroup.projectEndDate) + 1} ימים`}></div>
                                        }
                                        </div>
                                    )}
                                    {isProjectExpanded && (projectGroup.tasks || []).map((task) => {
                                        if (!task.startDate || !task.endDate) return null;
                                        const taskStart = new Date(task.startDate); const taskEnd = new Date(task.endDate); const offset = getDaysDiff(chartStartDate, taskStart); const duration = getDaysDiff(taskStart, taskEnd) + 1;
                                        const canEditThisTask = canUserEditTask(task, projectGroup);
                                        const cursorStyle = canEditThisTask ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer';
                                        return (
                                            <div key={task.id} className="h-10 p-1 relative border-b border-gray-100">
                                                <div className="absolute inset-0 flex">{Array.from({ length: Math.ceil(totalDays) }).map((_, i) => (<div key={i} style={{width: `${pixelsPerDay}px`}} className="h-full border-l border-gray-200/60"></div>))}</div>
                                                <div onMouseDown={(e) => handleBarMouseDown(e, 'task', task.id, projectGroup.id)} onMouseUp={(e) => handleBarClick(e, 'task', task.id, projectGroup.id)} className={`absolute h-8 top-1 rounded-md flex items-center px-2 select-none z-[5] group ${cursorStyle}`} style={{ right: `${offset * pixelsPerDay}px`, width: `${duration * pixelsPerDay}px`, backgroundColor: task.color, minWidth: '20px' }} title={`${task.title} (${duration} ימים)`}>
                                                    {canEditThisTask && <div onMouseDown={(e) => handleResizeStart(e, task.id, 'start', projectGroup.id)} className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 handle-start"></div>}
                                                    <span className="text-white text-xs truncate pointer-events-none">{task.title}</span>
                                                    {canEditThisTask && <div onMouseDown={(e) => handleResizeStart(e, task.id, 'end', projectGroup.id)} className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 handle-end"></div>}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </React.Fragment>
                            )})}
                        </div>
                    </div>
                     {(chartData.length === 0 || chartData.every(p => (p.tasks || []).length === 0)) && <div className="text-center p-8 text-gray-500">לא נמצאו פרויקטים או משימות עם תאריכים עבור הבחירה הנוכחית.</div>}
                </div>
            </div>

            <TaskDetailModal 
                isOpen={!!viewingTask} 
                onClose={() => setViewingTask(null)} 
                task={viewingTask?.task || null} 
                project={viewingTask?.project || null} 
                isManager={isManagerForTask(viewingTask?.project || null)} 
                canUserChangeStatus={canUserChangeTaskStatus(viewingTask?.task, viewingTask?.project)} 
                onUpdateTaskField={(taskId, updates) => {
                    if (viewingTask) {
                        handleUpdateTaskField(taskId, viewingTask.project.id, updates);
                    }
                }}
                onEdit={() => { if (viewingTask) setEditingTask(viewingTask); setViewingTask(null); }} 
                onDelete={() => { if (viewingTask) setDeletingTask(viewingTask); setViewingTask(null); }} 
                onAddComment={handleAddTaskComment} 
                titleId={viewTaskTitleId} 
            />
            <ProjectTasksModal 
                isOpen={!!viewingProject} 
                project={viewingProject} 
                onClose={() => setViewingProject(null)} 
                refreshProject={refreshData}
                users={users}
            />
            <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)} size="sm" titleId={editTaskTitleId}>
                {editingTask && <EditTaskForm titleId={editTaskTitleId} task={editingTask.task} onSubmit={handleUpdateTask} onCancel={() => setEditingTask(null)} users={users} />}
            </Modal>
            <ConfirmationModal isOpen={!!deletingTask} onClose={() => setDeletingTask(null)} onConfirm={confirmDeleteTask} title="אישור מחיקת משימה" message={`האם אתה בטוח שברצונך למחוק את המשימה "${deletingTask?.task?.title}"? פעולה זו היא בלתי הפיכה.`} />
        </div>
    );
};

export default GanttTab;