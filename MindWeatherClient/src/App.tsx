import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapView } from './components/MapView';
import { EmotionInput } from './components/EmotionInput';
import { Ticker } from './components/Ticker';
import { Header } from './components/Header';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DiaryModal } from './components/DiaryModal';
import { ComfortBoardModal } from './components/ComfortBoardModal';
import { LoginPage } from './pages/LoginPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [showInput, setShowInput] = useState(false);
  const [showDiary, setShowDiary] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check for admin mode
  const isAdmin = new URLSearchParams(window.location.search).get('admin') === 'true';

  // Refresh map when emotion is submitted
  const handleEmotionSubmit = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
    setShowInput(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900 text-white selection:bg-purple-500/30">
      {isAdmin ? (
        <AdminDashboard />
      ) : (
        <>
          <Header />

          {/* Ticker - moved to top */}
          <div className="relative z-30">
            <Ticker />
          </div>

          <main className="relative w-full h-full">
            <MapView refreshTrigger={refreshTrigger} />
          </main>

          {/* Floating Action Buttons */}
          <div className="fixed bottom-32 right-6 z-40 flex flex-col gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowDiary(true)}
              className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-full shadow-lg text-2xl"
              title="감정 다이어리"
            >
              📅
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowBoard(true)}
              className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-full shadow-lg text-2xl"
              title="공개 위로 게시판"
            >
              💌
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowInput(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-full shadow-lg shadow-purple-500/30 text-2xl"
            >
              ✏️
            </motion.button>
          </div>

          <a
            href="/?admin=true"
            className="fixed bottom-24 right-6 z-40 text-xs text-white/5 hover:text-white/50 transition-colors"
          >
            Admin
          </a>


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
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

import { SignalRProvider } from './contexts/SignalRContext';
import { SoundManager } from './components/SoundManager';
import { DynamicBackground } from './components/DynamicBackground';

// ... (existing AppContent code)

export default function App() {
  return (
    <AuthProvider>
      <SignalRProvider>
        <AppContent />
        <SoundManager />
        <DynamicBackground />
      </SignalRProvider>
    </AuthProvider>
  );
}
