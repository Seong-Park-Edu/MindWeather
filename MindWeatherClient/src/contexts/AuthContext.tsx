import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getUserProfile } from '../services/api';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    isAdmin: boolean;
    isGuest: boolean;
    loading: boolean;
    signOut: () => Promise<void>;
    enterGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkAdminStatus = async (token: string) => {
        try {
            const profile = await getUserProfile(token);
            const admin = (profile as any).isAdmin || (profile as any).IsAdmin || false;
            setIsAdmin(!!admin);
        } catch (error) {
            console.error('Failed to fetch admin status:', error);
            setIsAdmin(false);
        }
    };

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.access_token) {
                checkAdminStatus(session.access_token);
                setIsGuest(false);
            }
            setLoading(false);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.access_token) {
                checkAdminStatus(session.access_token);
                setIsGuest(false);
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
        setIsGuest(false);
    };

    const enterGuestMode = () => {
        const guestUser = {
            id: 'guest-user',
            app_metadata: {},
            user_metadata: {},
            aud: 'guest',
            created_at: new Date().toISOString(),
        } as User;

        setUser(guestUser);
        setIsGuest(true);
        setIsAdmin(false);
        setLoading(false);
    };

    const value = {
        session,
        user,
        isAdmin,
        isGuest,
        loading,
        signOut,
        enterGuestMode,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
