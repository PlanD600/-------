
import React from 'react';
import { Notification } from '../types';
import { ChatBubbleBottomCenterTextIcon, UserPlusIcon, ArrowPathIcon, CalendarDaysIcon, BellIcon } from './icons';

interface NotificationsPopoverProps {
    isOpen: boolean;
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onClose: () => void;
}

const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'comment': return <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-blue-500" />;
        case 'assignment': return <UserPlusIcon className="w-5 h-5 text-green-500" />;
        case 'status_change': return <ArrowPathIcon className="w-5 h-5 text-purple-500" />;
        case 'deadline': return <CalendarDaysIcon className="w-5 h-5 text-red-500" />;
        default: return <BellIcon className="w-5 h-5 text-gray-500" />;
    }
};

const timeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) {
        return `לפני ${Math.floor(interval)} שנים`;
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return `לפני ${Math.floor(interval)} חודשים`;
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return `לפני ${Math.floor(interval)} ימים`;
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return `לפני ${Math.floor(interval)} שעות`;
    }
    interval = seconds / 60;
    if (interval > 1) {
        return `לפני ${Math.floor(interval)} דקות`;
    }
    return `לפני רגע`;
};

const NotificationsPopover = ({ isOpen, notifications, onMarkAsRead, onMarkAllAsRead, onClose }: NotificationsPopoverProps) => {
    if (!isOpen) return null;

    return (
        <div className="absolute left-0 mt-2 w-80 max-w-sm bg-white rounded-lg shadow-2xl z-30 border border-gray-200">
            <div className="flex justify-between items-center p-3 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-800">התראות</h3>
                <button 
                    onClick={onMarkAllAsRead}
                    className="text-xs font-semibold text-[#4A2B2C] hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                    disabled={notifications.every(n => n.read)}
                >
                    סמן הכל כנקרא
                </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                    notifications.map(notif => (
                        <button
                            key={notif.id}
                            onClick={() => {
                                onMarkAsRead(notif.id);
                                // Future: navigate to link
                                onClose();
                            }}
                            className={`w-full text-right p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-blue-50' : ''}`}
                        >
                            <div className="flex items-start space-x-3 space-x-reverse">
                                <div className="flex-shrink-0 bg-gray-100 rounded-full p-2">
                                    {getNotificationIcon(notif.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-800 leading-tight">{notif.text}</p>
                                    <p className="text-xs text-gray-500 mt-1">{timeSince(new Date(notif.timestamp))}</p>
                                </div>
                                {!notif.read && (
                                     <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1 self-center">
                                        <span className="sr-only">התראה חדשה</span>
                                     </div>
                                )}
                            </div>
                        </button>
                    ))
                ) : (
                    <p className="text-sm text-gray-500 text-center p-8">אין התראות חדשות.</p>
                )}
            </div>
        </div>
    );
};

export default NotificationsPopover;
