// src/contexts/AuthContext.tsx

import React, { createContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { User, Membership } from '../types';
import * as api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  memberships: Membership[];
  currentOrgId: string | null;
  currentUserRole: Membership['role'] | undefined;
  loading: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>; // ← עדכון!
  // loginWithOtp?: (phone: string, otpCode: string) => Promise<void>; // ← עתידי (בהערה)
  logout: () => void;
  switchOrganization: (orgId: string) => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshMemberships: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('jwtToken'));
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(localStorage.getItem('currentOrgId'));
  const [loading, setLoading] = useState<boolean>(false); // מצב לוגין
  const [isInitializing, setIsInitializing] = useState<boolean>(true); // מצב אתחול ראשוני

  // פונקציית עזר פנימית לטעינת ועדכון הממברשיפים
  const fetchAndSetMemberships = useCallback(async () => {
    if (!user?.id && token) { // אם יש טוקן אבל אין user (ייתכן בטעינה ראשונית)
      // ננסה להביא את הפרופיל קודם, או פשוט נמשיך אם user כבר קיים
    }
    if (token) { // נביא רק אם יש טוקן
      try {
        const fetchedMemberships = await api.getMyMemberships();
        setMemberships(fetchedMemberships);

        // לוגיקה לבחירת ארגון נוכחי לאחר רענון memberships
        const storedOrgId = localStorage.getItem('currentOrgId');
        if (storedOrgId && fetchedMemberships.some(m => m.organizationId === storedOrgId)) {
          setCurrentOrgId(storedOrgId);
        } else if (fetchedMemberships.length > 0) {
          // אם הארגון הנוכחי לא חוקי/לא קיים, או שאין ארגון שמור, בחר את הראשון
          const firstOrgId = fetchedMemberships[0].organizationId;
          setCurrentOrgId(firstOrgId);
          localStorage.setItem('currentOrgId', firstOrgId);
        } else {
          // אם אין בכלל memberships, נתק את המשתמש
          logout(); 
        }
      } catch (error) {
        console.error("Failed to fetch memberships during refresh:", error);
        // אם יש שגיאה באחזור (לדוגמה, טוקן לא חוקי), נתק את המשתמש
        logout(); 
      }
    } else {
      // אם אין טוקן, נקה memberships
      setMemberships([]);
      setCurrentOrgId(null);
      localStorage.removeItem('currentOrgId');
    }
  }, [user?.id, token]); // תלויות: user.id ו-token

  // פונקציה לייצוא עבור רענון חיצוני
  const refreshMemberships = useCallback(async () => {
    await fetchAndSetMemberships();
  }, [fetchAndSetMemberships]);


  // לוגיקת אתחול ראשוני
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('jwtToken');
      if (storedToken) {
        setToken(storedToken);
        try {
          const userProfile = await api.getMyProfile();
          setUser(userProfile);
          // נטען memberships דרך fetchAndSetMemberships כדי לטפל גם ב-currentOrgId
          await fetchAndSetMemberships(); 
        } catch (error) {
          console.error("Failed to re-authenticate session:", error);
          logout(); 
        }
      } else {
        // אין טוקן, וודא שניקוי מלא
        logout();
      }
      setIsInitializing(false);
    };

    initializeAuth();
  }, [fetchAndSetMemberships]); // תלות ב-fetchAndSetMemberships


 const login = useCallback(async (email: string, password: string) => {
  setLoading(true);
  try {
    const data = await api.loginWithEmail(email, password);
    localStorage.setItem('jwtToken', data.token);
    setToken(data.token);
    setUser(data.user);
    setMemberships(data.memberships);

    if (data.memberships.length > 0) {
      switchOrganization(data.memberships[0].organizationId);
    } else {
      localStorage.removeItem('currentOrgId');
      setCurrentOrgId(null);
    }
  } finally {
    setLoading(false);
  }
  }, []);

  // מצב עתידי — פונקציה להתחברות עם טלפון ו־OTP (בהערה)
/*
const loginWithOtp = useCallback(async (phone: string, otpCode: string) => {
  setLoading(true);
  try {
    const data = await api.verifyOtp(phone, otpCode);
    localStorage.setItem('jwtToken', data.token);
    setToken(data.token);
    setUser(data.user);
    setMemberships(data.memberships);

    if (data.memberships.length > 0) {
      switchOrganization(data.memberships[0].organizationId);
    } else {
      localStorage.removeItem('currentOrgId');
      setCurrentOrgId(null);
    }
  } finally {
    setLoading(false);
  }
}, [switchOrganization]);
*/

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setMemberships([]);
    setCurrentOrgId(null);
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('currentOrgId');
    setIsInitializing(false); // Reset isInitializing on logout
  }, []);
  
  const switchOrganization = useCallback((orgId: string) => {
    if (memberships.some(m => m.organizationId === orgId)) {
      localStorage.setItem('currentOrgId', orgId);
      setCurrentOrgId(orgId);
    } else {
      console.warn('Attempted to switch to an organization not part of user memberships.');
      // אם מנסים לעבור לארגון שלא קיים בממברשיפים, אולי לרענן או לנתק
      refreshMemberships(); 
    }
  }, [memberships, refreshMemberships]);
  
  // שינוי: updateUser מקבל Partial<User> ומפעיל refreshMemberships
  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user?.id) return;
    const updatedUser = await api.updateMyProfile(updates);
    setUser(prevUser => (prevUser ? { ...prevUser, ...updatedUser } : null));
    // אם שונתה אינפורמציה כמו jobTitle שמופיעה ב-membership, יש לרענן memberships
    await refreshMemberships(); 
  }, [user?.id, refreshMemberships]);


  const currentUserRole = useMemo(() => {
    return memberships.find(m => m.organizationId === currentOrgId)?.role;
  }, [memberships, currentOrgId]);


  const contextValue = useMemo(() => ({
    user,
    token,
    memberships,
    // setMemberships, // הוסר מהייצוא
    currentOrgId,
    currentUserRole,
    loading,
    isInitializing,
    login,
    logout,
    switchOrganization,
    updateUser,
    refreshMemberships, // ייצוא הפונקציה החדשה
      // loginWithOtp, // ← מצב עתידי (בהערה)

  }), [user, token, memberships, currentOrgId, currentUserRole, loading, isInitializing, login, logout, switchOrganization,/*loginWithOtp,*/ updateUser, refreshMemberships]);


  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
  
};export default AuthContext;
