import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, Loader2, Medal } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  totalQuestions: number;
}

export const LeaderboardScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(collection(db, 'results'), orderBy('score', 'desc'), limit(50));
        const querySnapshot = await getDocs(q);
        const results: LeaderboardEntry[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          results.push({
            id: doc.id,
            name: data.name,
            score: data.score,
            totalQuestions: data.totalQuestions
          });
        });
        setLeaders(results);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'results');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-slate-900 p-4 md:p-8 text-white"
    >
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center text-indigo-400 hover:text-indigo-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          मागे जा
        </button>

        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30"
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white">लीडरबोर्ड</h1>
          <p className="text-slate-400 mt-2">टॉप ५० स्कोअर्स</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl">
            {leaders.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                अद्याप कोणतेही निकाल नाहीत.
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {leaders.map((leader, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={leader.id}
                    className="p-4 sm:p-6 flex items-center hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="w-12 flex-shrink-0 flex justify-center">
                      {index === 0 ? (
                        <Medal className="w-8 h-8 text-amber-400" />
                      ) : index === 1 ? (
                        <Medal className="w-8 h-8 text-slate-300" />
                      ) : index === 2 ? (
                        <Medal className="w-8 h-8 text-amber-700" />
                      ) : (
                        <span className="text-xl font-bold text-slate-500">#{index + 1}</span>
                      )}
                    </div>
                    
                    <div className="flex-1 ml-4">
                      <h3 className="text-lg font-semibold text-slate-200">{leader.name}</h3>
                      <p className="text-sm text-slate-400">{leader.totalQuestions} प्रश्न सोडवले</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-mono font-bold text-indigo-400">
                        {leader.score}
                      </div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider">गुण</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
