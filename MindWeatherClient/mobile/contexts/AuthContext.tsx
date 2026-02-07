import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

import { getUserProfile } from '../services/api';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isAdmin: boolean;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    isAdmin: false,
    loading: true,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkAdminStatus = async (token: string) => {
        try {
            const profile = await getUserProfile(token);
            // Handle both camelCase and PascalCase (common in .NET)
            const admin = (profile as any).isAdmin || (profile as any).IsAdmin || false;
            setIsAdmin(!!admin);
        } catch (error) {
            console.error('Failed to fetch admin status:', error);
            setIsAdmin(false);
        }
    };

    useEffect(() => {
        // Check for an existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session ? session.user : null);
            if (session?.access_token) {
                checkAdminStatus(session.access_token);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session ? session.user : null);
            if (session?.access_token) {
                checkAdminStatus(session.access_token);
            } else {
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setIsAdmin(false);
    };

    return (
        <AuthContext.Provider value={{ user, session, isAdmin, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
