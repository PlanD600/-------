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
    const [leadId, setLeadId] = useState<string | null>(null); // בחירה יחידה לראש צוות
    const [memberIds, setMemberIds] = useState<string[]>([]);

    useEffect(() => {
        setName(team?.name || '');
        setLeadId(team?.leadIds?.[0] || null);
        setMemberIds(team?.memberIds || []);
    }, [team]);

    // מבנה חדש: ראשי הצוות מתוך כל הממברשיפים בעלי תפקיד מתאים
    const leadRoles = ['TEAM_LEADER', 'ADMIN', 'SUPER_ADMIN'];
    const availableLeads = useMemo(() => {
        return allMemberships
            .filter(m => leadRoles.includes(m.role) && m.user)
            .map(m => m.user!)
            .filter((user, idx, arr) => arr.findIndex(u => u.id === user.id) === idx);
    }, [allMemberships]);

    // חברי צוות אפשריים = כל המשתמשים שאינם ראש צוות נבחר
    const availableMembers = useMemo(() => users.filter(u => u.id !== leadId), [users, leadId]);

    const handleLeadChange = (selectedId: string) => {
        setLeadId(selectedId === leadId ? null : selectedId);
    };

    const handleMemberToggle = (memberId: string) => {
        setMemberIds(prev => prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !leadId) {
            alert('אנא מלא את שם הצוות ובחר ראש צוות אחד.');
            return;
        }
        onSubmit({ name, leadIds: [leadId], memberIds });
    };

    if (isLoading || !allMemberships || !users) {
        return (
            <div className="space-y-4 p-2">
                <h3 id={titleId} className="text-lg font-bold text-gray-800">{team ? 'עריכת צוות' : 'יצירת צוות חדש'}</h3>
                <div className="text-center py-8">
                    <div className="text-gray-500">טוען נתונים...</div>
                </div>
            </div>
        );
    }

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
                    <div className="mt-1 max-h-32 overflow-y-auto space-y-2 rounded-md border border-gray-300 p-3 bg-gray-50">
                        {availableLeads.length > 0 ? (
                            availableLeads.map(user => (
                                <label key={user.id} className="flex items-center space-x-3 space-x-reverse cursor-pointer hover:bg-gray-100 p-1 rounded-md">
                                    <input
                                        type="radio"
                                        name="lead-selection"
                                        value={user.id}
                                        checked={leadId === user.id}
                                        onChange={() => handleLeadChange(user.id)}
                                        className="w-4 h-4 rounded-full border-gray-300 text-[#4A2B2C] focus:ring-[#4A2B2C]"
                                    />
                                    <span className="text-gray-800 select-none">{user.fullName}</span>
                                </label>
                            ))
                        ) : (
                            <div className="text-gray-500 text-center py-4">
                                אין משתמשים זמינים לתפקיד ראש צוות
                                <br />
                                <span className="text-xs">נדרשים משתמשים עם תפקיד: מנהל, מנהל ארגון, או ראש צוות</span>
                            </div>
                        )}
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