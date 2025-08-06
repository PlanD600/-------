import React, { useState } from 'react';
import { Membership } from '../types';
import { roleDisplayNames } from '../src/roleDisplayNames'; 

interface InviteUserFormProps {
    onSubmit: (data: { fullName: string; phone: string; jobTitle: string; email: string; role: Membership['role'] }) => Promise<void>; // שינוי: הוספת email
    onCancel: () => void;
    loading: boolean;
    error: string;
    availableRoles: Membership['role'][];
    titleId: string;
}

const InviteUserForm = ({ onSubmit, onCancel, loading, error, availableRoles }: InviteUserFormProps) => {
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<Membership['role']>('EMPLOYEE');
    const [localError, setLocalError] = useState('');

    const validateEmail = (email: string) => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        if (email && !validateEmail(email)) {
            setLocalError("האימייל שהוזן אינו תקין.");
            return;
        }
        if (!fullName || !phone || !jobTitle || !email) {
            setLocalError("נא למלא את כל השדות.");
            return;
        }
        await onSubmit({ fullName, phone, jobTitle, email, role });
        setFullName('');
        setPhone('');
        setJobTitle('');
        setEmail('');
        setRole('EMPLOYEE');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">הזמנת משתמש חדש</h3>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {localError && <p className="text-red-500 text-sm">{localError}</p>}
            <div>
                <label htmlFor="invite-fullName" className="block text-sm font-medium text-gray-700">שם מלא</label>
                <input
                    type="text"
                    id="invite-fullName"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    className="mt-1 w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"
                />
            </div>
            <div>
                <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700">אימייל</label>
                <input
                    type="email"
                    id="invite-email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="mt-1 w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"
                />
            </div>
            <div>
                <label htmlFor="invite-phone" className="block text-sm font-medium text-gray-700">מספר טלפון</label>
                <input
                    type="tel"
                    id="invite-phone"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                    className="mt-1 w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"
                />
            </div>
            <div>
                <label htmlFor="invite-jobTitle" className="block text-sm font-medium text-gray-700">תפקיד</label>
                <input
                    type="text"
                    id="invite-jobTitle"
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    required
                    className="mt-1 w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"
                />
            </div>
            <div>
                <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700">הרשאה</label>
                <select
                    id="invite-role"
                    value={role}
                    onChange={e => setRole(e.target.value as Membership['role'])}
                    className="mt-1 w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"
                >
                    {availableRoles.map(r => <option key={r} value={r}>{roleDisplayNames[r] || r}</option>)}
                </select>
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse pt-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-md">ביטול</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-[#4A2B2C] text-white rounded-md disabled:opacity-50">
                    {loading ? 'שולח...' : 'שלח הזמנה'}
                </button>
            </div>
        </form>
    );
};

export default InviteUserForm;