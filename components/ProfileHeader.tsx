
import React from 'react';
import StatCard from './StatCard';

interface ProfileHeaderProps {
    name: string;
    title: string;
    avatarUrl: string;
}

const ProfileHeader = ({ name, title, avatarUrl }: ProfileHeaderProps) => {
    return (
        <div className="bg-[#4A2B2C] rounded-3xl text-white p-6 shadow-lg shadow-stone-400">
            <div className="flex items-center space-x-reverse space-x-4 mb-6">
                <div className="w-20 h-20 bg-white rounded-full p-1">
                    <img src={avatarUrl} alt={name} className="w-full h-full rounded-full object-cover" />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">{name}</h1>
                    <p className="text-stone-300">{title}</p>
                </div>
            </div>
            
            <p className="text-stone-200 text-sm mb-6">
                Shaping Exceptional Experiences, Not Just Screens
            </p>

            <div className="flex justify-around text-center">
                <StatCard value="75k" label="עוקבים" />
                <StatCard value="0.0" label="במעקב" />
                <StatCard value="600" label="פרויקטים" />
            </div>
        </div>
    );
};

export default ProfileHeader;
