import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
    const { enterGuestMode } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('회원가입 확인 메일을 확인해주세요! (개발환경에서는 자동 로그인될 수 있습니다)');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message || '인증에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 overflow-hidden relative">
            {/* Background Animations */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                transition={{ duration: 20, repeat: Infinity }}
                className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"
            />
            <motion.div
                animate={{ scale: [1, 1.1, 1], x: [0, -50, 0] }}
                transition={{ duration: 15, repeat: Infinity }}
                className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-8 rounded-2xl w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Mind Weather 🌦️
                    </h1>
                    <p className="text-gray-400 mt-2">
                        {isSignUp ? '새로운 계정 만들기' : '당신의 마음 날씨를 기록하세요'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">이메일</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            placeholder="example@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">비밀번호</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm text-center p-2 bg-red-500/10 rounded-lg">
                            {error}
                        </div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '처리 중...' : (isSignUp ? '회원가입' : '로그인')}
                    </motion.button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                        {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
                    </button>
                </div>

                {/* Guest Mode */}
                <div className="mt-4 pt-4 border-t border-white/10 text-center">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={enterGuestMode}
                        className="w-full py-3 rounded-xl font-medium text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm"
                    >
                        게스트로 둘러보기 👀
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}
