



import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, User, TaskPayload } from '../types';

interface EditTaskFormProps {
    task: Task;
    onSubmit: (updatedTaskData: Partial<TaskPayload>) => void;
    onCancel: () => void;
    users: User[];
    titleId: string;
}

const ALL_STATUSES: TaskStatus[] = ['מתוכנן', 'בתהליך', 'תקוע', 'הושלם'];

const EditTaskForm = ({ task, onSubmit, onCancel, users, titleId }: EditTaskFormProps) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assigneesIds, setAssigneesIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [expense, setExpense] = useState('');
    const [status, setStatus] = useState<TaskStatus>('מתוכנן');
    const [color, setColor] = useState('#8A94A6');

    useEffect(() => {
        setTitle(task?.title);
        setDescription(task?.description || '');
        setAssigneesIds(task.assignees?.map(a => a.id) || []);
        setStartDate(task.startDate?.split('T')[0] || '');
        setEndDate(task.endDate?.split('T')[0] || '');
        setExpense(task.expense?.toString() || '');
        setStatus(task.status);
        setColor(task.color);
    }, [task]);

    const handleAssigneeToggle = (userId: string) => {
        setAssigneesIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        const updatedTaskData: Partial<TaskPayload> = {
            title,
            description,
            assigneesIds,
            startDate,
            endDate,
            expense: Number(expense) || undefined,
            status,
            color
        };
        onSubmit(updatedTaskData);
    };

    return (
        <div className="flex flex-col h-full max-h-[80vh] md:max-h-[70vh]">
            <h3 id={titleId} className="text-xl font-bold text-[#3D2324] mb-4 flex-shrink-0">עריכת משימה</h3>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0" key={task.id}>
                <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2 pb-2">
                    <div>
                        <label htmlFor="edit-task-title" className="block text-sm font-medium text-gray-700 mb-1">שם המשימה</label>
                        <input id="edit-task-title" type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]" />
                    </div>
                    <div>
                        <label htmlFor="edit-task-status" className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
                        <select id="edit-task-status" value={status} onChange={e => setStatus(e.target.value as TaskStatus)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]">
                            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="edit-task-desc" className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
                        <textarea id="edit-task-desc" value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"></textarea>
                    </div>
                    <div>
                        <fieldset>
                            <legend className="block text-sm font-medium text-gray-700 mb-1">שיוך עובדים</legend>
                            <div className="max-h-32 overflow-y-auto space-y-2 rounded-md border border-gray-300 p-3 bg-white">
                                {users.map(user => (
                                    <label key={user.id} className="flex items-center space-x-3 space-x-reverse cursor-pointer hover:bg-gray-50 p-1 rounded-md">
                                        <input type="checkbox" checked={assigneesIds.includes(user.id)} onChange={() => handleAssigneeToggle(user.id)} className="w-4 h-4 rounded border-gray-300 text-[#4A2B2C] focus:ring-[#4A2B2C]" />
                                        <span className="text-gray-800 select-none">{user.fullName}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="edit-task-start" className="block text-sm font-medium text-gray-700 mb-1">ת. התחלה</label>
                            <input id="edit-task-start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]" />
                        </div>
                        <div>
                            <label htmlFor="edit-task-end" className="block text-sm font-medium text-gray-700 mb-1">ת. סיום</label>
                            <input id="edit-task-end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]" />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="edit-task-expense" className="block text-sm font-medium text-gray-700 mb-1">הוצאה (₪)</label>
                            <input id="edit-task-expense" type="number" value={expense} onChange={e => setExpense(e.target.value)} min="0" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]" />
                        </div>
                         <div>
                            <label htmlFor="edit-task-color" className="block text-sm font-medium text-gray-700 mb-1">צבע</label>
                            <input id="edit-task-color" type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-10 p-1 bg-white border border-gray-300 rounded-md shadow-sm" />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end space-x-2 space-x-reverse pt-3 mt-auto border-t border-gray-200 flex-shrink-0">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">ביטול</button>
                    <button type="submit" className="px-4 py-2 bg-[#4A2B2C] text-white rounded-md hover:bg-opacity-90">שמור שינויים</button>
                </div>
            </form>
        </div>
    );
};

export default EditTaskForm;
