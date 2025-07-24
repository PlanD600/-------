

import React, { useState, useMemo, useId } from 'react';
import Modal from '../../components/Modal';
import { CheckIcon, CreditCardIcon } from '../../components/icons';

interface Plan {
    id: 'basic' | 'business' | 'pro';
    name: string;
    price: number;
    features: string[];
    description: string;
}

const plans: Plan[] = [
    {
        id: 'basic',
        name: 'בסיסית',
        price: 0,
        description: 'פתרון מושלם לצוותים קטנים ופרילנסרים.',
        features: ['עד 20 משתמשים', 'עד 10 פרויקטים', 'תמיכה בסיסית באימייל']
    },
    {
        id: 'business',
        name: 'עסק קטן',
        price: 50,
        description: 'לצמיחה ויעילות של עסקים קטנים.',
        features: ['עד 50 משתמשים', 'עד 25 פרויקטים', 'תמיכה בסיסית באימייל']
    },
    {
        id: 'pro',
        name: 'פרו',
        price: 70,
        description: 'הכלים הטובים ביותר לצוותים גדלים וחברות.',
        features: ['משתמשים ללא הגבלה', 'פרויקטים ללא הגבלה', 'תמיכה בטלפון']
    }
];

const allFeatures = Array.from(new Set(plans.flatMap(p => p.features)));


const BillingSettings = () => {
    const [currentPlanId, setCurrentPlanId] = useState<Plan['id']>('business');
    const [planToChange, setPlanToChange] = useState<Plan | null>(null);
    const changePlanModalTitleId = useId();

    const currentPlan = useMemo(() => plans.find(p => p.id === currentPlanId)!, [currentPlanId]);

    const handleChangePlan = () => {
        if (planToChange) {
            setCurrentPlanId(planToChange.id);
            setPlanToChange(null);
        }
    };
    
    const getButton = (plan: Plan) => {
        if (plan.id === currentPlan.id) {
            return <button disabled className="w-full px-4 py-2 bg-gray-300 text-gray-600 rounded-md cursor-not-allowed">התוכנית הנוכחית</button>;
        }
        if (plan.price > currentPlan.price) {
            return <button onClick={() => setPlanToChange(plan)} className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">שדרג</button>;
        }
        return <button onClick={() => setPlanToChange(plan)} className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">שנמך</button>;
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap gap-6 justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">מנוי וחיובים</h3>
                    <p className="text-gray-500 mt-1">נהל את תוכנית המנוי והחיובים של הארגון שלך.</p>
                </div>
                <button 
                  onClick={() => alert('מעביר לפורטל ניהול תשלומים...')}
                  className="flex items-center space-x-2 space-x-reverse bg-white text-[#4A2B2C] border border-gray-300 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                >
                    <CreditCardIcon className="w-5 h-5" />
                    <span>נהל אמצעי תשלום</span>
                </button>
            </div>
            
            {/* Current Plan Card */}
            <div className="bg-gradient-to-r from-[#4A2B2C] to-[#6c4a4b] text-white p-6 rounded-xl shadow-lg">
                <h4 className="text-lg font-semibold">התוכנית הנוכחית שלך</h4>
                <p className="text-4xl font-bold my-2">{currentPlan.name}</p>
                <p className="text-lg">₪{currentPlan.price} / לחודש</p>
                <p className="text-sm text-stone-300 mt-3">{currentPlan.description}</p>
            </div>

            {/* Plans Comparison Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                    <thead>
                        <tr>
                            <th className="p-4 text-right text-lg font-semibold text-gray-700 border-b">תכונות</th>
                            {plans.map(plan => (
                                <th key={plan.id} className="p-4 text-center border-b border-l">
                                    <p className="text-xl font-bold text-[#4A2B2C]">{plan.name}</p>
                                    <p className="text-lg font-semibold text-gray-800">₪{plan.price}<span className="text-sm font-normal text-gray-500">/חודש</span></p>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {allFeatures.map(feature => (
                            <tr key={feature} className="border-b">
                                <td className="p-4 font-medium text-gray-600">{feature}</td>
                                {plans.map(plan => (
                                    <td key={plan.id} className="p-4 text-center border-l">
                                        {plan.features.includes(feature) && <CheckIcon className="w-6 h-6 mx-auto text-green-500" />}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        <tr className="bg-gray-50">
                            <td></td>
                            {plans.map(plan => (
                                <td key={plan.id} className="p-4 text-center border-l">
                                    {getButton(plan)}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>

            <Modal isOpen={!!planToChange} onClose={() => setPlanToChange(null)} size="sm" titleId={changePlanModalTitleId}>
                {planToChange && (
                    <div className="p-2">
                        <h3 id={changePlanModalTitleId} className="text-lg font-bold text-gray-800">אישור שינוי תוכנית</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            האם אתה בטוח שברצונך לעבור לתוכנית <strong>{planToChange.name}</strong> במחיר של <strong>₪{planToChange.price}/חודש</strong>?
                        </p>
                        <div className="mt-6 flex justify-end space-x-2 space-x-reverse">
                            <button onClick={() => setPlanToChange(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">ביטול</button>
                            <button onClick={handleChangePlan} className="px-4 py-2 bg-[#4A2B2C] text-white rounded-md hover:bg-opacity-90">אשר ועבור תוכנית</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default BillingSettings;