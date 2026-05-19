import React from 'react';
import { motion } from 'framer-motion';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="w-32 h-32 bg-gradient-to-br from-red-600 to-red-900 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(220,38,38,0.6)] relative overflow-hidden">
           <div className="absolute inset-0 bg-black/20"></div>
           <span className="text-white text-7xl font-bold italic relative z-10 drop-shadow-lg">G</span>
        </div>
        <h1 className="text-5xl font-serif text-white mb-2 tracking-wider">Galaxy</h1>
        <p className="text-white tracking-[0.3em] text-sm font-light">THE BEST</p>
      </motion.div>
    </div>
  );
};
