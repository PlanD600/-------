// src/components/WhatIsItContent.tsx
import React from 'react';

interface WhatIsItContentProps {
  onClose: () => void;
}

const WhatIsItContent = ({ onClose }: WhatIsItContentProps) => {
  return (
    <div className="p-4 text-gray-800">
      <h2 className="text-xl font-bold mb-4 text-[#4A2B2C]">שליטה מלאה על הארגון שלך, בפשטות שלא הכרת.</h2>
      <p className="mb-4">
        ניהול פרויקטים לא צריך להיות מסובך. עם ProjectFlow, כל המידע והכלים הדרושים לך נמצאים במקום אחד, בממשק אלגנטי וברור שתוכנן במיוחד עבור מנהלים עסוקים.
      </p>
      <p className="mb-4">
        האפליקציה מאגדת את כל תחומי הניהול בפלטפורמה אינטגרטיבית אחת, ומאפשרת לך לעקוב, לנתח ולקבל החלטות בקלות:
      </p>
      <ul className="list-disc list-inside space-y-4">
        <li>
          <strong className="font-semibold text-[#4A2B2C]">ניהול משימות חכם:</strong> צור משימות, שייך עובדים, הגדר תאריכים ועקוב אחר סטטוס ההתקדמות בזמן אמת, בין אם בתצוגת רשימה מסודרת או בתצוגת כרטיסיות ויזואלית. כל זה כולל גם אפשרות להוסיף הערות ותגובות לכל משימה, כדי שהצוות שלך תמיד יישאר מעודכן.
        </li>
        <li>
          <strong className="font-semibold text-[#4A2B2C]">תרשים גאנט אינטואיטיבי:</strong> קבל מבט-על מקיף על כל הפרויקטים והמשימות שלך בציר זמן ויזואלי. עקוב אחר תלות בין משימות, נהל לוחות זמנים והתאם תאריכים בקלות, הכל על ידי גרירה פשוטה.
        </li>
        <li>
          <strong className="font-semibold text-[#4A2B2C]">מעקב פיננסי שקוף:</strong> קבל סקירה מיידית של מאזן הארגון שלך, כולל הכנסות והוצאות. תוכל לשייך כל תנועה כספית לפרויקט או למשימה ספציפית, ולקבל תמונה ברורה של הרווחיות שלך.
        </li>
        <li>
          <strong className="font-semibold text-[#4A2B2C]">תקשורת מהירה וחלקה:</strong> רכיב הצ'אט המובנה מאפשר לך לתקשר בזמן אמת עם הצוות, בשיחות פרטיות או קבוצתיות, מבלי לצאת מהאפליקציה. בנוסף, מערכת ההתראות תעדכן אותך על כל פעולה רלוונטית – מתגובה חדשה ועד שינוי סטטוס.
        </li>
      </ul>
      <div className="flex justify-end mt-6">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md shadow-[3px_3px_6px_#cdc8c2,-3px_-3px_6px_#ffffff] transition-all hover:bg-gray-300">
          סגור
        </button>
      </div>
    </div>
  );
};

export default WhatIsItContent;