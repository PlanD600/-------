


import React, { useState, useMemo, useId } from 'react';
import { useAuth } from '../../hooks/useAuth';
import * as api from '../../services/api';
import { User, Membership } from '../../types';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { PlusIcon, EditIcon, TrashIcon } from '../../components/icons';


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

const UserSettings = ({ allMemberships, refreshData }: UserSettingsProps) => {
    const { user: currentUser, currentUserRole, currentOrgId } = useAuth();
    
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<DisplayUser | null>(null);
    const [userToRemove, setUserToRemove] = useState<DisplayUser | null>(null);
    
    // State for forms
    const [inviteFullName, setInviteFullName] = useState('');
    const [invitePhone, setInvitePhone] = useState('');
    const [inviteJobTitle, setInviteJobTitle] = useState('');
    const [inviteRole, setInviteRole] = useState<Membership['role']>('EMPLOYEE');
    const [editingRole, setEditingRole] = useState<Membership['role']>('EMPLOYEE');
    
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
        setInviteFullName('');
        setInvitePhone('');
        setInviteJobTitle('');
        setInviteRole('EMPLOYEE');
    };

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.inviteUser({
                fullName: inviteFullName,
                phone: invitePhone,
                jobTitle: inviteJobTitle,
                role: inviteRole
            });
            await refreshData();
            handleCloseInviteModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to invite user');
        } finally {
            setLoading(false);
        }
    };
    
    const handleCloseEditModal = () => {
        setUserToEdit(null);
        setError('');
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
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update role');
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
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to remove user');
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (user: DisplayUser) => {
        setUserToEdit(user);
        setEditingRole(user.role);
    };

    const currentUserRoleValue = roleHierarchy[currentUserRole || 'EMPLOYEE'];
    const availableRolesForInvite = Object.entries(roleHierarchy)
        .filter(([, value]) => value < currentUserRoleValue)
        .map(([key]) => key as Membership['role']);
    
    const renderUserTable = () => (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שם</th>
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
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <button onClick={() => openEditModal(user)} disabled={!canTakeAction || loading} className="text-blue-600 hover:text-blue-900 disabled:text-gray-300 disabled:cursor-not-allowed"><EditIcon className="w-5 h-5"/></button>
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
            <Modal isOpen={isInviteModalOpen} onClose={handleCloseInviteModal} titleId={inviteModalTitleId}>
                <form onSubmit={handleInviteUser} className="space-y-4" key="invite-user-form">
                     <h3 id={inviteModalTitleId} className="text-lg font-bold text-gray-800">הזמנת משתמש חדש</h3>
                     {error && <p className="text-red-500 text-sm">{error}</p>}
                     <div>
                        <label htmlFor="invite-fullName" className="block text-sm font-medium text-gray-700">שם מלא</label>
                        <input type="text" id="invite-fullName" value={inviteFullName} onChange={e => setInviteFullName(e.target.value)} required className="mt-1 w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"/>
                     </div>
                     <div>
                        <label htmlFor="invite-phone" className="block text-sm font-medium text-gray-700">מספר טלפון</label>
                        <input type="tel" id="invite-phone" value={invitePhone} onChange={e => setInvitePhone(e.target.value)} required className="mt-1 w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"/>
                     </div>
                      <div>
                        <label htmlFor="invite-jobTitle" className="block text-sm font-medium text-gray-700">תפקיד</label>
                        <input type="text" id="invite-jobTitle" value={inviteJobTitle} onChange={e => setInviteJobTitle(e.target.value)} required className="mt-1 w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"/>
                     </div>
                     <div>
                        <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700">הרשאה</label>
                        <select id="invite-role" value={inviteRole} onChange={e => setInviteRole(e.target.value as Membership['role'])} className="mt-1 w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]">
                           {availableRolesForInvite.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                     </div>
                     <div className="flex justify-end space-x-2 space-x-reverse pt-2">
                        <button type="button" onClick={handleCloseInviteModal} className="px-4 py-2 bg-gray-200 rounded-md">ביטול</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-[#4A2B2C] text-white rounded-md disabled:opacity-50">
                            {loading ? 'שולח...' : 'שלח הזמנה'}
                        </button>
                     </div>
                </form>
            </Modal>

            {/* Edit User Modal */}
            <Modal isOpen={!!userToEdit} onClose={handleCloseEditModal} titleId={editModalTitleId}>
                 {userToEdit && (
                    <form onSubmit={handleEditUserRole} className="space-y-4" key={userToEdit.id}>
                         <h3 id={editModalTitleId} className="text-lg font-bold text-gray-800">עריכת הרשאה עבור: {userToEdit.fullName}</h3>
                         <p className="text-sm text-gray-600">משתמש זה כרגע בתפקיד: {userToEdit.role}.</p>
                         {error && <p className="text-red-500 text-sm">{error}</p>}
                         <div>
                            <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700">הרשאה חדשה</label>
                            <select
                                id="edit-role"
                                value={editingRole}
                                onChange={e => setEditingRole(e.target.value as Membership['role'])}
                                className="mt-1 w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#4A2B2C] focus:border-[#4A2B2C]"
                            >
                               {availableRolesForInvite.map(r => <option key={r} value={r}>{r}</option>)}
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
