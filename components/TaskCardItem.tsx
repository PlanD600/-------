

import React from 'react';
import { Task, TaskStatus } from '../types';

interface TaskCardItemProps {
    task: Task;
    onView: () => void;
}

const statusStyles: { [key in TaskStatus]: { bg: string; text: string; } } = {
    'הושלם': { bg: 'bg-green-100', text: 'text-green-800' },
    'בתהליך': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    'תקוע': { bg: 'bg-red-100', text: 'text-red-800' },
    'מתוכנן': { bg: 'bg-gray-100', text: 'text-gray-800' },
};

const TaskCardItem = ({ task, onView }: TaskCardItemProps) => {
    const style = statusStyles[task.status] || statusStyles['מתוכנן'];
    const assigneeNames = (task.assignees || []).map(u => u.fullName).join(', ');

    return (
        <button
            type="button"
            className="w-full text-right bg-white rounded-2xl p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-shadow flex flex-col justify-between h-full cursor-pointer"
            onClick={onView}
            aria-label={`הצג פרטי משימה: ${task.title}. סטטוס: ${task.status}.`}
        >
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg text-[#3D2324] pr-2 line-clamp-2">{task.title}</h4>
                </div>
                <p className="text-base text-gray-600 line-clamp-3 mb-4">{task.description || 'אין תיאור למשימה.'}</p>
                 <div className="text-sm space-y-2">
                    <div>
                        <span className="font-semibold text-gray-500">תאריכים: </span>
                        <span className="text-gray-800">
                             {task.startDate ? new Date(task.startDate).toLocaleDateString('he-IL') : 'N/A'} - {task.endDate ? new Date(task.endDate).toLocaleDateString('he-IL') : 'N/A'}
                        </span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-500">משויך ל: </span>
                        <span className="text-gray-800">
                            {assigneeNames || 'טרם שויך'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                    {task.status}
                </span>
                <span className="text-sm text-gray-500">
                    {task.comments.length} תגובות
                </span>
            </div>
        </button>
    );
};

export default TaskCardItem;
