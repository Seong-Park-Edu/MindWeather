import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapView } from './components/MapView';
import { EmotionInput } from './components/EmotionInput';
import { Ticker } from './components/Ticker';
import { Header } from './components/Header';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme, themes } from './contexts/ThemeContext';
import { DiaryModal } from './components/DiaryModal';
import { ComfortBoardModal } from './components/ComfortBoardModal';
import { GardenModal } from './components/GardenModal';
import { LettersModal } from './components/LettersModal';
import { LoginPage } from './pages/LoginPage';
import { OnboardingModal, isOnboardingCompleted } from './components/OnboardingModal';

function AppContent() {
  const { user, isGuest, isAdmin: userIsAdmin, loading } = useAuth();
  const { theme } = useTheme();
  const colors = themes[theme];
  const [showInput, setShowInput] = useState(false);
  const [showDiary, setShowDiary] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [showGarden, setShowGarden] = useState(false);
  const [showLetters, setShowLetters] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check for admin mode via URL
  const isAdminPage = new URLSearchParams(window.location.search).get('admin') === 'true';

  // Show onboarding for first-time users
  useEffect(() => {
    if (user && !isGuest && !isOnboardingCompleted()) {
      setShowOnboarding(true);
    }
  }, [user, isGuest]);

  // Refresh map when emotion is submitted
  const handleEmotionSubmit = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
    setShowInput(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg.primary, color: colors.text.primary }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-t-transparent rounded-full"
          style={{ borderColor: colors.accent.primary, borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden selection:bg-purple-500/30" style={{ backgroundColor: colors.bg.primary, color: colors.text.primary }}>
      {isAdminPage && userIsAdmin ? (
        <AdminDashboard />
      ) : (
        <>
          <Header />

          <main className="relative w-full h-full">
            <MapView refreshTrigger={refreshTrigger} />
          </main>

          {/* Ticker - fixed at bottom */}
          <div className="fixed bottom-0 left-0 right-0 z-30">
            <Ticker />
          </div>

          {/* Floating Action Buttons - above ticker */}
          <div className="fixed bottom-20 right-6 z-40 flex flex-col gap-3">
            {/* Letters - hide for guests */}
            {!isGuest && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowLetters(true)}
                className="backdrop-blur-md border p-4 rounded-full shadow-lg text-2xl"
                style={{ backgroundColor: colors.bg.tertiary + '80', borderColor: colors.border + '40' }}
                title="AI 편지함"
              >
                📬
              </motion.button>
            )}
            {/* Garden - hide for guests */}
            {!isGuest && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowGarden(true)}
                className="backdrop-blur-md border p-4 rounded-full shadow-lg text-2xl"
                style={{ backgroundColor: colors.bg.tertiary + '80', borderColor: colors.border + '40' }}
                title="감정 수호 정원"
              >
                🌱
              </motion.button>
            )}
            {/* Diary - hide for guests */}
            {!isGuest && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowDiary(true)}
                className="backdrop-blur-md border p-4 rounded-full shadow-lg text-2xl"
                style={{ backgroundColor: colors.bg.tertiary + '80', borderColor: colors.border + '40' }}
                title="감정 다이어리"
              >
                📅
              </motion.button>
            )}
            {/* Board - visible for all */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowBoard(true)}
              className="backdrop-blur-md border p-4 rounded-full shadow-lg text-2xl"
              style={{ backgroundColor: colors.bg.tertiary + '80', borderColor: colors.border + '40' }}
              title="공개 위로 게시판"
            >
              💌
            </motion.button>
            {/* Emotion Input - hide for guests */}
            {!isGuest && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowInput(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-full shadow-lg shadow-purple-500/30 text-2xl"
              >
                ✏️
              </motion.button>
            )}
          </div>

          {!isGuest && userIsAdmin && (
            <a
              href="/?admin=true"
              className="fixed bottom-16 right-6 z-40 text-xs hover:text-white/50 transition-colors"
              style={{ color: colors.text.primary + '0D' }}
            >
              Admin
            </a>
          )}

          <AnimatePresence>
            {showInput && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowInput(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="fixed inset-0 pointer-events-none flex items-center justify-center z-50 p-4"
                >
                  <div className="w-full max-w-lg pointer-events-auto">
                    <EmotionInput onSuccess={handleEmotionSubmit} />
                  </div>
                </motion.div>
              </>
            )}
            {showDiary && <DiaryModal onClose={() => setShowDiary(false)} />}
            {showBoard && <ComfortBoardModal onClose={() => setShowBoard(false)} />}
            {showGarden && <GardenModal onClose={() => setShowGarden(false)} />}
            {showLetters && <LettersModal onClose={() => setShowLetters(false)} />}
            {showOnboarding && <OnboardingModal onComplete={() => setShowOnboarding(false)} />}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

import { SignalRProvider } from './contexts/SignalRContext';
import { SoundManager } from './components/SoundManager';
import { DynamicBackground } from './components/DynamicBackground';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SignalRProvider>
          <AppContent />
          <SoundManager />
          <DynamicBackground />
        </SignalRProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
