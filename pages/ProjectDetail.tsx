import React from 'react';
import { Project } from '../types';
import { ChevronLeftIcon } from '../components/icons';

interface ProjectDetailProps {
    project: Project | undefined;
    onBack: () => void;
}

const ProjectDetail = ({ project, onBack }: ProjectDetailProps) => {

    if (!project) {
        return (
            <div className="flex flex-col h-screen max-w-md mx-auto bg-[#F0EBE3] shadow-2xl items-center justify-center">
                <p className="text-lg text-gray-600">Project not found.</p>
                <button onClick={onBack} className="mt-4 text-[#4A2B2C] underline">Go Back</button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen max-w-md mx-auto bg-[#F0EBE3] shadow-2xl">
            <header className="flex items-center justify-between p-4 bg-[#F0EBE3] shrink-0">
                <button
                    onClick={onBack}
                    className="w-10 h-10 flex items-center justify-center bg-[#E6DED6] rounded-lg shadow-[4px_4px_8px_#d1ccc6,-4px_-4px_8px_#fbf6f0] active:shadow-inner active:bg-[#F0EBE3]"
                    aria-label="חזור"
                >
                    <ChevronLeftIcon className="w-5 h-5 text-gray-700 transform rotate-180" />
                </button>
                <h1 className="font-bold text-lg text-[#4A2B2C] truncate px-4">{project.title}</h1>
                <div className="w-10 h-10"></div> {/* Spacer to balance the title */}
            </header>
            <main className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="bg-[#E6DED6] rounded-2xl p-5 shadow-[5px_5px_10px_#cdc8c2,-5px_-5px_10px_#ffffff]">
                    <h2 className="text-xl font-bold text-[#4A2B2C] mb-3">תיאור הפרויקט</h2>
                    {/* השינוי הוא הוספת overflow-hidden ל-div החיצוני ועוד כמה קלאסים ל-p הפנימי */}
                    <div className="text-gray-700 leading-relaxed overflow-y-auto max-h-[150px] pr-2">
                        <p className="break-words whitespace-pre-wrap"> 
                            {project.description || "לא סופק תיאור עבור פרויקט זה."}
                        </p>
                    </div>
                </div>

                <div className="bg-[#E6DED6] rounded-2xl p-5 shadow-[5px_5px_10px_#cdc8c2,-5px_-5px_10px_#ffffff]">
                    <h2 className="text-xl font-bold text-[#4A2B2C] mb-3">פרטים נוספים</h2>
                    <ul className="space-y-2 text-gray-600">
                        <li><strong>סטטוס:</strong> {project.status || 'לא צוין'}</li>
                        <li><strong>תקציב:</strong> {project.budget ? `₪${project.budget.toLocaleString()}` : 'לא צוין'}</li>
                        <li><strong>תאריך התחלה:</strong> {project.startDate ? new Date(project.startDate).toLocaleDateString('he-IL') : 'לא צוין'}</li>
                        <li><strong>תאריך סיום:</strong> {project.endDate ? new Date(project.endDate).toLocaleDateString('he-IL') : 'לא צוין'}</li>
                    </ul>
                </div>
            </main>
        </div>
    );
};

export default ProjectDetail;