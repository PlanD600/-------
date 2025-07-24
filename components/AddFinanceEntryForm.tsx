
import React, { useState, useMemo } from 'react';
import { Project, FinanceEntryType, FinanceEntry } from '../types';

interface FormProps {
    type: FinanceEntryType;
    projects: Project[];
    onCancel: () => void;
    onSubmit: (data: Omit<FinanceEntry, 'id' | 'type' | 'projectTitle' | 'createdAt' | 'updatedAt'>) => void;
    titleId: string;
}

const FormInput = ({ id, label, children }: { id: string, label: string, children: React.ReactNode }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {children}
    </div>
);

const AddFinanceEntryForm = ({ type, projects, onCancel, onSubmit, titleId }: FormProps) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [projectId, setProjectId] = useState<string | undefined>(undefined);
    const [taskId, setTaskId] = useState<string | undefined>(undefined);

    const availableTasks = useMemo(() => {
        if (!projectId) return [];
        const selectedProject = projects.find(p => p.id === projectId);
        return selectedProject?.tasks || [];
    }, [projectId, projects]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !description || !date) {
            alert('אנא מלא את כל שדות החובה.');
            return;
        }
        onSubmit({
            amount: Number(amount),
            description,
            date: new Date(date).toISOString(),
            projectId,
            taskId
        });
    };
    
    const titleText = type === 'INCOME' ? 'הוספת הכנסה חדשה' : 'הוספת הוצאה חדשה';
    const amountLabel = type === 'INCOME' ? 'סכום ההכנסה (₪)' : 'סכום ההוצאה (₪)';

    return (
        <div className="p-2">
            <h3 id={titleId} className="text-xl font-bold text-[#3D2324] mb-6">{titleText}</h3>
            <form onSubmit={handleSubmit} className="space-y-4" key="add-finance-form">
                <FormInput id="amount" label={amountLabel}>
                    <input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"
                        placeholder="0"
                        min="0"
                    />
                </FormInput>

                <FormInput id="description" label="תיאור">
                    <input
                        id="description"
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"
                        placeholder={type === 'INCOME' ? 'לדוגמא: תשלום מלקוח' : 'לדוגמא: רכישת ציוד'}
                    />
                </FormInput>
                
                <FormInput id="date" label="תאריך">
                    <input
                        id="date"
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"
                    />
                </FormInput>

                <FormInput id="project" label="שייך לפרויקט (אופציונלי)">
                    <select
                        id="project"
                        value={projectId || ''}
                        onChange={e => {
                            setProjectId(e.target.value || undefined);
                            setTaskId(undefined); // Reset task when project changes
                        }}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"
                    >
                        <option value="">ללא שיוך לפרויקט</option>
                        {projects.filter(p => !p.isArchived).map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                    </select>
                </FormInput>

                <FormInput id="task" label="שייך למשימה (אופציונלי)">
                    <select
                        id="task"
                        value={taskId || ''}
                        onChange={e => setTaskId(e.target.value || undefined)}
                        disabled={!projectId || availableTasks.length === 0}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C] disabled:bg-gray-100"
                    >
                        <option value="">ללא שיוך למשימה</option>
                        {availableTasks.map(t => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                    </select>
                </FormInput>

                <div className="flex justify-end space-x-2 space-x-reverse pt-4 mt-2 border-t border-gray-200">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        ביטול
                    </button>
                    <button type="submit" className="px-4 py-2 bg-[#4A2B2C] text-white rounded-md hover:bg-opacity-90">
                        הוסף
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddFinanceEntryForm;
