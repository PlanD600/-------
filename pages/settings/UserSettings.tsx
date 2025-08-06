import React, { useState, useMemo, useId } from 'react';
import { useAuth } from '../../hooks/useAuth';
import * as api from '../../services/api';
import { User, Membership } from '../../types';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { PlusIcon, EditIcon, TrashIcon } from '../../components/icons';
import InviteUserForm from '../../components/InviteUserForm';
import { roleDisplayNames } from '../../src/roleDisplayNames';
import UpdateUserEmailForm from '../../components/users/UpdateUserEmailForm';
import UpdateUserPasswordForm from '../../components/users/UpdateUserPasswordForm';

const availableRoles: Membership['role'][] = ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'EMPLOYEE'];

const roleHierarchy: { [key in Membership['role']]: number } = {
    'SUPER_ADMIN': 4,
    'ADMIN': 3,
    'TEAM_LEADER': 2,
    'EMPLOYEE': 1
};

type DisplayUser = User & { role: Membership['role'] };

interface UserSettingsProps {
    allMemberships: Membership[];
    refreshData: () => Promise<void>;
}

const errorMessagesHe: Record<string, string> = {
    'Email already in use': "האימייל כבר בשימוש",
    'Invalid email format': "פורמט אימייל לא תקין",
    'Failed to invite user': "שליחת ההזמנה נכשלה",
    'Network Error': "תקלה ברשת. נסה שוב מאוחר יותר.",
};

