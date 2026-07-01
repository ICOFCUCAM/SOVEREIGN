import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export type UserStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface UserRole {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  full_name?: string;
  status: UserStatus;
  rejected_reason?: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  isPending: boolean;
  isRejected: boolean;
  isSuspended: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (uid: string) => {
    const { data } = await supabase.from('user_roles').select('*').eq('user_id', uid).maybeSingle();
    if (data) setRole(data as UserRole);
    else setRole(null);
  };

  const refresh = async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setUser(data.session?.user ?? null);
    if (data.session?.user) await fetchRole(data.session.user.id);
    else setRole(null);
  };

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) await fetchRole(sess.user.id);
      else setRole(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    await refresh();
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    if (error) return { error: error.message };
    // Auto-sign in if no email confirmation required
    await new Promise(r => setTimeout(r, 400));
    await refresh();
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  const status = role?.status ?? null;
  // An active admin must also be approved — server-side is_admin() now
  // enforces this, but mirroring it client-side prevents flashes of
  // admin UI during the round-trip.
  const isApproved = status === 'approved';
  const isAdmin    = role?.role === 'admin' && isApproved;

  return (
    <AuthContext.Provider value={{
      user, session, role, loading,
      isAdmin,
      isApproved,
      isPending:   status === 'pending',
      isRejected:  status === 'rejected',
      isSuspended: status === 'suspended',
      signIn, signUp, signOut, refresh
    }}>
      {children}
    </AuthContext.Provider>
  );
};
