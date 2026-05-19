import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Video, PlayCircle } from 'lucide-react';

interface Props {
  onNavigate: (screen: 'live-classes' | 'videos') => void;
  onBack: () => void;
}

export const LiveLearningScreen: React.FC<Props> = ({ onNavigate, onBack }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button onClick={onBack} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors mr-4">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Live Learning</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('live-classes')}
            className="bg-slate-800 p-8 rounded-3xl border border-slate-700 flex flex-col items-center justify-center text-center group hover:bg-slate-750 transition-colors"
          >
            <div className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mb-6 group-hover:bg-rose-500 group-hover:text-white transition-colors">
              <Video className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Live Classes</h2>
            <p className="text-slate-400">Join live interactive sessions</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('videos')}
            className="bg-slate-800 p-8 rounded-3xl border border-slate-700 flex flex-col items-center justify-center text-center group hover:bg-slate-750 transition-colors"
          >
            <div className="w-20 h-20 bg-indigo-500/20 text-indigo-500 rounded-full flex items-center justify-center mb-6 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <PlayCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Recorded Videos</h2>
            <p className="text-slate-400">Watch previous class recordings</p>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
