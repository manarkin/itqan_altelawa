import { useState, useEffect } from 'react';
import { 
  User, 
  Session, 
  LeaderboardEntry, 
  SessionRequest, 
  AdminStats, 
  GlobalStudent, 
  GlobalTeacher 
} from './types';
import { 
  initialAnnouncements,
  initialSessions,
  initialLeaderboard,
  initialSessionRequests,
  initialAdminStats,
  initialAllStudents,
  initialAllTeachers,
  translations 
} from './data';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import MySession from './components/MySession';
import ControlPanel from './components/ControlPanel';
import Profile from './components/Profile';
import { About, Contact, Conditions, Success } from './components/StaticPages';
import Footer from './components/Footer';

export default function App() {
  // Lang state, initialized to ar (Arabic) to match SQU context, but easily toggleable!
  const [lang, setLang] = useState<'ar' | 'en'>(() => {
    const cached = localStorage.getItem('itqan_lang');
    return (cached as 'ar' | 'en') || 'ar';
  });

  const [currentView, setCurrentView] = useState<string>(() => {
    const cached = localStorage.getItem('itqan_view');
    return cached || 'home';
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Synchronized Data States
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('itqan_user');
    return cached ? JSON.parse(cached) : null;
  });

  const [sessions, setSessions] = useState<Session[]>(() => {
    const cached = localStorage.getItem('itqan_sessions');
    return cached ? JSON.parse(cached) : initialSessions;
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    const cached = localStorage.getItem('itqan_leaderboard');
    return cached ? JSON.parse(cached) : initialLeaderboard;
  });

  const [sessionRequests, setSessionRequests] = useState<SessionRequest[]>(() => {
    const cached = localStorage.getItem('itqan_requests');
    return cached ? JSON.parse(cached) : initialSessionRequests;
  });

  const [adminStats, setAdminStats] = useState<AdminStats>(() => {
    const cached = localStorage.getItem('itqan_stats');
    return cached ? JSON.parse(cached) : initialAdminStats;
  });

  const [showExamResults, setShowExamResults] = useState(false);

  // --- Effects for Storage Persistence & RTL toggling ---
  useEffect(() => {
    localStorage.setItem('itqan_lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('itqan_view', currentView);
  }, [currentView]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('itqan_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('itqan_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('itqan_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('itqan_leaderboard', JSON.stringify(leaderboard));
  }, [leaderboard]);

  useEffect(() => {
    localStorage.setItem('itqan_requests', JSON.stringify(sessionRequests));
  }, [sessionRequests]);

  useEffect(() => {
    localStorage.setItem('itqan_stats', JSON.stringify(adminStats));
  }, [adminStats]);


  // --- Helper Translation fetcher ---
  const t = () => translations[lang];

  // --- Login handler with rich initial data ---
  const handleLogin = (emailAddress: string) => {
    const lower = emailAddress.toLowerCase();
    
    if (lower.includes('admin')) {
      setUser({
        firstName: 'ريم',
        lastName: 'الخزيرية',
        role: 'ADMIN',
        email: emailAddress,
        isEnrolled: true,
        sessionId: '1',
        money: 50,
        absencesExcused: 1,
        absencesUnexcused: 0,
        gifts: [],
        avatar: 'https://picsum.photos/seed/admin_avatar/200/200'
      });
    } else if (lower.includes('teacher')) {
      setUser({
        firstName: 'مريم',
        lastName: 'الهنائية',
        role: 'TEACHER',
        email: emailAddress,
        isEnrolled: true,
        sessionId: '1',
        money: 0,
        absencesExcused: 0,
        absencesUnexcused: 0,
        gifts: [],
        avatar: 'https://picsum.photos/seed/coach/200/200'
      });
    } else {
      // SQU Student Aisha Al-Hinai with pass exams status teaser & coin chests
      setUser({
        firstName: 'عائشة',
        lastName: 'الهنائية',
        role: 'STUDENT',
        email: emailAddress,
        isEnrolled: true,
        sessionId: '1',
        phone: '+968 7766 5544',
        college: lang === 'ar' ? 'التربية' : 'Education',
        degree: 'Bachelor',
        cohort: '2022',
        isSenior: false,
        money: 450,
        absencesExcused: 1,
        absencesUnexcused: 0,
        gifts: [
          { id: 101, amount: 50, message: "تبارك الرحمن! تلاوتك متميزة هذا اليوم وعليك بالمداومة المستمرة.", isOpened: false, giftType: 'box' }
        ],
        examResults: {
          theory: 22, // Out of 25
          practical: 'PASS',
          averageTheory: 20
        },
        avatar: 'https://picsum.photos/seed/s4/100/100'
      });
    }

    setCurrentView('home');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('home');
  };

  const submitEnrollRequest = () => {
    // Submit student join request successfully
    if (user) {
      setUser(prev => prev ? { ...prev, isEnrolled: true } : null);
    }
    alert(lang === 'ar' ? 'تم إرسال طلب تلاوتك بنجاح وتقييم تمكينكِ بجدارة!' : 'Enrollment application submitted successfully!');
  };

  const viewExamResults = () => {
    setShowExamResults(true);
    setCurrentView('mysession');
  };

  // --- Dynamic Route Renderer ---
  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <Home 
            user={user} 
            announcements={initialAnnouncements} // general administration notes
            leaderboard={leaderboard}
            navigate={setCurrentView}
            lang={lang}
            submitEnrollRequest={submitEnrollRequest}
            viewExamResults={viewExamResults}
            t={t}
          />
        );
      case 'login':
        return (
          <Login 
            handleLogin={handleLogin} 
            navigate={setCurrentView} 
            lang={lang} 
            t={t} 
          />
        );
      case 'register':
        return (
          <Register 
            navigate={setCurrentView} 
            lang={lang} 
            t={t} 
          />
        );
      case 'mysession':
        if (!user) {
          setCurrentView('home');
          return null;
        }
        return (
          <MySession 
            user={user}
            sessions={sessions}
            setSessions={setSessions}
            leaderboard={leaderboard}
            setLeaderboard={setLeaderboard}
            setUser={setUser}
            lang={lang}
            showExamResults={showExamResults}
            setShowExamResults={setShowExamResults}
            t={t}
          />
        );
      case 'controlpanel':
        if (!user || user.role !== 'ADMIN') {
          setCurrentView('home');
          return null;
        }
        return (
          <ControlPanel 
            user={user}
            sessions={sessions}
            setSessions={setSessions}
            sessionRequests={sessionRequests}
            setSessionRequests={setSessionRequests}
            adminStats={adminStats}
            setAdminStats={setAdminStats}
            allStudents={initialAllStudents}
            allTeachers={initialAllTeachers}
            lang={lang}
            t={t}
          />
        );
      case 'profile':
        if (!user) {
          setCurrentView('home');
          return null;
        }
        return (
          <Profile 
            user={user} 
            setUser={setUser} 
            lang={lang} 
            t={t} 
          />
        );
      case 'about':
        return <About lang={lang} t={t} />;
      case 'contact':
        return <Contact lang={lang} t={t} />;
      case 'conditions':
        return <Conditions lang={lang} t={t} />;
      case 'success':
        return (
          <Success 
            navigate={setCurrentView} 
            lang={lang} 
            t={t} 
          />
        );
      default:
        return (
          <Home 
            user={user} 
            announcements={initialAnnouncements} 
            leaderboard={leaderboard}
            navigate={setCurrentView}
            lang={lang}
            submitEnrollRequest={submitEnrollRequest}
            viewExamResults={viewExamResults}
            t={t}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-brand-dark overflow-x-hidden pb-10">
      {/* Dynamic Navigation Head */}
      <Navbar 
        user={user}
        currentView={currentView}
        navigate={setCurrentView}
        lang={lang}
        toggleLanguage={() => setLang(prev => prev === 'en' ? 'ar' : 'en')}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        handleLogout={handleLogout}
        t={t}
      />

      {/* Main Container view with dynamic padding for top navbar safety */}
      <main className="flex-grow pt-28 pb-12 w-full max-w-7xl mx-auto px-4 sm:px-6 animate-fade-in">
        {renderContent()}
      </main>

      {/* Exquisite Central Islamic Medallion decorative bg illustration floating element */}
      <div className="fixed inset-0 pointer-events-none z-[-5] flex items-center justify-center opacity-[0.03] overflow-hidden">
        <svg 
          className="w-full h-full text-brand-primary animate-spin-slow max-w-[80vh] min-w-[300px]" 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 2"/>
          <path d="M50 2L55 35L88 20L70 50L100 65L65 65L80 98L50 80L20 98L35 65L0 65L30 50L12 20L45 35L50 2Z" stroke="currentColor" stroke-width="0.5"/>
          <circle cx="50" cy="50" r="15" stroke="currentColor" stroke-width="0.5"/>
        </svg>
      </div>

      {/* Unified footer */}
      <Footer 
        navigate={setCurrentView} 
        lang={lang} 
        t={t} 
      />
    </div>
  );
}