const UserSettings = ({ allMemberships, refreshData }: UserSettingsProps) => {
    const { user: currentUser, currentUserRole, currentOrgId } = useAuth();

    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<DisplayUser | null>(null);
    const [userToRemove, setUserToRemove] = useState<DisplayUser | null>(null);

    const [editingRole, setEditingRole] = useState<Membership['role']>('EMPLOYEE');
    const [editTab, setEditTab] = useState<'role' | 'email' | 'password'>('role');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const inviteModalTitleId = useId();
    const editModalTitleId = useId();

    const displayUsers = useMemo(() => {
        return allMemberships
            .filter(m => m.organizationId === currentOrgId && m.user)
            .map(m => ({
                ...m.user,
                role: m.role
            })) as DisplayUser[];
    }, [allMemberships, currentOrgId]);

    const handleCloseInviteModal = () => {
        setIsInviteModalOpen(false);
        setError('');
    };

    const handleInviteUser = async (data: { fullName: string; phone: string; jobTitle: string; email: string; role: Membership['role'] }) => {
        setLoading(true);
        setError('');
        try {
            await api.inviteUser(data);
            await refreshData();
            handleCloseInviteModal();
        } catch (err: any) {
            const msg = err.message;
            setError(errorMessagesHe[msg] || 'שליחת ההזמנה נכשלה');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseEditModal = () => {
        setUserToEdit(null);
        setError('');
        setEditTab('role');
    };

    const handleEditUserRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userToEdit) return;
        setLoading(true);
        setError('');
        try {
            await api.updateUserRole(userToEdit.id, editingRole);
            await refreshData();
            handleCloseEditModal();
        } catch (err: any) {
            setError(err.message || 'עדכון הרשאה נכשל');
        } finally {
            setLoading(false);
        }
    };

    const confirmRemoveUser = async () => {
        if (!userToRemove) return;
        setLoading(true);
        try {
            await api.removeUserFromOrg(userToRemove.id);
            await refreshData();
            setUserToRemove(null);
        } catch (err: any) {
            alert(err.message || 'הסרת המשתמש נכשלה');
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (user: DisplayUser) => {
        setUserToEdit(user);
        setEditingRole(user.role);
        setEditTab('role');
    };

    const currentUserRoleValue = roleHierarchy[currentUserRole || 'EMPLOYEE'];
    const availableRolesForInvite = useMemo(() => Object.entries(roleHierarchy)
        .filter(([, value]) => value < currentUserRoleValue)
        .map(([key]) => key as Membership['role']), [currentUserRoleValue]);

    const renderUserTable = () => (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שם</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">אימייל</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תפקיד</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {displayUsers.map(user => {
                        const userRoleValue = roleHierarchy[user.role];
                        const canTakeAction = currentUserRoleValue > userRoleValue && currentUser?.id !== user.id;

                        return (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            <img className="h-10 w-10 rounded-full object-cover" src={user.profilePictureUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.fullName} />
                                        </div>
                                        <div className="mr-4">
                                            <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                                            <div className="text-sm text-gray-500">{user.jobTitle}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-xs text-gray-800">{user.email || "—"}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                        {roleDisplayNames[user.role] || user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <button onClick={() => openEditModal(user)} disabled={!canTakeAction || loading} className="text-blue-600 hover:text-blue-900 disabled:text-gray-300 disabled:cursor-not-allowed"><EditIcon className="w-5 h-5" /></button>
                                        <button onClick={() => setUserToRemove(user)} disabled={!canTakeAction || loading} className="text-red-600 hover:text-red-900 disabled:text-gray-300 disabled:cursor-not-allowed"><TrashIcon className="w-5 h-5" /></button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">ניהול משתמשים</h3>
                <button onClick={() => setIsInviteModalOpen(true)} className="flex items-center space-x-2 space-x-reverse bg-[#4A2B2C] text-white px-4 py-2 rounded-lg shadow hover:bg-opacity-90 transition-colors">
                    <PlusIcon className="w-5 h-5" />
                    <span>הזמן משתמש</span>
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {displayUsers.length > 0 ? renderUserTable() : <p className="text-gray-500 text-center py-8">לא נמצאו משתמשים בארגון.</p>}
            </div>

            {/* Invite User Modal */}
            <Modal isOpen={isInviteModalOpen} onClose={handleCloseInviteModal} titleId={inviteModalTitleId} title="הזמנת משתמש חדש">
                <InviteUserForm
                    onSubmit={handleInviteUser}
                    onCancel={handleCloseInviteModal}
                    loading={loading}
                    error={error}
                    availableRoles={availableRolesForInvite}
                    titleId={inviteModalTitleId}
                />
            </Modal>

            {/* Edit User Modal */}
            <Modal isOpen={!!userToEdit} onClose={handleCloseEditModal} titleId={editModalTitleId}>
                {userToEdit && (
                    <div>
                        {/* טאבים עיצוביים */}
                        <div className="flex mb-4 gap-2">
                            <button
                                className={`px-3 py-1 rounded transition-colors font-semibold text-sm border ${editTab === 'role' ? 'bg-[#4A2B2C] text-white border-[#4A2B2C]' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'}`}
                                onClick={() => setEditTab('role')}
                            >הרשאה</button>
                            <button
                                className={`px-3 py-1 rounded transition-colors font-semibold text-sm border ${editTab === 'email' ? 'bg-[#4A2B2C] text-white border-[#4A2B2C]' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'}`}
                                onClick={() => setEditTab('email')}
                            >אימייל</button>
                            <button
                                className={`px-3 py-1 rounded transition-colors font-semibold text-sm border ${editTab === 'password' ? 'bg-[#4A2B2C] text-white border-[#4A2B2C]' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'}`}
                                onClick={() => setEditTab('password')}
                            >סיסמה</button>
                        </div>

                        {/* תוכן הטאב */}
                        {editTab === 'role' && (
                            <form onSubmit={handleEditUserRole} className="space-y-4" key={userToEdit.id}>
                                <h3 id={editModalTitleId} className="text-lg font-bold text-gray-800">עריכת הרשאה עבור: {userToEdit.fullName}</h3>
                                <p className="text-sm text-gray-600">משתמש זה כרגע בתפקיד: {roleDisplayNames[userToEdit.role] || userToEdit.role}.</p>
                                {error && <p className="text-red-500 text-sm">{error}</p>}
                                <div>
                                    <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700">הרשאה חדשה</label>
                                    <select
                                        id="edit-role"
                                        value={editingRole}
                                        onChange={e => setEditingRole(e.target.value as Membership['role'])}
                                        className="mt-1 w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"
                                    >
                                        {availableRoles.map(role => (<option key={role} value={role}>{roleDisplayNames[role] || role}</option>))}
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-2 space-x-reverse pt-2">
                                    <button type="button" onClick={handleCloseEditModal} className="px-4 py-2 bg-gray-200 rounded-md">ביטול</button>
                                    <button type="submit" disabled={loading} className="px-4 py-2 bg-[#4A2B2C] text-white rounded-md disabled:opacity-50">
                                        {loading ? 'שומר...' : 'שמור שינויים'}
                                    </button>
                                </div>
                            </form>
                        )}
                        {editTab === 'email' && (
                            <UpdateUserEmailForm
                                userId={userToEdit.id}
                                currentEmail={userToEdit.email || ''}
                                onSuccess={refreshData}
                                onClose={handleCloseEditModal}
                            />
                        )}
                        {editTab === 'password' && (
                            <UpdateUserPasswordForm
                                userId={userToEdit.id}
                                onSuccess={refreshData}
                                onClose={handleCloseEditModal}
                            />
                        )}
                    </div>
                )}
            </Modal>

            {/* Remove User Confirmation */}
            <ConfirmationModal
                isOpen={!!userToRemove}
                onClose={() => setUserToRemove(null)}
                onConfirm={confirmRemoveUser}
                title="אישור הסרת משתמש"
                message={`האם אתה בטוח שברצונך להסיר את המשתמש "${userToRemove?.fullName}" מהארגון?`}
            />
        </div>
    );
};

export default UserSettings;