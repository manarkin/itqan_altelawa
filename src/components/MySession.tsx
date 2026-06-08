import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Session, 
  SessionStudent, 
  Announcement,
  Gift
} from '../types';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Pencil, 
  Users, 
  Info, 
  Gift as GiftIcon, 
  Trash2, 
  Plus, 
  Megaphone,
  PlayCircle,
  ExternalLink,
  FileText,
  CheckCircle,
  X,
  Award,
  BookOpen,
  MessageSquare,
  AlertCircle,
  ScrollText,
  ChevronLeft
} from 'lucide-react';

interface MySessionProps {
  user: User;
  sessions: Session[];
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  leaderboard: any[];
  setLeaderboard: React.Dispatch<React.SetStateAction<any[]>>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  lang: 'ar' | 'en';
  showExamResults: boolean;
  setShowExamResults: (show: boolean) => void;
  t: () => any;
}

export default function MySession({
  user,
  sessions,
  setSessions,
  leaderboard,
  setLeaderboard,
  setUser,
  lang,
  showExamResults,
  setShowExamResults,
  t
}: MySessionProps) {
  // Filter sessions for current user (past and present)
  const userSessions = sessions.filter(s => {
    if (user.role === 'ADMIN') return true;
    if (user.role === 'TEACHER') {
      return s.teacher.name.includes(user.firstName) || s.teacher.name.includes(user.lastName);
    }
    // Student: match name or email, or s.id === user.sessionId
    return s.id === user.sessionId || s.students.some(stud => 
      stud.name === `${user.firstName} ${user.lastName}` || 
      stud.email?.toLowerCase() === user.email.toLowerCase()
    );
  });

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (showExamResults && user.sessionId) {
      setSelectedSessionId(user.sessionId);
    }
  }, [showExamResults, user.sessionId]);

  const session = sessions.find(s => s.id === selectedSessionId) || sessions.find(s => s.id === user.sessionId) || sessions[0];
  const isTeacher = user.role === 'TEACHER' || user.role === 'ADMIN';
  const announcements = session.announcements || [];

  // Local UI States
  const [activeInfoStudent, setActiveInfoStudent] = useState<SessionStudent | null>(null);
  const [giftModalStudentId, setGiftModalStudentId] = useState<string | null>(null);
  const [editField, setEditField] = useState<{ field: 'name' | 'location' | 'themeColor' | 'themePhoto'; value: string } | null>(null);
  const [tempColor, setTempColor] = useState('#7C3AED');
  const [tempPhoto, setTempPhoto] = useState('');
  const [newAnnouncementModal, setNewAnnouncementModal] = useState(false);

  // Sync edits when active session changes or when editField opens
  useEffect(() => {
    if (editField && editField.field === 'themeColor') {
      setTempColor(session.themeColor || '#7C3AED');
      setTempPhoto(session.themePhoto || '');
    }
  }, [editField, session]);

  // States for making new announcement
  const [annText, setAnnText] = useState('');
  const [annType, setAnnType] = useState<'text' | 'image' | 'video' | 'link' | 'pdf' | 'poll'>('text');
  const [annAttachment, setAnnAttachment] = useState('');

  // States for sending gift
  const [giftType, setGiftType] = useState<'box' | 'package' | 'envelope' | 'piggy'>('box');
  const [giftAmount, setGiftAmount] = useState(10);
  const [giftMessage, setGiftMessage] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showExamResults && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [showExamResults]);

  // --- Handlers ---

  const handleOpenGift = (giftId: number) => {
    // Collect gift
    setUser(prevUser => {
      if (!prevUser) return null;
      const targetGift = prevUser.gifts.find(g => g.id === giftId);
      if (targetGift && !targetGift.isOpened) {
        const updatedGifts = prevUser.gifts.map(g => g.id === giftId ? { ...g, isOpened: true } : g);
        const addedAmount = targetGift.amount;

        // sync global session representation student object as well
        setSessions(prevSessions => prevSessions.map(sess => {
          if (sess.id === prevUser.sessionId) {
            return {
              ...sess,
              students: sess.students.map(stud => {
                if (stud.name === `${prevUser.firstName} ${prevUser.lastName}`) {
                  return { ...stud, money: stud.money + addedAmount };
                }
                return stud;
              })
            };
          }
          return sess;
        }));

        // sync leaderboard
        setLeaderboard(prevL => prevL.map(item => {
          if (item.name === `${prevUser.firstName} ${prevUser.lastName}`) {
            return { ...item, money: item.money + addedAmount };
          }
          return item;
        }));

        return {
          ...prevUser,
          money: prevUser.money + addedAmount,
          gifts: updatedGifts
        };
      }
      return prevUser;
    });
  };

  const handleEditSessionField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editField) return;

    setSessions(prev => prev.map(s => {
      if (s.id === session.id) {
        if (editField.field === 'themeColor') {
          return {
            ...s,
            themeColor: tempColor,
            themePhoto: tempPhoto
          };
        }
        return {
          ...s,
          [editField.field]: editField.value
        };
      }
      return s;
    }));

    setEditField(null);
  };

  const handleChangeStudentAbsence = (studentId: string, type: 'excused' | 'unexcused', offset: number) => {
    setSessions(prev => prev.map(s => {
      if (s.id === session.id) {
        return {
          ...s,
          students: s.students.map(student => {
            if (student.id === studentId) {
              const prevExcused = student.absencesExcused || 0;
              const prevUnexcused = student.absencesUnexcused || 0;
              const nextExcused = type === 'excused' ? Math.max(0, prevExcused + offset) : prevExcused;
              const nextUnexcused = type === 'unexcused' ? Math.max(0, prevUnexcused + offset) : prevUnexcused;

              // If updating current logged in student
              if (user.role === 'STUDENT' && student.name === `${user.firstName} ${user.lastName}`) {
                setUser(prevU => prevU ? { ...prevU, absencesExcused: nextExcused, absencesUnexcused: nextUnexcused } : null);
              }

              return {
                ...student,
                absencesExcused: nextExcused,
                absencesUnexcused: nextUnexcused
              };
            }
            return student;
          })
        };
      }
      return s;
    }));
  };

  const handleDeleteStudent = (studentId: string) => {
    const isAr = lang === 'ar';
    const confirmMsg = isAr 
      ? 'هل أنتِ متأكدة من حذف هذه الطالبة من الحلقة؟' 
      : 'Are you sure you want to remove this student from the session?';

    if (window.confirm(confirmMsg)) {
      setSessions(prev => prev.map(s => {
        if (s.id === session.id) {
          return {
            ...s,
            students: s.students.filter(stud => stud.id !== studentId)
          };
        }
        return s;
      }));
    }
  };

  const handleDeleteAnnouncement = (annId: string) => {
    const isAr = lang === 'ar';
    const confirmMsg = isAr 
      ? 'هل أنتِ متأكدة من حذف هذا الإعلان؟' 
      : 'Are you sure you want to delete this announcement?';

    if (window.confirm(confirmMsg)) {
      setSessions(prev => prev.map(s => {
        if (s.id === session.id) {
          return {
            ...s,
            announcements: s.announcements.filter(ann => ann.id !== annId)
          };
        }
        return s;
      }));
    }
  };

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annText) return;

    const newAnn: Announcement = {
      id: Date.now().toString(),
      text: annText,
      type: annType,
      attachment: annType === 'pdf' ? '#' : annAttachment,
      date: new Date().toISOString().split('T')[0],
      author: user.firstName + ' ' + user.lastName,
      pollOptions: annType === 'poll' ? [
        { id: 1, text: lang === 'ar' ? 'الخيار الأول' : 'Option One', votes: 0 },
        { id: 2, text: lang === 'ar' ? 'الخيار الثاني' : 'Option Two', votes: 0 }
      ] : undefined
    };

    setSessions(prev => prev.map(s => {
      if (s.id === session.id) {
        return {
          ...s,
          announcements: [newAnn, ...s.announcements]
        };
      }
      return s;
    }));

    // Reset Form
    setAnnText('');
    setAnnType('text');
    setAnnAttachment('');
    setNewAnnouncementModal(false);
  };

  const handleVotePoll = (annId: string, optionId: number) => {
    setSessions(prev => prev.map(s => {
      if (s.id === session.id) {
        return {
          ...s,
          announcements: s.announcements.map(ann => {
            if (ann.id === annId && !ann.voted) {
              return {
                ...ann,
                voted: optionId,
                pollOptions: ann.pollOptions?.map(opt => 
                  opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
                )
              };
            }
            return ann;
          })
        };
      }
      return s;
    }));
  };

  const handleSendGift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftModalStudentId) return;

    setSessions(prev => prev.map(s => {
      if (s.id === session.id) {
        return {
          ...s,
          students: s.students.map(stud => {
            if (stud.id === giftModalStudentId) {
              const newGift: Gift = {
                id: Date.now(),
                amount: giftAmount,
                message: giftMessage,
                giftType: giftType,
                isOpened: false
              };

              // Check if the recipient student is actually current logged-in user
              if (user.role === 'STUDENT' && stud.name === `${user.firstName} ${user.lastName}`) {
                setUser(prevU => prevU ? { ...prevU, gifts: [newGift, ...prevU.gifts] } : null);
              } else {
                // If it is another student in the teacher's list, simulate their gold coin addition automatically
                stud.money += giftAmount;
                // Sync leaderboard
                setLeaderboard(prevL => prevL.map(item => 
                  item.name === stud.name ? { ...item, money: item.money + giftAmount } : item
                ));
              }

              return {
                ...stud,
                gifts: [newGift, ...(stud.gifts || [])]
              };
            }
            return stud;
          })
        };
      }
      return s;
    }));

    alert(lang === 'ar' ? 'تم إرسال الجائزة بنجاح!' : 'Gift sent successfully close!');
    setGiftModalStudentId(null);
    setGiftMessage('');
    setGiftAmount(10);
    setGiftType('box');
  };

  // Helper selectors for chest icon styles
  const renderGiftBox = (gift: Gift) => {
    switch (gift.giftType) {
      case 'package':
        return (
          <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center relative shadow-sm cursor-pointer select-none">
            <div className="absolute w-1 h-full left-1/2 -translate-x-1/2 bg-black/15"></div>
            <div className="absolute h-1 w-full top-1/2 -translate-y-1/2 bg-black/15"></div>
            <GiftIcon className="text-white relative z-10 w-8 h-8" />
          </div>
        );
      case 'envelope':
        return (
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg flex items-center justify-center relative shadow-sm cursor-pointer select-none">
            <div className="absolute w-4 h-4 bg-red-600 rounded-full border border-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"></div>
            <GiftIcon className="text-white relative z-10 w-8 h-8" />
          </div>
        );
      case 'piggy':
        return (
          <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center relative shadow-sm cursor-pointer select-none">
            <div className="absolute w-6 h-1 bg-slate-600 top-3 rounded-full left-1/2 -translate-x-1/2"></div>
            <GiftIcon className="text-white relative z-10 w-8 h-8" />
          </div>
        );
      case 'box':
      default:
        return (
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center relative shadow-md shadow-red-500/20 cursor-pointer select-none transition-transform duration-300 hover:rotate-2 hover:scale-105">
            <div className="absolute w-3 h-full bg-amber-400"></div>
            <div className="absolute h-3 w-full bg-amber-400"></div>
            <GiftIcon className="text-white relative z-10 w-8 h-8" />
          </div>
        );
    }
  };

  const getGiftName = (type: string) => {
    if (lang === 'ar') {
      switch (type) {
        case 'box': return 'علبة هدايا عصرية';
        case 'package': return 'طرد بريدي ورقي';
        case 'envelope': return 'مظروف رسائل تشجيعي';
        case 'piggy': return 'حصالة توفير نقدية';
        default: return 'هدية تشجيعية';
      }
    } else {
      switch (type) {
        case 'box': return 'Gift Box';
        case 'package': return 'Cardboard Package';
        case 'envelope': return 'Encouraging Letter';
        case 'piggy': return 'Piggy Bank';
        default: return 'Incentive Reward';
      }
    }
  };

  if (selectedSessionId === null) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 animate-fade-in select-none">
        {/* Header */}
        <div className="text-center mb-12 select-none">
          <h1 className="text-3xl sm:text-5xl font-black text-brand-dark mb-4">
            {lang === 'ar' ? 'سجل حلقاتي القرآني' : 'My Quranic Sessions'}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 font-bold max-w-xl mx-auto">
            {lang === 'ar' 
              ? 'تتبعي حِلق التلاوة المقيدة بها حالياً وتاريخ مشاركاتكِ المشرّفة للفصول السابقة.' 
              : 'Browse your active and past physical or digital Quran recitation circles.'}
          </p>
        </div>

        {/* Sessions Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {userSessions.map(s => (
            <div 
              key={s.id}
              onClick={() => setSelectedSessionId(s.id)}
              className="relative bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group text-start flex flex-col justify-between min-h-[300px]"
              style={{ borderColor: s.themeColor ? `${s.themeColor}35` : undefined }}
            >
              {/* Left/Start accent strip of chosen color */}
              <div className="absolute top-0 bottom-0 start-0 w-2.5 z-20" style={{ backgroundColor: s.themeColor || '#7C3AED' }}></div>
              
              {/* Theme Photo Banner */}
              {s.themePhoto ? (
                <div className="h-28 w-full relative overflow-hidden bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${s.themePhoto})` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
                  <div className="absolute inset-0 opacity-20" style={{ backgroundColor: s.themeColor || '#7C3AED' }} />
                </div>
              ) : (
                <div className="h-6 w-full shrink-0" style={{ backgroundColor: s.themeColor ? `${s.themeColor}10` : '#7C3AED10' }} />
              )}

              <div className="p-5 ps-8 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <span 
                    className="text-[0.65rem] font-black uppercase tracking-wider px-2.5 py-1 rounded-full" 
                    style={{ 
                      backgroundColor: s.themeColor ? `${s.themeColor}15` : '#7C3AED15', 
                      color: s.themeColor || '#7C3AED' 
                    }}
                  >
                    {s.isPast ? (lang === 'ar' ? 'حلقة سابقة' : 'Past Completed') : (lang === 'ar' ? 'حلقة نشطة' : 'Active Current')}
                  </span>
                  <span className="text-xs font-black px-2.5 py-1 bg-gray-100 rounded-full text-gray-500">
                    {lang === 'ar' ? t()[s.level.toLowerCase()] || s.level : s.level}
                  </span>
                </div>
                
                <h3 className="text-xl font-black text-brand-dark mb-2.5 group-hover:text-brand-primary transition-colors">
                  {s.name}
                </h3>
                
                <p className="text-sm font-bold text-gray-500 mb-6 flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">{lang === 'ar' ? 'المعقّدة الأستاذة:' : 'Teacher:'}</span>
                  <span className="text-brand-dark font-black">{s.teacher.name}</span>
                </p>

                <div className="space-y-2.5 pt-1 text-xs font-bold text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{s.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{s.location}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/50 border-t border-gray-100 p-4 ps-8 flex items-center justify-between text-xs font-black">
                <div className="flex items-center gap-1.5 font-bold" style={{ color: s.themeColor || '#7C3AED' }}>
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>{s.students.length} {lang === 'ar' ? 'طالبات مقيدات' : 'Students'}</span>
                </div>
                <span className="font-extrabold flex items-center gap-1 text-brand-primary group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1" style={{ color: s.themeColor || '#7C3AED' }}>
                  {lang === 'ar' ? 'دخول الحلقة ➔' : 'View Session ➔'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const themeColor = session.themeColor || '#7C3AED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 active-session-container">
      {/* Dynamic Theme color style overrides */}
      <style>{`
        .active-session-container .bg-brand-primary { background-color: ${themeColor} !important; }
        .active-session-container .text-brand-primary { color: ${themeColor} !important; }
        .active-session-container .border-brand-primary { border-color: ${themeColor} !important; }
        .active-session-container .border-brand-primary\\/10 { border-color: ${themeColor}1a !important; }
        .active-session-container .border-brand-primary\\/15 { border-color: ${themeColor}26 !important; }
        .active-session-container .border-brand-primary\\/25 { border-color: ${themeColor}40 !important; }
        .active-session-container .bg-brand-neutral { background-color: ${themeColor}0e !important; }
        .active-session-container .bg-brand-neutral\\/10 { background-color: ${themeColor}1a !important; }
        .active-session-container .bg-brand-neutral\\/20 { background-color: ${themeColor}33 !important; }
        .active-session-container .text-brand-accent { color: ${themeColor} !important; }
        .active-session-container .hover\\:bg-brand-accent:hover { background-color: ${themeColor}dd !important; }
        .active-session-container .hover\\:border-brand-primary\\/30:hover { border-color: ${themeColor}4d !important; }
        .active-session-container .focus\\:border-brand-primary:focus { border-color: ${themeColor} !important; }
        .active-session-container .shadow-brand-primary\\/10 { box-shadow: 0 4px 6px -1px ${themeColor}1a, 0 2px 4px -2px ${themeColor}1a !important; }
      `}</style>

      {/* Back button to go back to all user sessions */}
      <div className="mb-6 flex justify-start select-none">
        <button
          onClick={() => {
            setSelectedSessionId(null);
            setShowExamResults(false);
          }}
          className="px-4 py-2 bg-white border border-brand-primary/10 hover:border-brand-primary/20 text-brand-primary hover:text-brand-accent rounded-2xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer group"
        >
          <ChevronLeft className="w-4.5 h-4.5 transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5" />
          <span>{lang === 'ar' ? 'العودة لجميع الحلقات' : 'Back to All Sessions'}</span>
        </button>
      </div>

      {/* Teacher Session details header */}
      <div className="bg-white rounded-3xl border border-brand-primary/10 shadow-sm overflow-hidden mb-8" style={{ borderColor: session.themeColor ? `${session.themeColor}30` : undefined }}>
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Theme Photo / Card Cover */}
          <div className="md:col-span-3 min-h-[220px] relative flex flex-col items-center justify-center p-6 text-center text-white select-none overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: session.themePhoto ? `url(${session.themePhoto})` : undefined, backgroundColor: session.themeColor || '#8B5CF6' }}>
            {/* Color Overlay to ensure readability and contrast */}
            <div className="absolute inset-0 bg-brand-dark/50" />
            <div className="absolute inset-0 mix-blend-overlay opacity-40" style={{ backgroundColor: session.themeColor || '#8B5CF6' }} />
            
            {/* Elegant Minimal Ornate Badge Frame instead of profile picture */}
            <div className="relative z-10 w-16 h-16 rounded-full border-2 border-white/40 flex items-center justify-center bg-white/10 backdrop-blur-md mb-3 shadow-sm">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            
            <div className="relative z-10 px-4">
              <h4 className="text-lg sm:text-xl font-black mb-1.5 tracking-tight leading-tight">{session.teacher.name}</h4>
              <span className="text-[0.65rem] font-black tracking-widest uppercase bg-white/20 text-white py-1 px-3.5 rounded-full border border-white/20 backdrop-blur-md">
                {t().coach}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-9 p-6 md:p-8 flex flex-col justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">
                  {t().sessionName}
                </label>
                <div className="text-xl font-bold text-brand-dark flex flex-wrap items-center gap-2">
                  <span>{session.name}</span>
                  <div className="flex gap-1.5 items-center">
                    {isTeacher && (
                      <>
                        <Pencil 
                          className="w-4 h-4 text-gray-400 hover:text-brand-primary cursor-pointer transition-colors" 
                          onClick={() => setEditField({ field: 'name', value: session.name })}
                        />
                        <button 
                          onClick={() => setEditField({ field: 'themeColor', value: session.themeColor || '#7C3AED' })}
                          className="p-1 px-2.5 rounded-full text-[0.65rem] font-black border bg-slate-50 text-gray-500 hover:bg-white hover:text-brand-primary hover:border-brand-primary/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
                        >
                          <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-3xs border border-white" style={{ backgroundColor: session.themeColor || '#7C3AED' }}></span>
                          <span>{lang === 'ar' ? 'تعديل لون المظهر' : 'Edit Theme'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="sm:text-end">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">
                  {t().level}
                </label>
                <span className="inline-block bg-brand-warm/15 text-brand-dark/95 border border-brand-warm/35 text-xs font-bold py-1 px-3 rounded-full">
                  {lang === 'ar' ? t()[session.level.toLowerCase()] || session.level : session.level}
                </span>
              </div>
            </div>

            <hr className="my-5 border-gray-100" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-neutral/80 rounded-xl flex items-center justify-center text-brand-primary flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <small className="text-xs text-gray-400 font-bold block">{t().sessionLocation}</small>
                  <div className="font-bold text-brand-dark flex items-center gap-1.5 text-sm">
                    <span>{session.location}</span>
                    {isTeacher && (
                      <Pencil 
                        className="w-3.5 h-3.5 text-gray-400 hover:text-brand-primary cursor-pointer" 
                        onClick={() => setEditField({ field: 'location', value: session.location })}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-neutral/80 rounded-xl flex items-center justify-center text-brand-primary flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <small className="text-xs text-gray-400 font-bold block">{t().academicYear}</small>
                  <span className="font-bold text-brand-dark text-sm">{session.time}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-neutral/80 rounded-xl flex items-center justify-center text-brand-primary flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <small className="text-xs text-gray-400 font-bold block">{t().sessionPhone}</small>
                  <span className="font-bold text-brand-dark font-mono text-sm tracking-tight">{session.teacher.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Session Mates section for STUDENTS */}
      {!isTeacher && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-brand-primary/10 shadow-sm mb-8 text-start">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary flex-shrink-0">
              <Users className="w-5.5 h-5.5" />
            </div>
            <div>
              <h4 className="text-lg font-black text-brand-dark">
                {lang === 'ar' ? 'زميلات وبنات حلقة التلاوة المرافقة' : 'My Recitation Session Mates'}
              </h4>
              <p className="text-xs text-gray-400 font-bold mb-0">
                {lang === 'ar' 
                  ? 'قائمة أسماء الطالبات المسجلات معكِ في نفس حلقة التلاوة بنادي مسك بجامعة السلطان قابوس.' 
                  : 'A list of SQU student partners registered in your current recitation circle.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {session.students.map((stud) => (
              <div 
                key={stud.id} 
                className="p-3.5 bg-slate-50 border border-gray-100 rounded-xl font-black text-brand-dark flex items-center gap-2.5 text-sm"
              >
                <div className="w-2.5 h-2.5 bg-brand-primary rounded-full" />
                <span>{stud.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TEACHER Management Roster for Students */}
      {isTeacher && (
        <div className="bg-white rounded-3xl border border-brand-primary/10 shadow-sm p-6 sm:p-8 mb-8 text-start">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 bg-brand-primary text-white rounded-2xl flex items-center justify-center shadow-md shadow-brand-primary/10 flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg sm:text-xl font-black text-brand-dark">
                {lang === 'ar' ? 'سجل تفاصيل الطالبات المقيدات بالحلقة' : 'Registered Student Directory'}
              </h4>
              <p className="text-xs sm:text-sm text-gray-400 font-bold mb-0">
                {lang === 'ar' 
                  ? 'استعراض بيانات الطالبات بالتفصيل وتخصصاتهن الدراسية وأرقام هواتفهن بنادي مسك بجامعة السلطان قابوس.' 
                  : 'View comprehensive student academic streams, contacts, and personal level details.'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-xs font-black uppercase tracking-wider text-end select-none">
                  <th className={`pb-3 py-2 text-start ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{lang === 'ar' ? 'الطالبة' : 'Student'}</th>
                  <th className={`pb-3 py-2 text-start ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{lang === 'ar' ? 'الكلية والأكاديميا' : 'College & Stream'}</th>
                  <th className={`pb-3 py-2 text-start ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{lang === 'ar' ? 'الهاتف' : 'Phone'}</th>
                  <th className={`pb-3 py-2 text-start ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{lang === 'ar' ? 'الدفعة' : 'Cohort'}</th>
                  <th className={`pb-3 py-2 text-end ${lang === 'ar' ? 'text-left' : 'text-right'}`}>{lang === 'ar' ? 'البيانات' : 'Profile'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {session.students.map((stud) => (
                  <tr key={stud.id} className="hover:bg-brand-neutral/10 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={stud.avatar} 
                          alt="" 
                          className="w-10 h-10 rounded-full border border-gray-150 flex-shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-extrabold text-brand-dark leading-snug">{stud.name}</div>
                          <div className="text-xs text-gray-400 font-mono tracking-tight">{stud.email || `${stud.id}@student.squ.edu.om`}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 text-start font-bold text-gray-600">
                      🎓 {stud.college || (lang === 'ar' ? 'كلية التربية' : 'Education')}
                    </td>

                    <td className="py-4 text-start font-mono text-gray-600">
                      📱 {stud.phone || '+968 9345 6789'}
                    </td>

                    <td className="py-4 text-start font-bold text-gray-500">
                      🆔 Cohort {stud.cohort || '2022'}
                    </td>

                    <td className="py-4 text-end">
                      <div className={`flex flex-wrap items-center gap-2 ${lang === 'ar' ? 'justify-start' : 'justify-end'}`}>
                        {/* Profile Card Trigger */}
                        <button 
                          className="px-2.5 py-1.5 rounded-lg border border-gray-150 hover:bg-gray-50 text-gray-500 font-bold flex items-center gap-1.5 text-xs transition-all cursor-pointer"
                          onClick={() => setActiveInfoStudent(stud)}
                        >
                          <Info className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'عرض البيانات' : 'Profile'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Inline Section Field Editor modal */}
      {editField && (
        <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-brand-primary/15 shadow-2xl w-full max-w-md text-start animate-fade-in">
            <h4 className="text-lg font-black mb-4 text-brand-dark">
              {editField.field === 'name' 
                ? t().sessionName 
                : editField.field === 'location' 
                  ? t().sessionLocation 
                  : (lang === 'ar' ? 'تصميم مظهر ولون حلقة التلاوة' : 'Recitation Session Theme Settings')}
            </h4>
            <form onSubmit={handleEditSessionField}>
              <div className="mb-6">
                {editField.field === 'themeColor' ? (
                  <div className="space-y-4">
                    {/* Header accent info */}
                    <div className="p-3 bg-slate-50 border border-gray-100 rounded-2xl flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tempColor }}></div>
                      <span className="text-xs font-black text-gray-700">
                        {lang === 'ar' ? 'معاينة المظهر النشط' : 'Theme Customization Preview'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 font-bold mb-1">
                      {lang === 'ar' 
                        ? '١. اختر لون مظهر مخصص لبطاقة حلقة التلاوة:' 
                        : '1. Select a customized style color accent for this recitation session:'}
                    </p>
                    <div className="grid grid-cols-4 gap-2.5">
                      {[
                        { color: '#7C3AED', name: lang === 'ar' ? 'بنفسجي' : 'Purple' },
                        { color: '#059669', name: lang === 'ar' ? 'أخضر' : 'Green' },
                        { color: '#D97706', name: lang === 'ar' ? 'عسلي' : 'Amber' },
                        { color: '#2563EB', name: lang === 'ar' ? 'أزرق' : 'Blue' },
                        { color: '#DB2777', name: lang === 'ar' ? 'وردي' : 'Pink' },
                        { color: '#DC2626', name: lang === 'ar' ? 'أحمر' : 'Red' },
                        { color: '#0891B2', name: lang === 'ar' ? 'سيان' : 'Cyan' },
                        { color: '#4B5563', name: lang === 'ar' ? 'رمادي' : 'Slate' }
                      ].map(item => (
                        <button
                          key={item.color}
                          type="button"
                          onClick={() => setTempColor(item.color)}
                          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border-2 transition-all cursor-pointer ${
                            tempColor === item.color 
                              ? 'border-brand-primary bg-brand-primary/5' 
                              : 'border-transparent bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <span className="w-6 h-6 rounded-full inline-block shadow-3xs" style={{ backgroundColor: item.color }}></span>
                          <span className="text-[0.6rem] font-bold text-gray-500">{item.name}</span>
                        </button>
                      ))}
                    </div>
                    {/* Color picker */}
                    <div className="flex items-center gap-3 bg-gray-50/50 p-2 border border-gray-150 rounded-2xl">
                      <input 
                        type="color" 
                        value={tempColor}
                        onChange={(e) => setTempColor(e.target.value)}
                        className="w-10 h-10 border-0 rounded cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-bold text-gray-500">
                        {lang === 'ar' ? 'أو اختر لون دقيق مخصص:' : 'Or pick an exact custom color:'}
                        <span className="font-mono text-[0.65rem] text-brand-primary font-black block">{tempColor}</span>
                      </span>
                    </div>

                    {/* Photo theme component */}
                    <hr className="my-3 border-gray-150" />
                    <p className="text-xs text-gray-500 font-bold mb-1">
                      {lang === 'ar' 
                        ? '٢. اختر صورة غلاف مظهر حلقة التلاوة:' 
                        : '2. Select a Cover Theme Photo Background:'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { 
                          url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600', 
                          name: lang === 'ar' ? 'زخرفة إسلامية' : 'Mosque Geometry' 
                        },
                        { 
                          url: 'https://images.unsplash.com/photo-1564121211835-e88c852648ab?auto=format&fit=crop&q=80&w=600', 
                          name: lang === 'ar' ? 'قنديل روحي' : 'Lantern Arch' 
                        },
                        { 
                          url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=600', 
                          name: lang === 'ar' ? 'نقش ماندالا' : 'Elegant Pattern' 
                        },
                        { 
                          url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600', 
                          name: lang === 'ar' ? 'أفق الغروب' : 'Dusk Sky' 
                        }
                      ].map(item => (
                        <button
                          key={item.url}
                          type="button"
                          onClick={() => setTempPhoto(item.url)}
                          className={`flex items-center gap-2 p-1.5 rounded-xl border-2 transition-all text-start cursor-pointer hover:bg-gray-50 text-xs font-bold ${
                            tempPhoto === item.url 
                              ? 'border-brand-primary bg-brand-primary/5 shadow-2xs' 
                              : 'border-gray-150'
                          }`}
                        >
                          <img src={item.url} alt="" className="w-8 h-8 object-cover rounded-md flex-shrink-0" referrerPolicy="no-referrer" />
                          <span className="text-[0.65rem] truncate text-gray-700 block leading-tight">{item.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* Custom image URL input */}
                    <div className="mt-2.5">
                      <label className="text-[0.7rem] font-bold text-gray-400 block mb-1">
                        {lang === 'ar' ? 'أو أدخل رابط صورة خارجي مخصص (URL):' : 'Or type a custom external image URL:'}
                      </label>
                      <input 
                        type="url" 
                        value={tempPhoto}
                        onChange={(e) => setTempPhoto(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full bg-slate-50 border border-gray-200 focus:border-brand-primary focus:outline-none rounded-2xl px-4 py-2.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <input 
                    type="text" 
                    value={editField.value}
                    onChange={(e) => setEditField({ ...editField, value: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-200 focus:border-brand-primary focus:outline-none rounded-2xl px-4 py-3 text-sm font-bold"
                    required 
                  />
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3.5 rounded-2xl text-sm font-black transition-colors"
                  onClick={() => setEditField(null)}
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-brand-primary text-white py-3.5 rounded-2xl text-sm font-black hover:bg-brand-accent transition-colors cursor-pointer"
                >
                  {lang === 'ar' ? 'حفظ' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Announcement Modal */}
      {newAnnouncementModal && (
        <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-brand-primary/15 w-full max-w-lg text-start">
            <div className="flex justify-between items-center mb-5">
              <h4 className="text-xl font-black text-gray-800">{t().postAnnouncement}</h4>
              <button onClick={() => setNewAnnouncementModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1">
                  {t().message}
                </label>
                <textarea 
                  value={annText}
                  onChange={(e) => setAnnText(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-2xl p-4 text-sm font-bold"
                  rows={3}
                  required
                  placeholder={lang === 'ar' ? 'اكتب الرسالة الإعلانية هنا...' : 'Type your announcement details...'}
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1">
                  {lang === 'ar' ? 'نوع المرفق' : 'Attachment Type'}
                </label>
                <select 
                  value={annType}
                  onChange={(e: any) => setAnnType(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-2xl px-4 py-3 text-sm font-bold"
                >
                  <option value="text">{lang === 'ar' ? 'نص فقط' : 'Just Text'}</option>
                  <option value="image">{lang === 'ar' ? 'صورة مميزة' : 'Featured Image'}</option>
                  <option value="video">{lang === 'ar' ? 'رابط مقطع مرئي (فيديو)' : 'Featured Video'}</option>
                  <option value="link">{lang === 'ar' ? 'رابط خارجي مخصص' : 'External Web Link'}</option>
                  <option value="pdf">{lang === 'ar' ? 'ورقة عمل مستند PDF' : 'Tajweed Worksheet (PDF Document)'}</option>
                  <option value="poll">{lang === 'ar' ? 'بطاقة تصويت واستبيان تفاعلي' : 'Interactive Opinion Poll'}</option>
                </select>
              </div>

              {annType !== 'text' && annType !== 'pdf' && annType !== 'poll' && (
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1 font-mono">
                    URL Address
                  </label>
                  <input 
                    type="url"
                    value={annAttachment}
                    onChange={(e) => setAnnAttachment(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-2xl px-4 py-3 text-sm font-bold font-mono text-ltr"
                    placeholder="https://..."
                    required
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl text-sm font-black"
                  onClick={() => setNewAnnouncementModal(false)}
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-brand-primary text-white py-3.5 rounded-2xl text-sm font-black hover:bg-brand-accent cursor-pointer"
                >
                  {lang === 'ar' ? 'نشر الإعلان' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Award Gift Modal */}
      {giftModalStudentId && (
        <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-brand-primary/15 shadow-2xl w-full max-w-lg text-start">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-black text-brand-dark">🎁 {lang === 'ar' ? 'إرسال جائزة تشجيعية للطالبة' : 'Send Incentive Reward'}</h4>
              <button onClick={() => setGiftModalStudentId(null)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <p className="text-xs text-gray-500 font-bold mb-5 leading-normal">
              {lang === 'ar' 
                ? 'حددي شكل ومقدار الجائزة والرسالة التحفيزية التي ستظهر للطالبة فور فتح الصندوق بشكل تفاعلي.'
                : 'Determine the box design, gold coins amount, and an encouragement citation message visible instantly to the student.'}
            </p>

            <form onSubmit={handleSendGift} className="space-y-4">
              {/* Choose Gift box type with beautiful visual badges */}
              <div>
                <label className="text-xs font-black text-gray-400 block mb-2 font-bold">
                  {lang === 'ar' ? 'تصميم مظهر الجائزة:' : 'Reward design style:'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { type: 'box', icon: '🎁', name: lang === 'ar' ? 'علبة هدايا' : 'Giftbox' },
                    { type: 'package', icon: '📦', name: lang === 'ar' ? 'طرد ورقي' : 'Package' },
                    { type: 'envelope', icon: '✉️', name: lang === 'ar' ? 'مظروف' : 'Envelope' },
                    { type: 'piggy', icon: '🐷', name: lang === 'ar' ? 'حصالة' : 'Piggybank' }
                  ].map((item) => (
                    <label 
                      key={item.type} 
                      className={`text-center p-2 rounded-xl border-2 cursor-pointer flex flex-col items-center gap-1 hover:bg-brand-neutral/20 transition-all select-none ${
                        giftType === item.type 
                          ? 'border-brand-primary bg-brand-primary/5' 
                          : 'border-gray-150 bg-white'
                      }`}
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-[0.65rem] font-black">{item.name}</span>
                      <input 
                        type="radio" 
                        name="giftTypeRadio" 
                        value={item.type} 
                        checked={giftType === item.type}
                        onChange={() => setGiftType(item.type as any)}
                        className="sr-only" // hide real input safely
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 block mb-1 font-bold">
                  {lang === 'ar' ? 'المبلغ بالعملة التشجيعية (🪙 قطعة ذهبية):' : 'Reward amount in motivation gold (🪙 coins):'}
                </label>
                <input 
                  type="number" 
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-2xl px-4 py-3 text-sm font-bold font-mono"
                  min="1"
                  max="500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 block mb-1 font-bold">
                  {lang === 'ar' ? 'عبارة تشجيعية (Motivation Message):' : 'Encouragement Message:'}
                </label>
                <textarea 
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-2xl p-4 text-sm font-bold"
                  rows={2}
                  required
                  placeholder={lang === 'ar' ? 'تبارك الرحمن، تلاوتك متميزة هذا اليوم وعليك بالمداومة المستمرة!' : 'Amazing performance today, keep up the outstanding progress!'}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl text-sm font-black"
                  onClick={() => setGiftModalStudentId(null)}
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-brand-primary text-white py-3.5 rounded-2xl text-sm font-black hover:bg-brand-accent cursor-pointer"
                >
                  {lang === 'ar' ? 'إرسال 🪙' : 'Send Coins'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Info Profile Card Modal */}
      {activeInfoStudent && (
        <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-md z-[200] flex items-center justify-center p-4 select-none">
          <div className="bg-white p-6 rounded-3xl border border-brand-primary/15 shadow-2xl w-full max-w-md text-start">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <h4 className="text-lg font-black text-brand-dark">
                {lang === 'ar' ? 'بطاقة تفاصيل الطالبة المقيدة' : 'Active Student Profiling'}
              </h4>
              <button onClick={() => setActiveInfoStudent(null)}>
                <X className="w-5.5 h-5.5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="flex items-center gap-4.5 mb-5 text-start">
              <img 
                src={activeInfoStudent.avatar} 
                alt="" 
                className="w-14 h-14 rounded-full border border-gray-200 shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div>
                <h5 className="font-black text-brand-dark text-base mb-0.5">{activeInfoStudent.name}</h5>
                <span className="bg-brand-neutral text-brand-primary text-[0.65rem] border py-0.5 px-2 rounded-full font-bold">
                  {lang === 'ar' ? 'طالبة مقيدة بنادي مسك' : 'Registered Member - Misk SQU'}
                </span>
              </div>
            </div>

            {/* Profile fields details grid */}
            <div className="space-y-3 mb-6">
              <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100 text-sm">
                <small className="text-gray-400 font-bold block mb-0.5">{lang === 'ar' ? 'رقم الهاتف والتواصل:' : 'Phone Contact:'}</small>
                <span className="font-mono text-brand-dark font-extrabold text-ltr block">{activeInfoStudent.phone || '+968 9988 7766'}</span>
              </div>

              <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100 text-sm">
                <small className="text-gray-400 font-bold block mb-0.5">{lang === 'ar' ? 'البريد الإلكتروني للجامعة:' : 'University Email:'}</small>
                <span className="font-mono text-brand-dark font-extrabold text-ltr block leading-none">{activeInfoStudent.email || `${activeInfoStudent.id}@student.squ.edu.om`}</span>
              </div>

              <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100 text-sm">
                <small className="text-gray-400 font-bold block mb-0.5">{lang === 'ar' ? 'الكلية / التخصص:' : 'College / Department:'}</small>
                <span className="text-brand-dark font-extrabold block">{activeInfoStudent.college || (lang === 'ar' ? 'الهندسة والعلوم' : 'Engineering & Science')}</span>
              </div>

              <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100 text-sm">
                <small className="text-gray-400 font-bold block mb-0.5">{lang === 'ar' ? 'الدفعة الجامعية:' : 'Cohort Year:'}</small>
                <span className="text-brand-dark font-extrabold font-mono block">{activeInfoStudent.cohort || '2023'}</span>
              </div>
            </div>

            <button 
              className="w-full bg-brand-primary text-white py-3.5 rounded-2xl font-black text-sm hover:bg-brand-accent transition-colors cursor-pointer"
              onClick={() => setActiveInfoStudent(null)}
            >
              {lang === 'ar' ? 'حسناً، إغلاق' : 'Close Details'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
