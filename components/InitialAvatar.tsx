// src/components/InitialAvatar.tsx

import React from 'react';

interface InitialAvatarProps {
  name: string;
  sizeClasses?: string; // e.g., "w-10 h-10"
}

const InitialAvatar: React.FC<InitialAvatarProps> = ({ name, sizeClasses = 'w-10 h-10' }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  let fontSizeClass = 'text-xl';
  if (sizeClasses.includes('w-8') || sizeClasses.includes('h-8')) fontSizeClass = 'text-base';
  if (sizeClasses.includes('w-12') || sizeClasses.includes('h-12')) fontSizeClass = 'text-2xl';

  return (
    <div
      className={`
        ${sizeClasses}
        flex
        items-center
        justify-center
        rounded-full
        bg-[#6D4C41]
        text-white
        font-bold
        select-none
        flex-shrink-0
      `}
    >
      <span className={fontSizeClass}>{initial}</span>
    </div>
  );
};

export default InitialAvatar;