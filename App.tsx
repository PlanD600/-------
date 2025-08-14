import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  const { token, isInitializing } = useAuth();

  // הקוד שלך לטיפול בגלילה - נשאר ללא שינוי, הוא תקין
  useEffect(() => {
    let scrollTimer: number | null = null;
    const handleScroll = () => {
        document.body.classList.add('is-scrolling');
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = window.setTimeout(() => {
            document.body.classList.remove('is-scrolling');
        }, 1500);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => {
        window.removeEventListener('scroll', handleScroll, true);
        if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, []);

  // לוגיקת מסך הטעינה - נשארת ללא שינוי, היא תקינה
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F0EBE3]">
        <div className="text-xl font-semibold text-[#4A2B2C]">טוען...</div>
      </div>
    );
  }

  // כאן השינוי המרכזי: החלפת התנאי הפשוט במערכת ניווט
  return (
    <div role="application" className="bg-[#F0EBE3] min-h-screen text-[#333]">
       <Routes>
          <Route 
            path="/login" 
            element={!token ? <LoginPage /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/dashboard/*" // הוספת * כדי לאפשר ניווט פנימי בדאשבורד
            element={token ? <Dashboard /> : <Navigate to="/login" />} 
          />
          {/* נתיב ברירת מחדל שמנווט למקום הנכון */}
          <Route 
            path="*" 
            element={<Navigate to={token ? "/dashboard" : "/login"} />} 
          />
        </Routes>
    </div>
  );
}

export default App;