import React, { useState } from 'react';
import { Project, Task, TaskStatus, TaskPayload, Comment } from '../types';
import Modal from './Modal';
import { CloseIcon, EditIcon, TrashIcon } from './icons';
import { useAuth } from '../hooks/useAuth';

interface TaskDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task | null;
    project: Project | null;
    isManager: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onAddComment: (commentText: string) => void;
    canUserChangeStatus: boolean;
    onUpdateTaskField: (taskId: string, updates: Partial<TaskPayload>) => void;
    titleId: string;
}

const ALL_STATUSES: TaskStatus[] = ['מתוכנן', 'בתהליך', 'תקוע', 'הושלם'];

const statusStyles: { [key in TaskStatus]: { bg: string; text: string; } } = {
    'הושלם': { bg: 'bg-green-100', text: 'text-green-800' },
    'בתהליך': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    'תקוע': { bg: 'bg-red-100', text: 'text-red-800' },
    'מתוכנן': { bg: 'bg-gray-100', text: 'text-gray-800' },
};

const InfoItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex flex-col items-start">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <span className="mt-1 text-base font-semibold text-gray-900 min-w-0 truncate">{value}</span>
    </div>
);

const TaskDetailModal = ({ isOpen, onClose, task, project, isManager, onEdit, onDelete, onAddComment, canUserChangeStatus, onUpdateTaskField, titleId }: TaskDetailModalProps) => {
    const { user } = useAuth();
    const [newComment, setNewComment] = useState('');

    if (!isOpen || !task || !project) return null;
    
    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(newComment);
            setNewComment('');
        }
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdateTaskField(task.id, { status: e.target.value as TaskStatus });
    };

    const statusStyle = statusStyles[task.status] || statusStyles['מתוכנן'];
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" titleId={titleId}>
            <div className="flex flex-col max-h-[90vh] p-4 overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-start pb-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex-1 min-w-0 pr-4">
                        <p className="text-base text-gray-500 truncate">{project.title}</p>
                        <h2 id={titleId} className="text-3xl font-bold text-gray-800 truncate">{task.title}</h2>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse ml-4 flex-shrink-0">
                       {isManager && (
                            <>
                                <button onClick={onEdit} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors" aria-label="ערוך משימה">
                                    <EditIcon className="w-5 h-5" />
                                </button>
                                <button onClick={onDelete} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors" aria-label="מחק משימה">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </>
                        )}
                         <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors" aria-label="סגור">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 py-6 space-y-8"> 
                    
                    {/* Details and Description in a distinct card */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-6 flex-shrink-0">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                            <InfoItem 
                                label="סטטוס" 
                                value={
                                    canUserChangeStatus ? (
                                        <select
                                            value={task.status}
                                            onChange={handleStatusChange}
                                            className={`w-full p-2 text-base font-semibold border-2 border-transparent rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-[#4A2B2C] transition-colors ${statusStyle.bg} ${statusStyle.text} truncate`}
                                            aria-label="שנה סטטוס משימה"
                                        >
                                            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    ) : (
                                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusStyle.bg} ${statusStyle.text} truncate`}>{task.status}</span>
                                    )
                                }
                            />
                            <InfoItem label="תאריך התחלה" value={task.startDate ? new Date(task.startDate).toLocaleDateString('he-IL') : 'לא צוין'} />
                            <InfoItem label="תאריך יעד" value={task.endDate ? new Date(task.endDate).toLocaleDateString('he-IL') : 'לא צוין'} />
                            <InfoItem label="תקציב" value={task.expense ? `₪${task.expense.toLocaleString()}` : 'לא צוין'} />
                            <div className="col-span-2 md:col-span-4">
                                <InfoItem label="משויך ל" value={<span className="whitespace-normal break-words">{task.assignees && task.assignees.length > 0 ? task.assignees.map(u => u.fullName).join(', ') : 'טרם שויך'}</span>} />
                            </div>
                        </div>
                        
                        {task.description && (
                            <>
                                {/* שינוי: המרווח בין כותרת התיאור לתוכן התיאור. שינוי pt-6 ל-pt-3 ב-div שמכיל את border-t */}
                                <div className="border-t border-gray-200 pt-3"></div> 
                                <div>
                                    {/* שינוי: הסרתי את mb-3 מכותרת תיאור המשימה כדי להקטין מרווח */}
                                    <h3 className="text-xl font-bold text-gray-800">תיאור המשימה</h3>
                                    <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[80px] pr-2 break-words">
                                        {task.description}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Comments Section */}
                    <div className="flex flex-col flex-1 min-h-0">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex-shrink-0">תגובות ({task.comments.length})</h3>
                        <div className="space-y-5 flex-1 overflow-y-auto max-h-[250px] pr-2">
                            {task.comments.map(comment => (
                                <div key={comment.id} className="flex items-start space-x-3 space-x-reverse bg-white rounded-lg p-4 border border-gray-200 shadow-sm min-w-30 max-h-[150px] overflow-y-auto">
                                    <img src={comment.author.profilePictureUrl || `https://i.pravatar.cc/150?u=${comment.author.id}`} alt={comment.author.fullName} className="w-10 h-10 rounded-full flex-shrink-0"/>
                                    <div className="flex-1"> 
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-semibold text-base text-gray-800 truncate">{comment.author.fullName}</p>
                                            <p className="text-xs text-gray-400 flex-shrink-0">{new Date(comment.createdAt).toLocaleString('he-IL')}</p>
                                        </div>
                                        <p className="text-base text-gray-600 break-words whitespace-pre-wrap overflow-y-auto max-h-[80px] pr-2 break-all">
                                            {comment.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {task.comments.length === 0 && <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">אין תגובות. היה הראשון להגיב!</p>}
                        </div>
                        
                        {/* Add Comment Form */}
                        <form onSubmit={handleAddComment} className="mt-6 flex items-start space-x-3 space-x-reverse flex-shrink-0" key={`comment-form-${task.id}`}>
                            <img src={user?.profilePictureUrl || `https://i.pravatar.cc/150?u=${user?.id}`} alt={user?.fullName || ''} className="w-10 h-10 rounded-full flex-shrink-0"/>
                            <div className="flex-1">
                                <label htmlFor="new-comment" className="sr-only">הוסף תגובה</label>
                                <textarea
                                    id="new-comment"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="כתוב תגובה..."
                                    rows={3}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A2B2C] focus:border-transparent transition shadow-sm bg-white text-gray-900"
                                ></textarea>
                                <button type="submit" className="mt-2 px-4 py-2 bg-[#4A2B2C] text-white text-sm font-semibold rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50" disabled={!newComment.trim()}>
                                    הוסף תגובה
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default TaskDetailModal;