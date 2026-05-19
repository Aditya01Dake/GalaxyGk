import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Question } from '../data/questions';

interface QuizScreenProps {
  questions: Question[];
  onFinish: (score: number, correct: number, wrong: number, total: number) => void;
  onFetchMore: (currentCount: number) => Promise<Question[]>;
  onBack: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({ questions: initialQuestions, onFinish, onFetchMore, onBack }) => {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (selectedOption !== null || showExplanation) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, selectedOption, showExplanation]);

  const handleTimeout = () => {
    setSelectedOption(-1); // -1 indicates timeout
    setScore((prev) => prev - 1); // -1 mark for timeout
    setWrongCount((prev) => prev + 1);
    setShowExplanation(true);
  };

  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null) return;
    
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOption(index);

    if (index === currentQuestion.correctAnswerIndex) {
      setScore((prev) => prev + 4);
      setCorrectCount((prev) => prev + 1);
      // Move to next question after a short delay if correct
      setTimeout(() => {
        handleNextQuestion();
      }, 1500);
    } else {
      setScore((prev) => prev - 1);
      setWrongCount((prev) => prev + 1);
      setShowExplanation(true);
    }
  };

  const handleNextQuestion = async () => {
    setSelectedOption(null);
    setShowExplanation(false);
    setTimeLeft(30);

    if (currentIndex + 1 >= questions.length) {
      setIsFetching(true);
      const newQs = await onFetchMore(questions.length);
      setIsFetching(false);
      
      if (newQs.length > 0) {
        setQuestions(prev => [...prev, ...newQs]);
        setCurrentIndex(prev => prev + 1);
      } else {
        // No more questions, finish quiz
        onFinish(score, correctCount, wrongCount, currentIndex + 1);
      }
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleFinishEarly = () => {
    onFinish(score, correctCount, wrongCount, currentIndex + (selectedOption !== null ? 1 : 0));
  };

  if (!currentQuestion) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center text-slate-400 hover:text-white transition-colors bg-slate-700/50 px-4 py-2 rounded-xl border border-slate-600"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              मागे जा
            </button>
            <div className="bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-xl font-mono text-lg font-bold border border-indigo-500/30">
              प्रश्न: {currentIndex + 1} / {questions.length}+
            </div>
            <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl font-mono text-lg font-bold border border-emerald-500/30 hidden sm:block">
              स्कोर: {score}
            </div>
          </div>
          
          <div className={`flex items-center px-4 py-2 rounded-xl font-mono text-xl font-bold border ${
            timeLeft <= 10 ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' : 'bg-slate-700/50 text-slate-300 border-slate-600'
          }`}>
            <Clock className="w-5 h-5 mr-2" />
            {timeLeft}s
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl border border-slate-700 mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-medium leading-relaxed mb-8 text-white">
              {currentQuestion.text}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => {
                let btnClass = "bg-slate-700/50 hover:bg-slate-600 border-slate-600 text-slate-200";
                let icon = null;

                if (selectedOption !== null) {
                  if (index === currentQuestion.correctAnswerIndex) {
                    btnClass = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
                    icon = <CheckCircle className="w-5 h-5 ml-auto" />;
                  } else if (index === selectedOption) {
                    btnClass = "bg-red-500/20 border-red-500 text-red-400";
                    icon = <XCircle className="w-5 h-5 ml-auto" />;
                  } else {
                    btnClass = "bg-slate-800 border-slate-700 text-slate-500 opacity-50";
                  }
                }

                return (
                  <motion.button
                    key={index}
                    whileHover={selectedOption === null ? { scale: 1.02 } : {}}
                    whileTap={selectedOption === null ? { scale: 0.98 } : {}}
                    onClick={() => handleOptionSelect(index)}
                    disabled={selectedOption !== null}
                    className={`flex items-center text-left p-4 rounded-2xl border-2 transition-all duration-200 text-lg ${btnClass}`}
                  >
                    <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mr-4 font-mono text-sm border border-slate-600">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                    {icon}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Explanation Modal/Section */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-indigo-900/40 border border-indigo-500/30 rounded-3xl p-6 mb-8 overflow-hidden"
            >
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-indigo-400 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-indigo-300 mb-2">स्पष्टीकरण:</h3>
                  <p className="text-indigo-100/80 leading-relaxed">
                    {currentQuestion.explanation}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleNextQuestion}
                  disabled={isFetching}
                  className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {isFetching ? 'पुढील प्रश्न लोड होत आहे...' : 'पुढील प्रश्न'}
                  {!isFetching && <ArrowRight className="w-5 h-5 ml-2" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Finish Early Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={handleFinishEarly}
            className="text-slate-500 hover:text-slate-300 text-sm underline underline-offset-4 transition-colors"
          >
            क्विझ थांबवा आणि निकाल पहा
          </button>
        </div>
      </div>
    </div>
  );
};
