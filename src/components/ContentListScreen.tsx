import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, BookOpen, Image as ImageIcon, Download, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface ContentItem {
  id: string;
  type: 'pdf' | 'note' | 'paper';
  title: string;
  description?: string;
  url: string;
  createdAt: string;
}

interface Props {
  type: 'pdf' | 'note' | 'paper';
  onBack: () => void;
}

export const ContentListScreen: React.FC<Props> = ({ type, onBack }) => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const q = query(
          collection(db, 'content'),
          where('type', '==', type)
        );
        const snapshot = await getDocs(q);
        const fetchedItems: ContentItem[] = [];
        snapshot.forEach((doc) => {
          fetchedItems.push({ id: doc.id, ...doc.data() } as ContentItem);
        });
        fetchedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setItems(fetchedItems);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'content');
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [type]);

  const getTitle = () => {
    if (type === 'pdf') return 'PDFs';
    if (type === 'note') return 'Notes';
    return 'Papers';
  };

  const getIcon = () => {
    if (type === 'pdf') return <FileText className="w-8 h-8 text-blue-500" />;
    if (type === 'note') return <BookOpen className="w-8 h-8 text-emerald-500" />;
    return <ImageIcon className="w-8 h-8 text-amber-500" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-slate-50 p-4 md:p-8"
    >
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center text-slate-600 hover:text-slate-900 mb-6 transition-colors bg-white px-4 py-2 rounded-full shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          मागे जा
        </button>

        <div className="flex items-center mb-8 bg-white p-6 rounded-3xl shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mr-4">
            {getIcon()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{getTitle()}</h1>
            <p className="text-slate-500">उपलब्ध {getTitle()} डाउनलोड करा किंवा पहा</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100">
            <p className="text-slate-500 text-lg">अद्याप कोणतेही {getTitle()} उपलब्ध नाहीत.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <motion.a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={item.id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-shadow cursor-pointer block"
              >
                <div className="flex-1 pr-4">
                  <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                  {item.description && <p className="text-sm text-slate-500">{item.description}</p>}
                </div>
                <div
                  className="flex items-center justify-center w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-colors flex-shrink-0"
                >
                  <Download className="w-5 h-5" />
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
