import React, { useState, useMemo, useEffect, useRef, useId } from 'react';
import { Conversation, User, Message } from '../../types';
import * as api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { PlusIcon, PaperAirplaneIcon, TrashIcon, ChevronLeftIcon } from '../../components/icons';
import { Socket } from 'socket.io-client';
import InitialAvatar from '../../components/InitialAvatar';

interface ChatTabProps {
    conversations: Conversation[];
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
    users: User[];
    socket: Socket | null;
    // 💡 אלה ה-props החדשים שצריך להוסיף
    activeConversationId: string | null;
    setActiveConversationId: React.Dispatch<React.SetStateAction<string | null>>;
}

// 💡 שינוי #1: הוספנו את 'conversations' לפרופס של המודאל
const CreateConversationModal = ({ isOpen, onClose, users, currentUserId, onCreate, titleId, conversations }: { isOpen: boolean, onClose: () => void, users: User[], currentUserId: string, onCreate: (data: { type: 'private' | 'group', participantIds: string[], name?: string }) => void, titleId: string, conversations: Conversation[] }) => {
    const [type, setType] = useState<'private' | 'group'>('private');
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');

    // 💡 שינוי #1 (המשך): לוגיקה לסינון משתמשים שכבר קיימת איתם שיחה
    const otherUsers = useMemo(() => {
        // נמצא את כל המזהים של משתמשים שכבר יש לנו שיחה פרטית איתם
        const userIdsInPrivateChats = conversations
            .filter(c => c.type === 'private')
            .flatMap(c => c.participants.map(p => p.id))
            .filter(id => id !== currentUserId);

        // נסנן את רשימת המשתמשים הכללית
        return users.filter(u =>
            u.id !== currentUserId && // נסנן את המשתמש הנוכחי
            !userIdsInPrivateChats.includes(u.id) // נסנן משתמשים שכבר יש שיחה איתם
        );
    }, [users, currentUserId, conversations]);


    const handleMemberToggle = (id: string) => {
        setSelectedGroupMembers(prev => prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (type === 'private' && selectedUser) {
            onCreate({ type: 'private', participantIds: [currentUserId, selectedUser] });
        } else if (type === 'group' && groupName.trim() && selectedGroupMembers.length > 0) {
            const finalMembers = [...new Set([currentUserId, ...selectedGroupMembers])];
            onCreate({ type: 'group', name: groupName.trim(), participantIds: finalMembers });
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} titleId={titleId}>
            <form onSubmit={handleSubmit} className="p-2 space-y-4" key="create-conversation-form">
                <h3 id={titleId} className="text-xl font-bold text-gray-800">יצירת שיחה חדשה</h3>
                <div className="flex items-center rounded-lg bg-gray-200 p-1">
                    <button type="button" onClick={() => setType('private')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${type === 'private' ? 'bg-white shadow text-[#4A2B2C]' : 'text-gray-600'}`}>פרטית</button>
                    <button type="button" onClick={() => setType('group')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${type === 'group' ? 'bg-white shadow text-[#4A2B2C]' : 'text-gray-600'}`}>קבוצתית</button>
                </div>
                {type === 'private' ? (
                    <div>
                        <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-1">בחר משתמש</label>
                        <select id="user-select" value={selectedUser} onChange={e => setSelectedUser(e.target.value)} required className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4A2B2C] focus:border-transparent">
                            <option value="">-- בחר --</option>
                            {otherUsers.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                        </select>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="group-name" className="block text-sm font-medium text-gray-700 mb-1">שם הקבוצה</label>
                            <input type="text" id="group-name" value={groupName} onChange={e => setGroupName(e.target.value)} required className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4A2B2C] focus:border-transparent" />
                        </div>
                        <fieldset>
                            <legend className="block text-sm font-medium text-gray-700">בחר חברים</legend>
                            <div className="mt-1 max-h-40 overflow-y-auto space-y-2 rounded-md border border-gray-300 p-3 bg-gray-50">
                                {users.filter(u => u.id !== currentUserId).map(u => ( // כאן נשתמש ברשימה המלאה (בלי המשתמש הנוכחי) כי לקבוצה אפשר להוסיף כל אחד
                                    <label key={u.id} className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                                        <input type="checkbox" checked={selectedGroupMembers.includes(u.id)} onChange={() => handleMemberToggle(u.id)} className="w-4 h-4 rounded border-gray-300 text-[#4A2B2C] focus:ring-[#4A2B2C]" />
                                        <span className="text-gray-800">{u.fullName}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    </div>
                )}
                <div className="flex justify-end space-x-2 space-x-reverse pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">ביטול</button>
                    <button type="submit" className="px-4 py-2 bg-[#4A2B2C] text-white rounded-md hover:bg-opacity-90">צור שיחה</button>
                </div>
            </form>
        </Modal>
    );
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) { // בדיקה שהתאריך תקין
        return '';
    }
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "היום";
    if (date.toDateString() === yesterday.toDateString()) return "אתמול";
    return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const ChatTab = ({ conversations, setConversations, users, socket, activeConversationId, setActiveConversationId }: ChatTabProps) => {
    const { user: currentUser } = useAuth();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const createModalTitleId = useId();
    const [showChatOnMobile, setShowChatOnMobile] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);

    const activeConversation = useMemo(() => {
        return conversations.find(c => c.id === activeConversationId);
    }, [conversations, activeConversationId]);

    useEffect(() => {
        if (!activeConversationId && conversations.length > 0) {
            setActiveConversationId(conversations[0].id);
        } else if (activeConversationId && !conversations.some(c => c.id === activeConversationId)) {
            setActiveConversationId(conversations.length > 0 ? conversations[0].id : null);
        }
    }, [conversations, activeConversationId]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeConversation?.messages.length]);

    useEffect(() => {
        if (socket && activeConversationId) {
            socket.emit('join_conversation', activeConversationId);
        }
    }, [socket, activeConversationId]);

    const handleSelectConversation = (id: string) => {
        setActiveConversationId(id);
        setConversations(prev => prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c));
        setShowChatOnMobile(true);
    };

    const handleCreateConversation = async (data: { type: 'private' | 'group', participantIds: string[], name?: string }) => {
        try {
            const newConversation = await api.createConversation(data);
            setConversations(prev => [newConversation, ...prev.filter(c => c.id !== newConversation.id)]);
            setActiveConversationId(newConversation.id);
            setShowChatOnMobile(true);
        } catch (error: any) {
            // שדרוג הטיפול בשגיאה: אם השיחה כבר קיימת, פשוט נעבור אליה
            if (error.message.includes("Conversation already exists")) {
                alert("שיחה עם משתמש זה כבר קיימת.");
            } else {
                console.error("Failed to create conversation:", error);
                alert(`שגיאה ביצירת השיחה: ${error.message}`);
            }
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversationId || !currentUser || !socket) return;

        socket.emit('send_message', {
            conversationId: activeConversationId,
            text: newMessage,
            senderId: currentUser.id
        });
        setNewMessage('');
    };

    const confirmDeleteMessages = async () => {
        if (!conversationToDelete) return;
        try {
            await api.deleteConversationMessages(conversationToDelete.id);
            setConversations(prev =>
                prev.map(c =>
                    c.id === conversationToDelete.id ? { ...c, messages: [] } : c
                )
            );
        } catch (error) {
            console.error("Failed to delete messages:", error);
            alert("שגיאה במחיקת היסטוריית השיחה.");
        } finally {
            setConversationToDelete(null);
        }
    };

    const getConversationDisplay = (conv: Conversation | null | undefined) => {
        if (!conv || !currentUser) return { name: 'טוען...', avatarComponent: <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" /> };
        if (conv.type === 'group') {
            return {
                name: conv.name || 'קבוצה',
                avatarComponent: <InitialAvatar name={conv.name || 'ק'} sizeClasses="w-12 h-12" />
            };
        }
        const otherParticipant = conv.participants?.find(p => p.id !== currentUser.id);
        const avatarComponent = otherParticipant?.profilePictureUrl
            ? <img src={api.getApiBaseUrl() + otherParticipant.profilePictureUrl} alt={otherParticipant.fullName} className="w-12 h-12 rounded-full object-cover" />
            : <InitialAvatar name={otherParticipant?.fullName || '?'} sizeClasses="w-12 h-12" />;
        return {
            name: otherParticipant?.fullName || 'משתמש לא ידוע',
            avatarComponent
        };
    };

    const getHeaderDisplay = (conv: Conversation | null | undefined) => {
        if (!conv || !currentUser) return { name: '', avatarComponent: <InitialAvatar name="?" sizeClasses="w-10 h-10" /> };
        if (conv.type === 'group') {
            return { name: conv.name || 'קבוצה', avatarComponent: <InitialAvatar name={conv.name || 'ק'} sizeClasses="w-10 h-10" /> };
        }
        const otherParticipant = conv.participants?.find(p => p.id !== currentUser.id);
        const avatarComponent = otherParticipant?.profilePictureUrl
            ? <img src={api.getApiBaseUrl() + otherParticipant.profilePictureUrl} alt={otherParticipant.fullName} className="w-10 h-10 rounded-full object-cover" />
            : <InitialAvatar name={otherParticipant?.fullName || '?'} sizeClasses="w-10 h-10" />;
        return { name: otherParticipant?.fullName || 'משתמש לא ידוע', avatarComponent };
    };

    return (
        <>
            <div className="flex h-[calc(100vh-200px)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className={`w-full md:w-1/3 lg:w-1/4 border-l border-gray-200 flex flex-col ${activeConversationId && showChatOnMobile ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">הודעות</h2>
                        <button onClick={() => setIsCreateModalOpen(true)} className="p-2 text-gray-600 hover:text-[#4A2B2C] rounded-full hover:bg-gray-100" aria-label="שיחה חדשה">
                            <PlusIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {conversations.map(conv => {
                            const display = getConversationDisplay(conv);
                            const lastMessage = conv.messages?.[conv.messages.length - 1];
                            const isActive = conv.id === activeConversationId;
                            return (
                                <button key={conv.id} onClick={() => handleSelectConversation(conv.id)} className={`w-full text-right flex items-center p-3 space-x-3 space-x-reverse border-b transition-colors ${isActive && (!showChatOnMobile || window.innerWidth >= 768) ? 'bg-[#F0EBE3]' : 'hover:bg-gray-50'}`}>
                                    {display.avatarComponent}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <p className={`font-semibold truncate ${isActive ? 'text-[#4A2B2C]' : 'text-gray-800'}`}>{display.name}</p>
                                            {conv.unreadCount && conv.unreadCount > 0 && (
                                                <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">{conv.unreadCount}</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">{lastMessage?.text || 'אין הודעות'}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className={`w-full md:flex-1 flex flex-col ${activeConversationId && showChatOnMobile ? 'flex' : 'hidden md:flex'}`}>
                    {activeConversation ? (
                        <>
                            <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
                                <div className="flex items-center space-x-3 space-x-reverse min-w-0">
                                    <button onClick={() => setShowChatOnMobile(false)} className="md:hidden p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-full">
                                        <ChevronLeftIcon className="w-5 h-5 transform rotate-180" />
                                    </button>
                                    {getHeaderDisplay(activeConversation).avatarComponent}
                                    <h3 className="font-bold text-lg text-gray-800 truncate">{getHeaderDisplay(activeConversation).name}</h3>
                                </div>
                                <button onClick={() => setConversationToDelete(activeConversation)} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50" aria-label="מחק היסטוריית שיחה">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
                                {(activeConversation.messages || []).map((msg, index) => {
                                    if (!currentUser || !msg.sender) return null;
                                    // 💡 שינוי #2: שימוש ב-timestamp או ב-createdAt
                                    const messageDate = msg.timestamp || msg.createdAt;
                                    const prevMessageDate = index > 0 ? activeConversation.messages[index - 1].timestamp || activeConversation.messages[index - 1].createdAt : null;

                                    const isMe = msg.sender.id === currentUser?.id;
                                    const time = new Date(messageDate).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
                                    const showDate = index === 0 || (prevMessageDate && (new Date(messageDate).toDateString() !== new Date(prevMessageDate).toDateString()));

                                    const senderAvatar = msg.sender?.profilePictureUrl
                                        ? <img src={api.getApiBaseUrl() + msg.sender.profilePictureUrl} alt={msg.sender.fullName} className="w-8 h-8 rounded-full object-cover self-start" />
                                        : <InitialAvatar name={msg.sender?.fullName || '?'} sizeClasses="w-8 h-8" />;

                                    return (
                                        <React.Fragment key={msg.id}>
                                            {showDate && (
                                                <div className="text-center my-4">
                                                    <span className="text-xs text-gray-500 bg-gray-200 rounded-full px-3 py-1">
                                                        {formatDate(messageDate)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {senderAvatar}
                                                <div className={`max-w-xs lg:max-w-md p-3 rounded-2xl ${isMe ? 'bg-[#4A2B2C] text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border'}`}>
                                                    <p className="text-sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.text}</p>
                                                    <p className={`text-xs mt-1 text-right ${isMe ? 'text-stone-300' : 'text-gray-400'}`}>{time}</p>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    )
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-4 border-t bg-white">
                                <form onSubmit={handleSendMessage} className="flex items-center space-x-2 space-x-reverse" key={activeConversationId || 'new-message'}>
                                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="כתוב הודעה..." className="flex-1 w-full px-4 py-2 bg-gray-100 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-[#4A2B2C]" />
                                    <button type="submit" disabled={!newMessage.trim()} className="p-3 bg-[#4A2B2C] text-white rounded-full disabled:opacity-50 hover:bg-opacity-90 transition">
                                        <PaperAirplaneIcon className="w-5 h-5" />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-500">
                            <p>בחר שיחה כדי להתחיל</p>
                        </div>
                    )}
                </div>
            </div>
            {/* 💡 שינוי #1 (המשך): העברת רשימת השיחות למודאל */}
            <CreateConversationModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                users={users}
                currentUserId={currentUser!.id}
                onCreate={handleCreateConversation}
                titleId={createModalTitleId}
                conversations={conversations}
            />
            <ConfirmationModal
                isOpen={!!conversationToDelete}
                onClose={() => setConversationToDelete(null)}
                onConfirm={confirmDeleteMessages}
                title="מחיקת היסטוריית שיחה"
                message={`האם למחוק את כל ההודעות בשיחה זו? לא ניתן לשחזר פעולה זו.`}
            />
        </>
    );
};

export default ChatTab;