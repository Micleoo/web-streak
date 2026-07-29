import React, { createContext, useContext } from 'react';
import { authClient, useSession } from '../lib/auth-client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  currentStreak: number;
  totalXp: number;
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

  const signOut = async () => {
    await authClient.signOut();
    window.location.href = '/login';
  };

  const refreshProfile = async () => {
    // Better auth handles reactivity automatically for the most part
    // We could refetch here if absolutely needed, but useSession does it.
  };

  const user = sessionData?.user as any;
  const profile = user ? {
    id: user.id,
    name: user.name,
    email: user.email,
    currentStreak: user.currentStreak || 0,
    totalXp: user.totalXp || 0,
  } : null;

  return (
    <AuthContext.Provider value={{ 
      session: sessionData?.session || null, 
      user: profile, 
      profile, 
      loading: isPending, 
      signOut, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
