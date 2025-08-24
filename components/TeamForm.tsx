// src/components/TeamForm.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { User, Team, Membership } from '../types';

interface TeamFormProps {
    team?: Team | null;
    users: User[];
    allMemberships: Membership[];
    onSubmit: (data: Pick<Team, 'name' | 'leadIds' | 'memberIds'>) => void;
    onCancel: () => void;
    titleId: string;
    isLoading?: boolean;
    apiError?: string;
}

const TeamForm = ({ team, users, allMemberships, onSubmit, onCancel, titleId, isLoading, apiError }: TeamFormProps) => {
    const [name, setName] = useState('');
    const [leadId, setLeadId] = useState<string | null>(null); // 💡 שינוי: leadId הוא כעת מחרוזת בודדת או null.
    const [memberIds, setMemberIds] = useState<string[]>([]);

    useEffect(() => {
        setName(team?.name || '');
        // 💡 שינוי: נגדיר את leadId כראש הצוות הראשון במערך, אם קיים.
        setLeadId(team?.leadIds?.[0] || null);
        setMemberIds(team?.memberIds || []);
    }, [team]);
    
    // רשימת המשתמשים שיכולים להיות ראשי צוות (ללא שינוי, זה כבר תקין).
    const availableLeads = useMemo(() => {
        const leadRoles = ['TEAM_LEADER', 'ADMIN', 'SUPER_ADMIN'];
        return users.filter(user => 
            allMemberships.find(m => m.userId === user.id && leadRoles.includes(m.role))
        );
    }, [users, allMemberships]);

    const availableMembers = useMemo(() => {
        return users;
    }, [users]);

    // 💡 שינוי: פונקציית הבחירה של ראש הצוות תהיה מבוססת על בחירה יחידה.
    const handleLeadChange = (selectedId: string) => {
        setLeadId(selectedId === leadId ? null : selectedId);
    };

    const handleMemberToggle = (memberId: string) => {
        setMemberIds(prev => prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // 💡 שינוי: בדיקה אם נבחר ראש צוות יחיד.
        if (!name.trim() || !leadId) {
            alert('אנא מלא את שם הצוות ובחר ראש צוות אחד.');
            return;
        }
        // 💡 שינוי: נשלח את leadIds כשהוא מכיל מערך עם מזהה יחיד.
        onSubmit({ name, leadIds: [leadId], memberIds });
    };

    return (
        <form onSubmit={handleSubmit} key={team?.id || 'new'} className="space-y-4 p-2">
            <h3 id={titleId} className="text-lg font-bold text-gray-800">{team ? 'עריכת צוות' : 'יצירת צוות חדש'}</h3>
            {apiError && <p className="text-red-500 bg-red-100 p-2 rounded-md text-sm">{apiError}</p>}
            <div>
                <label htmlFor="teamName" className="block text-sm font-medium text-gray-700">שם הצוות</label>
                <input type="text" id="teamName" value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]" />
            </div>
            <div>
                <fieldset>
                    <legend className="block text-sm font-medium text-gray-700">ראש צוות</legend>
                    {/* 💡 שינוי: החלף מ-checkbox ל-radio לבחירה יחידה */}
                    <div className="mt-1 max-h-32 overflow-y-auto space-y-2 rounded-md border border-gray-300 p-3 bg-gray-50">
                        {availableLeads.map(user => (
                            <label key={user.id} className="flex items-center space-x-3 space-x-reverse cursor-pointer hover:bg-gray-100 p-1 rounded-md">
                                <input 
                                    type="radio" 
                                    name="lead-selection" // נותן לכל הקבוצה שם זהה
                                    value={user.id}
                                    checked={leadId === user.id} 
                                    onChange={() => handleLeadChange(user.id)} 
                                    className="w-4 h-4 rounded-full border-gray-300 text-[#4A2B2C] focus:ring-[#4A2B2C]" 
                                />
                                <span className="text-gray-800 select-none">{user.fullName}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>
            </div>
            <div>
                <fieldset>
                    <legend className="block text-sm font-medium text-gray-700">חברי צוות</legend>
                    <div className="mt-1 max-h-48 overflow-y-auto space-y-2 rounded-md border border-gray-300 p-3 bg-gray-50">
                        {availableMembers.map(member => (
                            <label key={member.id} className="flex items-center space-x-3 space-x-reverse cursor-pointer hover:bg-gray-100 p-1 rounded-md">
                                <input type="checkbox" checked={memberIds.includes(member.id)} onChange={() => handleMemberToggle(member.id)} className="w-4 h-4 rounded border-gray-300 text-[#4A2B2C] focus:ring-[#4A2B2C]" />
                                <span className="text-gray-800 select-none">{member.fullName}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse pt-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-md">ביטול</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-[#4A2B2C] text-white rounded-md disabled:opacity-50">
                    {isLoading ? (team ? 'שומר...' : 'יוצר...') : (team ? 'שמור שינויים' : 'צור צוות')}
                </button>
            </div>
        </form>
    );
};
export default TeamForm;