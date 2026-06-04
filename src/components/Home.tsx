import { User, Announcement, LeaderboardEntry } from '../types';
import { Megaphone, Pin, Award, ScrollText, Medal, CheckCircle } from 'lucide-react';

interface HomeProps {
  user: User | null;
  announcements: Announcement[];
  leaderboard: LeaderboardEntry[];
  navigate: (view: string) => void;
  lang: 'ar' | 'en';
  submitEnrollRequest: () => void;
  viewExamResults: () => void;
  t: () => any;
}

export default function Home({
  user,
  announcements,
  leaderboard,
  navigate,
  lang,
  submitEnrollRequest,
  viewExamResults,
  t
}: HomeProps) {
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12 px-4 sm:px-6">
        <div className="mb-10 animate-fade-in">
          <h1 className="text-4xl sm:text-6xl font-black text-brand-dark mb-6 leading-tight">
            {t().heroTitle}
          </h1>
          <p className="text-2xl sm:text-3.5xl text-brand-accent mb-10 font-serif leading-loose px-4 max-w-2xl mx-auto">
            “{t().heroSubtitle}”
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            <button 
              className="px-8 py-4 bg-brand-primary text-white text-lg font-black rounded-2xl shadow-lg shadow-brand-primary/30 hover:bg-brand-accent hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer" 
              onClick={() => navigate('register')}
            >
              {t().getStarted}
            </button>
            <button 
              className="px-8 py-4 border-3 border-brand-primary text-brand-primary text-lg font-black rounded-2xl hover:bg-brand-neutral/50 hover:translate-y-0.5 transition-all duration-150 cursor-pointer bg-white shadow-xs" 
              onClick={() => navigate('login')}
            >
              {t().login}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Announcements & Exam results (8 columns) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Announcements Heading */}
          <div>
            <h4 className="text-xl sm:text-2xl font-black text-brand-dark flex items-center gap-3">
              <Megaphone className="text-brand-primary w-7 h-7" />
              {t().announcements}
            </h4>
          </div>

          {/* Announcements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {announcements.map((ann) => (
              <div 
                key={ann.id} 
                className="bg-white p-6 rounded-3xl border border-brand-primary/10 shadow-sm hover:-translate-y-1.5 hover:shadow-md hover:border-brand-primary/20 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-brand-neutral text-brand-primary/90 text-xs font-bold py-1.5 px-3 rounded-full border border-brand-primary/10 font-mono">
                    {ann.date}
                  </span>
                  <Pin className="text-amber-500 w-4.5 h-4.5" />
                </div>
                <p className="font-bold text-brand-dark text-[1.05rem] leading-relaxed mb-0">
                  {ann.text}
                </p>
              </div>
            ))}
          </div>

          {/* Exam Results Banner teaser if available */}
          {user.examResults && (
            <div className="bg-linear-to-br from-white to-amber-50/50 p-6 rounded-3xl border-2 border-brand-primary/25 shadow-md flex flex-col md:flex-row items-center gap-5 hover:border-brand-primary/40 transition-all duration-300">
              <div className="w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center text-brand-dark shadow-sm flex-shrink-0">
                <ScrollText className="w-8 h-8" />
              </div>
              <div className="flex-grow text-center md:text-start">
                <h4 className="text-lg font-black text-brand-dark mb-1">{t().examResults}</h4>
                <p className="text-sm text-gray-500 font-bold mb-0">{t().examResultsBody}</p>
              </div>
              <div className="w-full md:w-auto flex-shrink-0">
                <button 
                  className="w-full px-5 py-2.5 bg-brand-primary text-white text-sm font-black rounded-xl hover:bg-brand-accent transition-all duration-200 shadow-sm cursor-pointer"
                  onClick={viewExamResults}
                >
                  {t().viewResults}
                </button>
              </div>
            </div>
          )}

          {/* Registration Enrollment Status */}
          <div className="bg-brand-primary/5 border border-dashed border-brand-primary/30 p-8 rounded-3xl shadow-xs text-center md:text-start">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-brand-dark mb-2">{t().enrollRequest}</h3>
                <p className="text-gray-500 text-sm sm:text-base font-bold mb-0">{t().enrollSubtitle}</p>
              </div>
              <div className="w-full md:w-auto flex-shrink-0">
                {user.isEnrolled ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 font-black text-sm rounded-full border border-emerald-100 shadow-xs">
                    <CheckCircle className="w-4.5 h-4.5" />
                    {t().registered}
                  </span>
                ) : (
                  <button 
                    className="w-full px-6 py-3 bg-brand-primary text-white text-base font-black rounded-xl hover:bg-brand-accent transition-all duration-200 cursor-pointer shadow-md shadow-brand-primary/10" 
                    onClick={submitEnrollRequest}
                  >
                    {t().applyNow}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Leaderboard (4 columns) */}
        <div className="lg:col-span-4 select-none">
          <div className="bg-white rounded-3xl border border-brand-primary/10 shadow-lg overflow-hidden">
            <div className="bg-brand-primary px-6 py-5 flex items-center gap-3">
              <Medal className="text-brand-warm w-7 h-7 animate-bounce" />
              <h5 className="text-base font-black text-white uppercase tracking-wider mb-0">
                {t().leaderboard}
              </h5>
            </div>
            
            <div className="p-4 md:p-5 flex flex-col gap-3.5">
              {leaderboard.map((student, index) => (
                <div 
                  key={student.id} 
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-50 hover:border-brand-primary/20 hover:bg-brand-neutral/20 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Circle */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-xs ${
                      index === 0 
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' 
                        : index === 1 
                        ? 'bg-gradient-to-br from-slate-400 to-slate-500 text-white' 
                        : index === 2 
                        ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-white' 
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}>
                      {index + 1}
                    </div>
                    {/* Avatar */}
                    <img 
                      src={student.avatar} 
                      alt="" 
                      className="w-10 h-10 rounded-full border border-gray-100 shadow-xs flex-shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="font-bold text-brand-dark text-sm">
                      {student.name}
                    </div>
                  </div>
                  <div className="text-emerald-600 font-extrabold text-sm font-mono whitespace-nowrap">
                    🪙 {student.money}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
