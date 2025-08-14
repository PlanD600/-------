import { useEffect, useRef } from 'react';

/**
 * Hook שמטפל בנעילת הגלילה של אלמנט לראש העמוד عند פתיחתו.
 * הוא משתמש ב-ResizeObserver כדי לאפס את הגלילה בכל פעם שגודל התוכן משתנה.
 * @param isOpen - מציין אם האלמנט (למשל, מודל) פתוח.
 * @returns {React.RefObject<HTMLDivElement>} - רפרנס שיש לשייך לאלמנט הגולל.
 */
export const useScrollLock = (isOpen: boolean) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollableElement = contentRef.current;
    
    // בצע את הלוגיקה רק אם האלמנט קיים והמודל פתוח
    if (!scrollableElement || !isOpen) {
      return;
    }

    // איפוס גלילה ראשוני מיידי
    scrollableElement.scrollTop = 0;

    // הגדרת ה-Observer שיאזין לשינויי גודל
    const resizeObserver = new ResizeObserver(() => {
      // בכל פעם שה-Observer מזהה שינוי גודל (כמו טעינת תמונה),
      // הוא יאפס את הגלילה חזרה למעלה.
      if (scrollableElement.scrollTop !== 0) {
        scrollableElement.scrollTop = 0;
      }
    });

    // הפעלת ה-Observer על אלמנט התוכן
    resizeObserver.observe(scrollableElement);

    // פונקציית ניקוי: חובה לנתק את ה-Observer כדי למנוע דליפות זיכרון
    return () => {
      resizeObserver.disconnect();
    };
  }, [isOpen]); // ה-Effect יפעל מחדש בכל פעם שהמודל נפתח או נסגר

  return contentRef;
};