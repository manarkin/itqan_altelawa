import { useState, useEffect } from 'react';
import { 
  User, 
  Session, 
  LeaderboardEntry, 
  SessionRequest, 
  AdminStats, 
  GlobalStudent, 
  GlobalTeacher,
  Semester 
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

  // New state added for semester management:
  const [semesters, setSemesters] = useState<Semester[]>(() => {
    const cached = localStorage.getItem('itqan_semesters');
    if (cached) return JSON.parse(cached);
    return [
      {
        id: 'fall_2026',
        title: 'الفصل الدراسي لخريف ٢٠٢٦ - نادي إتقان بجامعة السلطان قابوس',
        description: 'يسر نادي إتقان لتجويد وتحفيظ القرآن الكريم بجامعة السلطان قابوس الإعلان عن فتح باب رصد التوقيتات وتأكيد رغبات الجدول لكل الطالبات في المستويات للتسميع والحصر.',
        importantNotes: 'يرجى مواءمة خانات الوقت بدقة مع جدول محاضراتك الأكاديمي والعمل بالقنوات المناسبة لحلقاتك.',
        rules: 'الالتزام التام بالموعد المحدد للحلقات والمسارات، وضوابط الغياب بعذر مقبول بحد أقصى مرتين بالترم الدراسي.',
        announcementTime: '2026-05-01T08:00:00.000Z',
        stopRegistration: false,
        stopRegistrationTime: '2026-09-15T23:59:00.000Z'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('itqan_semesters', JSON.stringify(semesters));
  }, [semesters]);

  // Dynamic user data lists for admin and register coordination
  const [allStudents, setAllStudents] = useState<any[]>(() => {
    const cached = localStorage.getItem('itqan_all_students_v3');
    if (cached) return JSON.parse(cached);
    return [
      {
        firstName: 'أمل',
        fatherName: 'سليمان',
        grandfatherName: 'سعيد',
        lastName: 'الفارسية',
        role: 'STUDENT',
        phone: '96877665544',
        email: 'amal.farsi@student.squ.edu.om',
        studentId: 'SQU983742',
        level: 'متقدمة',
        college: 'Science',
        cohort: '2022',
        cardPicName: 'student_id_amal.jpg',
        voiceFileName: 'recitation_amal.mp3',
        approved: false,
        isNew: true,
        enrollmentDetails: {
          timings: {
            "Sunday_4:15-5:30": "selected",
            "Tuesday_4:15-5:30": "selected"
          }
        }
      },
      {
        firstName: 'زكية',
        fatherName: 'خلفان',
        grandfatherName: 'محمد',
        lastName: 'الهاشمية',
        role: 'STUDENT',
        phone: '96811223344',
        email: 'zakia.hashmi@student.squ.edu.om',
        studentId: 'SQU948211',
        level: 'مبتدئة',
        college: 'Arts',
        cohort: '2023',
        cardPicName: 'student_id_zakia.jpg',
        voiceFileName: 'recitation_zakia.mp3',
        approved: false,
        isNew: true,
        enrollmentDetails: {
          timings: {
            "Monday_10:00-11:15": "selected",
            "Wednesday_10:00-11:15": "selected"
          }
        }
      },
      {
        firstName: 'بسمة',
        fatherName: 'حمد',
        grandfatherName: 'علي',
        lastName: 'الراشدية',
        role: 'STUDENT',
        phone: '96855443322',
        email: 'basma.rashdi@student.squ.edu.om',
        studentId: 'SQU951034',
        level: 'تمهيدية',
        college: 'Engineering',
        cohort: '2021',
        cardPicName: 'student_id_basma.jpg',
        voiceFileName: 'recitation_basma.mp3',
        approved: false,
        isNew: true,
        enrollmentDetails: {
          timings: {
            "Sunday_4:15-5:30": "selected",
            "Tuesday_4:15-5:30": "selected"
          }
        }
      },
      {
        firstName: 'فاطمة',
        fatherName: 'عبدالله',
        grandfatherName: 'أحمد',
        lastName: 'العلوية',
        role: 'STUDENT',
        phone: '96899887766',
        email: 'fatima.alwi@student.squ.edu.om',
        studentId: 'SQU923847',
        level: 'غير مصنفة',
        college: 'Medicine',
        cohort: '2024',
        cardPicName: 'student_id_fatima.jpg',
        voiceFileName: 'recitation_fatima.mp3',
        approved: false,
        isNew: true,
        enrollmentDetails: {
          timings: {
            "Monday_10:00-11:15": "selected",
            "Wednesday_10:00-11:15": "selected"
          }
        }
      }
    ];
  });

  const [allTeachers, setAllTeachers] = useState<any[]>(() => {
    const cached = localStorage.getItem('itqan_all_teachers_v3');
    if (cached) return JSON.parse(cached);
    return [
      {
        firstName: 'مريم',
        fatherName: 'بدر',
        grandfatherName: 'صالح',
        lastName: 'الهنائية',
        role: 'TEACHER',
        phone: '96812345678',
        email: 'maryam.hinai@recitation.club',
        employeeId: 'EMP1003',
        level: 'مجازة',
        college: 'Education',
        approved: false,
        isNew: false,
        enrollmentDetails: {
          timings: {
            "Sunday_4:15-5:30": "selected",
            "Tuesday_4:15-5:30": "selected"
          }
        }
      },
      {
        firstName: 'سارة',
        fatherName: 'خميس',
        grandfatherName: 'جمعة',
        lastName: 'البلوشية',
        role: 'TEACHER',
        phone: '96887654321',
        email: 'sara.balushi@recitation.club',
        employeeId: 'EMP1004',
        level: 'طالبة اقراء',
        college: 'Arts',
        approved: false,
        isNew: false,
        enrollmentDetails: {
          timings: {
            "Monday_10:00-11:15": "selected",
            "Wednesday_10:00-11:15": "selected"
          }
        }
      }
    ];
  });

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

  useEffect(() => {
    localStorage.setItem('itqan_all_students_v3', JSON.stringify(allStudents));
  }, [allStudents]);

  useEffect(() => {
    localStorage.setItem('itqan_all_teachers_v3', JSON.stringify(allTeachers));
  }, [allTeachers]);


  // --- Helper Translation fetcher ---
  const t = () => translations[lang];

  // --- Login handler with rich initial data ---
  const handleLogin = (emailAddress: string, passwordInput?: string) => {
    const lower = emailAddress.toLowerCase();
    
    // Check if there is a custom registered user in local storage
    const customRegisteredStr = localStorage.getItem('registered_user_' + lower);
    if (customRegisteredStr) {
      const parsed = JSON.parse(customRegisteredStr);
      if (passwordInput && parsed.password && parsed.password !== passwordInput) {
        alert(lang === 'ar' ? 'كلمة المرور غير صحيحة!' : 'Incorrect password!');
        return;
      }
      setUser(parsed);
      setCurrentView('home');
      return;
    }
    
    // Check if there is a modified user object in localStorage for itqan_user
    const savedUserStr = localStorage.getItem('itqan_user');
    if (savedUserStr) {
      const parsedSaved = JSON.parse(savedUserStr);
      if (parsedSaved.email && parsedSaved.email.toLowerCase() === lower) {
        if (passwordInput && parsedSaved.password && parsedSaved.password !== passwordInput) {
          alert(lang === 'ar' ? 'كلمة المرور غير صحيحة!' : 'Incorrect password!');
          return;
        }
        setUser(parsedSaved);
        setCurrentView('home');
        return;
      }
    }

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
        avatar: 'https://picsum.photos/seed/admin_avatar/200/200',
        password: '123'
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
        avatar: 'https://picsum.photos/seed/coach/200/200',
        password: '123'
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
        avatar: 'https://picsum.photos/seed/s4/100/100',
        password: '123'
      });
    }

    setCurrentView('home');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('home');
  };

  const submitEnrollRequest = (details?: any, semesterId?: string) => {
    // Submit student join request successfully
    if (user) {
      const updatedDetails = { ...details, semesterId };
      setUser(prev => {
        if (!prev) return null;
        const updated = { ...prev, isEnrolled: true, enrollmentDetails: updatedDetails };
        localStorage.setItem('itqan_user', JSON.stringify(updated));
        return updated;
      });

      // Also ensure that the admin observes actual timing coordinates in directory collection
      if (user.role === 'TEACHER') {
        setAllTeachers(prev => {
          const arr = prev.map(t => t.email === user.email ? { ...t, isEnrolled: true, enrollmentDetails: updatedDetails } : t);
          return arr;
        });
      } else {
        setAllStudents(prev => {
          const arr = prev.map(s => s.email === user.email ? { ...s, isEnrolled: true, enrollmentDetails: updatedDetails } : s);
          return arr;
        });
      }
    }
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
            setUser={setUser}
            t={t}
            semesters={semesters}
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
            setUser={setUser}
            setAllStudents={setAllStudents}
            setAllTeachers={setAllTeachers}
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
            setUser={setUser}
            sessions={sessions}
            setSessions={setSessions}
            sessionRequests={sessionRequests}
            setSessionRequests={setSessionRequests}
            adminStats={adminStats}
            setAdminStats={setAdminStats}
            allStudents={allStudents}
            allTeachers={allTeachers}
            setAllStudents={setAllStudents}
            setAllTeachers={setAllTeachers}
            lang={lang}
            t={t}
            semesters={semesters}
            onUpdateSemesters={setSemesters}
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
            setUser={setUser}
            t={t}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-brand-dark overflow-x-hidden">
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
          <path d="M50 2L55 35L88 20L70 50L100 65L65 65L80 98L50 80L20 98L35 65L0 65L30 50L12 20L45 35L50 2Z" stroke="currentColor" strokeWidth="0.5"/>
          <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="0.5"/>
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
