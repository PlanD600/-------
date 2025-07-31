

import { Task, TaskStatus } from '../types';

interface TaskListItemProps {
    task: Task;
    onView: () => void;
}

const statusStyles: { [key in TaskStatus]: { text: string; dot: string; } } = {
    'הושלם': { text: 'text-green-700', dot: 'bg-green-500' },
    'בתהליך': { text: 'text-yellow-700', dot: 'bg-yellow-500' },
    'תקוע': { text: 'text-red-700', dot: 'bg-red-500' },
    'מתוכנן': { text: 'text-gray-600', dot: 'bg-gray-400' },
};

const TaskListItem = ({ task, onView }: TaskListItemProps) => {
    const style = statusStyles[task.status] || statusStyles['מתוכנן'];
    const assigneeNames = Array.isArray(task.assignees) ? task.assignees.map(u => u.fullName).join(', ') : '';
    return (
        <button
            type="button"
            className="w-full text-right bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={onView}
            aria-label={`הצג פרטי משימה: ${task?.title}. סטטוס: ${task.status}.`}
        >
            {/* Mobile View */}
            <div className="p-3 md:hidden">
                <div className="flex justify-between items-start gap-4">
                    <p className="font-bold text-gray-800 break-words flex-1">{task?.title}</p>
                    <div className="flex items-center flex-shrink-0">
                        <span className={`w-2 h-2 rounded-full ml-2 ${style.dot}`}></span>
                        <span className={`text-sm ${style.text}`}>{task.status}</span>
                    </div>
                </div>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                        <span className="font-semibold w-20">תאריכים:</span>
                        <span>
                            {task.startDate || task.endDate ? (
                                `${task.startDate ? new Date(task.startDate).toLocaleDateString('he-IL') : '...'} - ${task.endDate ? new Date(task.endDate).toLocaleDateString('he-IL') : '...'}`
                            ) : 'אין'}
                        </span>
                    </div>
                    <div className="flex items-center">
                        <span className="font-semibold w-20">משויכים:</span>
                        <span className="truncate" title={assigneeNames}>
                            {assigneeNames || 'טרם שויך'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1.5fr)] gap-x-4 items-center p-3">
                {/* Status */}
                <div className="flex items-center">
                    <span className={`w-2.5 h-2.5 rounded-full ml-2 ${style.dot}`}></span>
                    <span className={`font-semibold text-sm ${style.text}`}>{task.status}</span>
                </div>

                {/* Task Name */}
                <p className="font-semibold text-gray-800 truncate" title={task?.title}>{task?.title}</p>

                {/* Dates */}
                <div className="text-sm text-gray-500">
                    {task.startDate || task.endDate ? (
                        <span>
                            {task.startDate ? new Date(task.startDate).toLocaleDateString('he-IL') : 'N/A'} - {task.endDate ? new Date(task.endDate).toLocaleDateString('he-IL') : 'N/A'}
                        </span>
                    ) : (
                        <span>אין תאריכים</span>
                    )}
                </div>

                {/* Assignees */}
                <div className="text-sm text-gray-600 truncate" title={assigneeNames}>
                    {assigneeNames || 'טרם שויך'}
                </div>
            </div>
        </button>
    );
};

export default TaskListItem;
