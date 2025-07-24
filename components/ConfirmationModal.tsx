
import React, { useId } from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: ConfirmationModalProps) => {
    const titleId = useId();
    const messageId = useId();

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} titleId={titleId} size="sm">
            <div
                role="alertdialog"
                aria-labelledby={titleId}
                aria-describedby={messageId}
            >
                <h3 id={titleId} className="text-lg font-bold text-gray-800">{title}</h3>
                <p id={messageId} className="mt-2 text-sm text-gray-600">{message}</p>
                <div className="mt-6 flex justify-end space-x-2 space-x-reverse">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        ביטול
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        מחק
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;