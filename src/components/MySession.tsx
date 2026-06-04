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
  ScrollText
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
  const session = sessions.find(s => s.id === user.sessionId) || sessions[0];
  const isTeacher = user.role === 'TEACHER' || user.role === 'ADMIN';
  const announcements = session.announcements || [];

  // Local UI States
  const [activeInfoStudent, setActiveInfoStudent] = useState<SessionStudent | null>(null);
  const [giftModalStudentId, setGiftModalStudentId] = useState<string | null>(null);
  const [editField, setEditField] = useState<{ field: 'name' | 'location'; value: string } | null>(null);
  const [newAnnouncementModal, setNewAnnouncementModal] = useState(false);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      {/* Teacher Session details header */}
      <div className="bg-white rounded-3xl border border-brand-primary/10 shadow-sm overflow-hidden mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Teacher Badge Cover */}
          <div className="md:col-span-3 bg-brand-primary p-8 flex flex-col items-center justify-center text-center text-white select-none">
            <div className="bg-white p-1.5 rounded-full mb-3 shadow-md">
              <img 
                src="https://picsum.photos/seed/coach/200/200" 
                alt="" 
                className="w-24 h-24 rounded-full border border-gray-100" 
                referrerPolicy="no-referrer"
              />
            </div>
            <h4 className="text-xl font-black mb-1">{session.teacher.name}</h4>
            <span className="bg-white text-brand-primary text-xs font-black py-1 px-3 rounded-full border shadow-xs">
              {t().coach}
            </span>
          </div>

          {/* Details */}
          <div className="md:col-span-9 p-6 md:p-8 flex flex-col justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">
                  {t().sessionName}
                </label>
                <div className="text-xl font-bold text-brand-dark flex items-center gap-2">
                  <span>{session.name}</span>
                  {isTeacher && (
                    <Pencil 
                      className="w-4 h-4 text-gray-400 hover:text-brand-primary cursor-pointer transition-colors" 
                      onClick={() => setEditField({ field: 'name', value: session.name })}
                    />
                  )}
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

      {/* Gifts Chest Showcase section for STUDENTS */}
      {!isTeacher && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-dashed border-brand-primary/25 shadow-xs mb-8">
          <div className="flex items-center gap-3.5 mb-6 text-start">
            <div className="w-11 h-11 bg-brand-warm rounded-xl flex items-center justify-center text-brand-dark shadow-sm flex-shrink-0">
              <GiftIcon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg sm:text-xl font-black text-brand-dark">
                {lang === 'ar' ? 'خزينة هدايا وجوائز الطالبة' : 'My Gifts & Rewards Cabinet'}
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 font-bold mb-0">
                {lang === 'ar' 
                  ? 'تصلك هنا تبريكات المعلمة وجوائزها النقدية بمختلف الأشكال. انقري لفتح الهدية وتحصيل النقود 🪙!' 
                  : 'Receive greetings and incentive rewards from your teacher here. Click to open and claim 🪙!'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 items-center justify-center sm:justify-start">
            {user.gifts && user.gifts.length > 0 ? (
              user.gifts.map((gift) => (
                <div key={gift.id} className="flex flex-col items-center">
                  {gift.isOpened ? (
                    <div className="flex items-center gap-3 p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 max-w-sm text-start shadow-xs">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1 mb-0.5 text-xs text-gray-400 font-bold">
                          <span>🎁</span>
                          <span>{getGiftName(gift.giftType)}</span>
                        </div>
                        <h6 className="font-black text-emerald-600 text-sm mb-0.5">+🪙 {gift.amount}</h6>
                        <p className="font-medium text-brand-dark text-xs italic mb-0">
                          &ldquo;{gift.message}&rdquo;
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer flex flex-col items-center gap-2 group" 
                      onClick={() => handleOpenGift(gift.id)}
                    >
                      {renderGiftBox(gift)}
                      <span className="bg-brand-warm text-brand-dark/95 border border-brand-warm text-[0.7rem] px-2 py-0.5 rounded-full font-bold group-hover:scale-105 active:scale-95 transition-all animate-pulse">
                        {lang === 'ar' ? 'افتح الهدية! 🎁' : 'Open Gift! 🎁'}
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="w-full py-6 text-center text-gray-400 flex flex-col items-center">
                <AlertCircle className="w-10 h-10 opacity-30 mb-2" />
                <p className="text-xs font-bold mb-0">
                  {lang === 'ar' ? 'لا توجد هدايا بعد في خزنتك.' : 'Your gift chest is empty for now.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exam Results Block */}
      {user.examResults && showExamResults && (
        <div 
          ref={scrollRef} 
          className="bg-gradient-to-br from-white to-slate-50/50 p-6 sm:p-8 rounded-3xl border-2 border-brand-primary shadow-xl mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Award className="w-36 h-36" />
          </div>

          <div className="relative z-10 text-start">
            <div className="flex items-center gap-3.5 mb-5 border-b border-gray-100 pb-4">
              <div className="w-12 h-12 bg-brand-warm rounded-full flex items-center justify-center text-brand-dark flex-shrink-0">
                <ScrollText className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-brand-dark mb-0">
                {t().examResults} (SQU Syllabus)
              </h3>
            </div>

            {/* Overall Pass/Fail Badge */}
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-100 flex items-center gap-4 mb-6 shadow-sm">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-emerald-700 font-black text-lg mb-0.5">{t().pass}</h4>
                <p className="text-xs sm:text-sm text-emerald-600 font-bold mb-0">{t().passMessage}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Theory Result */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="text-brand-primary w-5 h-5" />
                    <span className="font-extrabold text-brand-dark">{t().theoryExam}</span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-600 text-xs py-1 px-3 rounded-full font-black">
                    {t().pass}
                  </span>
                </div>
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-4xl font-black text-brand-dark leading-none">{user.examResults.theory}</span>
                  <span className="text-gray-400 font-bold text-lg">/ 25</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-2 text-xs text-gray-400 font-bold leading-relaxed">
                  <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{t().theoryScoreInfo}</span>
                </div>
              </div>

              {/* Practical Evaluation */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="text-amber-500 w-5 h-5" />
                    <span className="font-extrabold text-brand-dark">{t().practicalExam}</span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-600 text-xs py-1 px-3 rounded-full font-black">
                    {t().pass}
                  </span>
                </div>
                <div className="text-3xl font-black text-emerald-600 mb-3 leading-none uppercase">
                  {user.examResults.practical}
                </div>
                <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-2 text-xs text-gray-400 font-bold leading-relaxed">
                  <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{t().practicalEvalInfo}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 text-end">
              <button 
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-black rounded-lg"
                onClick={() => setShowExamResults(false)}
              >
                {lang === 'ar' ? 'إخفاء النتائج' : 'Hide Results'}
              </button>
            </div>
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
                {lang === 'ar' ? 'دليل إدارة شؤون الطالبات ورصد الغياب' : 'Student Directory & Management'}
              </h4>
              <p className="text-xs sm:text-sm text-gray-400 font-bold mb-0">
                {lang === 'ar' 
                  ? 'استعراض بيانات الطالبات بالتفصيل ورصد الغيابات (بعذر / بدون عذر) وإرسال المكافآت التشجيعية.' 
                  : 'View student profiling, manage excused or unexcused absences, and issue incentive gifts.'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-xs font-black uppercase tracking-wider text-end select-none">
                  <th className={`pb-3 py-2 text-start ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{lang === 'ar' ? 'الطالبة' : 'Student'}</th>
                  <th className={`pb-3 py-2 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{lang === 'ar' ? 'رصيد الجوائز' : 'Gold Coins'}</th>
                  <th className="pb-3 py-2 text-center">{lang === 'ar' ? 'الغياب بعذر 🟡' : 'Excused Absence 🟡'}</th>
                  <th className="pb-3 py-2 text-center">{lang === 'ar' ? 'غياب بدون عذر 🔴' : 'Unexcused Absence 🔴'}</th>
                  <th className={`pb-3 py-2 text-end ${lang === 'ar' ? 'text-left' : 'text-right'}`}>{lang === 'ar' ? 'خيارات الإدارة' : 'Management Actions'}</th>
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

                    <td className="py-4 font-mono font-black text-emerald-600">
                      🪙 {stud.money}
                    </td>

                    <td className="py-4 text-center">
                      <div className="inline-flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-full border border-gray-100 shadow-sm">
                        <button 
                          className="w-5.5 h-5.5 rounded-full flex items-center justify-center bg-white border border-gray-200 font-black hover:bg-gray-100 active:scale-95 text-xs"
                          onClick={() => handleChangeStudentAbsence(stud.id, 'excused', -1)}
                        >
                          -
                        </button>
                        <span className="w-6.5 h-6.5 rounded-full bg-amber-400 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                          {stud.absencesExcused}
                        </span>
                        <button 
                          className="w-5.5 h-5.5 rounded-full flex items-center justify-center bg-white border border-gray-200 font-black hover:bg-gray-100 active:scale-95 text-xs"
                          onClick={() => handleChangeStudentAbsence(stud.id, 'excused', 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="py-4 text-center">
                      <div className="inline-flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-full border border-gray-100 shadow-sm">
                        <button 
                          className="w-5.5 h-5.5 rounded-full flex items-center justify-center bg-white border border-gray-200 font-black hover:bg-gray-100 active:scale-95 text-xs"
                          onClick={() => handleChangeStudentAbsence(stud.id, 'unexcused', -1)}
                        >
                          -
                        </button>
                        <span className="w-6.5 h-6.5 rounded-full bg-red-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                          {stud.absencesUnexcused}
                        </span>
                        <button 
                          className="w-5.5 h-5.5 rounded-full flex items-center justify-center bg-white border border-gray-200 font-black hover:bg-gray-100 active:scale-95 text-xs"
                          onClick={() => handleChangeStudentAbsence(stud.id, 'unexcused', 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="py-4 text-end">
                      <div className={`flex flex-wrap items-center gap-2 ${lang === 'ar' ? 'justify-start' : 'justify-end'}`}>
                        {/* Profile Card Trigger */}
                        <button 
                          className="px-2.5 py-1.5 rounded-lg border border-gray-150 hover:bg-gray-50 text-gray-500 font-bold flex items-center gap-1.5 text-xs transition-all"
                          onClick={() => setActiveInfoStudent(stud)}
                        >
                          <Info className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'عرض البيانات' : 'Profile'}</span>
                        </button>

                        {/* Gift award */}
                        <button 
                          className="px-2.5 py-1.5 rounded-lg bg-brand-primary text-white font-bold flex items-center gap-1.5 text-xs hover:bg-brand-accent transition-all cursor-pointer shadow-xs"
                          onClick={() => setGiftModalStudentId(stud.id)}
                        >
                          <GiftIcon className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'إرسال هدية' : 'Send Gift'}</span>
                        </button>

                        {/* Delete roster */}
                        <button 
                          className="p-1.5 rounded-lg border border-red-150 hover:bg-red-50 text-red-500 transition-colors"
                          onClick={() => handleDeleteStudent(stud.id)}
                          title={lang === 'ar' ? 'إزالة الطالبة من الحلقة' : 'Remove Student'}
                        >
                          <Trash2 className="w-4 h-4" />
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Announcements & feeds */}
        <div className="lg:col-span-8 text-start">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl sm:text-2xl font-black text-brand-dark flex items-center gap-2">
              <Megaphone className="text-brand-primary w-6 h-6" />
              {t().teacherAnnouncements}
            </h4>
            {isTeacher && (
              <button 
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-primary text-white text-xs font-black shadow-sm hover:bg-brand-accent transition-all duration-200 cursor-pointer"
                onClick={() => setNewAnnouncementModal(true)}
              >
                <Plus className="w-4.5 h-4.5" />
                <span>{t().postAnnouncement}</span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {announcements.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl border border-dashed text-center flex flex-col items-center">
                <AlertCircle className="opacity-15 w-16 h-16 text-gray-400 mb-3" />
                <p className="text-gray-400 font-bold mb-0">No announcements yet.</p>
              </div>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="bg-white rounded-3xl border border-brand-primary/15 shadow-xs overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex gap-2">
                        <span className="bg-brand-neutral text-brand-primary border border-brand-primary/10 text-xs py-1 px-3 rounded-full font-mono">
                          {ann.date}
                        </span>
                        {ann.type !== 'text' && (
                          <span className="bg-brand-warm/15 text-brand-dark border border-brand-warm/25 text-[0.65rem] uppercase py-1 px-2.5 rounded-full font-black select-none">
                            {ann.type}
                          </span>
                        )}
                      </div>

                      {isTeacher && (
                        <button 
                          className="text-red-500 hover:text-red-700 flex items-center gap-1.5 border border-red-100 hover:bg-red-50 px-2 py-1 rounded-lg text-xs"
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'حذف' : 'Delete'}</span>
                        </button>
                      )}
                    </div>

                    <p className="text-base sm:text-lg font-bold text-brand-dark mb-4 leading-relaxed">
                      {ann.text}
                    </p>

                    {/* image attachments */}
                    {ann.type === 'image' && ann.attachment && (
                      <div className="rounded-2xl overflow-hidden border border-gray-100 mb-4 max-h-96">
                        <img 
                          src={ann.attachment} 
                          alt="" 
                          className="w-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {/* video mock attachments */}
                    {ann.type === 'video' && (
                      <div className="aspect-video rounded-2xl overflow-hidden border border-gray-100 mb-4 bg-slate-900 flex flex-col items-center justify-center text-white select-none">
                        <PlayCircle className="w-16 h-16 text-white/50 animate-pulse cursor-pointer" />
                        <span className="mt-2 text-xs text-white/40">{lang === 'ar' ? 'مشغّل فيديو مدمج' : 'Embedded Video Player'}</span>
                      </div>
                    )}

                    {/* Link attachments */}
                    {ann.type === 'link' && ann.attachment && (
                      <a 
                        href={ann.attachment} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gray-50/50 hover:bg-brand-neutral/20 border border-gray-100 hover:border-brand-primary/30 text-decoration-none transition-all duration-200"
                      >
                        <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-sm text-brand-primary">
                          <ExternalLink className="w-4.5 h-4.5" />
                        </div>
                        <span className="text-sm font-extrabold text-brand-dark overflow-hidden text-ellipsis whitespace-nowrap block max-w-sm">
                          {ann.attachment}
                        </span>
                      </a>
                    )}

                    {/* PDF Document attachments */}
                    {ann.type === 'pdf' && (
                      <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gray-50/50 border border-gray-150 select-none">
                        <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5.5 h-5.5" />
                        </div>
                        <div className="overflow-hidden text-ellipsis">
                          <span className="text-sm font-extrabold text-brand-dark block text-nowrap text-truncate">
                            SQU_Itqan_Chapter_Tajweed_Part1.pdf
                          </span>
                          <span className="text-xs text-gray-400 font-bold block mt-0.5">
                            PDF Document - 1.2 MB (Mocked)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Poll attachments */}
                    {ann.type === 'poll' && ann.pollOptions && (
                      <div className="flex flex-col gap-2.5">
                        {ann.pollOptions.map((opt) => {
                          const totalVotes = ann.pollOptions?.reduce((acc, curr) => acc + curr.votes, 0) || 0;
                          const percent = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;
                          const hasVoted = ann.voted === opt.id;

                          return (
                            <div 
                              key={opt.id} 
                              className={`relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all overflow-hidden ${
                                hasVoted 
                                  ? 'border-brand-primary bg-brand-primary/5' 
                                  : 'border-gray-150 hover:bg-brand-neutral/10'
                              }`}
                              onClick={() => handleVotePoll(ann.id, opt.id)}
                            >
                              <div 
                                className="absolute top-0 bottom-0 left-0 bg-brand-primary/10 transition-all duration-500 ease-out" 
                                style={{ width: `${percent}%` }}
                              ></div>
                              <div className="relative z-10 flex justify-between items-center text-sm">
                                <span className="font-extrabold text-brand-dark">{opt.text}</span>
                                <div className="flex items-center gap-2">
                                  {hasVoted && <CheckCircle className="w-4.5 h-4.5 text-brand-primary" />}
                                  <span className="text-xs font-black text-gray-500 font-mono">
                                    {Math.round(percent)}% ({opt.votes} {t().totalVotes})
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: leaderboard stats */}
        <div className="lg:col-span-4 text-start select-none">
          <div className="bg-white rounded-3xl border border-brand-primary/10 shadow-sm p-5">
            <h5 className="text-base font-black text-brand-dark flex items-center gap-2 mb-4">
              <Award className="text-brand-warm w-6 h-6" />
              {t().sessionLeaderboard} (SQU Stars)
            </h5>

            <div className="flex flex-col gap-2.5">
              {session.students.slice().sort((a,b) => b.money - a.money).map((stud, index) => (
                <div 
                  key={stud.id} 
                  className="flex items-center justify-between p-2.5 bg-gray-50/50 rounded-xl border border-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[0.7rem] font-black font-mono text-white ${
                      index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-amber-700' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-extrabold text-brand-dark text-xs">{stud.name}</span>
                  </div>
                  <span className="text-emerald-600 font-extrabold text-xs font-mono">
                    🪙 {stud.money}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* --- MODALS --- */}

      {/* Inline Section Field Editor modal */}
      {editField && (
        <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl border border-brand-primary/15 shadow-2xl w-full max-w-md text-start">
            <h4 className="text-lg font-black mb-4">
              {editField.field === 'name' ? t().sessionName : t().sessionLocation}
            </h4>
            <form onSubmit={handleEditSessionField}>
              <div className="mb-4">
                <input 
                  type="text" 
                  value={editField.value}
                  onChange={(e) => setEditField({ ...editField, value: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-200 focus:border-brand-primary focus:outline-none rounded-2xl px-4 py-3 text-sm font-bold"
                  required 
                />
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
                  {lang === 'ar' ? 'طالبة مقيدة بنادي إتقان' : 'Registered Member - Itqan SQU'}
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
