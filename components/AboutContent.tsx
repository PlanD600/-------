// src/components/AboutContent.tsx
import React from 'react';

interface AboutContentProps {
  onClose: () => void; // הוספנו onClose אם תרצה כפתור סגירה פנימי
}

const AboutContent = ({ onClose }: AboutContentProps) => {
  return (
    <div className="p-4 text-gray-800">
      <h2 className="text-xl font-bold mb-4 text-[#4A2B2C]">אודות המערכת</h2>
      <p className="mb-4">
        מערכת Open TN Creation נועדה לפשט את הניהול הפיננסי עבור פרויקטים ועסקים קטנים. אנו מאמינים בשקיפות, יעילות ובקרת הוצאות והכנסות בצורה חכמה.
      </p>
      <p className="mb-4">
        הפלטפורמה מאפשרת לך לעקוב אחר תקציבים, לנהל משימות, לשייך הכנסות והוצאות לפרויקטים ספציפיים, ולקבל תמונה ברורה של המצב הפיננסי שלך בכל רגע נתון.
      </p>
      <p>
        אנו מחויבים לספק כלי חזק ואינטואיטיבי שיעזור לך להצליח בניהול הפרויקטים שלך.
      </p>
      {/* אם תרצה כפתור סגירה בתוך התוכן */}
      <div className="flex justify-end mt-6">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md shadow-[3px_3px_6px_#cdc8c2,-3px_-3px_6px_#ffffff] transition-all hover:bg-gray-300">
          סגור
        </button>
      </div>
    </div>
  );
};

export default AboutContent;