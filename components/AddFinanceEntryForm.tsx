// src/components/AddFinanceEntryForm.tsx
import React, { useState, useEffect } from 'react';
import { Project, FinanceEntry, FinanceEntryType, Task } from '../types';
import { FormInput, TextInput } from './FormElements';
import * as api from '../services/api';

interface FormProps {
    titleId: string;
    type: FinanceEntryType;
    projects: Project[];
    onCancel: () => void;
    onSubmit: (data: Omit<FinanceEntry, 'id' | 'netAmount' | 'projectTitle' | 'createdAt' | 'updatedAt'>) => void;
}

const AddFinanceEntryForm = ({ titleId, type, projects, onCancel, onSubmit }: FormProps) => {
    const [formData, setFormData] = useState({
        amount: '',
        vatPercentage: '',
        deductions: '',
        status: 'ממתין לתשלום',
        description: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
        projectId: '',
        taskId: '',
    });
    const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (formData.projectId) {
            setLoadingTasks(true);
            api.getTasksForProject(formData.projectId)
                .then(res => setAvailableTasks(res.data))
                .catch(err => {
                    console.error("Failed to fetch tasks:", err);
                    setAvailableTasks([]);
                })
                .finally(() => setLoadingTasks(false));
        } else {
            setAvailableTasks([]);
        }
    }, [formData.projectId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        
        if (!formData.amount || !formData.description || !formData.date) {
            setFormError('סכום, תיאור ותאריך הם שדות חובה.');
            return;
        }

        const dataToSend = {
            type: type,
            amount: parseFloat(formData.amount),
            vatPercentage: parseFloat(formData.vatPercentage) || undefined,
            deductions: parseFloat(formData.deductions) || undefined,
            status: formData.status || 'ממתין לתשלום',
            description: formData.description,
            notes: formData.notes || undefined,
            date: new Date(formData.date).toISOString(),
            projectId: formData.projectId || undefined,
            taskId: formData.taskId || undefined,
        };
        
        onSubmit(dataToSend);
    };
    
    const relevantProjects = projects.filter(p => !p.isArchived);

    return (
        <div className="space-y-4">
            <h3 id={titleId} className="text-xl font-bold text-gray-800">{type === 'INCOME' ? 'הוספת הכנסה' : 'הוספת הוצאה'}</h3>
            <form onSubmit={handleFormSubmit} className="space-y-4">
                {formError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{formError}</span>
                    </div>
                )}
                
                <FormInput id="amount" label="סכום ברוטו (₪)">
                    <TextInput id="amount" type="number" value={formData.amount} onChange={handleChange} min="0" required />
                </FormInput>
                <div className="grid grid-cols-2 gap-4">
                    <FormInput id="vatPercentage" label="מע&quot;מ (%)">
                        <TextInput id="vatPercentage" type="number" value={formData.vatPercentage} onChange={handleChange} min="0" max="100" />
                    </FormInput>
                    <FormInput id="deductions" label="ניכויים (₪)">
                        <TextInput id="deductions" type="number" value={formData.deductions} onChange={handleChange} min="0" />
                    </FormInput>
                </div>
                <FormInput id="status" label="סטטוס">
                    <select id="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm">
                        <option value="ממתין לתשלום">ממתין לתשלום</option>
                        <option value="שולם">שולם</option>
                    </select>
                </FormInput>
                <FormInput id="description" label="תיאור">
                    <textarea id="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"></textarea>
                </FormInput>
                <FormInput id="notes" label="הערות">
                    <textarea id="notes" value={formData.notes} onChange={handleChange} rows={2} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"></textarea>
                </FormInput>
                <FormInput id="date" label="תאריך">
                    <TextInput id="date" type="date" value={formData.date} onChange={handleChange} required />
                </FormInput>
                <FormInput id="projectId" label="פרויקט משויך (אופציונלי)">
                    <select id="projectId" value={formData.projectId} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm">
                        <option value="">בחר פרויקט</option>
                        {relevantProjects.map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                    </select>
                </FormInput>
                {formData.projectId && (
                    <FormInput id="taskId" label="משימה משויכת (אופציונלי)">
                        <select id="taskId" value={formData.taskId} onChange={handleChange} disabled={loadingTasks} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm">
                            <option value="">בחר משימה</option>
                            {loadingTasks ? (
                                <option disabled>טוען משימות...</option>
                            ) : (
                                availableTasks.map(t => (
                                    <option key={t.id} value={t.id}>{t.title}</option>
                                ))
                            )}
                        </select>
                    </FormInput>
                )}
                <div className="flex justify-end space-x-2 space-x-reverse">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-md">ביטול</button>
                    <button type="submit" className="px-4 py-2 bg-[#4A2B2C] text-white rounded-md">הוסף רשומה</button>
                </div>
            </form>
        </div>
    );
};

export default AddFinanceEntryForm;