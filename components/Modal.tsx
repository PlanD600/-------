import React, { ReactNode, useEffect } from 'react';
import { useScrollLock } from './hooks/useScrollLock';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    titleId: string;
    title?: string;
    zIndex?: number;
    size?: 'sm' | 'md' | 'lg';
}

const Modal = ({ isOpen, onClose, children, titleId, zIndex = 50, size = 'md' }: ModalProps) => {
    // השתמש ב-Hook החדש שמסופק לך, הוא מחזיר את ה-ref
    const contentRef = useScrollLock(isOpen);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }

            if (event.key === 'Tab' && contentRef.current) {
                const focusableElements = contentRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (!focusableElements || focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (event.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        event.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        event.preventDefault();
                    }
                }
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            setTimeout(() => {
                 const firstElement = contentRef.current?.querySelector<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                 );
            }, 100);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);


    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
    };

    const widthClass = sizeClasses[size];

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4"
            style={{ zIndex }}
            onClick={onClose}
        >
            <div
                ref={contentRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={`bg-[#F0EBE3] rounded-3xl shadow-[10px_10px_20px_#cdc8c2,-10px_-10px_20px_#ffffff] p-6 w-full ${widthClass} max-h-[90vh] overflow-y-auto`}
                onClick={e => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

export default Modal;