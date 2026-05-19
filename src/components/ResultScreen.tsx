import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Send, RefreshCw, CheckCircle, XCircle, Target } from 'lucide-react';
import { sendResultToTelegram } from '../services/telegramService';
import { saveResult } from '../firebase';

interface ResultScreenProps {
  name: string;
  contact: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuestions: number;
  onRestart: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  name,
  contact,
  score,
  correctAnswers,
  wrongAnswers,
  totalQuestions,
  onRestart,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    const saveAndSend = async () => {
      setIsSending(true);
      try {
        // Save to Firebase (assuming user is logged in or we just save anonymously if rules allow, 
        // but our rules require auth. We will handle auth in App.tsx before showing WelcomeScreen)
        // Wait, if we require auth, we need the userId. We'll pass it down or handle it in App.tsx.
        // For now, let's just call the Telegram service.
        const success = await sendResultToTelegram(name, contact, score, totalQuestions);
        setSendSuccess(success);
      } catch (error) {
        console.error("Failed to send result", error);
        setSendSuccess(false);
      } finally {
        setIsSending(false);
      }
    };

    saveAndSend();
  }, [name, contact, score, totalQuestions]);

  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white"
    >
      <div className="bg-slate-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-700 text-center relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/20 to-transparent pointer-events-none" />
        
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
          className="w-24 h-24 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30 relative z-10"
        >
          <Trophy className="w-12 h-12 text-white" />
        </motion.div>

        <h1 className="text-3xl font-bold mb-2 text-slate-100">क्विझ पूर्ण झाली!</h1>
        <p className="text-slate-400 mb-8">अभिनंदन, {name}!</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-700/50 rounded-2xl p-4 border border-slate-600">
            <div className="text-slate-400 text-sm mb-1 flex items-center justify-center">
              <Target className="w-4 h-4 mr-2" />
              एकूण गुण
            </div>
            <div className="text-4xl font-mono font-bold text-indigo-400">{score}</div>
          </div>
          <div className="bg-slate-700/50 rounded-2xl p-4 border border-slate-600">
            <div className="text-slate-400 text-sm mb-1 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              टक्केवारी
            </div>
            <div className="text-4xl font-mono font-bold text-emerald-400">{percentage}%</div>
          </div>
        </div>

        <div className="flex justify-between text-sm text-slate-400 mb-8 px-4">
          <div className="flex flex-col items-center">
            <span className="text-slate-500 mb-1">एकूण प्रश्न</span>
            <span className="font-mono text-lg text-slate-300">{totalQuestions}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-emerald-500/70 mb-1">बरोबर</span>
            <span className="font-mono text-lg text-emerald-400">{correctAnswers}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-red-500/70 mb-1">चुकीचे</span>
            <span className="font-mono text-lg text-red-400">{wrongAnswers}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`p-4 rounded-xl border flex items-center justify-center text-sm ${
            isSending ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' :
            sendSuccess ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
            'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {isSending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                निकाल टेलिग्रामवर पाठवत आहे...
              </>
            ) : sendSuccess ? (
              <>
                <Send className="w-4 h-4 mr-2" />
                निकाल टेलिग्रामवर यशस्वीरित्या पाठवला!
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                टेलिग्रामवर निकाल पाठवता आला नाही. (Bot Token तपासा)
              </>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRestart}
            className="w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            पुन्हा खेळा
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
