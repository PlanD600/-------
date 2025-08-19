// src/pages/SettingsPage.tsx

import { useMemo, useEffect } from 'react'; // הוסף useEffect
import { useAuth } from '../hooks/useAuth';
import { ChevronLeftIcon, UserCircleIcon, BuildingOfficeIcon, UsersIcon, UserGroupIcon, CreditCardIcon, BellIcon } from '../components/icons';
import { User, Team, Membership } from '../types';

import ProfileSettings from './settings/ProfileSettings';
import OrganizationSettings from './settings/OrganizationSettings';
import UserSettings from './settings/UserSettings';
import TeamSettings from './settings/TeamSettings';
import MyTeamSettings from './settings/MyTeamSettings';
import BillingSettings from './settings/BillingSettings';
import NotificationSettings from './settings/NotificationSettings';

interface SettingsPageProps {
    onBack: () => void;
    users: User[];
    teams: Team[];
    allMemberships: Membership[];
    refreshData: () => Promise<void>; // נשאר כאן כי הוא נחוץ לרכיבים אחרים
    activeCategory: string;
    setActiveCategory: (category: string) => void;
}

const SettingsPage = ({ onBack, users, teams, allMemberships, refreshData, activeCategory, setActiveCategory }: SettingsPageProps) => {
    const { currentUserRole } = useAuth();

    console.log('SettingsPage rendered. activeCategory:', activeCategory); // הוספה


    const menuItems = useMemo(() => {
        console.log('menuItems re-computed');
        const baseMenu = [
            { id: 'profile', label: 'הפרופיל שלי', icon: <UserCircleIcon className="w-5 h-5" />, component: <ProfileSettings /> },
        ];

        const adminMenu = [
            { id: 'users', label: 'ניהול משתמשים', icon: <UsersIcon className="w-5 h-5" />, component: <UserSettings allMemberships={allMemberships} refreshData={refreshData} /> },
            { id: 'teams', label: 'ניהול צוותים', icon: <UserGroupIcon className="w-5 h-5" />, component: <TeamSettings teams={teams} users={users} allMemberships={allMemberships} refreshData={refreshData} /> },
            { id: 'billing', label: 'מנוי וחיובים', icon: <CreditCardIcon className="w-5 h-5" />, component: <BillingSettings /> },
        ];

        const menuStructure: { [key: string]: any[] } = {
            'SUPER_ADMIN': [
                baseMenu[0],
                { id: 'orgs', label: 'ניהול ארגונים', icon: <BuildingOfficeIcon className="w-5 h-5" />, component: <OrganizationSettings /> },
                ...adminMenu
            ],
            'ADMIN': [...baseMenu, ...adminMenu],
            'TEAM_LEADER': [
                ...baseMenu,
                { id: 'my-team', label: 'הצוות שלי', icon: <UserGroupIcon className="w-5 h-5" />, component: <MyTeamSettings /> },
                { id: 'notifications', label: 'העדפות התראה', icon: <BellIcon className="w-5 h-5" />, component: <NotificationSettings /> },
            ],
            'EMPLOYEE': [
                ...baseMenu,
                { id: 'notifications', label: 'העדפות התראה', icon: <BellIcon className="w-5 h-5" />, component: <NotificationSettings /> },
            ]
        };

        return menuStructure[currentUserRole || 'EMPLOYEE'] || baseMenu;
    }, [currentUserRole, users, teams, allMemberships]);

    // Set default active category if current one is not available for the role
    // השארת useEffect זה ללא שינוי, הוא נחוץ לוודא שהטאב הפעיל חוקי
    useEffect(() => {
        console.log('SettingsPage useEffect for activeCategory triggered. activeCategory:', activeCategory);
        if (!menuItems.some(item => item.id === activeCategory)) {
            const defaultCategory = menuItems[0]?.id || 'profile';
            console.log('activeCategory is invalid, resetting to:', defaultCategory);
            setActiveCategory(defaultCategory); // קריאה ל-setter מה-props
        }
    }, [menuItems, activeCategory, setActiveCategory]); // הוספנו setActiveCategory כתלות

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="flex items-center mb-6">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors ml-4"
                    aria-label="חזור"
                >
                    <ChevronLeftIcon className="w-6 h-6 transform rotate-180" />
                </button>
                <h2 className="text-2xl font-bold text-gray-800">הגדרות</h2>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Side Navigation */}
                <aside className="md:w-64 flex-shrink-0">
                    <nav className="space-y-2">
                        {menuItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveCategory(item.id)}
                                className={`w-full flex items-center space-x-3 space-x-reverse p-3 rounded-lg text-right font-semibold transition-colors ${activeCategory === item.id
                                        ? 'bg-[#4A2B2C] text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 min-h-[500px] relative">
                    {menuItems.map(item => (
                        <div
                            key={item.id}
                            role="tabpanel"
                            aria-labelledby={`setting-tab-${item.id}`}
                            style={{ display: activeCategory === item.id ? 'block' : 'none' }}
                            className="h-full"
                        >
                            {item.component}
                        </div>
                    ))}
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;