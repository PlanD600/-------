// pages/tabs/GanttTab.tsx

import React, { useState, useMemo, useEffect, useRef, useId } from 'react';
import * as api from '../../services/api';
import { Project, Task, User, TaskPayload } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../../components/Modal';
import TaskDetailModal from '../../components/TaskDetailModal';
import EditTaskForm from '../../components/EditTaskForm';
import ConfirmationModal from '../../components/ConfirmationModal';
import { PlusIcon, MinusIcon, ArrowsPointingOutIcon } from '../../components/icons';
import ProjectTasksModal from '../../components/ProjectTasksModal';

// --- קבועים לעיצוב וגמישות ---
const DAY_WIDTH_DEFAULT = 35;
const ROW_HEIGHT = 44; // גובה שורה אופטימלי לקריאות

// --- פונקציות עזר מדויקות לחישוב תאריכים ---
const getDaysOffset = (chartStartDate: Date, date: Date) => {
    const d1 = new Date(chartStartDate.getFullYear(), chartStartDate.getMonth(), chartStartDate.getDate());
    const d2 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffTime = d2.getTime() - d1.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

const getDaysDuration = (startDate: Date, endDate: Date) => {
    return getDaysOffset(startDate, endDate) + 1;
};

// --- רכיב הגאנט הראשי ---
const GanttTab = ({ projects, users, refreshData }: { projects: Project[], users: User[], refreshData: () => void }) => {
    // --- State Hooks ---
    const [localProjects, setLocalProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
    const [dateRange, setDateRange] = useState('year');
    const [pixelsPerDay, setPixelsPerDay] = useState(DAY_WIDTH_DEFAULT);
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

    // State for interactions
    const [resizingTask, setResizingTask] = useState<{ taskId: string; projectId: string; handle: 'start' | 'end'; initialX: number; initialDate: Date; } | null>(null);
    const [movingTask, setMovingTask] = useState<{ taskId: string; projectId: string; initialX: number; initialStartDate: Date; initialEndDate: Date; } | null>(null);
    const clickStartRef = useRef<{ x: number, y: number } | null>(null);

    // State for modals
    const [viewingTask, setViewingTask] = useState<{ task: Task, project: Project } | null>(null);
    const [editingTask, setEditingTask] = useState<{ task: Task, project: Project } | null>(null);
    const [deletingTask, setDeletingTask] = useState<{ task: Task, project: Project } | null>(null);
    const [viewingProject, setViewingProject] = useState<Project | null>(null);

    // --- Refs and Context ---
    const ganttContainerRef = useRef<HTMLDivElement>(null);
    const timelineBodyRef = useRef<HTMLDivElement>(null);
    const sidebarBodyRef = useRef<HTMLDivElement>(null);

    const { user, currentUserRole } = useAuth();
    const viewTaskTitleId = useId();
    const editTaskTitleId = useId();

    // --- Effects ---

    useEffect(() => {
        const sortedProjects = projects.map(p => ({
            ...p,
            tasks: (p.tasks || []).sort((a, b) => a.displayOrder - b.displayOrder)
        }));
        setLocalProjects(JSON.parse(JSON.stringify(sortedProjects)));
        const allProjectIds = new Set(projects.map(p => p.id));
        setExpandedProjects(allProjectIds);
    }, [projects]);

    // סנכרון גלילה בין הרשימה לתרשים
    useEffect(() => {
        const sidebar = sidebarBodyRef.current;
        const timeline = timelineBodyRef.current;
        if (!sidebar || !timeline) return;

        let isSyncing = false;
        const handleSidebarScroll = () => {
            if (isSyncing) return;
            isSyncing = true;
            timeline.scrollTop = sidebar.scrollTop;
            requestAnimationFrame(() => { isSyncing = false; });
        };
        const handleTimelineScroll = () => {
            if (isSyncing) return;
            isSyncing = true;
            sidebar.scrollTop = timeline.scrollTop;
            requestAnimationFrame(() => { isSyncing = false; });
        };

        sidebar.addEventListener('scroll', handleSidebarScroll);
        timeline.addEventListener('scroll', handleTimelineScroll);

        return () => {
            sidebar.removeEventListener('scroll', handleSidebarScroll);
            timeline.removeEventListener('scroll', handleTimelineScroll);
        };
    }, []);
    
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizingTask && !movingTask) return;
            document.body.classList.add('unselectable', 'cursor-grabbing');
            e.preventDefault();

            if (resizingTask) {
                const dayDiff = Math.round((e.clientX - resizingTask.initialX) / pixelsPerDay);
                const newDate = new Date(resizingTask.initialDate);
                newDate.setDate(newDate.getDate() + dayDiff);
                const newDateString = newDate.toISOString().split('T')[0];

                setLocalProjects(prev => prev.map(p => {
                    if (p.id !== resizingTask.projectId) return p;
                    return { ...p, tasks: (p.tasks || []).map(t => {
                        if (t.id !== resizingTask.taskId) return t;
                        const currentStartDate = new Date(t.startDate!);
                        const currentEndDate = new Date(t.endDate!);
                        if (resizingTask.handle === 'start' && newDate <= currentEndDate) return { ...t, startDate: newDateString };
                        if (resizingTask.handle === 'end' && newDate >= currentStartDate) return { ...t, endDate: newDateString };
                        return t;
                    })};
                }));
            } else if (movingTask) {
                const dayDiff = Math.round((e.clientX - movingTask.initialX) / pixelsPerDay);
                const newStartDate = new Date(movingTask.initialStartDate);
                newStartDate.setDate(newStartDate.getDate() + dayDiff);
                const newEndDate = new Date(movingTask.initialEndDate);
                newEndDate.setDate(newEndDate.getDate() + dayDiff);

                setLocalProjects(prev => prev.map(p => p.id === movingTask.projectId ? { ...p, tasks: (p.tasks || []).map(t => t.id === movingTask.taskId ? { ...t, startDate: newStartDate.toISOString().split('T')[0], endDate: newEndDate.toISOString().split('T')[0] } : t) } : p));
            }
        };

        const handleMouseUp = async () => {
            document.body.classList.remove('unselectable', 'cursor-grabbing');
            const action = resizingTask || movingTask;
            if (action) {
                const project = localProjects.find(p => p.id === action.projectId);
                const task = project?.tasks?.find(t => t.id === action.taskId);
                if (task && project) {
                    try {
                        // עדכון אופטימי בוצע, עכשיו נשלח לשרת
                        await api.updateTask(project.id, task.id, { startDate: task.startDate, endDate: task.endDate });
                        // אין צורך ב-refreshData() כדי למנוע ריענון מלא
                    } catch (err) {
                        console.error("Failed to update task dates", err);
                        alert("שגיאה בעדכון המשימה. מחזיר למצב הקודם.");
                        refreshData(); // החזרה למצב השרת רק במקרה של שגיאה
                    }
                }
            }
            setResizingTask(null);
            setMovingTask(null);
            clickStartRef.current = null;
        };

        if (resizingTask || movingTask) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp, { once: true });
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.classList.remove('unselectable', 'cursor-grabbing');
        };
    }, [resizingTask, movingTask, pixelsPerDay, localProjects, refreshData]);

    // --- Memos for performance ---

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

    const { chartData, chartStartDate, totalDays } = useMemo(() => {
        const allDates: Date[] = [];
        visibleProjects.forEach(p => {
            if (p.startDate) allDates.push(new Date(p.startDate));
            if (p.endDate) allDates.push(new Date(p.endDate));
            (p.tasks || []).forEach(t => {
                if (t.startDate) allDates.push(new Date(t.startDate));
                if (t.endDate) allDates.push(new Date(t.endDate));
            });
        });

        const now = new Date();
        let viewStartDate: Date;
        let viewEndDate: Date;

        switch (dateRange) {
            case 'year':
                viewStartDate = new Date(now.getFullYear(), 0, 1);
                viewEndDate = new Date(now.getFullYear(), 11, 31);
                break;
            case 'month':
                viewStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
                viewEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'week':
                const dayOfWeek = now.getDay();
                viewStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
                viewEndDate = new Date(viewStartDate.getFullYear(), viewStartDate.getMonth(), viewStartDate.getDate() + 6);
                break;
            default: // 'all'
                if (allDates.length > 0) {
                    viewStartDate = new Date(Math.min(...allDates.map(d => d.getTime())));
                    viewEndDate = new Date(Math.max(...allDates.map(d => d.getTime())));
                } else {
                    viewStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    viewEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                }
                break;
        }
        
        viewStartDate.setDate(viewStartDate.getDate() - 7);
        viewEndDate.setDate(viewEndDate.getDate() + 14);

        const finalTotalDays = getDaysOffset(viewStartDate, viewEndDate) + 1;
        return { chartData: visibleProjects, chartStartDate: viewStartDate, totalDays: finalTotalDays > 0 ? finalTotalDays : 30 };
    }, [visibleProjects, dateRange]);


    // --- Handlers ---
    
    const isManagerForTask = (project: Project | null) => {
        if (!user || !project) return false;
        if (currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN') return true;
        return currentUserRole === 'TEAM_LEADER' && project.teamLeads?.some(lead => lead.id === user.id);
    };

    const canUserEditTask = (task: Task | null, project: Project | null) => {
        if (!user || !task || !project || !task.id) return false;
        return isManagerForTask(project);
    };
    
    const canUserChangeTaskStatus = (task: Task | null, project: Project | null) => {
        if (!user || !task || !project) return false;
        if (isManagerForTask(project)) return true;
        return (task.assignees || []).some(assignee => assignee.id === user.id);
    };
    
    const toggleProjectExpansion = (projectId: string) => {
        setExpandedProjects(prev => {
            const newSet = new Set(prev);
            if (newSet.has(projectId)) newSet.delete(projectId);
            else newSet.add(projectId);
            return newSet;
        });
    };

    const handleZoomIn = () => setPixelsPerDay(p => Math.min(p * 1.5, 150));
    const handleZoomOut = () => setPixelsPerDay(p => Math.max(p / 1.5, 20));
    const handleFitToScreen = () => {
        const timelineBody = timelineBodyRef.current;
        if (timelineBody) {
            const containerWidth = timelineBody.offsetWidth;
            if (totalDays > 0 && containerWidth > 0) {
                setPixelsPerDay(containerWidth / totalDays);
            }
        }
    };

    const handleGoToToday = () => {
        const ganttElement = timelineBodyRef.current;
        if (ganttElement) {
            const todayOffset = getDaysOffset(chartStartDate, new Date());
            const containerWidth = ganttElement.offsetWidth;
            ganttElement.scrollLeft = (todayOffset * pixelsPerDay) - (containerWidth / 2) + (pixelsPerDay / 2);
        }
    };

    const handleBarMouseDown = (e: React.MouseEvent, type: 'task' | 'project', id: string, projectId: string) => {
        e.stopPropagation();
        clickStartRef.current = { x: e.clientX, y: e.clientY };
        if (type === 'task') {
            const project = localProjects.find(p => p.id === projectId);
            const task = project?.tasks?.find(t => t.id === id);
            if (task && task.startDate && task.endDate && canUserEditTask(task, project || null)) {
                setMovingTask({ taskId: id, projectId, initialX: e.clientX, initialStartDate: new Date(task.startDate), initialEndDate: new Date(task.endDate) });
            }
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
        if (task && canUserEditTask(task, project || null)) {
            const initialDateString = handle === 'start' ? task.startDate : task.endDate;
            if (initialDateString) {
                setResizingTask({ taskId, projectId, handle, initialX: e.clientX, initialDate: new Date(initialDateString) });
            }
        }
    };
    
    // ... (Modal and API handlers remain the same)
    const handleUpdateTask = async (updatedTaskData: Partial<TaskPayload>) => {
        if (!editingTask) return;
        const { project, task } = editingTask;
        try {
            await api.updateTask(project.id, task.id, updatedTaskData);
            refreshData();
            setEditingTask(null);
        } catch (err) { console.error("Failed to update task", err); alert("שגיאה בעדכון המשימה."); }
    };
    const confirmDeleteTask = async () => {
        if (!deletingTask) return;
        const { task, project } = deletingTask;
        try {
            await api.deleteTask(project.id, task.id);
            refreshData();
            setDeletingTask(null); setViewingTask(null);
        } catch (err) { console.error("Failed to delete task", err); alert("שגיאה במחיקת המשימה."); }
    };
    const handleAddTaskComment = async (commentText: string) => {
        if (!viewingTask || !user) return;
        const { task, project } = viewingTask;
        try {
           const newComment = await api.addTaskComment(project.id, task.id, commentText);
           const optimisticUpdate = (currentTask: Task): Task => ({ ...currentTask, comments: [...(currentTask.comments || []), newComment] });
           setLocalProjects(prev => prev.map(p => p.id === project.id ? { ...p, tasks: (p.tasks || []).map(t => t.id === task.id ? optimisticUpdate(t) : t) } : p));
           setViewingTask(prev => prev ? { ...prev, task: optimisticUpdate(prev.task) } : null);
        } catch(error) { console.error("Failed to add comment", error); alert("שגיאה בהוספת תגובה."); refreshData(); }
    };
    const handleUpdateTaskField = async (taskId: string, projectId: string, updates: Partial<TaskPayload>) => {
        try {
            const updatedTask = await api.updateTask(projectId, taskId, updates);
            setLocalProjects(prev => prev.map(p => p.id !== projectId ? p : { ...p, tasks: (p.tasks || []).map(t => t.id === taskId ? updatedTask : t) }));
            if (viewingTask?.task.id === taskId) { setViewingTask(prev => prev ? { ...prev, task: updatedTask } : null); }
        } catch(e) { console.error(e); alert("שגיאה בעדכון המשימה. סנכרון מחדש..."); refreshData(); }
    };

    // --- Render Calculation ---
    const timelineWidth = totalDays * pixelsPerDay;
    const todayPosition = getDaysOffset(chartStartDate, new Date());

    // --- JSX ---
    return (
        <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-3xl font-bold text-gray-800">תרשים גאנט</h2>
                <div className="flex items-center gap-2">
                    <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">
                        <option value="all">כל הפרויקטים</option>
                        {projects.filter(p => !p.isArchived).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                    <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">
                        <option value="all">כל התקופה</option>
                        <option value="year">שנה</option>
                        <option value="month">חודש</option>
                        <option value="week">שבוע</option>
                    </select>
                    <button onClick={handleGoToToday} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100">היום</button>
                    <div className="flex items-center border border-gray-300 rounded-lg p-1 bg-white">
                        <button onClick={handleZoomOut} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md"><MinusIcon className="w-5 h-5" /></button>
                        <button onClick={handleFitToScreen} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md"><ArrowsPointingOutIcon className="w-5 h-5" /></button>
                        <button onClick={handleZoomIn} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md"><PlusIcon className="w-5 h-5" /></button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200" ref={ganttContainerRef}>
                <div className="grid grid-cols-[320px,1fr]">
                    {/* ===== Sidebar Header ===== */}
                    <div className="sticky top-0 bg-gray-100 z-30 border-l border-b-2 border-gray-300">
                        <div className="h-[80px] flex items-center px-4 font-semibold text-gray-700 text-lg">משימה</div>
                    </div>
                    {/* ===== Timeline Header ===== */}
                    <div className="overflow-hidden sticky top-0 bg-white z-20 border-b-2 border-gray-300">
                        <div style={{ width: `${timelineWidth}px`}}>
                            <div className="relative h-10 flex border-b border-gray-200">
                                {Array.from({ length: Math.ceil(totalDays / 7) }).map((_, i) => {
                                    const weekStartDate = new Date(chartStartDate);
                                    weekStartDate.setDate(weekStartDate.getDate() + i * 7);
                                    return <div key={`week-${i}`} style={{ minWidth: `${7 * pixelsPerDay}px` }} className="flex items-center justify-center text-sm font-medium text-gray-500 border-l">שבוע {weekStartDate.getDate()}/{weekStartDate.getMonth()+1}</div>;
                                })}
                            </div>
                            <div className="relative h-10 flex bg-gray-50">
                                {Array.from({ length: totalDays }).map((_, i) => {
                                    const dayDate = new Date(chartStartDate);
                                    dayDate.setDate(dayDate.getDate() + i);
                                    const dayOfMonth = dayDate.getDate();
                                    const dayOfWeek = dayDate.getDay();
                                    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
                                    return (
                                        <div key={`day-${i}`} style={{ width: `${pixelsPerDay}px` }} className={`flex flex-col items-center justify-center border-l ${isWeekend ? 'bg-gray-100' : ''}`}>
                                            <span className="text-xs text-gray-400">{dayDate.toLocaleDateString('he-IL', { weekday: 'short' })}</span>
                                            <span className="text-md font-semibold text-gray-700">{dayOfMonth}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-hidden relative grid grid-cols-[320px,1fr]">
                    {/* ===== Sidebar Body ===== */}
                    <div className="overflow-y-scroll" ref={sidebarBodyRef}>
                        {chartData.map((project) => {
                            const isProjectExpanded = selectedProjectId === 'all' ? expandedProjects.has(project.id) : true;
                            const projectRowCount = isProjectExpanded ? (project.tasks || []).length : 0;
                            const totalProjectHeight = (projectRowCount + (selectedProjectId === 'all' ? 1 : 0)) * ROW_HEIGHT;
                            return (
                                <div key={`list-group-${project.id}`} style={{height: `${totalProjectHeight}px`}}>
                                    {selectedProjectId === 'all' && (
                                        <div onClick={() => toggleProjectExpansion(project.id)} className="flex items-center h-11 px-2 bg-gray-100 font-bold text-gray-800 border-b border-t select-none cursor-pointer hover:bg-gray-200">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 ml-2 transition-transform transform ${isProjectExpanded ? 'rotate-90' : ''}`}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                            </svg>
                                            <span className="truncate">{project.title}</span>
                                        </div>
                                    )}
                                    {isProjectExpanded && (project.tasks || []).map((task, index) => (
                                        <div key={`list-item-${task.id || index}`} className="relative h-11 flex items-center px-4 border-b border-gray-100 group">
                                            <span className="truncate text-sm font-medium text-gray-700">{task.title || `משימה ללא שם ${index + 1}`}</span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                    {/* ===== Timeline Body ===== */}
                    <div className="overflow-auto gantt-timeline-body" ref={timelineBodyRef}>
                         <div className="relative" style={{width: `${timelineWidth}px`, height: `${chartData.reduce((acc, p) => acc + ((selectedProjectId === 'all' ? 1 : 0) + (expandedProjects.has(p.id) ? (p.tasks || []).length : 0)) * ROW_HEIGHT, 0)}px`}}>
                            <div className="absolute inset-0 flex pointer-events-none">
                                {Array.from({ length: totalDays }).map((_, i) => {
                                    const dayDate = new Date(chartStartDate);
                                    dayDate.setDate(dayDate.getDate() + i);
                                    const isWeekend = dayDate.getDay() === 5 || dayDate.getDay() === 6;
                                    return <div key={`grid-col-${i}`} style={{width: `${pixelsPerDay}px`}} className={`h-full border-l ${isWeekend ? 'bg-gray-100' : 'border-gray-200/40'}`}></div>
                                })}
                            </div>
                            {todayPosition >= 0 && todayPosition < totalDays && (
                                <div className="absolute top-0 bottom-0 border-r-2 border-red-500/80 z-20" style={{ right: `${todayPosition * pixelsPerDay}px` }}>
                                    <div className="absolute -top-2.5 -right-3 bg-red-500 text-white text-xs px-1.5 rounded-full shadow">היום</div>
                                </div>
                            )}
                            {chartData.map((project, projIndex) => {
                                const isProjectExpanded = selectedProjectId === 'all' ? expandedProjects.has(project.id) : true;
                                const projectStartDate = project.startDate ? new Date(project.startDate) : null;
                                const projectEndDate = project.endDate ? new Date(project.endDate) : null;
                                let baseRowIndex = 0;
                                for(let i=0; i<projIndex; i++) {
                                    baseRowIndex += (selectedProjectId === 'all' ? 1 : 0) + (expandedProjects.has(chartData[i].id) ? (chartData[i].tasks || []).length : 0);
                                }
                                return (
                                    <React.Fragment key={`timeline-frag-${project.id}`}>
                                        {selectedProjectId === 'all' && projectStartDate && projectEndDate && (
                                            <div onMouseUp={(e) => handleBarClick(e, 'project', project.id, project.id)} className="absolute h-3 bg-gray-400 rounded-full cursor-pointer hover:bg-gray-500 z-10"
                                                style={{ top: `${baseRowIndex * ROW_HEIGHT + (ROW_HEIGHT / 2) - 6}px`, right: `${getDaysOffset(chartStartDate, projectStartDate) * pixelsPerDay}px`, width: `${getDaysDuration(projectStartDate, projectEndDate) * pixelsPerDay}px` }}
                                                title={`${project.title}: ${getDaysDuration(projectStartDate, projectEndDate)} ימים`}
                                            />
                                        )}
                                        {isProjectExpanded && (project.tasks || []).map((task, taskIndex) => {
                                            const taskStartDate = task.startDate ? new Date(task.startDate) : null;
                                            const taskEndDate = task.endDate ? new Date(task.endDate) : null;
                                            const canEditThisTask = canUserEditTask(task, project);
                                            const cursorStyle = canEditThisTask ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer';
                                            const topPosition = (baseRowIndex + (selectedProjectId === 'all' ? 1 : 0) + taskIndex) * ROW_HEIGHT;
                                            if(!taskStartDate || !taskEndDate) return null;
                                            return (
                                                <div key={`timeline-item-${task.id || taskIndex}`} onMouseDown={(e) => handleBarMouseDown(e, 'task', task.id, project.id)} onMouseUp={(e) => handleBarClick(e, 'task', task.id, project.id)}
                                                    className={`absolute h-[30px] rounded-md flex items-center px-3 select-none group shadow-lg transition-shadow duration-200 hover:shadow-xl ${cursorStyle}`}
                                                    style={{ top: `${topPosition + (ROW_HEIGHT - 30) / 2}px`, right: `${getDaysOffset(chartStartDate, taskStartDate) * pixelsPerDay}px`, width: `${getDaysDuration(taskStartDate, taskEndDate) * pixelsPerDay}px`, backgroundColor: task.color || '#3B82F6', zIndex: 20 }}
                                                    title={`${task.title} (${getDaysDuration(taskStartDate, taskEndDate)} ימים)`}
                                                >
                                                    {canEditThisTask && <div onMouseDown={(e) => handleResizeStart(e, task.id, 'start', project.id)} className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-30 handle-start"></div>}
                                                    <span className="text-white font-semibold text-sm truncate pointer-events-none">{task.title}</span>
                                                    {canEditThisTask && <div onMouseDown={(e) => handleResizeStart(e, task.id, 'end', project.id)} className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-30 handle-end"></div>}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
             <TaskDetailModal isOpen={!!viewingTask} onClose={() => setViewingTask(null)} task={viewingTask?.task || null} project={viewingTask?.project || null} isManager={isManagerForTask(viewingTask?.project || null)} canUserChangeStatus={canUserChangeTaskStatus(viewingTask?.task || null, viewingTask?.project || null)} onUpdateTaskField={(taskId, updates) => { if (viewingTask) { handleUpdateTaskField(taskId, viewingTask.project.id, updates); } }} onEdit={() => { if (viewingTask) setEditingTask(viewingTask); setViewingTask(null); }} onDelete={() => { if (viewingTask) setDeletingTask(viewingTask); setViewingTask(null); }} onAddComment={handleAddTaskComment} titleId={viewTaskTitleId} />
            <ProjectTasksModal isOpen={!!viewingProject} project={viewingProject} onClose={() => setViewingProject(null)} refreshProject={refreshData} users={users} />
            <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)} size="sm" titleId={editTaskTitleId}>
                {editingTask && <EditTaskForm titleId={editTaskTitleId} task={editingTask.task} onSubmit={handleUpdateTask} onCancel={() => setEditingTask(null)} users={users} />}
            </Modal>
            <ConfirmationModal isOpen={!!deletingTask} onClose={() => setDeletingTask(null)} onConfirm={confirmDeleteTask} title="אישור מחיקת משימה" message={`האם אתה בטוח שברצונך למחוק את המשימה "${deletingTask?.task?.title}"? פעולה זו היא בלתי הפיכה.`} />
        </div>
    );
};

export default GanttTab;
