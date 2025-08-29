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
    // 💡 שינוי: selectedTeamLeadIds הוא כבר מערך, וזה תקין.
    const [selectedTeamLeadIds, setSelectedTeamLeadIds] = useState<string[]>(project.teamLeads?.map(u => u.id) || []);
    // 💡 שינוי: selectedTeamIds ישמור כעת מערך של מזהים.
    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(project.teams?.map(t => t.id) || []);
    const [assignMethod, setAssignMethod] = useState<'team' | 'teamLeads'>(
        (project.teams && project.teams.length > 0) ? 'team' : 'teamLeads'
    );
    const [startDate, setStartDate] = useState(project.startDate?.split('T')[0] || '');
    const [endDate, setEndDate] = useState(project.endDate?.split('T')[0] || '');
    const [incomeBudget, setIncomeBudget] = useState<number | string>(0);
    const [expenseBudget, setExpenseBudget] = useState<number | string>(0);
    const [isArchived, setIsArchived] = useState(project.isArchived || false);
    const [formError, setFormError] = useState('');
    const teamLeadsList = teamLeads || [];

    useEffect(() => {
        setTitle(project.title);
        setDescription(project.description || '');
        setSelectedTeamLeadIds(project.teamLeads?.map(u => u.id) || []);
        // 💡 שינוי: עדכון ה-state של הצוותים עם מערך של מזהים.
        setSelectedTeamIds(project.teams?.map(t => t.id) || []);
        setAssignMethod((project.teams && project.teams.length > 0) ? 'team' : 'teamLeads');
        setIsArchived(project.isArchived || false);
        
        const totalIncome = (project.monthlyBudgets || []).reduce((sum, b) => sum + b.incomeBudget, 0);
        const totalExpense = (project.monthlyBudgets || []).reduce((sum, b) => sum + b.expenseBudget, 0);
        setIncomeBudget(totalIncome);
        setExpenseBudget(totalExpense);
    }, [project]);
    
    // הפונקציה לבחירת ראשי צוותים היא כבר בסדר.
    const handleLeadToggle = (leadId: string) => {
        setSelectedTeamLeadIds(prev =>
            prev.includes(leadId)
                ? prev.filter(id => id !== leadId)
                : [...prev, leadId]
        );
    };

    // ✨ תיקון: handleTeamToggle צריכה לעבוד על המערך selectedTeamIds.
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
            // 💡 שינוי: כעת אנחנו בודקים אם מערך selectedTeamIds אינו ריק.
            if (selectedTeamIds.length === 0) {
                setFormError('חובה לבחור לפחות צוות אחד.');
                return;
            }
            teamIdsToSend = selectedTeamIds;
            // 💡 שינוי: לולאה על כל הצוותים שנבחרו כדי לאסוף את כל ראשי הצוותים שלהם.
            const allLeadsFromTeams = teams.filter(t => selectedTeamIds.includes(t.id))
                                         .flatMap(t => t.leads || [])
                                         .map(lead => lead.id);
            // 💡 שינוי: נשתמש ב-Set כדי להסיר כפילויות של ראשי צוותים.
            teamLeadsToSend = [...new Set(allLeadsFromTeams)];
        } else { // assignMethod === 'teamLeads'
            if (selectedTeamLeadIds.length === 0) {
                setFormError('חובה לבחור לפחות ראש צוות אחד.');
                return;
            }
            teamLeadsToSend = selectedTeamLeadIds;
            teamIdsToSend = []; // 💡 שינוי: חשוב לוודא ששדה זה ריק במקרה של 'teamLeads'.
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
        
        // 💡 תיקון: נשלח רק שדות שהשתנו או שדות חובה
        const payload: Partial<ProjectPayload> = {
            title,
            description,
            teamLeads: teamLeadsToSend,
            teamIds: teamIdsToSend,
            startDate,
            endDate,
            // 💡 תיקון: נשלח isArchived רק אם הוא השתנה מהערך המקורי
            ...(isArchived !== project.isArchived && { isArchived }),
            monthlyBudgets: monthlyBudgetsPayload.length > 0 ? monthlyBudgetsPayload : undefined,
        };
        
        onSubmit(payload);
    };
    
    const availableLeads = useMemo(() => {
        if (assignMethod === 'team' && selectedTeamIds.length > 0) {
            // 💡 שינוי: נאסוף את כל ראשי הצוותים מכל הצוותים שנבחרו.
            const leads = teams.filter(t => selectedTeamIds.includes(t.id))
                               .flatMap(t => t.leads || []);
            // נשתמש ב-Set כדי להסיר כפילויות במקרה של ראש צוות שמשויך לכמה צוותים.
            const uniqueLeads = Array.from(new Set(leads.map(lead => lead.id)))
                                    .map(id => leads.find(lead => lead.id === id)!);
            return uniqueLeads;
        }
        return teamLeadsList;
    }, [assignMethod, selectedTeamIds, teams, teamLeadsList]);
    

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
                                    setSelectedTeamIds([]); // 💡 שינוי: ננקה את מערך מזהי הצוותים
                                }}
                                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${assignMethod === 'teamLeads' ? 'bg-[#4A2B2C] text-white' : 'bg-gray-200 text-gray-800'}`}
                            >
                                לראשי צוות
                            </button>
                        </div>
                    )}

                    {assignMethod === 'team' && teams && teams.length > 0 && (
                        // 💡 שינוי: השתמש ב-fieldset ובתיבות סימון לבחירה מרובה.
                        <FormInput id="proj-edit-team" label="בחר צוות/ים">
                            <fieldset>
                                <legend className="sr-only">בחר צוות/ים</legend>
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

                    <FormInput id="proj-edit-archived" label="סטטוס ארכיון">
                        <div className="flex items-center space-x-3 space-x-reverse">
                            <input
                                id="proj-edit-archived"
                                type="checkbox"
                                checked={isArchived}
                                onChange={e => setIsArchived(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-[#4A2B2C] focus:ring-[#4A2B2C]"
                            />
                            <span className="text-sm text-gray-700">העבר לארכיון</span>
                        </div>
                    </FormInput>
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