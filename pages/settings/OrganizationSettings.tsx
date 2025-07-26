import React, { useState, useMemo, useId } from 'react'; // הוסף useState ו-useId
import { useAuth } from '../../hooks/useAuth';
import { Organization } from '../../types';
import { BuildingOfficeIcon, PlusIcon } from '../../components/icons'; // ודא ש-PlusIcon מיובא
import Modal from '../../components/Modal'; // ודא ש-Modal מיובא
import * as api from '../../services/api'; // ודא ש-api מיובא

// הוסף את ה-interface הזה כדי שהקומפוננטה תקבל את refreshData כ-prop
interface OrganizationSettingsProps {
    refreshData: () => Promise<void>;
}

// קבל את refreshData כ-prop
const OrganizationSettings = ({ refreshData }: OrganizationSettingsProps) => {
    const { memberships, currentOrgId, switchOrganization } = useAuth();
    // מצב לניהול פתיחה/סגירה של המודל ליצירת ארגון
    const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);
    // מצב לשם הארגון החדש שיוקלד בטופס
    const [newOrgName, setNewOrgName] = useState('');
    // ID ייחודי לכותרת המודל עבור נגישות
    const createOrgModalTitleId = useId(); 

    const uniqueOrganizations = useMemo(() => {
        const orgMap = new Map<string, Organization>();
        memberships.forEach(m => {
            if (m.organization && !orgMap.has(m.organization.id)) {
                orgMap.set(m.organization.id, m.organization);
            }
        });
        return Array.from(orgMap.values());
    }, [memberships]);

    const handleCreateOrganization = async (e: React.FormEvent) => {
        e.preventDefault(); // מונע ריענון דף
        if (!newOrgName.trim()) {
            alert('שם הארגון אינו יכול להיות ריק.');
            return;
        }

        try {
            // קריאת API ליצירת ארגון חדש.
            // הנחה: api.createOrganization מקבל אובייקט עם שדה 'name'.
            await api.createOrganization({ name: newOrgName }); 
            alert('הארגון נוצר בהצלחה!');
            setIsCreateOrgModalOpen(false); // סגור את המודל
            setNewOrgName(''); // נקה את שדה הקלט

            // רענן את הנתונים באמצעות הפונקציה שהתקבלה כ-prop
            // ה-refreshData ב-Dashboard.tsx אחראי על טעינה מחדש של memberships, projects וכו'.
            await refreshData(); 
            // בנוסף, כדאי לשקול להחליף לארגון החדש או להשאיר את הבחירה למשתמש.
            // אם המערכת מוסיפה אותך אוטומטית כחבר בארגון החדש, useAuth יתעדכן.

        } catch (error) {
            console.error('Failed to create organization:', error);
            // הצג הודעת שגיאה ידידותית למשתמש
            alert(`שגיאה ביצירת ארגון: ${(error as Error).message || 'נסה שוב מאוחר יותר.'}`);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">הארגונים שלי</h3>
                {/* כפתור "צור ארגון" */}
                <button
                    onClick={() => setIsCreateOrgModalOpen(true)}
                    className="flex items-center space-x-2 space-x-reverse bg-[#4A2B2C] text-white px-3 py-2 text-sm rounded-lg shadow hover:bg-opacity-90 transition-colors"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span>צור ארגון</span>
                </button>
            </div>
            
            <p className="text-gray-600 mb-6">
                זוהי רשימת כל הארגונים שאתה חבר בהם. ניתן להחליף בין ארגונים דרך התפריט הראשי בראש העמוד.
            </p>

            <div className="space-y-3">
                {uniqueOrganizations.map(org => (
                    <div key={org.id} className={`flex items-center justify-between p-4 rounded-lg border ${org.id === currentOrgId ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'}`}>
                        <div className="flex items-center space-x-3 space-x-reverse">
                            <BuildingOfficeIcon className="w-6 h-6 text-gray-500"/>
                            <span className="font-semibold text-gray-800">{org.name}</span>
                        </div>
                        {org.id === currentOrgId ? (
                            <span className="text-sm font-bold text-blue-600">פעיל כעת</span>
                        ) : (
                            <button 
                                onClick={() => switchOrganization(org.id)}
                                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                            >
                                עבור לארגון זה
                            </button>
                        )}
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
                size="sm" // מניח שיש לך size prop ב-Modal
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
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#4A2B2C] focus:border-[#4A2B2C] sm:text-sm"
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
        </div>
    );
};

export default OrganizationSettings;