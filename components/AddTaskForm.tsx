
import React, { useState } from 'react';
import { User, TaskPayload } from '../types';

interface AddTaskFormProps {
    onSubmit: (taskData: TaskPayload) => void;
    onCancel: () => void;
    allUsers: User[];
    titleId: string;
}

const FormInput = ({ id, label, children }: { id: string, label: string, children: React.ReactNode }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {children}
    </div>
);

const TextInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
     <input
        {...props}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"
    />
);

const AddTaskForm = ({ onSubmit, onCancel, allUsers, titleId }: AddTaskFormProps) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assigneesIds, setAssigneesIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [expense, setExpense] = useState('');
    const [color, setColor] = useState('#8A94A6');

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
        onSubmit({ 
            title, 
            description,
            assigneesIds,
            startDate,
            endDate,
            expense: Number(expense) || 0,
            color,
            status: 'מתוכנן'
        });
    };

    return (
        <div className="flex flex-col h-full max-h-[80vh] md:max-h-[70vh]">
            <h3 id={titleId} className="text-xl font-bold text-[#3D2324] mb-4 flex-shrink-0">הוספת משימה חדשה</h3>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0" key="add-task-form">
                <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2 pb-2">
                    <FormInput id="task-title" label="שם המשימה">
                        <TextInput
                            id="task-title"
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="לדוגמא: עיצוב דף נחיתה"
                            required
                        />
                    </FormInput>

                    <FormInput id="task-desc" label="תיאור המשימה">
                        <textarea
                            id="task-desc"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="תיאור (אופציונלי)"
                            rows={2}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"
                        ></textarea>
                    </FormInput>

                    <FormInput id="task-assignees" label="שיוך עובדים">
                        <fieldset>
                            <legend className="sr-only">שייך עובדים למשימה</legend>
                            <div className="max-h-32 overflow-y-auto space-y-2 rounded-md border border-gray-300 p-3 bg-white">
                                {allUsers.map(user => (
                                    <label key={user.id} className="flex items-center space-x-3 space-x-reverse cursor-pointer hover:bg-gray-50 p-1 rounded-md">
                                        <input
                                            type="checkbox"
                                            checked={assigneesIds.includes(user.id)}
                                            onChange={() => handleAssigneeToggle(user.id)}
                                            className="w-4 h-4 rounded border-gray-300 text-[#4A2B2C] focus:ring-[#4A2B2C]"
                                        />
                                        <span className="text-gray-800 select-none">{user.fullName}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    </FormInput>


                    <div className="grid grid-cols-2 gap-4">
                        <FormInput id="task-start-date" label="תאריך התחלה">
                            <TextInput
                                id="task-start-date"
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </FormInput>
                         <FormInput id="task-end-date" label="תאריך סיום">
                            <TextInput
                                id="task-end-date"
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </FormInput>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput id="task-expense" label="הוצאה תקציבית (₪)">
                            <TextInput
                                id="task-expense"
                                type="number"
                                value={expense}
                                onChange={e => setExpense(e.target.value)}
                                placeholder="0"
                                min="0"
                            />
                        </FormInput>
                        <FormInput id="task-color" label="צבע">
                           <TextInput
                                id="task-color"
                                type="color"
                                value={color}
                                onChange={e => setColor(e.target.value)}
                                className="h-10 p-1"
                            />
                        </FormInput>
                    </div>

                </div>


                <div className="flex justify-end space-x-2 space-x-reverse pt-3 mt-auto border-t border-gray-200 flex-shrink-0">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        ביטול
                    </button>
                    <button type="submit" className="px-4 py-2 bg-[#4A2B2C] text-white rounded-md hover:bg-opacity-90">
                        הוסף משימה
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddTaskForm;
