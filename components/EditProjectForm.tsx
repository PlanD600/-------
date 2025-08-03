import React, { useState, useEffect, useMemo } from 'react';
import { Project, User, ProjectPayload, MonthlyBudgetPayload, Team } from '../types';

interface EditProjectFormProps {
    project: Project;
    onSubmit: (projectData: Partial<ProjectPayload>) => void;
    onCancel: () => void;
    teamLeads: User[];
    teams: Team[];
    titleId: string;
}

const FormInput = ({ id, label, children }: { id: string; label: string; children: React.ReactNode }) => (
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

const EditProjectForm = ({ project, onSubmit, onCancel, teamLeads, teams, titleId }: EditProjectFormProps) => {
    const [title, setTitle] = useState(project.title);
    const [description, setDescription] = useState(project.description || '');
    const [selectedTeamLeadIds, setSelectedTeamLeadIds] = useState<string[]>(project.teamLeads?.map(u => u.id) || []);
    const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(project.teams?.length > 0 ? project.teams[0].id : undefined);
    const [assignMethod, setAssignMethod] = useState<'team' | 'teamLeads'>(
        (project.teams && project.teams.length > 0) ? 'team' : 'teamLeads'
    );
    const [startDate, setStartDate] = useState(project.startDate?.split('T')[0] || '');
    const [endDate, setEndDate] = useState(project.endDate?.split('T')[0] || '');
    const [incomeBudget, setIncomeBudget] = useState<number | string>(0);
    const [expenseBudget, setExpenseBudget] = useState<number | string>(0);
    const [formError, setFormError] = useState('');
    const teamLeadsList = teamLeads || [];

    useEffect(() => {
        setTitle(project.title);
        setDescription(project.description || '');
        setSelectedTeamLeadIds(project.teamLeads?.map(u => u.id) || []);
        setSelectedTeamId(project.teams?.length > 0 ? project.teams[0].id : undefined);
        setAssignMethod((project.teams && project.teams.length > 0) ? 'team' : 'teamLeads');
        
        const totalIncome = (project.monthlyBudgets || []).reduce((sum, b) => sum + b.incomeBudget, 0);
        const totalExpense = (project.monthlyBudgets || []).reduce((sum, b) => sum + b.expenseBudget, 0);
        setIncomeBudget(totalIncome);
        setExpenseBudget(totalExpense);
    }, [project]);

    const handleLeadToggle = (leadId: string) => {
        setSelectedTeamLeadIds(prev =>
            prev.includes(leadId)
                ? prev.filter(id => id !== leadId)
                : [...prev, leadId]
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
            if (!selectedTeamId) {
                setFormError('חובה לבחור צוות.');
                return;
            }
            teamIdsToSend = [selectedTeamId];
            const selectedTeam = teams.find(t => t.id === selectedTeamId);
            if (selectedTeam && selectedTeam.leads) { 
                teamLeadsToSend = selectedTeam.leads.map(lead => lead.id);
            }
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
        if (incomeBudget !== 0 || expenseBudget !== 0) {
            monthlyBudgetsPayload.push({
                year: new Date().getFullYear(),
                month: new Date().getMonth() + 1,
                incomeBudget: Number(incomeBudget) || 0,
                expenseBudget: Number(expenseBudget) || 0,
            });
        }
        
        const payload: Partial<ProjectPayload> = {
            title,
            description,
            teamLeads: teamLeadsToSend,
            teamIds: teamIdsToSend,
            startDate,
            endDate,
            monthlyBudgets: monthlyBudgetsPayload
        };

        onSubmit(payload);
    };

    const availableLeads = useMemo(() => {
        if (assignMethod === 'team' && selectedTeamId) {
            const selectedTeam = teams.find(t => t.id === selectedTeamId);
            return selectedTeam?.leads || [];
        }
        return teamLeadsList;
    }, [assignMethod, selectedTeamId, teams, teamLeadsList]);


    return (
        <div className="flex flex-col h-full max-h-[80vh] md:max-h-[70vh]">
            <h3 id={titleId} className="text-xl font-bold text-[#3D2324] mb-4 flex-shrink-0">עריכת פרויקט</h3>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0" key={project.id}>
                <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2 pb-2">
                    {formError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">{formError}</span>
                        </div>
                    )}
                    
                    <FormInput id="proj-edit-title" label="שם הפרויקט">
                        <TextInput
                            id="proj-edit-title"
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />
                    </FormInput>

                    <FormInput id="proj-edit-desc" label="תיאור הפרויקט">
                        <textarea
                            id="proj-edit-desc"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"
                        ></textarea>
                    </FormInput>

                    {/* 💡 הוספת העיצוב החדש */}
                    {teams && teams.length > 0 && (
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
                                    setSelectedTeamId(undefined);
                                }}
                                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${assignMethod === 'teamLeads' ? 'bg-[#4A2B2C] text-white' : 'bg-gray-200 text-gray-800'}`}
                            >
                                לראשי צוות
                            </button>
                        </div>
                    )}

                    {assignMethod === 'team' && teams && teams.length > 0 && (
                        <FormInput id="proj-edit-team" label="בחר צוות">
                            <select
                                id="proj-edit-team"
                                value={selectedTeamId || ''}
                                onChange={(e) => setSelectedTeamId(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"
                            >
                                <option value="">-- בחר צוות --</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                        </FormInput>
                    )}

                    {assignMethod === 'teamLeads' && (
                        <FormInput id="proj-edit-lead" label="שיוך ראשי צוות">
                            <fieldset>
                                <legend className="sr-only">ערוך שיוך ראשי צוות</legend>
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
                        <FormInput id="proj-edit-start-date" label="תאריך התחלה">
                            <TextInput
                                id="proj-edit-start-date"
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </FormInput>
                        <FormInput id="proj-edit-end-date" label="תאריך סיום">
                            <TextInput
                                id="proj-edit-end-date"
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </FormInput>
                    </div>

                </div>

                <div className="flex justify-end space-x-2 space-x-reverse pt-3 mt-auto border-t border-gray-200 flex-shrink-0">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        ביטול
                    </button>
                    <button type="submit" className="px-4 py-2 bg-[#4A2B2C] text-white rounded-md hover:bg-opacity-90">
                        שמור שינויים
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProjectForm;