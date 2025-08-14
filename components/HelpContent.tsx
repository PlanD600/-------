// src/components/HelpContent.tsx
import React from 'react';

interface HelpContentProps {
  onClose: () => void;
}

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  return (
    <div className="mb-4 p-4 rounded-lg bg-[#E0D8CF] shadow-[inset_3px_3px_6px_#cdc8c2,inset_-3px_-3px_6px_#ffffff]">
      <h3 className="text-lg font-semibold text-[#4A2B2C] mb-2">{question}</h3>
      <p className="text-sm text-gray-700">{answer}</p>
    </div>
  );
};

const HelpContent = ({ onClose }: HelpContentProps) => {
  const faqData = [
    {
      question: "איך אני מוסיף פרויקט חדש?",
      answer: "במסך הפרויקטים, לחץ על כפתור 'הוסף פרויקט חדש', מלא את הפרטים הנדרשים ולחץ 'שמור'."
    },
    {
      question: "האם ניתן לערוך הוצאה או הכנסה קיימת?",
      answer: "כן, עבור למסך הכספים, מצא את הרשומה שברצונך לערוך, ולחץ על כפתור העריכה (בצורת עיפרון) שלידה."
    },
    {
      question: "כיצד מחשבים את המע\"מ והניכויים?",
      answer: "המערכת מחשבת אותם אוטומטית על סמך הסכום ברוטו שהזנת ואחוזי המע\"מ והניכויים שציינת."
    },
    {
      question: "האם ניתן להוסיף משתמשים נוספים לארגון?",
      answer: "כן, במסך ההגדרות של הארגון, ישנה אפשרות להזמין משתמשים חדשים באמצעות כתובת האימייל שלהם."
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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