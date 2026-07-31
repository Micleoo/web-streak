import React, { createContext, useContext, useState, useEffect } from 'react';
import { authClient, useSession } from '../lib/auth-client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string | null;
  favoriteCategories: string | null;
  currentStreak: number;
  maxStreak: number;
  totalXp: number;
  streakAtRisk: boolean;
  gracePeriodUntil: string | null;
}

interface AuthContextType {
  session: any | null;
  user: UserProfile | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: sessionData, isPending } = useSession();
  const [dbUser, setDbUser] = useState<any>(null);
  const [loadingDbUser, setLoadingDbUser] = useState(false);

  useEffect(() => {
    if (sessionData?.user) {
      setLoadingDbUser(true);
      fetch('/api/me', { credentials: 'include' })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed to fetch profile');
        })
        .then(data => setDbUser(data))
        .catch(console.error)
        .finally(() => setLoadingDbUser(false));
    } else {
      setDbUser(null);
    }
  }, [sessionData]);


  const signOut = async () => {
    await authClient.signOut();
    window.location.href = '/login';
  };

  const refreshProfile = async () => {
    try {
      const res = await fetch('/api/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDbUser(data);
      }
    } catch (e) {
      console.error('Failed to refresh profile', e);
    }
  };

  const baseUser = sessionData?.user as any;
  const user = baseUser ? { ...baseUser, ...(dbUser || {}) } : null;
  
  const profile = user ? {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username || null,
    favoriteCategories: user.favoriteCategories || null,
    currentStreak: user.currentStreak || 0,
    maxStreak: user.maxStreak || 0,
    totalXp: user.totalXp || 0,
    streakAtRisk: user.streakAtRisk || false,
    gracePeriodUntil: user.gracePeriodUntil || null,
  } : null;

  const isLoading = isPending || loadingDbUser;

  return (
    <AuthContext.Provider value={{ 
      session: sessionData?.session || null, 
      user: profile, 
      profile, 
      loading: isLoading, 
      signOut, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
