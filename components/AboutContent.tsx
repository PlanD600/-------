// src/components/AboutContent.tsx
import React from 'react';

interface AboutContentProps {
  onClose: () => void;
}

const AboutContent = ({ onClose }: AboutContentProps) => {
  return (
    <div className="p-4 text-gray-800">
      <h2 className="text-xl font-bold mb-4 text-[#4A2B2C]">אנחנו ProjectFlow. מנהלים כמוך, מפתחים כמונו.</h2>
      <p className="mb-4">
        בעולם שבו פרויקטים מורכבים מתנהלים על פני כלים מפוזרים, ProjectFlow נולדה מתוך צורך אמיתי: לאגד את הכול במקום אחד, בממשק יחיד ואינטואיטיבי. אנחנו צוות מפתחים ישראלי, שמאמין כי ניהול ארגוני יכול להיות פשוט, שקוף ויעיל.
      </p>
      <p className="mb-4">
        האפליקציה שלנו תוכננה בקפידה, עם דגש על חדשנות טכנולוגית (React, Tailwind CSS, WebSockets) ועל הבנה עמוקה של צרכי הלקוח. אנחנו יודעים שמנהלי ארגונים וראשי צוותים צריכים לראות את התמונה הגדולה, מבלי ללכת לאיבוד בפרטים.
      </p>
      <p className="mb-4">
        ProjectFlow היא הפתרון האולטימטיבי עבורך. אם אתה רוצה לנהל פרויקטים, לתקשר עם הצוות, לעקוב אחר תקציבים ולקבל החלטות מבוססות נתונים – כל זה מתבצע בפלטפורמה אחת ששמה דגש על פשטות, מקצועיות ושליטה מוחלטת.
      </p>
      <p>
        הצטרף אלינו, ותן לצוות שלך לזרום.
      </p>
      <div className="flex justify-end mt-6">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md shadow-[3px_3px_6px_#cdc8c2,-3px_-3px_6px_#ffffff] transition-all hover:bg-gray-300">
          סגור
        </button>
      </div>
    </div>
  );
};

export default AboutContent;