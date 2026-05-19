import React, { useState, useEffect } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { QuizScreen } from './components/QuizScreen';
import { ResultScreen } from './components/ResultScreen';
import { Chatbot } from './components/Chatbot';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { AdminScreen } from './components/AdminScreen';
import { HomeScreen } from './components/HomeScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { ContentListScreen } from './components/ContentListScreen';
import { LiveLearningScreen } from './components/LiveLearningScreen';
import { LiveClassesScreen } from './components/LiveClassesScreen';
import { VideosScreen } from './components/VideosScreen';
import { SplashScreen } from './components/SplashScreen';
import { ThemeToggle } from './components/ThemeToggle';
import { initialQuestions, Question } from './data/questions';
import { generateQuestions } from './services/geminiService';
import { loginWithGoogle, auth, saveResult, saveUser, db, logout } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { LogIn, Loader2, AlertCircle, Trophy, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

type Screen = 'login' | 'home' | 'profile' | 'welcome' | 'quiz' | 'result' | 'leaderboard' | 'admin' | 'pdfs' | 'live-learning' | 'live-classes' | 'videos' | 'papers';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [screen, setScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'staff' | 'user'>('user');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loginError, setLoginError] = useState<string>('');
  
  const [userDetails, setUserDetails] = useState({ name: '', contact: '', customId: '' });
  const [quizResult, setQuizResult] = useState({ score: 0, correct: 0, wrong: 0, total: 0 });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const q = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const fetchedQuestions: Question[] = [];
        snap.forEach((doc) => {
          const data = doc.data();
          fetchedQuestions.push({
            id: doc.id,
            text: data.text,
            options: data.options,
            correctAnswerIndex: data.correctAnswerIndex,
            explanation: data.explanation || ''
          });
        });
        
        if (fetchedQuestions.length > 0) {
          setQuestions(fetchedQuestions);
        } else {
          setQuestions(initialQuestions); // Fallback
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
        setQuestions(initialQuestions); // Fallback
      } finally {
        setLoading(false);
      }
    };

    if (screen === 'quiz') {
      fetchQuestions();
    }
  }, [screen]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Save user and get custom ID
          const customId = await saveUser(currentUser.uid, currentUser.displayName || 'User', currentUser.email || '');
          setUserDetails(prev => ({ ...prev, customId: customId || '' }));

          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          let role: 'admin' | 'staff' | 'user' = 'user';
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.isBanned) {
              await logout();
              setLoginError('तुमचे खाते बॅन करण्यात आले आहे. कृपया ॲडमिनशी संपर्क साधा.');
              setUser(null);
              setUserRole('user');
              setScreen('login');
              setIsAuthReady(true);
              return;
            }
            role = data.role || 'user';
          }
          
          if (currentUser.email === 'adityadake627@gmail.com' && currentUser.emailVerified) {
            role = 'admin';
          }
          
          setUserRole(role);
          
          if (role === 'admin' || role === 'staff') {
            setScreen('admin');
          } else {
            setScreen('home');
          }
        } catch (e) {
          console.error("Error checking user status", e);
          setScreen('home');
        }
      } else {
        setUserRole('user');
        setScreen('login');
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setLoginError('');
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === 'auth/popup-blocked') {
        setLoginError('तुमच्या ब्राउझरने पॉप-अप ब्लॉक केले आहे. कृपया पॉप-अपला परवानगी द्या आणि पुन्हा प्रयत्न करा.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setLoginError('हा डोमेन Firebase मध्ये अधिकृत (Authorized) नाही. कृपया Firebase Console मध्ये जाऊन हा डोमेन ॲड करा.');
      } else {
        setLoginError(error.message || 'लॉगिन करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
      }
    }
  };

  const handleStartQuiz = async (name: string, contact: string) => {
    setUserDetails(prev => ({ ...prev, name, contact }));
    if (user) {
      await saveUser(user.uid, name, contact);
    }
    setScreen('quiz');
  };

  const handleFinishQuiz = async (score: number, correct: number, wrong: number, total: number) => {
    setQuizResult({ score, correct, wrong, total });
    setScreen('result');
    
    if (user) {
      await saveResult({
        userId: user.uid,
        name: userDetails.name || user.displayName || 'User',
        score,
        totalQuestions: total,
        correctAnswers: correct,
        wrongAnswers: wrong
      });
    }
  };

  const handleFetchMoreQuestions = async (currentCount: number) => {
    const previousTexts = questions.map(q => q.text);
    const newQuestions = await generateQuestions(10, previousTexts);
    return newQuestions;
  };

  const handleRestart = () => {
    setQuestions(initialQuestions); // Reset to initial questions
    setScreen('home');
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="font-sans antialiased text-slate-900 bg-slate-50 min-h-screen selection:bg-indigo-500/30">
      {/* Top Navigation for authenticated users (only show on specific screens if needed) */}
      {user && !['login', 'quiz', 'home', 'profile'].includes(screen) && (
        <div className="absolute top-4 right-4 flex space-x-2 z-10">
          <ThemeToggle />
          <button
            onClick={() => setScreen('leaderboard')}
            className="flex items-center px-4 py-2 bg-indigo-600/20 text-indigo-600 hover:bg-indigo-600/30 rounded-xl font-medium transition-colors backdrop-blur-sm"
          >
            <Trophy className="w-4 h-4 mr-2" />
            लीडरबोर्ड
          </button>
          {userRole === 'admin' && screen !== 'admin' && (
            <button
              onClick={() => setScreen('admin')}
              className="flex items-center px-4 py-2 bg-rose-600/20 text-rose-600 hover:bg-rose-600/30 rounded-xl font-medium transition-colors backdrop-blur-sm"
            >
              <Shield className="w-4 h-4 mr-2" />
              ॲडमिन
            </button>
          )}
        </div>
      )}

      {screen === 'login' && (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-700/50 max-w-md w-full text-center"
          >
            <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
              <LogIn className="w-10 h-10 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome GK Knowledge Hub</h1>
            <p className="text-slate-400 mb-8">क्विझ सुरू करण्यासाठी कृपया लॉग इन करा.</p>
            
            {loginError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start text-left">
                <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{loginError}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center py-4 px-4 border border-slate-600 rounded-xl shadow-sm text-lg font-medium text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            >
              <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google सह लॉग इन करा
            </button>
          </motion.div>
        </div>
      )}

      {screen === 'home' && (
        <HomeScreen onNavigate={(s) => {
          if (s === 'quiz') {
            setUserDetails(prev => ({ 
              ...prev,
              name: user?.displayName || 'User', 
              contact: user?.email || '' 
            }));
            setScreen('quiz');
          }
          else setScreen(s as any);
        }} />
      )}

      {screen === 'profile' && (
        <ProfileScreen 
          onBack={() => setScreen('home')} 
          onLogout={() => setScreen('login')}
        />
      )}

      {screen === 'welcome' && <WelcomeScreen onStart={handleStartQuiz} onBack={() => setScreen('home')} />}
      
      {screen === 'quiz' && (
        loading ? (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <QuizScreen 
            questions={questions} 
            onFinish={handleFinishQuiz} 
            onFetchMore={handleFetchMoreQuestions}
            onBack={() => setScreen('home')}
          />
        )
      )}
      
      {screen === 'result' && (
        <ResultScreen 
          name={userDetails.name || user?.displayName || 'User'}
          contact={userDetails.contact}
          score={quizResult.score}
          correctAnswers={quizResult.correct}
          wrongAnswers={quizResult.wrong}
          totalQuestions={quizResult.total}
          onRestart={handleRestart}
        />
      )}

      {screen === 'leaderboard' && (
        <LeaderboardScreen onBack={() => setScreen('home')} />
      )}

      {screen === 'admin' && (userRole === 'admin' || userRole === 'staff') && (
        <AdminScreen userRole={userRole} onBack={() => setScreen('home')} />
      )}

      {screen === 'pdfs' && (
        <ContentListScreen type="pdf" onBack={() => setScreen('home')} />
      )}

      {screen === 'live-learning' && (
        <LiveLearningScreen onNavigate={(s) => setScreen(s as any)} onBack={() => setScreen('home')} />
      )}

      {screen === 'live-classes' && (
        <LiveClassesScreen user={user} onBack={() => setScreen('live-learning')} />
      )}

      {screen === 'videos' && (
        <VideosScreen onBack={() => setScreen('live-learning')} />
      )}

      {screen === 'papers' && (
        <ContentListScreen type="paper" onBack={() => setScreen('home')} />
      )}

      {/* Global Chatbot */}
      {user && <Chatbot />}
    </div>
  );
}
