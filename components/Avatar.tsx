// src/components/Avatar.tsx
import React from 'react';

// פונקציה פשוטה שיוצרת צבע רקע על בסיס אותיות השם, כדי שהצבע יהיה קבוע לכל שם
const stringToHslColor = (str: string, s: number, l: number) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const h = hash % 360;
    return `hsl(${h}, ${s}%, ${l}%)`;
};

interface AvatarProps {
    fullName: string;
    size?: number;
    className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ fullName, size = 10, className = '' }) => {
    // משיכת האות הראשונה של השם המלא
    const initials = fullName ? fullName[0].toUpperCase() : '';
    const bgColor = stringToHslColor(fullName, 50, 70);
    
    // גודל דינמי באמצעות Tailwind, למשל w-10 h-10
    const sizeClasses = `w-${size} h-${size}`;

    return (
        <div 
            className={`flex items-center justify-center rounded-full text-white font-bold text-xl select-none ${sizeClasses} ${className}`}
            style={{ backgroundColor: bgColor }}
        >
            {initials}
        </div>
    );
};

export default Avatar;