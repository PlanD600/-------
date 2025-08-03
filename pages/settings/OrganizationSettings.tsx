// src/pages/settings/OrganizationSettings.tsx

import React, { useState, useMemo, useId } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Organization } from '../../types';
// **שינוי כאן:** ייבוא EditIcon במקום PencilIcon
import { BuildingOfficeIcon, PlusIcon, EditIcon, TrashIcon } from '../../components/icons';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';
import * as api from '../../services/api';


const OrganizationSettings = () => {
    const { memberships, currentOrgId, switchOrganization, currentUserRole, refreshMemberships } = useAuth();

    const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);
    const [newOrgName, setNewOrgName] = useState('');
    const createOrgModalTitleId = useId();

    // מצבים חדשים לעריכה ומחיקה
    const [organizationToEdit, setOrganizationToEdit] = useState<Organization | null>(null);
    const [editedOrgName, setEditedOrgName] = useState('');
    const editOrgModalTitleId = useId();

    const [organizationToDelete, setOrganizationToDelete] = useState<Organization | null>(null);


    const uniqueOrganizations = useMemo(() => {
        const orgMap = new Map<string, Organization>();
        memberships.forEach(m => {
            if (m.organization && !orgMap.has(m.organization.id)) {
                orgMap.set(m.organization.id, m.organization);
            }
        });
        return Array.from(orgMap.values());
    }, [memberships]);

    const isSuperAdmin = useMemo(() => currentUserRole === 'SUPER_ADMIN', [currentUserRole]);


    const handleCreateOrganization = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOrgName.trim()) {
            alert('שם הארגון אינו יכול להיות ריק.');
            return;
        }

        try {
            await api.createOrganization({ name: newOrgName });
            alert('הארגון נוצר בהצלחה!');
            setIsCreateOrgModalOpen(false);
            setNewOrgName('');
            await refreshMemberships();
        } catch (error) {
            console.error('Failed to create organization:', error);
            alert(`שגיאה ביצירת ארגון: ${(error as Error).message || 'נסה שוב מאוחר יותר.'}`);
        }
    };

    const handleEditOrganization = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!organizationToEdit || !editedOrgName.trim()) {
            alert('שם הארגון אינו יכול להיות ריק או ארגון לעריכה לא נבחר.');
            return;
        }

        try {
            await api.updateOrganization(organizationToEdit.id, { name: editedOrgName });
            alert('שם הארגון עודכן בהצלחה!');
            setOrganizationToEdit(null);
            setEditedOrgName('');
            await refreshMemberships(); // **השתמש בפונקציה החדשה לרענון**
        } catch (error) {
            console.error('Failed to update organization:', error);
            alert(`שגיאה בעדכון ארגון: ${(error as Error).message || 'נסה שוב מאוחר יותר.'}`);
        }
    };

    const confirmDeleteOrganization = async () => {
        if (!organizationToDelete) return;

        try {
            await api.deleteOrganization(organizationToDelete.id);
            alert('הארגון נמחק בהצלחה!');
            setOrganizationToDelete(null);
            await refreshMemberships(); // **השתמש בפונקציה החדשה לרענון**
            if (organizationToDelete.id === currentOrgId && uniqueOrganizations.length > 1) {
                switchOrganization(uniqueOrganizations.find(org => org.id !== organizationToDelete.id)?.id || '');
            } else if (uniqueOrganizations.length === 1) {
            }
        } catch (error) {
            console.error('Failed to delete organization:', error);
            alert(`שגיאה במחיקת ארגון: ${(error as Error).message || 'נסה שוב מאוחר יותר.'}`);
        }
    };


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">הארגונים שלי</h3>
                {isSuperAdmin && (
                    <button
                        onClick={() => setIsCreateOrgModalOpen(true)}
                        className="flex items-center space-x-2 space-x-reverse bg-[#4A2B2C] text-white px-3 py-2 text-sm rounded-lg shadow hover:bg-opacity-90 transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span>צור ארגון</span>
                    </button>
                )}
            </div>

            <p className="text-gray-600 mb-6">
                זוהי רשימת כל הארגונים שאתה חבר בהם. ניתן להחליף בין ארגונים דרך התפריט הראשי בראש העמוד.
            </p>

            <div className="space-y-3">
                {uniqueOrganizations.map(org => (
                    <div key={org.id} className={`flex items-center justify-between p-4 rounded-lg border ${org.id === currentOrgId ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'}`}>
                        <div className="flex items-center space-x-3 space-x-reverse">
                            <BuildingOfficeIcon className="w-6 h-6 text-gray-500" />
                            <span className="font-semibold text-gray-800">{org.name}</span>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                            {isSuperAdmin && (
                                <>
                                    {/* כפתור עריכה - שימוש ב-EditIcon */}
                                    <button
                                        onClick={() => {
                                            setOrganizationToEdit(org);
                                            setEditedOrgName(org.name);
                                        }}
                                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                                        aria-label={`ערוך ארגון ${org.name}`}
                                    >
                                        <EditIcon className="w-5 h-5" />
                                    </button>

                                    {/* כפתור מחיקה */}
                                    <button
                                        onClick={() => setOrganizationToDelete(org)}
                                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-md transition-colors"
                                        aria-label={`מחק ארגון ${org.name}`}
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                            {org.id === currentOrgId ? (
                                <span className="px-3 py-1 text-sm font-bold text-blue-600 bg-blue-100 rounded-md">פעיל כעת</span>
                            ) : (
                                <button
                                    onClick={() => switchOrganization(org.id)}
                                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                                >
                                    עבור לארגון זה
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {uniqueOrganizations.length === 0 && (
                <p className="text-gray-500 text-center py-8">אינך חבר באף ארגון.</p>
            )}

            {/* Modal ליצירת ארגון חדש */}
            <Modal
                isOpen={isCreateOrgModalOpen}
                onClose={() => setIsCreateOrgModalOpen(false)}
                titleId={createOrgModalTitleId}
                title="צור ארגון חדש"
                size="md"
            >
                <form onSubmit={handleCreateOrganization} className="space-y-4 p-4">
                    <div>
                        <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-1">
                            שם הארגון
                        </label>
                        <input
                            type="text"
                            id="orgName"
                            value={newOrgName}
                            onChange={(e) => setNewOrgName(e.target.value)}
                            className="block w-full py-2 px-3 border-gray-300 rounded-md shadow-sm focus:ring-[#4A2B2C] focus:border-[#4A2B2C] sm:text-sm"
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-2 space-x-reverse mt-4">
                        <button
                            type="button"
                            onClick={() => setIsCreateOrgModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            ביטול
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-[#4A2B2C] rounded-md hover:bg-opacity-90 transition-colors"
                        >
                            צור ארגון
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal לעריכת ארגון קיים */}
            <Modal
                isOpen={!!organizationToEdit}
                onClose={() => setOrganizationToEdit(null)}
                titleId={editOrgModalTitleId}
                title={`ערוך ארגון: ${organizationToEdit?.name || ''}`}
                size="md"
            >
                {organizationToEdit && (
                    <form onSubmit={handleEditOrganization} className="space-y-4 p-4">
                        <div>
                            <label htmlFor="editedOrgName" className="block text-sm font-medium text-gray-700 mb-1">
                                שם הארגון החדש
                            </label>
                            <input
                                type="text"
                                id="editedOrgName"
                                value={editedOrgName}
                                onChange={(e) => setEditedOrgName(e.target.value)}
                                className="block w-full py-2 px-3 border-gray-300 rounded-md shadow-sm focus:ring-[#4A2B2C] focus:border-[#4A2B2C] sm:text-sm"
                                required
                            />
                        </div>
                        <div className="flex justify-end space-x-2 space-x-reverse mt-4">
                            <button
                                type="button"
                                onClick={() => setOrganizationToEdit(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                ביטול
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-[#4A2B2C] rounded-md hover:bg-opacity-90 transition-colors"
                            >
                                שמור שינויים
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* ConfirmationModal למחיקת ארגון */}
            <ConfirmationModal
                isOpen={!!organizationToDelete}
                onClose={() => setOrganizationToDelete(null)}
                onConfirm={confirmDeleteOrganization}
                title="אישור מחיקת ארגון"
                message={`האם אתה בטוח שברצונך למחוק את הארגון "${organizationToDelete?.name}"? פעולה זו היא בלתי הפיכה ותמחק את כל הנתונים הקשורים לארגון זה (פרויקטים, משימות, צוותים וכו').`}
            />
        </div>
    );
};

export default OrganizationSettings;