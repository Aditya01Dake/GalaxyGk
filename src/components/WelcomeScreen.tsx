import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Play, User, Mail, Phone, ArrowLeft } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: (name: string, contact: string) => void;
  onBack: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, onBack }) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) {
      setError('कृपया तुमचे नाव आणि ईमेल/मोबाईल नंबर टाका.');
      return;
    }
    setError('');
    onStart(name, contact);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center p-4 relative"
    >
      <button
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center text-indigo-200 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        मागे जा
      </button>

      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20 mt-12">
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg"
          >
            <BookOpen className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Welcome</h1>
          <h2 className="text-2xl font-semibold text-indigo-200">GK Knowledge Hub</h2>
          <p className="text-indigo-100/70 mt-4 text-sm">
            १५०+ सामाजिक ज्ञानाचे प्रश्न. प्रत्येक प्रश्नाला ३० सेकंद आणि ४ गुण. चुकीच्या उत्तराला १ गुण वजा.
          </p>
        </div>

        <form onSubmit={handleStart} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-indigo-100 mb-2">
              तुमचे नाव
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-indigo-300" />
              </div>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-xl bg-white/5 text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="उदा. रमेश पाटील"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-indigo-100 mb-2">
              ईमेल किंवा मोबाईल नंबर
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-indigo-300" />
              </div>
              <input
                type="text"
                id="contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-xl bg-white/5 text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="उदा. ramesh@email.com किंवा 9876543210"
              />
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-indigo-900 transition-all"
          >
            <Play className="w-5 h-5 mr-2" />
            क्विझ सुरू करा
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
};
