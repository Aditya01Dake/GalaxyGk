import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, LogOut, Award, FileText, Loader2, Download } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth, logout, handleFirestoreError, OperationType } from '../firebase';

interface ProfileScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

interface UserResult {
  id: string;
  score: number;
  totalQuestions: number;
  createdAt: string;
}

interface Certificate {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

interface Message {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack, onLogout }) => {
  const [results, setResults] = useState<UserResult[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  const [customId, setCustomId] = useState<string>('');

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCustomId(userDoc.data().customId || 'N/A');
        }

        // Fetch Results
        const resultsQuery = query(
          collection(db, 'results'),
          where('userId', '==', user.uid)
        );
        const resultsSnapshot = await getDocs(resultsQuery);
        const fetchedResults: UserResult[] = [];
        resultsSnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedResults.push({
            id: doc.id,
            score: data.score,
            totalQuestions: data.totalQuestions,
            createdAt: data.createdAt
          });
        });
        // Sort in JS to avoid composite index requirement
        fetchedResults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setResults(fetchedResults);

        // Fetch Certificates and Messages
        if (userDoc.exists() && userDoc.data().customId) {
          const certsQuery = query(
            collection(db, 'certificates'),
            where('userId', '==', userDoc.data().customId)
          );
          const certsSnapshot = await getDocs(certsQuery);
          const fetchedCerts: Certificate[] = [];
          certsSnapshot.forEach((doc) => {
            const data = doc.data();
            fetchedCerts.push({
              id: doc.id,
              title: data.title,
              url: data.url,
              createdAt: data.createdAt
            });
          });
          fetchedCerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setCertificates(fetchedCerts);

          const msgsQuery = query(
            collection(db, 'messages'),
            where('userId', '==', userDoc.data().customId)
          );
          const msgsSnapshot = await getDocs(msgsQuery);
          const fetchedMsgs: Message[] = [];
          msgsSnapshot.forEach((doc) => {
            const data = doc.data();
            fetchedMsgs.push({
              id: doc.id,
              title: data.title,
              content: data.content,
              createdAt: data.createdAt
            });
          });
          fetchedMsgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setMessages(fetchedMsgs);
        }

      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'profile_data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleLogoutClick = async () => {
    try {
      await logout();
      onLogout();
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="min-h-screen bg-slate-50 p-4 md:p-8"
    >
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          मागे जा
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 flex items-center space-x-6">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-indigo-200">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-3xl font-bold text-indigo-500">{user.displayName?.charAt(0) || 'U'}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{user.displayName}</h1>
            <p className="text-slate-500">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Google Verified
              </div>
              {customId && (
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 font-mono">
                  ID: {customId}
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quiz Marks Section */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-indigo-500" />
                माझे निकाल (Quiz Marks)
              </h2>
              
              {results.length === 0 ? (
                <p className="text-slate-500 text-sm">तुम्ही अद्याप कोणतीही क्विझ सोडवलेली नाही.</p>
              ) : (
                <div className="space-y-3">
                  {results.map(result => (
                    <div key={result.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="font-medium text-slate-700">क्विझ स्कोअर</p>
                        <p className="text-xs text-slate-400">{new Date(result.createdAt).toLocaleDateString('mr-IN')}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-indigo-600">{result.score}</span>
                        <span className="text-sm text-slate-500"> / {result.totalQuestions}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Certificates Section */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-amber-500" />
                माझे सर्टिफिकेट्स (Certificates)
              </h2>
              
              {certificates.length === 0 ? (
                <p className="text-slate-500 text-sm">आतापर्यंत सर्टिफिकेट आले नाही.</p>
              ) : (
                <div className="space-y-3">
                  {certificates.map(cert => (
                    <a 
                      key={cert.id} 
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex justify-between items-center p-4 bg-amber-50 rounded-xl border border-amber-100 hover:bg-amber-100 transition-colors group"
                    >
                      <div className="flex items-center">
                        <Award className="w-6 h-6 text-amber-500 mr-3" />
                        <div>
                          <p className="font-medium text-amber-900">{cert.title}</p>
                          <p className="text-xs text-amber-700/70">{new Date(cert.createdAt).toLocaleDateString('mr-IN')}</p>
                        </div>
                      </div>
                      <Download className="w-5 h-5 text-amber-600 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Messages Section */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-indigo-500" />
                माझे संदेश (Messages)
              </h2>
              
              {messages.length === 0 ? (
                <p className="text-slate-500 text-sm">आतापर्यंत कोणतेही संदेश आले नाहीत.</p>
              ) : (
                <div className="space-y-3">
                  {messages.map(msg => (
                    <div key={msg.id} className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-indigo-900">{msg.title}</h3>
                        <span className="text-xs text-indigo-700/70">{new Date(msg.createdAt).toLocaleDateString('mr-IN')}</span>
                      </div>
                      <p className="text-indigo-800 text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogoutClick}
          className="w-full mt-8 flex items-center justify-center py-4 px-4 border border-rose-200 rounded-2xl shadow-sm text-lg font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 focus:outline-none transition-all"
        >
          <LogOut className="w-5 h-5 mr-2" />
          लॉग आउट (Logout)
        </button>
      </div>
    </motion.div>
  );
};