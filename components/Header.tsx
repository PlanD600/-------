

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { MenuIcon, BellIcon } from './icons';
import { Notification } from '../types';
import NotificationsPopover from './NotificationsPopover';

interface HeaderProps {
    onNavigate: (view: 'settings' | 'dashboard') => void;
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const Header = ({ onNavigate, notifications, setNotifications }: HeaderProps) => {
    const { user, memberships, currentOrgId, switchOrganization, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    
    const menuRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);
    
    const currentOrg = memberships.find(m => m.organizationId === currentOrgId)?.organization;
    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    const uniqueOrganizations = useMemo(() => {
        const orgMap = new Map();
        memberships.forEach(m => {
            if (!orgMap.has(m.organization.id)) {
                orgMap.set(m.organization.id, m.organization);
            }
        });
        return Array.from(orgMap.values());
    }, [memberships]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (menuRef.current && !menuRef.current.contains(target)) {
                setIsMenuOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(target)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef, notificationsRef]);

    const handleMarkAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    };

    const handleMarkAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <header className="grid grid-cols-3 items-center p-4 bg-white shadow-md shrink-0">
            {/* Right Side: Profile (in RTL) */}
            <div className="flex items-center space-x-reverse space-x-3 justify-self-start">
                 <img 
                    src={user?.profilePictureUrl || `https://i.pravatar.cc/150?u=${user?.id || 'default'}`} 
                    alt={`תמונת פרופיל של ${user?.fullName || 'משתמש'}`} 
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                />
                <div className="text-right">
                    <p className="font-semibold text-gray-800 truncate">{user?.fullName || 'טוען...'}</p>
                    <p className="text-sm text-gray-500 truncate">{user?.jobTitle || '...'}</p>
                </div>
            </div>

            {/* Center: Org Name */}
            <h1 className="text-lg md:text-xl font-bold text-gray-800 text-center truncate px-2">
                {currentOrg?.name || 'ProjectFlow'}
            </h1>

            {/* Left Side: Menu & Notifications (in RTL) */}
            <div className="flex items-center justify-self-end gap-x-2">
                {/* Notifications */}
                <div className="relative" ref={notificationsRef}>
                    <button
                        onClick={() => setIsNotificationsOpen(prev => !prev)}
                        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label={`התראות, ${unreadCount} לא נקראו`}
                    >
                        <BellIcon className="w-6 h-6 text-gray-600" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-1 ring-white"></span>
                        )}
                    </button>
                    <NotificationsPopover
                        isOpen={isNotificationsOpen}
                        notifications={notifications}
                        onMarkAsRead={handleMarkAsRead}
                        onMarkAllAsRead={handleMarkAllAsRead}
                        onClose={() => setIsNotificationsOpen(false)}
                    />
                </div>

                {/* Menu */}
                <div className="relative" ref={menuRef}>
                    <button 
                        id="main-menu-button"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="פתח תפריט ראשי"
                        aria-haspopup="true"
                        aria-expanded={isMenuOpen}
                        aria-controls="main-menu"
                    >
                        <MenuIcon className="w-6 h-6 text-gray-600" />
                    </button>
                    {isMenuOpen && (
                        <div 
                            id="main-menu"
                            role="menu"
                            aria-labelledby="main-menu-button"
                            className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg z-20 border border-gray-100"
                        >
                            <div className="py-1">
                                 <button role="menuitem" onClick={() => { onNavigate('settings'); setIsMenuOpen(false); }} className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">הגדרות</button>
                                <div className="border-t border-gray-100 my-1"></div>
                                <p className="px-4 pt-2 pb-1 text-xs text-gray-500" id="switch-org-label">החלף ארגון</p>
                                {uniqueOrganizations.map(organization => (
                                     <button
                                        role="menuitem"
                                        key={organization.id}
                                        onClick={() => {
                                            switchOrganization(organization.id);
                                            setIsMenuOpen(false);
                                        }}
                                        className={`block w-full text-right px-4 py-2 text-sm ${currentOrgId === organization.id ? 'font-bold text-[#4A2B2C]' : 'text-gray-700'} hover:bg-gray-100`}
                                    >
                                        {organization.name}
                                    </button>
                                ))}
                                <div className="border-t border-gray-100 my-1"></div>
                                <button 
                                    role="menuitem"
                                    onClick={() => {
                                        logout();
                                        setIsMenuOpen(false);
                                    }} 
                                    className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    התנתק
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;