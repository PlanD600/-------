

import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { User, Membership } from '../types';
import * as api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  memberships: Membership[];
  setMemberships: React.Dispatch<React.SetStateAction<Membership[]>>;
  currentOrgId: string | null;
  currentUserRole: Membership['role'] | undefined;
  loading: boolean;
  isInitializing: boolean;
  login: (phone: string, otp: string) => Promise<void>;
  logout: () => void;
  switchOrganization: (orgId: string) => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('jwtToken');
      if (storedToken) {
        setToken(storedToken);
        try {
          // Fetch user profile and memberships to validate token and get data
          const [userProfile, fetchedMemberships] = await Promise.all([
            api.getMyProfile(),
            api.getMyMemberships(),
          ]);
          
          setUser(userProfile);
          setMemberships(fetchedMemberships);
          
          const storedOrgId = localStorage.getItem('currentOrgId');
          if (storedOrgId && fetchedMemberships.some(m => m.organizationId === storedOrgId)) {
            setCurrentOrgId(storedOrgId);
          } else if (fetchedMemberships.length > 0) {
            const firstOrgId = fetchedMemberships[0].organizationId;
            setCurrentOrgId(firstOrgId);
            localStorage.setItem('currentOrgId', firstOrgId);
          }
        } catch (error) {
          console.error("Failed to re-authenticate session:", error);
          // Token is invalid, clear storage
          localStorage.removeItem('jwtToken');
          localStorage.removeItem('currentOrgId');
          setToken(null);
        }
      }
      setIsInitializing(false);
    };

    initializeAuth();
  }, []);


  const currentUserRole = useMemo(() => {
    return memberships.find(m => m.organizationId === currentOrgId)?.role;
  }, [memberships, currentOrgId]);


  const login = async (phone: string, otp: string) => {
    setLoading(true);
    try {
        const data = await api.verifyOtp(phone, otp);
        localStorage.setItem('jwtToken', data.token);
        setToken(data.token);
        setUser(data.user);
        setMemberships(data.memberships);

        if (data.memberships.length > 0) {
          switchOrganization(data.memberships[0].organizationId);
        }
    } finally {
        setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setMemberships([]);
    setCurrentOrgId(null);
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('currentOrgId');
  };
  
  const switchOrganization = (orgId: string) => {
    localStorage.setItem('currentOrgId', orgId);
    setCurrentOrgId(orgId);
  };
  
  const updateUser = (newUser: User) => {
      setUser(newUser);
  };


  return (
    <AuthContext.Provider value={{ user, token, memberships, setMemberships, currentOrgId, currentUserRole, loading, isInitializing, login, logout, switchOrganization, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
