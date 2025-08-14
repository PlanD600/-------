// src/components/WhatIsItContent.tsx
import React from 'react';

interface WhatIsItContentProps {
  onClose: () => void;
}

const WhatIsItContent = ({ onClose }: WhatIsItContentProps) => {
  return (
    <div className="p-4 text-gray-800">
      <h2 className="text-xl font-bold mb-4 text-[#4A2B2C]">מה זו המערכת הזו?</h2>
      <p className="mb-4">
        מערכת זו היא כלי ניהולי מקיף המאפשר לך:
      </p>
      <ul className="list-disc list-inside mb-4 space-y-2">
        <li>ניהול פרויקטים: יצירה, עריכה, ושיוך הכנסות והוצאות לפרויקטים.</li>
        <li>מעקב פיננסי: תיעוד מפורט של כל הכנסה והוצאה, כולל מע"מ וניכויים.</li>
        <li>סטטוסים פיננסיים: עדכון סטטוס תשלום (ממתין, שולם).</li>
        <li>קישור למשימות: שיוך הוצאות והכנסות למשימות ספציפיות בתוך פרויקט.</li>
        <li>דוחות ותובנות: קבלת תמונה פיננסית בזמן אמת.</li>
      </ul>
      <p>
        המטרה היא לספק לך שליטה מלאה על התזרים הפיננסי של העסק, בצורה נוחה וידידותית למשתמש.
      </p>
      <div className="flex justify-end mt-6">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md shadow-[3px_3px_6px_#cdc8c2,-3px_-3px_6px_#ffffff] transition-all hover:bg-gray-300">
          סגור
        </button>
      </div>
    </div>
  );
};

export default WhatIsItContent;