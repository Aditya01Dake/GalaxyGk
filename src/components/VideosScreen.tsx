import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, PlayCircle, Loader2 } from 'lucide-react';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface VideoItem {
  id: string;
  title: string;
  description: string;
  url: string;
  createdAt: string;
}

interface Props {
  onBack: () => void;
}

export const VideosScreen: React.FC<Props> = ({ onBack }) => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const q = query(
          collection(db, 'content'),
          where('type', '==', 'video'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const fetchedVideos: VideoItem[] = [];
        snapshot.forEach((doc) => {
          fetchedVideos.push({ id: doc.id, ...doc.data() } as VideoItem);
        });
        setVideos(fetchedVideos);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'content');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button onClick={onBack} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors mr-4">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Recorded Videos</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : videos.length === 0 ? (
          <div className="bg-slate-800 rounded-3xl p-12 text-center border border-slate-700">
            <PlayCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-slate-300 mb-2">No Videos</h2>
            <p className="text-slate-500">There are currently no recorded videos available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos.map((video) => {
              const ytId = getYouTubeId(video.url);
              return (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 flex flex-col"
                >
                  {ytId ? (
                    <div className="aspect-video w-full">
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}`}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      ></iframe>
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-slate-900 flex items-center justify-center">
                      <a href={video.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-indigo-400 hover:text-indigo-300 transition-colors">
                        <PlayCircle className="w-12 h-12 mb-2" />
                        <span>Watch Video</span>
                      </a>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{video.title}</h3>
                    {video.description && (
                      <p className="text-slate-400 text-sm">{video.description}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
