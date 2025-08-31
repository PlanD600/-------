import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';

// קומפוננטת דף 404 מותאמת
const NotFoundPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F0EBE3]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#4A2B2C] mb-4">404</h1>
        <p className="text-xl text-[#4A2B2C] mb-6">העמוד שחיפשת לא נמצא</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-[#4A2B2C] text-white px-6 py-3 rounded-lg hover:bg-[#3D2324] transition-colors"
        >
          חזור לדשבורד
        </button>
      </div>
    </div>
  );
};

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

  // כאן השינוי המרכזי: מערכת ניווט מותאמת ל-HashRouter
  return (
    <div role="application" className="bg-[#F0EBE3] min-h-screen text-[#333]">
       <Routes>
          <Route 
            path="/login" 
            element={!token ? <LoginPage /> : <Navigate to="/dashboard" replace />} 
          />
          <Route 
            path="/dashboard/*" // הוספת * כדי לאפשר ניווט פנימי בדאשבורד
            element={token ? <Dashboard /> : <Navigate to="/login" replace />} 
          />
          {/* נתיב ברירת מחדל שמנווט למקום הנכון */}
          <Route 
            path="/" 
            element={<Navigate to={token ? "/dashboard" : "/login"} replace />} 
          />
          {/* דף 404 מותאם לכל הנתיבים שלא קיימים */}
          <Route 
            path="*" 
            element={<NotFoundPage />} 
          />
        </Routes>
    </div>
  );
}

export default App;