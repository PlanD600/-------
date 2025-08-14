// src/components/HelpContent.tsx
import React, { ReactNode } from 'react';

interface HelpContentProps {
  onClose: () => void;
}

const FAQItem = ({ question, answer }: { question: string; answer: ReactNode }) => {
  return (
    <div className="mb-4 p-4 rounded-lg bg-[#E0D8CF] shadow-[inset_3px_3px_6px_#cdc8c2,inset_-3px_-3px_6px_#ffffff]">
      <h3 className="text-lg font-semibold text-[#4A2B2C] mb-2">{question}</h3>
      <div className="text-sm text-gray-700">{answer}</div>
    </div>
  );
};

const HelpContent = ({ onClose }: HelpContentProps) => {
  const faqData = [
    {
      question: "מהי ProjectFlow?",
      answer: "ProjectFlow היא מערכת לניהול פרויקטים המיועדת לארגונים. היא מאגדת ניהול משימות, מעקב פיננסי, תרשימי גאנט ותקשורת פנימית בפלטפורמה אחת, כדי לפשט את הניהול ולשפר את שיתוף הפעולה בין הצוותים."
    },
    {
      question: "אילו תכונות עיקריות מציעה האפליקציה?",
      answer: (
        <ul className="list-disc list-inside space-y-1">
          <li><strong>מבט על (Overview)</strong>: מספק סקירה כללית של פרויקטים פעילים וארכיוניים ומאפשר סינון לפי סטטוסים או צוותים.</li>
          <li><strong>משימות (Tasks)</strong>: ניהול משימות ברמת הפרויקט עם תצוגות מגוונות (רשימה/כרטיסיות), סינון לפי עובדים, והוספת תגובות.</li>
          <li><strong>גאנט (Gantt)</strong>: תרשים גאנט ויזואלי המאפשר מעקב אחר התקדמות פרויקטים ומשימות, שינוי תאריכים וצפייה בפרטים.</li>
          <li><strong>כספים (Finance)</strong>: ניהול פיננסי הכולל סיכום הכנסות, הוצאות ומאזן, עם אפשרות לשייך כל תנועה לפרויקט ספציפי.</li>
          <li><strong>הודעות (Chat)</strong>: רכיב צ'אט מובנה לתקשורת בזמן אמת בין משתמשים, בשיחות פרטיות או קבוצתיות.</li>
        </ul>
      )
    },
    {
      question: "אילו רמות הרשאה קיימות במערכת?",
      answer: (
        <ul className="list-disc list-inside space-y-1">
          <li><strong>SUPER_ADMIN (סופר אדמין)</strong>: בעל ההרשאות הגבוהות ביותר.</li>
          <li><strong>ADMIN (אדמין)</strong>: בעל הרשאות ניהול מלאות בתוך ארגון ספציפי.</li>
          <li><strong>TEAM_LEADER (ראש צוות)</strong>: יכול לנהל פרויקטים ומשימות המשויכים לצוות שלו.</li>
          <li><strong>EMPLOYEE (עובד)</strong>: יכול לצפות במשימות ששויכו אליו, לעדכן סטטוס ולהוסיף תגובות.</li>
        </ul>
      )
    },
    {
      question: "כיצד מתבצעת ההתחברות לאפליקציה?",
      answer: "האפליקציה מאפשרת התחברות באמצעות מספר טלפון וקוד חד-פעמי (OTP) שנשלח למכשירך. במידה ואין לך חשבון, תוכל ליצור אחד בקלות עם שם מלא, מספר טלפון ושם הארגון."
    },
    {
      question: "האם ניתן לנהל מספר ארגונים במקביל?",
      answer: "כן. לאחר ההתחברות, באפשרותך לעבור בין הארגונים אליהם אתה משויך דרך תפריט ההגדרות הראשי."
    },
    {
      question: "מהם תנאי השימוש ומדיניות הפרטיות?",
      answer: "תנאי השימוש קובעים כי כל התוכן והקוד הם קניינה הבלעדי של החברה, המשתמש אחראי על התכנים שהוא מעלה, והשירות ניתן 'כפי שהוא'. ניתן גם להסכים לקבל תוכן שיווקי ופרסומות, עם אפשרות הסרה בכל עת."
    },
    {
      question: "כיצד מחשבים את המע\"מ והניכויים?",
      answer: "המערכת מחשבת אותם אוטומטית על סמך הסכום ברוטו שהזנת ואחוזי המע\"מ והניכויים שציינת."
    },
    {
      question: "מה קורה כאשר פרויקט מסתיים?",
      answer: "אתה יכול לארכב פרויקט שסיים את פעילותו. הוא יוסר מרשימת הפרויקטים הפעילים, אך נתוניו יישארו זמינים בדוחות הארכיון."
    },
    {
      question: "האם המערכת מאובטחת?",
      answer: "אנו משתמשים בטכנולוגיות הצפנה מתקדמות ובפרוטוקולי אבטחה מחמירים כדי להבטיח את הגנת המידע שלך בכל עת."
    },
  ];

  return (
    <div className="p-4 text-gray-800">
      <h2 className="text-2xl font-bold mb-4 text-[#4A2B2C]">עזרה ותמיכה</h2>
      <div className="grid grid-cols-1 gap-6">
        {/* עמודת שאלות ותשובות */}
        <div className="max-h-[60vh] overflow-y-auto">
          <h3 className="text-xl font-bold mb-4 text-[#4A2B2C]">שאלות נפוצות</h3>
          {faqData.map((item, index) => (
            <FAQItem key={index} question={item.question} answer={item.answer} />
          ))}
        </div>

        {/* עמודת סרטוני וידאו */}
        <div className="max-h-[60vh] overflow-y-auto">
          <h3 className="text-xl font-bold mb-4 text-[#4A2B2C]">סרטוני הדרכה</h3>
          <div className="space-y-4">
            <div className="relative pt-[56.25%]">
              <iframe
                className="absolute inset-0 w-full h-full rounded-lg shadow-md"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="מדריך למתחילים"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="relative pt-[56.25%]">
              <iframe
                className="absolute inset-0 w-full h-full rounded-lg shadow-md"
                src="https://www.youtube.com/embed/your_second_video_id"
                title="ניהול הכנסות והוצאות"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="relative pt-[56.25%]">
              <iframe
                className="absolute inset-0 w-full h-full rounded-lg shadow-md"
                src="https://www.youtube.com/embed/your_second_video_id"
                title="ניהול הכנסות והוצאות"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="relative pt-[56.25%]">
              <iframe
                className="absolute inset-0 w-full h-full rounded-lg shadow-md"
                src="https://www.youtube.com/embed/your_second_video_id"
                title="ניהול הכנסות והוצאות"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="relative pt-[56.25%]">
              <iframe
                className="absolute inset-0 w-full h-full rounded-lg shadow-md"
                src="https://www.youtube.com/embed/your_second_video_id"
                title="ניהול הכנסות והוצאות"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="relative pt-[56.25%]">
              <iframe
                className="absolute inset-0 w-full h-full rounded-lg shadow-md"
                src="https://www.youtube.com/embed/your_second_video_id"
                title="ניהול הכנסות והוצאות"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="relative pt-[56.25%]">
              <iframe
                className="absolute inset-0 w-full h-full rounded-lg shadow-md"
                src="https://www.youtube.com/embed/your_third_video_id"
                title="הגדרות וניהול משתמשים"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md shadow-[3px_3px_6px_#cdc8c2,-3px_-3px_6px_#ffffff] transition-all hover:bg-gray-300">
          סגור
        </button>
      </div>
    </div>
  );
};

export default HelpContent;