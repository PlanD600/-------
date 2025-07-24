
import React from 'react';
import { Project, ProjectStatus } from '../types';
import { EditIcon, ArchiveIcon, TrashIcon } from './icons';

interface ProjectCardProps {
    project: Project;
    onClick: () => void;
    onEdit?: (id: string) => void;
    onArchive?: (id: string) => void;
    onDelete?: (id: string) => void;
}

const statusStyles: { [key in ProjectStatus]: { bg: string; text: string; } } = {
    'מתוכנן': { bg: 'bg-gray-100', text: 'text-gray-800' },
    'בתהליך': { bg: 'bg-blue-100', text: 'text-blue-800' },
    'לקראת סיום': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    'בסיכון': { bg: 'bg-red-100', text: 'text-red-800' },
    'מוקפא': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    'הושלם': { bg: 'bg-green-100', text: 'text-green-800' },
};

const ActionButton = ({ icon, onClick, label }: { icon: React.ReactNode, onClick: () => void, label: string }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onClick(); }} 
        aria-label={label} 
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
    >
        {icon}
    </button>
);

const DetailRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex justify-between items-baseline text-right">
        <span className="text-gray-500 text-xs ml-2">{label}:</span>
        <div className="font-semibold text-gray-800 truncate">{value}</div>
    </div>
);

const ProjectCard = ({ project, onClick, onEdit, onArchive, onDelete }: ProjectCardProps) => {
    const statusStyle = statusStyles[project.status] || statusStyles['מתוכנן'];
    const teamNames = project.team?.map(t => t.name).join(', ') || 'ללא שיוך';
    const teamLeadNames = project.teamLeads?.map(u => u.fullName).join(', ') || 'לא צוין';
    
    return (
        <div 
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all flex flex-col h-full"
        >
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <button
                        type="button"
                        className="flex-1 min-w-0 text-right space-y-2"
                        onClick={onClick}
                        aria-label={`הצג פרטי פרויקט: ${project.title}. סטטוס: ${project.status}.`}
                    >
                        <h3 className="font-bold text-lg text-[#3D2324] mb-1 truncate">{project.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{project.description || 'אין תיאור לפרויקט'}</p>
                    </button>
                    <div className="w-40 flex-shrink-0 space-y-2 text-sm ml-4">
                        <DetailRow 
                            label="סטטוס" 
                            value={
                                 <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                                    {project.status}
                                </span>
                            }
                        />
                        <DetailRow label="צוות" value={teamNames} />
                        <DetailRow 
                            label={project.teamLeads && project.teamLeads.length > 1 ? "ראשי צוות" : "ראש צוות"} 
                            value={teamLeadNames} 
                        />
                        <DetailRow 
                            label="תאריכים"
                            value={
                                <span>
                                     {project.startDate ? new Date(project.startDate).toLocaleDateString('he-IL') : 'N/A'} - {project.endDate ? new Date(project.endDate).toLocaleDateString('he-IL') : 'N/A'}
                                </span>
                            }
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end space-x-1 space-x-reverse pt-2 mt-auto">
                {onEdit && <ActionButton icon={<EditIcon className="w-4 h-4" />} onClick={() => onEdit(project.id)} label={`ערוך פרויקט ${project.title}`} />}
                {onArchive && <ActionButton icon={<ArchiveIcon className="w-4 h-4" />} onClick={() => onArchive(project.id)} label={`${project.isArchived ? 'בטל ארכיון' : 'העבר לארכיון'} פרויקט ${project.title}`} />}
                {onDelete && <ActionButton icon={<TrashIcon className="w-4 h-4" />} onClick={() => onDelete(project.id)} label={`מחק פרויקט ${project.title}`} />}
            </div>
        </div>
    );
};

export default ProjectCard;
