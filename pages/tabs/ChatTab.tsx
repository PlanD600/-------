




import React, { useState, useMemo, useEffect, useRef, useId } from 'react';
import { Conversation, User, Message, } from '../../types';
import * as api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { PlusIcon, PaperAirplaneIcon, TrashIcon, ChevronLeftIcon } from '../../components/icons';
import { Socket } from 'socket.io-client'; // **ודא שאתה מייבא Socket מ-socket.io-client גם כאן!**

interface ChatTabProps {
    conversations: Conversation[];
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
    users: User[];
    socket: Socket | null; // שונה מ-WebSocket | null ל-Socket | null
}

const CreateConversationModal = ({ isOpen, onClose, users, currentUserId, onCreate, titleId }: { isOpen: boolean, onClose: () => void, users: User[], currentUserId: string, onCreate: (data: { type: 'private' | 'group', participantIds: string[], name?: string, avatarUrl?: string }) => void, titleId: string }) => {
    const [type, setType] = useState<'private' | 'group'>('private');
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([currentUserId]);
    const [groupName, setGroupName] = useState('');
    const [groupAvatar, setGroupAvatar] = useState('');

    const otherUsers = users.filter(u => u.id !== currentUserId);

    const handleMemberToggle = (id: string) => {
        setSelectedGroupMembers(prev => prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (type === 'private' && selectedUser) {
            onCreate({ type: 'private', participantIds: [currentUserId, selectedUser] });
        } else if (type === 'group' && groupName && selectedGroupMembers.length > 1) {
            onCreate({ type: 'group', name: groupName, avatarUrl: groupAvatar, participantIds: selectedGroupMembers });
        }
        onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} titleId={titleId}>
            <form onSubmit={handleSubmit} className="p-2 space-y-4" key="create-conversation-form">
                <h3 id={titleId} className="text-xl font-bold text-gray-800">יצירת שיחה חדשה</h3>
                <div className="flex items-center rounded-lg bg-gray-200 p-1">
                    <button type="button" onClick={() => setType('private')} className={`w-1/2 py-2 text-sm font-semibold rounded-md ${type === 'private' ? 'bg-white shadow text-[#4A2B2C]' : 'text-gray-600'}`}>פרטית</button>
                    <button type="button" onClick={() => setType('group')} className={`w-1/2 py-2 text-sm font-semibold rounded-md ${type === 'group' ? 'bg-white shadow text-[#4A2B2C]' : 'text-gray-600'}`}>קבוצתית</button>
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
                        <div>
                            <label htmlFor="group-avatar" className="block text-sm font-medium text-gray-700 mb-1">כתובת תמונת קבוצה (אופציונלי)</label>
                            <input type="text" id="group-avatar" value={groupAvatar} onChange={e => setGroupAvatar(e.target.value)} className="w-full p-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4A2B2C] focus:border-transparent" />
                        </div>
                        <fieldset>
                            <legend className="block text-sm font-medium text-gray-700">בחר חברים</legend>
                            <div className="mt-1 max-h-40 overflow-y-auto space-y-2 rounded-md border border-gray-300 p-3 bg-gray-50">
                                {otherUsers.map(u => (
                                     <label key={u.id} className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                                        <input type="checkbox" onChange={() => handleMemberToggle(u.id)} className="w-4 h-4 rounded border-gray-300 text-[#4A2B2C] focus:ring-[#4A2B2C]" />
                                        <span className="text-gray-800">{u.fullName}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    </div>
                )}
                <div className="flex justify-end space-x-2 space-x-reverse pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">ביטול</button>
                    <button type="submit" className="px-4 py-2 bg-[#4A2B2C] text-white rounded-md">צור שיחה</button>
                </div>
            </form>
        </Modal>
    );
};

const ChatTab = ({ conversations, setConversations, users, socket }: ChatTabProps) => {
    const { user: currentUser } = useAuth();
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const createModalTitleId = useId();

    const [showChatOnMobile, setShowChatOnMobile] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);

    useEffect(() => {
        if (!activeConversationId && conversations.length > 0) {
            setActiveConversationId(conversations[0].id);
        }
        if (activeConversationId && !conversations.some(c => c.id === activeConversationId)) {
            setActiveConversationId(conversations.length > 0 ? conversations[0].id : null);
        }
    }, [conversations, activeConversationId]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeConversationId, conversations]);
    
    useEffect(() => {
        if (socket && activeConversationId) {
            socket.send(JSON.stringify({ event: 'join_conversation', payload: activeConversationId }));
        }
    }, [socket, activeConversationId]);

    const activeConversation = useMemo(() => {
        return conversations.find(c => c.id === activeConversationId);
    }, [conversations, activeConversationId]);

    const handleSelectConversation = (id: string) => {
        setActiveConversationId(id);
        setConversations(prev => prev.map(c => c.id === id ? {...c, unreadCount: 0} : c))
        setShowChatOnMobile(true);
    };

    const handleCreateConversation = async (data: { type: 'private' | 'group', participantIds: string[], name?: string, avatarUrl?: string }) => {
        try {
            const newConversation = await api.createConversation(data);
            setConversations(prev => [newConversation, ...prev]);
            setActiveConversationId(newConversation.id);
            setShowChatOnMobile(true);
        } catch (error) {
            console.error("Failed to create conversation:", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversationId || !currentUser || !socket) return;
        
        const payload = {
            conversationId: activeConversationId,
            text: newMessage,
        };

        socket.send(JSON.stringify({ event: 'send_message', payload }));
        
        // Optimistically update the UI
        const optimisticMessage: Message = {
            id: `temp-${Date.now()}`,
            text: newMessage,
            sender: currentUser,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            timestamp: new Date().toISOString(),
        };

        setConversations(prev => prev.map(c => 
            c.id === activeConversationId
                ? { ...c, messages: [...c.messages, optimisticMessage] }
                : c
        ));

        setNewMessage('');
    };

    const handleDeleteConversation = () => {
        // Deleting conversation is not in API spec, so this will be a local removal for now.
        if (!conversationToDelete) return;

        setConversations(prev => prev.filter(c => c.id !== conversationToDelete.id));

        if (activeConversationId === conversationToDelete.id) {
            const remainingConversations = conversations.filter(c => c.id !== conversationToDelete.id);
            const newActiveId = remainingConversations.length > 0 ? remainingConversations[0].id : null;
            setActiveConversationId(newActiveId);
            if (!newActiveId) {
                setShowChatOnMobile(false);
            }
        }
        setConversationToDelete(null);
    };
    
    const getConversationDisplay = (conv: Conversation | null | undefined) => {
        if (!conv || !currentUser) {
            return { name: '', avatar: '' };
        }
        if (conv.type === 'group') {
            return {
                name: conv.name || 'קבוצה',
                avatar: conv.avatarUrl || `https://i.pravatar.cc/150?u=${conv.id}`
            };
        }
        const otherParticipant = conv.participants.find(p => p.id !== currentUser.id);
        return {
            name: otherParticipant?.fullName || 'משתמש לא ידוע',
            avatar: otherParticipant?.profilePictureUrl || `https://i.pravatar.cc/150?u=${otherParticipant?.id}`
        };
    };

    return (
        <>
            <div className="flex h-[calc(100vh-200px)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Conversations List */}
                 <div className={`w-full md:w-1/3 lg:w-1/4 border-l border-gray-200 flex-col ${activeConversationId && showChatOnMobile ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">הודעות</h2>
                        <button onClick={() => setIsCreateModalOpen(true)} className="p-2 text-gray-600 hover:text-[#4A2B2C] rounded-full hover:bg-gray-100" aria-label="שיחה חדשה">
                            <PlusIcon className="w-6 h-6"/>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {conversations.map(conv => {
                            const display = getConversationDisplay(conv);
                            const lastMessage = conv.messages[conv.messages.length - 1];
                            const isActive = conv.id === activeConversationId;
                            return (
                                <button key={conv.id} onClick={() => handleSelectConversation(conv.id)} className={`w-full text-right flex items-center p-3 space-x-3 space-x-reverse border-b transition-colors ${isActive && (!showChatOnMobile || window.innerWidth >= 768) ? 'bg-[#F0EBE3]' : 'hover:bg-gray-50'}`}>
                                    <img src={display.avatar} alt={display.name} className="w-12 h-12 rounded-full object-cover"/>
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

                {/* Active Chat Window */}
                <div className={`w-full md:flex-1 flex-col ${activeConversationId && showChatOnMobile ? 'flex' : 'hidden md:flex'}`}>
                    {activeConversation ? (
                        <>
                            <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
                                <div className="flex items-center space-x-3 space-x-reverse min-w-0">
                                     <button onClick={() => setShowChatOnMobile(false)} className="md:hidden p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-full">
                                        <ChevronLeftIcon className="w-5 h-5 transform rotate-180" />
                                    </button>
                                    <img src={getConversationDisplay(activeConversation).avatar} alt={getConversationDisplay(activeConversation).name} className="w-10 h-10 rounded-full object-cover"/>
                                    <h3 className="font-bold text-lg text-gray-800 truncate">{getConversationDisplay(activeConversation).name}</h3>
                                </div>
                                {activeConversation.type === 'group' && (
                                    <button onClick={() => setConversationToDelete(activeConversation)} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50" aria-label="מחק קבוצה">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {activeConversation.messages.map(msg => {
                                    const isMe = msg.sender.id === currentUser?.id;
                                    const time = new Date(msg.timestamp || msg.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
                                    return (
                                        <div key={msg.id} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <img src={msg.sender?.profilePictureUrl || `https://i.pravatar.cc/150?u=${msg.sender?.id}`} alt={msg.sender?.fullName || ''} className="w-8 h-8 rounded-full object-cover self-start"/>
                                            <div className={`max-w-xs lg:max-w-md p-3 rounded-2xl ${isMe ? 'bg-[#4A2B2C] text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border'}`}>
                                                <p className="text-sm">{msg.text}</p>
                                                <p className={`text-xs mt-1 ${isMe ? 'text-stone-300' : 'text-gray-400'}`}>{time}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-4 border-t bg-white">
                                <form onSubmit={handleSendMessage} className="flex items-center space-x-2 space-x-reverse" key={activeConversationId || 'new-message'}>
                                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="כתוב הודעה..." className="flex-1 w-full px-4 py-2 bg-gray-100 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-[#4A2B2C]"/>
                                    <button type="submit" disabled={!newMessage.trim()} className="p-3 bg-[#4A2B2C] text-white rounded-full disabled:opacity-50 hover:bg-opacity-90 transition">
                                        <PaperAirplaneIcon className="w-5 h-5"/>
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
             <CreateConversationModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)}
                users={users}
                currentUserId={currentUser!.id}
                onCreate={handleCreateConversation}
                titleId={createModalTitleId}
            />
            <ConfirmationModal
                isOpen={!!conversationToDelete}
                onClose={() => setConversationToDelete(null)}
                onConfirm={handleDeleteConversation}
                title="אישור מחיקת שיחה"
                message={`האם אתה בטוח שברצונך למחוק את השיחה "${getConversationDisplay(conversationToDelete).name}"? פעולה זו היא בלתי הפיכה.`}
            />
        </>
    );
};

export default ChatTab;
