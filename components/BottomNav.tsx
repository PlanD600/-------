
import React from 'react';
import { HomeIcon, PaymentIcon, ProfileIcon, PlusIcon } from './icons';

interface BottomNavProps {
    onAddClick: () => void;
}

const NavItem = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
    <button className="flex flex-col items-center space-y-1 text-gray-500 hover:text-[#4A2B2C] transition-colors">
        {icon}
        <span className="text-xs">{label}</span>
    </button>
);

const BottomNav = ({ onAddClick }: BottomNavProps) => {
    return (
        <footer className="absolute bottom-0 left-0 right-0 max-w-md mx-auto">
            <div className="bg-[#e6ded6]/80 backdrop-blur-sm p-4 rounded-t-3xl">
                <div className="flex justify-around items-center">
                    <NavItem icon={<HomeIcon className="w-6 h-6" />} label="בית" />
                    <NavItem icon={<PaymentIcon className="w-6 h-6" />} label="תשלום" />
                    
                    <button 
                        onClick={onAddClick}
                        className="w-16 h-16 bg-[#4A2B2C] rounded-full flex items-center justify-center text-white shadow-lg -translate-y-6 shadow-stone-400 hover:scale-105 transition-transform"
                    >
                        <PlusIcon className="w-8 h-8" />
                    </button>

                    <NavItem icon={<ProfileIcon className="w-6 h-6" />} label="פרופיל" />
                    <NavItem icon={<ProfileIcon className="w-6 h-6" />} label="פרופיל" />
                </div>
            </div>
        </footer>
    );
};

export default BottomNav;
