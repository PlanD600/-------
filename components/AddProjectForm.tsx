// src/components/AddProjectForm.tsx
import React, { useState } from 'react';
import { User, ProjectPayload, MonthlyBudgetPayload, Team } from '../types';

interface AddProjectFormProps {
    onSubmit: (projectData: ProjectPayload) => void;
    onCancel: () => void;
    teamLeads: User[];
    teams: Team[];
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

const AddProjectForm = ({ onSubmit, onCancel, teamLeads: availableLeads, teams, titleId }: AddProjectFormProps) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedTeamLeadIds, setSelectedTeamLeadIds] = useState<string[]>([]);
    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
    const [assignMethod, setAssignMethod] = useState<'team' | 'teamLeads'>(teams && teams.length > 0 ? 'team' : 'teamLeads');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [incomeBudget, setIncomeBudget] = useState<number | ''>('');
    const [expenseBudget, setExpenseBudget] = useState<number | ''>('');
    const [formError, setFormError] = useState('');

    const handleLeadToggle = (leadId: string) => {
        setSelectedTeamLeadIds(prev =>
            prev.includes(leadId)
                ? prev.filter(id => id !== leadId)
                : [...prev, leadId]
        );
    };

    const handleTeamToggle = (teamId: string) => {
        setSelectedTeamIds(prev =>
            prev.includes(teamId)
                ? prev.filter(id => id !== teamId)
                : [...prev, teamId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
        setFormError('שם הפרויקט הוא שדה חובה.');
        return;
    }

    let teamLeadsToSend: string[] = [];
    let teamIdsToSend: string[] = [];

    if (assignMethod === 'team') {
        if (selectedTeamIds.length === 0) {
            setFormError('חובה לבחור לפחות צוות אחד.');
            return;
        }
        teamIdsToSend = selectedTeamIds;
        const allLeadsFromTeams = teams.filter(t => selectedTeamIds.includes(t.id))
                                       .flatMap(t => t.leads || [])
                                       .map(lead => lead.id);
        teamLeadsToSend = [...new Set(allLeadsFromTeams)];
    } else { // assignMethod === 'teamLeads'
        if (selectedTeamLeadIds.length === 0) {
            setFormError('חובה לבחור לפחות ראש צוות אחד.');
            return;
        }
        teamLeadsToSend = selectedTeamLeadIds;
        teamIdsToSend = [];
    }
    
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
            setFormError('תאריך ההתחלה לא יכול להיות אחרי תאריך הסיום.');
            return;
        }
    }

    const monthlyBudgetsPayload: MonthlyBudgetPayload[] = [];
    if (incomeBudget !== '' || expenseBudget !== '') {
        const now = new Date();
        monthlyBudgetsPayload.push({
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            incomeBudget: Number(incomeBudget) || 0,
            expenseBudget: Number(expenseBudget) || 0,
        });
    }

    onSubmit({
        title,
        description,
        teamLeads: teamLeadsToSend,
        teamIds: teamIdsToSend,
        startDate,
        endDate,
        monthlyBudgets: monthlyBudgetsPayload.length > 0 ? monthlyBudgetsPayload : undefined,
    });
};

    return (
        <div className="flex flex-col h-full max-h-[80vh] md:max-h-[70vh]">
            <h3 id={titleId} className="text-xl font-bold text-[#3D2324] mb-4 flex-shrink-0">יצירת פרויקט חדש</h3>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0" key="add-project-form">
                <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2 pb-2">
                    {formError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">{formError}</span>
                        </div>
                    )}

                    <FormInput id="proj-title" label="שם הפרויקט">
                        <TextInput
                            id="proj-title"
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="לדוגמא: השקת מוצר חדש"
                            required
                        />
                    </FormInput>
                    
                    <FormInput id="proj-desc" label="תיאור הפרויקט">
                        <textarea
                            id="proj-desc"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="תיאור קצר של הפרויקט (אופציונלי)"
                            rows={3}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"
                        ></textarea>
                    </FormInput>
                    
                    {/* 💡 הוספת העיצוב החדש */}
                    {teams && teams.length > 0 && availableLeads && availableLeads.length > 0 && (
                        <div className="flex items-center space-x-4 space-x-reverse mb-4">
                            <span className="text-sm font-medium text-gray-700">שייך פרויקט:</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setAssignMethod('team');
                                    setSelectedTeamLeadIds([]);
                                }}
                                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${assignMethod === 'team' ? 'bg-[#4A2B2C] text-white' : 'bg-gray-200 text-gray-800'}`}
                            >
                                לצוות
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setAssignMethod('teamLeads');
                                    setSelectedTeamIds([]);
                                }}
                                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${assignMethod === 'teamLeads' ? 'bg-[#4A2B2C] text-white' : 'bg-gray-200 text-gray-800'}`}
                            >
                                לראשי צוות
                            </button>
                        </div>
                    )}
                    
                    {assignMethod === 'team' && teams && teams.length > 0 && (
                        <FormInput id="proj-teams" label="שיוך צוותים">
                            <fieldset>
                               <legend className="sr-only">בחר צוותים</legend>
                                <div className="max-h-32 overflow-y-auto space-y-2 rounded-md border border-gray-300 p-3 bg-white">
                                    {teams.map(team => (
                                        <label key={team.id} className="flex items-center space-x-3 space-x-reverse cursor-pointer hover:bg-gray-50 p-1 rounded-md">
                                            <input
                                                type="checkbox"
                                                checked={selectedTeamIds.includes(team.id)}
                                                onChange={() => handleTeamToggle(team.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-[#4A2B2C] focus:ring-[#4A2B2C]"
                                            />
                                            <span className="text-gray-800 select-none">{team.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                        </FormInput>
                    )}

                    {assignMethod === 'teamLeads' && (
                        <FormInput id="proj-lead" label="שיוך ראשי צוות">
                            <fieldset>
                               <legend className="sr-only">בחר ראשי צוות</legend>
                                <div className="max-h-32 overflow-y-auto space-y-2 rounded-md border border-gray-300 p-3 bg-white">
                                    {availableLeads.map(lead => (
                                        <label key={lead.id} className="flex items-center space-x-3 space-x-reverse cursor-pointer hover:bg-gray-50 p-1 rounded-md">
                                            <input
                                                type="checkbox"
                                                checked={selectedTeamLeadIds.includes(lead.id)}
                                                onChange={() => handleLeadToggle(lead.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-[#4A2B2C] focus:ring-[#4A2B2C]"
                                            />
                                            <span className="text-gray-800 select-none">{lead.fullName}</span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                        </FormInput>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput id="proj-start-date" label="תאריך התחלה">
                            <TextInput
                                id="proj-start-date"
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </FormInput>
                        <FormInput id="proj-end-date" label="תאריך סיום">
                            <TextInput
                                id="proj-end-date"
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </FormInput>
                    </div>
                    
                    <FormInput id="proj-income-budget" label="תקציב הכנסה (₪)">
                        <TextInput
                            id="proj-income-budget"
                            type="number"
                            value={incomeBudget}
                            onChange={e => setIncomeBudget(Number(e.target.value))}
                            placeholder="0"
                            min="0"
                        />
                    </FormInput>

                    <FormInput id="proj-expense-budget" label="תקציב הוצאה (₪)">
                        <TextInput
                            id="proj-expense-budget"
                            type="number"
                            value={expenseBudget}
                            onChange={e => setExpenseBudget(Number(e.target.value))}
                            placeholder="0"
                            min="0"
                        />
                    </FormInput>
                </div>
                
                <div className="flex justify-end space-x-2 space-x-reverse pt-3 mt-auto border-t border-gray-200 flex-shrink-0">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        ביטול
                    </button>
                    <button type="submit" className="px-4 py-2 bg-[#4A2B2C] text-white rounded-md hover:bg-opacity-90">
                        צור פרויקט
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddProjectForm;