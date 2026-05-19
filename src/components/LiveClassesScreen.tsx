import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Video, Users, Loader2 } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface LiveClass {
  id: string;
  title: string;
  description: string;
  roomName: string;
  type?: 'camera' | 'video';
  videoUrl?: string;
  status: 'upcoming' | 'live' | 'ended';
  createdAt: string;
}

interface Props {
  user: any;
  onBack: () => void;
}

export const LiveClassesScreen: React.FC<Props> = ({ user, onBack }) => {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeClass, setActiveClass] = useState<LiveClass | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'live_classes'),
      where('status', 'in', ['upcoming', 'live']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedClasses: LiveClass[] = [];
      snapshot.forEach((doc) => {
        fetchedClasses.push({ id: doc.id, ...doc.data() } as LiveClass);
      });
      setClasses(fetchedClasses);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'live_classes');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (activeClass) {
    const isVideo = activeClass.type === 'video';
    
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <div className="p-4 bg-slate-800 flex items-center justify-between">
          <button onClick={() => setActiveClass(null)} className="flex items-center text-slate-300 hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Leave Class
          </button>
          <div className="flex items-center text-rose-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse mr-2"></span>
            LIVE
          </div>
        </div>
        <div className="flex-grow">
          {isVideo ? (
            <div className="w-full h-full flex items-center justify-center bg-black">
              {activeClass.videoUrl?.includes('youtube.com') || activeClass.videoUrl?.includes('youtu.be') ? (
                <iframe
                  src={activeClass.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                  className="w-full max-w-5xl aspect-video border-0 rounded-xl shadow-2xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <video 
                  src={activeClass.videoUrl} 
                  controls 
                  autoPlay 
                  className="w-full max-w-5xl aspect-video rounded-xl shadow-2xl bg-black"
                />
              )}
            </div>
          ) : (
            <iframe
              src={`https://meet.jit.si/${activeClass.roomName}`}
              allow="camera; microphone; fullscreen; display-capture"
              className="w-full h-full border-0"
            ></iframe>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button onClick={onBack} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors mr-4">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Live Classes</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-slate-800 rounded-3xl p-12 text-center border border-slate-700">
            <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-slate-300 mb-2">No Live Classes</h2>
            <p className="text-slate-500">There are currently no live or upcoming classes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {classes.map((cls) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800 rounded-3xl p-6 border border-slate-700 flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{cls.title}</h3>
                  {cls.status === 'live' ? (
                    <span className="bg-rose-500/20 text-rose-400 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse mr-2"></span>
                      LIVE
                    </span>
                  ) : (
                    <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-xs font-medium">
                      UPCOMING
                    </span>
                  )}
                </div>
                <p className="text-slate-400 mb-6 flex-grow">{cls.description}</p>
                
                <button
                  onClick={() => setActiveClass(cls)}
                  disabled={cls.status !== 'live'}
                  className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center ${
                    cls.status === 'live' 
                      ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Video className="w-5 h-5 mr-2" />
                  {cls.status === 'live' ? 'Join Class' : 'Waiting to Start'}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
