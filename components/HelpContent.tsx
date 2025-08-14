// src/components/HelpContent.tsx
import React from 'react';

interface HelpContentProps {
  onClose: () => void;
}

const HelpContent = ({ onClose }: HelpContentProps) => {
  return (
    <div className="p-4 text-gray-800">
      <h2 className="text-xl font-bold mb-4 text-[#4A2B2C]">עזרה ותמיכה</h2>
      <p className="mb-4">
        אם נתקלת בבעיה כלשהי או שיש לך שאלה לגבי השימוש במערכת, אנו כאן כדי לעזור.
      </p>
      <ul className="list-disc list-inside mb-4 space-y-2">
        <li>לשאלות נפוצות, אנא עיין במדור ה-<a href="#" className="text-[#4A2B2C] hover:underline font-semibold">שאלות ותשובות</a> שלנו.</li>
        <li>לקבלת תמיכה טכנית, אנא שלח אימייל לכתובת: <a href="mailto:support@opentn.com" className="text-[#4A2B2C] hover:underline font-semibold">support@opentn.com</a></li>
        <li>תוכל גם לפנות אלינו דרך טופס יצירת קשר ב<a href="#" className="text-[#4A2B2C] hover:underline font-semibold">קישור זה</a>.</li>
      </ul>
      <p>
        אנו משתדלים להגיב לכל הפניות במהירות האפשרית.
      </p>
      <div className="flex justify-end mt-6">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md shadow-[3px_3px_6px_#cdc8c2,-3px_-3px_6px_#ffffff] transition-all hover:bg-gray-300">
          סגור
        </button>
      </div>
    </div>
  );
};

export default HelpContent;