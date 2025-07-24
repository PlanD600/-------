
import React from 'react';
import { CloseIcon } from './icons';
import MarkdownViewer from './MarkdownViewer';

interface MarketingConsentProps {
    onClose: () => void;
}

const MarketingConsent = ({ onClose }: MarketingConsentProps) => {
    return (
        <div className="flex flex-col h-full max-h-[80vh] p-2">
             <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 flex-shrink-0">
                <h3 id="marketing-modal-title" className="text-xl font-bold text-[#3D2324]">הסכמה לקבלת תוכן שיווקי</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" aria-label="סגור חלון">
                    <CloseIcon className="w-6 h-6"/>
                </button>
            </div>
             <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                <MarkdownViewer filePath="/marketing.md" />
             </div>
             <div className="flex justify-end pt-4 mt-auto border-t border-gray-200 flex-shrink-0">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-[#4A2B2C] text-white rounded-md hover:bg-opacity-90">
                    סגור
                </button>
            </div>
        </div>
    );
};

export default MarketingConsent;