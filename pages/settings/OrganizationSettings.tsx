

import React, { useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Organization } from '../../types';
import { BuildingOfficeIcon } from '../../components/icons';

const OrganizationSettings = () => {
    const { memberships, currentOrgId, switchOrganization } = useAuth();

    const uniqueOrganizations = useMemo(() => {
        const orgMap = new Map<string, Organization>();
        memberships.forEach(m => {
            if (m.organization && !orgMap.has(m.organization.id)) {
                orgMap.set(m.organization.id, m.organization);
            }
        });
        return Array.from(orgMap.values());
    }, [memberships]);


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">הארגונים שלי</h3>
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

        </div>
    );
};

export default OrganizationSettings;