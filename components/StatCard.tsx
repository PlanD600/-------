
import React from 'react';

interface StatCardProps {
    value: string;
    label: string;
}

const StatCard = ({ value, label }: StatCardProps) => {
    return (
        <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-stone-400">{label}</p>
        </div>
    );
};

export default StatCard;
