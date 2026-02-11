import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getUserProfile } from '../services/api';
import { setupPushNotifications } from '../services/notification';
import { initializeReminder } from '../services/reminder';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isAdmin: boolean;
    isGuest: boolean;
    loading: boolean;
    signOut: () => Promise<void>;
    enterGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    isAdmin: false,
    isGuest: false,
    loading: true,
    signOut: async () => { },
    enterGuestMode: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkAdminStatus = async (token: string, userId: string) => {
        try {
            const profile = await getUserProfile(token);
            // Handle both camelCase and PascalCase (common in .NET)
            const admin = (profile as any).isAdmin || (profile as any).IsAdmin || false;
            setIsAdmin(!!admin);

            // 푸시 알림 설정 (실제 유저인 경우에만)
            await setupPushNotifications(userId);

            // 감정 기록 리마인더 초기화
            await initializeReminder(userId);
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
            if (session?.access_token && session.user?.id) {
                checkAdminStatus(session.access_token, session.user.id);
                setIsGuest(false); // Real login, not guest
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session ? session.user : null);
            if (session?.access_token && session.user?.id) {
                checkAdminStatus(session.access_token, session.user.id);
                setIsGuest(false); // Real login, not guest
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
        // Create a mock guest user for local use
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

    return (
        <AuthContext.Provider value={{ user, session, isAdmin, isGuest, loading, signOut, enterGuestMode }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
