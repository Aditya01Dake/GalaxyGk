import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, UserCircle, FileText, BookOpen, Image as ImageIcon, PlayCircle, Loader2, Download, Award } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

import { ThemeToggle } from './ThemeToggle';

interface ContentItem {
  id: string;
  type: 'ad' | 'pdf' | 'note' | 'paper';
  title: string;
  description?: string;
  url: string;
}

interface HomeScreenProps {
  onNavigate: (screen: 'quiz' | 'profile' | 'leaderboard' | 'pdfs' | 'live-learning' | 'papers') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const q = query(collection(db, 'content'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedContent: ContentItem[] = [];
        querySnapshot.forEach((doc) => {
          fetchedContent.push({ id: doc.id, ...doc.data() } as ContentItem);
        });
        setContent(fetchedContent);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  const ads = content.filter(c => c.type === 'ad');
  const pdfs = content.filter(c => c.type === 'pdf');
  const notes = content.filter(c => c.type === 'note');
  const papers = content.filter(c => c.type === 'paper');

  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex(prev => (prev + 1) % ads.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [ads.length]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 flex justify-between items-center sticky top-0 z-20">
        <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <Menu className="w-7 h-7 text-slate-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">GK Knowledge Hub</h1>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <button 
            onClick={() => onNavigate('profile')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <UserCircle className="w-8 h-8 text-indigo-600" />
          </button>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto pb-20">
        {/* Ads / Upcoming Info Banner */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <>
            {ads.length > 0 ? (
              <div className="mb-6 relative h-[160px] overflow-hidden rounded-2xl shadow-lg">
                {ads.map((ad, index) => (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: index === currentAdIndex ? 1 : 0, zIndex: index === currentAdIndex ? 10 : 0 }}
                    transition={{ duration: 0.5 }}
                    key={ad.id} 
                    className="absolute inset-0 bg-slate-200 flex items-center justify-center group"
                  >
                    {ad.url && ad.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                      <img src={ad.url} alt={ad.title} className="absolute inset-0 w-full h-full object-contain bg-slate-800" />
                    ) : ad.url ? (
                      <img src={ad.url} alt={ad.title} className="absolute inset-0 w-full h-full object-contain bg-slate-800" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="relative z-10 w-full h-full flex flex-col justify-end p-4">
                      <h2 className="text-lg font-bold mb-0.5 text-white drop-shadow-md">{ad.title}</h2>
                      {ad.description && <p className="text-indigo-50 text-xs drop-shadow-md line-clamp-1">{ad.description}</p>}
                    </div>
                  </motion.div>
                ))}
                
                {/* Carousel Indicators */}
                {ads.length > 1 && (
                  <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center space-x-2">
                    {ads.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`w-2 h-2 rounded-full transition-colors ${idx === currentAdIndex ? 'bg-white' : 'bg-white/40'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-6">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden flex flex-col justify-center min-h-[160px]"
                >
                  <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-2">Welcome to GK Hub</h2>
                    <p className="text-blue-100 text-sm">Your daily dose of general knowledge</p>
                  </div>
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                </motion.div>
              </div>
            )}

            {/* Grid Layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* Quiz Card */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('quiz')}
                className="bg-white p-6 rounded-2xl shadow-sm border-2 border-rose-400 flex flex-col items-center justify-center text-center aspect-square relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-rose-50/50"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <PlayCircle className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">Quiz सोडवा</h3>
                  <p className="text-xs text-rose-600 font-medium mt-1">नवीन प्रश्न</p>
                </div>
              </motion.button>

              {/* PDFs Card */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('pdfs')}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center aspect-square relative overflow-hidden group"
              >
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">PDFs</h3>
                <p className="text-xs text-slate-500 mt-1">{pdfs.length} उपलब्ध</p>
              </motion.button>

              {/* Live Learning Card */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('live-learning')}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center aspect-square relative overflow-hidden group"
              >
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                  <PlayCircle className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">Live Learning</h3>
                <p className="text-xs text-slate-500 mt-1">Classes & Videos</p>
              </motion.button>

              {/* Papers Card */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('papers')}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center aspect-square relative overflow-hidden group"
              >
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">Papers</h3>
                <p className="text-xs text-slate-500 mt-1">{papers.length} उपलब्ध</p>
              </motion.button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};