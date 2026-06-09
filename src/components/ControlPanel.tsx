import React, { useState } from 'react';
import { 
  User, 
  Session, 
  SessionRequest, 
  AdminStats, 
  GlobalStudent, 
  GlobalTeacher,
  Semester
} from '../types';
import AssignmentDashboard from './AssignmentWizard/AssignmentDashboard';
import { 
  Users, 
  BookOpen, 
  Layers, 
  Inbox, 
  CheckCircle, 
  UserPlus, 
  AlertCircle,
  Search,
  ChevronUp,
  ChevronDown,
  CreditCard,
  AudioLines,
  Pause,
  Play,
  UserCheck,
  Calendar,
  PlusCircle,
  Trash2,
  Sparkles,
  Send
} from 'lucide-react';

interface ControlPanelProps {
  user: User;
  setUser?: React.Dispatch<React.SetStateAction<any>>;
  sessions: Session[];
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  sessionRequests: SessionRequest[];
  setSessionRequests: React.Dispatch<React.SetStateAction<SessionRequest[]>>;
  adminStats: AdminStats;
  setAdminStats: React.Dispatch<React.SetStateAction<AdminStats>>;
  allStudents: any[];
  allTeachers: any[];
  setAllStudents: React.Dispatch<React.SetStateAction<any[]>>;
  setAllTeachers: React.Dispatch<React.SetStateAction<any[]>>;
  lang: 'ar' | 'en';
  t: () => any;
  semesters?: Semester[];
  onUpdateSemesters?: React.Dispatch<React.SetStateAction<Semester[]>>;
}

type AdminSubView = 'default' | 'students' | 'teachers' | 'sessions' | 'assignments' | 'semesters';

export default function ControlPanel({
  user,
  setUser,
  sessions,
  setSessions,
  sessionRequests,
  setSessionRequests,
  adminStats,
  setAdminStats,
  allStudents,
  allTeachers,
  setAllStudents,
  setAllTeachers,
  lang,
  t,
  semesters = [],
  onUpdateSemesters
}: ControlPanelProps) {
  const [subView, setSubView] = useState<AdminSubView>('default');

  const [draftSessions, setDraftSessions] = useState<any[]>(() => {
    const cached = localStorage.getItem('itqan_draft_sessions');
    return cached ? JSON.parse(cached) : [];
  });

  React.useEffect(() => {
    localStorage.setItem('itqan_draft_sessions', JSON.stringify(draftSessions));
  }, [draftSessions]);

  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [sessName, setSessName] = useState('');
  const [sessTeacherEmail, setSessTeacherEmail] = useState('');
  const [sessTimeSlot, setSessTimeSlot] = useState('');
  const [sessLocation, setSessLocation] = useState('');
  const [sessMaxStudents, setSessMaxStudents] = useState(15);
  const [sessSelectedStudents, setSessSelectedStudents] = useState<string[]>([]);
  const [sessColor, setSessColor] = useState('#059669');
  const [sessLevel, setSessLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');

  // New state hooks added for requirements:
  const [sessFormat, setSessFormat] = useState<'online' | 'person'>('person');
  const [sessSelectedStudentIds, setSessSelectedStudentIds] = useState<string[]>([]);
  const [selectedTeacherDetails, setSelectedTeacherDetails] = useState<any | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // New semester creation stats states:
  const [showAddSemesterForm, setShowAddSemesterForm] = useState(false);
  const [semTitle, setSemTitle] = useState('');
  const [semDesc, setSemDesc] = useState('');
  const [semNotes, setSemNotes] = useState('');
  const [semRules, setSemRules] = useState('');
  const [semAnnounceTime, setSemAnnounceTime] = useState(() => {
    return new Date().toISOString().slice(0, 16);
  });
  const [semStopRegTime, setSemStopRegTime] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 21);
    return date.toISOString().slice(0, 16);
  });
  const [semStopRegManual, setSemStopRegManual] = useState(false);

  // New state hooks for active semester allocation:
  const [activeAllocationSemesterId, setActiveAllocationSemesterId] = useState<string | null>(null);
  const [assignMethod, setAssignMethod] = useState<'automated' | 'manual'>('automated');

  // Helper to construct a full name with all parts
  const getPreciseFullName = (item: any) => {
    if (!item) return '';
    if (item.firstName) {
      return `${item.firstName} ${item.fatherName || ''} ${item.grandfatherName || ''} ${item.lastName || ''}`.replace(/\s+/g, ' ').trim();
    }
    return item.name || '';
  };

  // Helper to retrieve timing preferences
  const getTeacherAvailableTimes = (teacher: any) => {
    if (!teacher || !teacher.enrollmentDetails || !teacher.enrollmentDetails.timings) return [];
    return Object.keys(teacher.enrollmentDetails.timings).filter(key => {
      const val = teacher.enrollmentDetails.timings[key];
      return val === 'selected' || val === 'online' || val === 'person';
    });
  };

  // Helper to format Timing Keys for clear Arabic & English displays
  const formatTimingKey = (key: string, language: 'ar' | 'en') => {
    const parts = key.split('_');
    if (parts.length < 2) return key;
    const day = parts[0];
    const time = parts[1];
    
    const dayMapAr: Record<string, string> = {
      Sunday: 'الأحد',
      Monday: 'الاثنين',
      Tuesday: 'الثلاثاء',
      Wednesday: 'الأربعاء',
      Thursday: 'الخميس',
      Friday: 'الجمعة',
      Saturday: 'السبت'
    };

    const dayStr = language === 'ar' ? (dayMapAr[day] || day) : day;
    return `${dayStr} | ${time}`;
  };

  // Helper to determine session level based on assigned students
  const getDeterminedSessionLevel = () => {
    if (sessSelectedStudentIds.length === 0) return null;
    const firstId = sessSelectedStudentIds[0];
    const stud = allStudents.find(s => s.studentId === firstId || s.email === firstId || s.name === firstId);
    if (!stud) return null;
    
    const lvl = (stud.level || '').toUpperCase();
    if (lvl.includes('BEGINNER') || lvl.includes('مبتدئة')) return 'BEGINNER';
    if (lvl.includes('INTERMEDIATE') || lvl.includes('تمهيدية') || lvl.includes('متوسطة') || lvl.includes('TAMKEEN') || lvl.includes('تمكين')) return 'INTERMEDIATE';
    if (lvl.includes('ADVANCED') || lvl.includes('متقدمة')) return 'ADVANCED';
    return null;
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessTeacherEmail || !sessTimeSlot) {
      alert(lang === 'ar' ? 'الرجاء اختيار المعلمة وتحديد الميعاد الشاغر المتاح!' : 'Please choose a teacher and select an available time slot!');
      return;
    }

    const selectedTeacher = allTeachers.find(t => t.email === sessTeacherEmail);
    const teacherFirstName = selectedTeacher ? (selectedTeacher.firstName || selectedTeacher.name?.split(' ')[0] || 'Teacher') : 'Teacher';
    const autoSessionName = lang === 'ar' ? `حلقة أ. ${teacherFirstName}` : `T. ${teacherFirstName}'s session.`;

    const tName = selectedTeacher ? getPreciseFullName(selectedTeacher) : (lang === 'ar' ? 'معلمة متميزة' : 'Assigned Teacher');
    const tPhone = selectedTeacher ? (selectedTeacher.phone || '+968 9988 7766') : '+968 9988 7766';

    // Map designated IDs into SessionStudent structures
    const mappedStudents = sessSelectedStudentIds.map(stId => {
      const orig = allStudents.find(s => s.studentId === stId || s.email === stId || s.name === stId);
      return {
        id: stId,
        name: orig ? `${orig.firstName || orig.name} ${orig.lastName || ''}` : stId,
        money: orig ? (orig.money || 0) : 0,
        avatar: orig ? (orig.avatar || `https://picsum.photos/seed/${stId}/100/100`) : `https://picsum.photos/seed/${stId}/100/100`,
        absencesExcused: orig ? (orig.absencesExcused || 0) : 0,
        absencesUnexcused: orig ? (orig.absencesUnexcused || 0) : 0,
        email: orig ? orig.email : '',
        phone: orig ? orig.phone : '',
        college: orig ? orig.college : '',
        cohort: orig ? orig.cohort : ''
      };
    });

    const determinedLevel = getDeterminedSessionLevel() || 'BEGINNER';
    const finalLocation = sessLocation || (sessFormat === 'online' ? (lang === 'ar' ? 'عبر الأثير - تيمز' : 'Teams Digital Channel') : (lang === 'ar' ? 'مسجد الجامعة - قاعات التربية' : 'SQU Campus Mosque'));

    if (editingDraftId) {
      // Editing Mode
      setSessions(prev => prev.map(s => {
        if (s.id === editingDraftId) {
          return {
            ...s,
            name: autoSessionName,
            location: finalLocation,
            time: sessTimeSlot,
            maxStudents: 999, // remove constraints
            level: determinedLevel as any,
            themeColor: sessFormat === 'online' ? '#2563eb' : '#059669',
            teacher: {
              name: tName,
              phone: tPhone
            },
            students: mappedStudents
          };
        }
        return s;
      }));
      alert(lang === 'ar' ? 'تم تعديل الحلقة بنجاح' : 'Session updated successfully!');
    } else {
      // Creation Mode
      const newSess: Session = {
        id: 'sess_' + Date.now(),
        name: autoSessionName,
        location: finalLocation,
        time: sessTimeSlot,
        maxStudents: 999, // remove constraints
        level: determinedLevel as any,
        themeColor: sessFormat === 'online' ? '#2563eb' : '#059669',
        teacher: {
          name: tName,
          phone: tPhone
        },
        students: mappedStudents,
        announcements: [],
        themePhoto: 'https://images.unsplash.com/photo-1541844053589-346841d0b34c?auto=format&fit=crop&q=80&w=600'
      };
      setSessions(prev => [...prev, newSess]);
      setAdminStats(prev => ({
        ...prev,
        totalSessions: prev.totalSessions + 1
      }));
      alert(lang === 'ar' ? 'تم إنشاء الحلقة بنجاح وتفعيلها' : 'New session created successfully!');
    }

    // Reset Form
    setEditingDraftId(null);
    setSessName('');
    setSessTeacherEmail('');
    setSessTimeSlot('');
    setSessLocation('');
    setSessColor('#059669');
    setSessLevel('BEGINNER');
    setSessSelectedStudentIds([]);
    setSessFormat('person');
    setStudentSearchQuery('');
  };

  const handleEditSessionTrigger = (sess: Session) => {
    setEditingDraftId(sess.id);
    setSessName(sess.name);
    
    // Find teacher by name or profile
    const matchedTeacher = allTeachers.find(t => getPreciseFullName(t) === sess.teacher?.name || t.name === sess.teacher?.name);
    setSessTeacherEmail(matchedTeacher ? matchedTeacher.email : '');
    
    setSessTimeSlot(sess.time);
    setSessLocation(sess.location);
    setSessMaxStudents(sess.maxStudents);
    setSessColor(sess.themeColor || '#059669');
    setSessLevel(sess.level);

    // Check delivery type based on location
    const isOnline = sess.location.toLowerCase().includes('أثير') || sess.location.toLowerCase().includes('تيمز') || sess.location.toLowerCase().includes('online') || sess.location.toLowerCase().includes('virtual');
    setSessFormat(isOnline ? 'online' : 'person');

    // Populate selected student IDs
    if (sess.students) {
      setSessSelectedStudentIds(sess.students.map(st => st.id));
    } else {
      setSessSelectedStudentIds([]);
    }
  };

  const handleDeleteSession = (sessId: string) => {
    const confirmMsg = lang === 'ar' 
      ? 'هل أنتِ متأكدة من حذف هذه الحلقة نهائياً؟ سيتم إلغاء تسجيل جميع الطالبات بها.' 
      : 'Are you sure you want to permanently delete this session? All student placements inside will be cancelled.';
    
    if (window.confirm(confirmMsg)) {
      setSessions(prev => prev.filter(s => s.id !== sessId));
      setAdminStats(prev => ({
        ...prev,
        totalSessions: Math.max(0, prev.totalSessions - 1)
      }));
      alert(lang === 'ar' ? 'تم حذف الحلقة' : 'Session deleted.');
    }
  };

  const handleApproveJoinRequest = (reqId: string) => {
    const request = sessionRequests.find(r => r.id === reqId);
    if (!request) return;

    // Enroll them in the first session with full mock object
    setSessions(prev => prev.map((s, index) => {
      if (index === 0) {
        return {
          ...s,
          students: [
            ...s.students,
            {
              id: 's_added_' + reqId,
              name: request.name,
              money: 0,
              avatar: `https://picsum.photos/seed/s_add_${reqId}/100/100`,
              absencesExcused: 0,
              absencesUnexcused: 0,
              email: `${reqId}@student.squ.edu.om`,
              phone: '+968 9988 7766',
              college: lang === 'ar' ? 'الهندسة والعلوم' : 'Engineering & Science',
              cohort: '2023'
            }
          ]
        };
      }
      return s;
    }));

    // Remove request and update stats
    setSessionRequests(prev => prev.filter(r => r.id !== reqId));
    setAdminStats(prev => ({
      ...prev,
      pendingRequests: Math.max(0, prev.pendingRequests - 1),
      totalStudents: prev.totalStudents + 1
    }));

    alert(lang === 'ar' 
      ? 'تم قبول طلب الانضمام وتوزيع الطالبة بنجاح!' 
      : 'Join request approved and student enrolled successfully!'
    );
  };

  const handleRejectJoinRequest = (reqId: string) => {
    const confirmMsg = lang === 'ar' 
      ? 'هل أنتِ متأكدة من رفض وحذف هذا الطلب؟' 
      : 'Are you sure you want to reject and delete this request?';

    if (window.confirm(confirmMsg)) {
      setSessionRequests(prev => prev.filter(r => r.id !== reqId));
      setAdminStats(prev => ({
        ...prev,
        pendingRequests: Math.max(0, prev.pendingRequests - 1)
      }));
    }
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  
  // Simulated Audio Playback States
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioTime, setAudioTime] = useState(0);
  const audioDuration = 24; // 24 seconds mock sample

  // Active filter states
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState<'all' | 'pending' | 'approved'>('all');
  
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherFilter, setTeacherFilter] = useState<'all' | 'pending' | 'approved'>('all');

  // Trigger simulated play progress
  React.useEffect(() => {
    let interval: any;
    if (playingId) {
      interval = setInterval(() => {
        setAudioTime(t => {
          if (t >= audioDuration) {
            setPlayingId(null);
            return 0;
          }
          return t + 1;
        });
      }, 1000);
    } else {
      setAudioTime(0);
    }
    return () => clearInterval(interval);
  }, [playingId]);

  const handleStartEdit = (userItem: any, idKey: string) => {
    setEditingId(idKey);
    setEditForm({ ...userItem });
  };

  const handleToggleTeacherAdmin = (email: string) => {
    setAllTeachers(prev => prev.map(t => {
      if (t.email === email) {
        const nextRole = t.role === 'ADMIN' ? 'TEACHER' : 'ADMIN';
        alert(lang === 'ar' 
          ? `تم تحديث الصلاحية بنجاح! الدور الحالي: ${nextRole === 'ADMIN' ? 'مشرفة إدارية (Admin)' : 'معلمة تلاوة (Teacher)'}`
          : `Role updated successfully! Active role: ${nextRole}`
        );
        return { ...t, role: nextRole };
      }
      return t;
    }));
  };

  const handleSaveUser = (role: 'STUDENT' | 'TEACHER') => {
    if (!editForm) return;

    if (role === 'STUDENT') {
      setAllStudents(prev => prev.map(s => {
        const matchKey = s.studentId || s.email;
        const currentKey = editForm.studentId || editForm.email;
        if (matchKey === currentKey) {
          return { ...editForm, approved: true };
        }
        return s;
      }));
    } else {
      setAllTeachers(prev => prev.map(t => {
        const matchKey = t.employeeId || t.email;
        const currentKey = editForm.employeeId || editForm.email;
        if (matchKey === currentKey) {
          return { ...editForm, approved: true };
        }
        return t;
      }));
    }

    setEditingId(null);
    setEditForm(null);

    alert(lang === 'ar' 
      ? 'تم حفظ التعديلات والموافقة على الحساب بنجاح!' 
      : 'User details updated and account successfully approved!'
    );
  };

  const getArabicLevelName = (lvl: string) => {
    switch (lvl?.toUpperCase() || lvl) {
      case 'BEGINNER':
      case 'مبتدئة':
        return 'مبتدئة';
      case 'INTERMEDIATE':
      case 'تمهيدية':
      case 'متوسطة':
        return 'تمهيدي / متوسطة';
      case 'ADVANCED':
      case 'متقدمة':
        return 'متقدمة';
      default:
        return lvl;
    }
  };

  if (subView === 'assignments') {
    const isAr = lang === 'ar';
    const tLabel = (ar: string, en: string) => isAr ? ar : en;
    const activeSem = semesters.find(s => s.id === activeAllocationSemesterId);
    const semTitleStr = activeSem ? activeSem.title : '';

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-start select-none animate-fade-in">
        {/* Full-Page Studio Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8 border-b border-gray-150 pb-6">
          <div className="space-y-1.5 text-start">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-primary block animate-pulse"></span>
              <span className="text-[10px] bg-brand-primary/10 text-brand-primary font-black px-2.5 py-1 rounded-md uppercase tracking-wider block w-fit">
                {tLabel('مركـز الفـرز والتوزيـع والأفـواج • SQU Allocation Studio', 'SQU Allocation & Placements Studio')}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-brand-dark">
              {tLabel(`أداة توزيع الطالبات لـ: ${semTitleStr}`, `Allocation Tool: ${semTitleStr}`)}
            </h2>
            <p className="text-xs text-slate-400 font-bold block">
              {tLabel('التسكين التلقائي والموزع الذكي لشواغر الطالبات، وتفويج وبناء حلقات التلاوة يدوياً بحسب التفرغات وتوزع المقارئ.', 'Assign students automatically or design recitation circles manually with full capacity slot audits.')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setSubView('semesters')}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-2xl text-xs font-black border border-gray-200 flex items-center gap-2 cursor-pointer transition-all self-stretch md:self-auto justify-center"
            >
              <Send className="w-4.5 h-4.5 rotate-180 text-gray-500" />
              <span>{tLabel('رجوع لقائمة الفصول', 'Go Back to Semesters')}</span>
            </button>
          </div>
        </div>

        {/* Selected Workspace Component */}
        <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-sm transition-all duration-300">
          <AssignmentDashboard
            sessions={sessions}
            setSessions={setSessions}
            allStudents={allStudents}
            setAllStudents={setAllStudents}
            allTeachers={allTeachers}
            setAllTeachers={setAllTeachers}
            lang={lang}
            t={t}
            onBack={() => setSubView('semesters')}
          />
        </div>
      </div>
    );
  }

  if (subView === 'semesters') {
    const isAr = lang === 'ar';
    const tLabel = (ar: string, en: string) => isAr ? ar : en;

    const handleCreateSemester = (e: React.FormEvent) => {
      e.preventDefault();
      if (!semTitle.trim()) {
        alert(tLabel('يرجى كتابة عنوان للفصل الدراسي الجديد!', 'Please provide a title for the new semester!'));
        return;
      }

      const newSem: Semester = {
        id: 'sem_' + Date.now(),
        title: semTitle,
        description: semDesc,
        importantNotes: semNotes,
        rules: semRules,
        announcementTime: new Date(semAnnounceTime).toISOString(),
        stopRegistration: semStopRegManual,
        stopRegistrationTime: semStopRegTime ? new Date(semStopRegTime).toISOString() : undefined
      };

      if (onUpdateSemesters) {
        onUpdateSemesters(prev => [...prev, newSem]);
      }
      
      // Reset fields
      setSemTitle('');
      setSemDesc('');
      setSemNotes('');
      setSemRules('');
      setSemStopRegManual(false);
      setShowAddSemesterForm(false);

      alert(tLabel('تم إنشاء الفصل الدراسي الجديد بنجاح وبدء جدول التقديم!', 'The new semester registration calendar has been initiated successfully!'));
    };

    const handleToggleRegistration = (id: string) => {
      if (onUpdateSemesters) {
        onUpdateSemesters(prev => prev.map(sem => 
          sem.id === id ? { ...sem, stopRegistration: !sem.stopRegistration } : sem
        ));
      }
    };

    const handleDeleteSemester = (id: string) => {
      if (window.confirm(tLabel('هل أنت متأكد من حذف هذا الفصل الدراسي نهائياً؟', 'Are you sure you want to delete this semester permanently?'))) {
        if (onUpdateSemesters) {
          onUpdateSemesters(prev => prev.filter(sem => sem.id !== id));
        }
      }
    };

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-start">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3.5xl font-black text-brand-dark">
              {tLabel('إدارة الفصول وفترات الاستقبال 📅', 'Semesters & Intake Configurations 📅')}
            </h2>
            <p className="text-xs text-slate-400 font-bold mt-1">
              {tLabel('أنشئ فصولاً دراسية جديدة، حدد مواعيد الإعلانات والمطابخ الزمنية الآلية، وتتبع رغبات الطالبات.', 'Deploy custom semesters, announce registration criteria, schedule automatic cutoffs and configure assignments.')}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowAddSemesterForm(!showAddSemesterForm);
              }}
              className="px-5 py-3 bg-brand-primary hover:bg-brand-accent text-white rounded-2xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4.5 h-4.5" />
              <span>{tLabel('إضافة فصل جديد ✦', 'Add New Semester ✦')}</span>
            </button>
            <button
              onClick={() => setSubView('default')}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-2xl text-xs font-black border border-gray-200 flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4.5 h-4.5 rotate-180" />
              <span>{tLabel('رجوع للملخص', 'Go Back')}</span>
            </button>
          </div>
        </div>

        {/* Creation Form */}
        {showAddSemesterForm && (
          <form onSubmit={handleCreateSemester} className="bg-white rounded-3xl border border-brand-primary/15 shadow-xl p-6 sm:p-8 mb-8 mt-4 animate-fade-in relative space-y-5">
            <h3 className="text-base sm:text-lg font-black text-brand-dark flex items-center gap-2 border-b pb-3 border-gray-100">
              <span>📝</span>
              <span>{tLabel('تفاصيل وضوابط الفصل الدراسي الجديد', 'Add New Academic Semester Details')}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-brand-dark block">{tLabel('عنوان الفصل والتقديم (مثال: فصل خريف ٢٦):', 'Semester Title (e.g., Fall 2026 Intake):')}</label>
                <input
                  type="text"
                  required
                  value={semTitle}
                  onChange={e => setSemTitle(e.target.value)}
                  placeholder={tLabel('أدخلي العنوان...', 'Enter semester title...')}
                  className="w-full bg-slate-50 border border-gray-150 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold placeholder-gray-300 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-brand-dark block">{tLabel('توقيت الإعلان ونشره بالرئيسية (تاريخ البدء):', 'Announcement Activation Publish Time (Start):')}</label>
                <input
                  type="datetime-local"
                  required
                  value={semAnnounceTime}
                  onChange={e => setSemAnnounceTime(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-150 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold font-mono focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-black text-brand-dark block">{tLabel('وصف الفصل والغرض العام (يظهر في واجهة الطالبة):', 'Semester General Description (Appears to user):')}</label>
                <textarea
                  rows={2}
                  value={semDesc}
                  onChange={e => setSemDesc(e.target.value)}
                  placeholder={tLabel('اكتبي وصفاً للترحيب وأهداف الحلقات...', 'Enter welcome text and general objective details...')}
                  className="w-full bg-slate-50 border border-gray-150 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold placeholder-gray-300 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-brand-dark block">{tLabel('ملاحظات تخصصية مهمة (تنزل بالبطاقة):', 'Important Pedagogical Notes:')}</label>
                <textarea
                  rows={2}
                  value={semNotes}
                  onChange={e => setSemNotes(e.target.value)}
                  placeholder={tLabel('مثال: مواءمة الساعات مع جدول محاضرات البكالوريوس...', 'e.g. Fit hours with SQU undergrad lecture tables...')}
                  className="w-full bg-slate-50 border border-gray-150 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold placeholder-gray-300 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-brand-dark block">{tLabel('الضوابط والقواعد والسياسات العامة:', 'Rules & Class Attendance Policies:')}</label>
                <textarea
                  rows={2}
                  value={semRules}
                  onChange={e => setSemRules(e.target.value)}
                  placeholder={tLabel('مثال: ضابط الغياب بحد أقصى مرتين لتثبيت الأجزاء وتلافي الحذف...', 'e.g. Maximum excused absences is set to 2 to maintain seat allotment...')}
                  className="w-full bg-slate-50 border border-gray-150 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold placeholder-gray-300 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-brand-dark block">{tLabel('التوقيت التلقائي لإيقاف التسجيل (سقف الموعد النهائي):', 'Automatic Stop Registration Deadline (Official cut-off point):')}</label>
                <input
                  type="datetime-local"
                  value={semStopRegTime}
                  onChange={e => setSemStopRegTime(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-150 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold font-mono focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  id="stop_reg_manual_chk"
                  type="checkbox"
                  checked={semStopRegManual}
                  onChange={e => setSemStopRegManual(e.target.checked)}
                  className="w-5 h-5 accent-brand-primary cursor-pointer rounded"
                />
                <label htmlFor="stop_reg_manual_chk" className="text-xs font-black text-rose-700 cursor-pointer select-none">
                  🛑 {tLabel('إيقاف استقبال الرغبات والتقديم يدوياً فوراً', 'Manually stop enrollments and lock timeline inputs immediately')}
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAddSemesterForm(false)}
                className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black border cursor-pointer"
              >
                {tLabel('إلغاء', 'Cancel')}
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-brand-primary hover:bg-brand-accent text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
              >
                {tLabel('نشر وإعلان الفصل الدراسي الجديد ✦', 'Publish & Launch New Semester ✦')}
              </button>
            </div>
          </form>
        )}

        {/* Semesters List */}
        <div className="bg-white rounded-3xl border border-brand-primary/10 shadow-sm p-6">
          <h3 className="text-base sm:text-lg font-black text-brand-dark mb-6 flex items-center gap-2">
            <span>📅</span>
            <span>{tLabel('الفصول المطلقة والمجدولة بالنادي', 'Active & Scheduled Semesters Log')}</span>
          </h3>

          {semesters.length === 0 ? (
            <div className="py-16 text-center border border-dashed rounded-2xl bg-gray-50 flex flex-col items-center">
              <Calendar className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-400 font-bold mb-0">{tLabel('لم يتم تسجيل أي فصول دراسية، اضغطي على زر "إضافة فصل جديد" للبدء.', 'No semesters registered yet. Click "Add New Semester" to initiate custom slots.')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {semesters.map((sem, index) => {
                const now = new Date();
                const isAnnounced = new Date(sem.announcementTime) <= now;
                const isClosed = sem.stopRegistration || (sem.stopRegistrationTime && new Date(sem.stopRegistrationTime) <= now);

                let statusBadge = (
                  <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    {tLabel('نشط ويستقبل الطلبات', 'Live & Open')}
                  </span>
                );

                if (!isAnnounced) {
                  statusBadge = (
                    <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      {tLabel('انتظار موعد الإعلان المجدول', 'Scheduled Future Release')}
                    </span>
                  );
                } else if (isClosed) {
                  statusBadge = (
                    <span className="bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      {tLabel('مغلق ومكتمل التقديم', 'Intake Stopped / Closed')}
                    </span>
                  );
                }

                return (
                  <div key={sem.id} className="border border-gray-150 rounded-2xl p-5 hover:border-brand-primary/20 transition-all text-start relative bg-slate-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-xs font-mono bg-brand-primary/10 text-brand-primary px-2.5 py-0.5 rounded-md font-extrabold">
                            #{sem.id}
                          </span>
                          {statusBadge}
                        </div>
                        <h4 className="text-base sm:text-lg font-black text-brand-dark">
                          {sem.title}
                        </h4>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleToggleRegistration(sem.id)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer border transition-all duration-200 ${
                            sem.stopRegistration 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {sem.stopRegistration 
                            ? tLabel('تفعيل استقبال التسجيل', 'Re-open Registration')
                            : tLabel('إيقاف استقبال التسجيل 🛑', 'Stop Registration 🛑')
                          }
                        </button>

                        <button
                          onClick={() => {
                            setActiveAllocationSemesterId(sem.id);
                            setAssignMethod('automated');
                            setSubView('assignments');
                          }}
                          className="px-4 py-2.5 bg-brand-primary hover:bg-brand-accent text-white rounded-xl text-xs font-black shadow-sm cursor-pointer transition-all duration-200"
                        >
                          🎯 {tLabel('أداة الفرز والتوزيع للحلقات', 'Run Session Allocator Tool')}
                        </button>

                        <button
                          onClick={() => handleDeleteSemester(sem.id)}
                          className="p-2.5 bg-white hover:bg-rose-50 border border-gray-200 hover:border-rose-150 text-rose-600 rounded-xl cursor-pointer"
                          title={tLabel('حذف', 'Delete')}
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-500 font-bold mb-4 leading-relaxed">
                      {sem.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-gray-150">
                        <span className="text-gray-400 font-bold block mb-1">{tLabel('تاريخ الإعلان ونشره:', 'Release Time:')}</span>
                        <span className="text-brand-dark font-black block font-mono">
                          {new Date(sem.announcementTime).toLocaleString(isAr ? 'ar-OM' : 'en-US')}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-gray-150">
                        <span className="text-gray-400 font-bold block mb-1">{tLabel('الموعد النهائي التلقائي:', 'Automated Lock:')}</span>
                        <span className="text-rose-600 font-black block font-mono">
                          {sem.stopRegistrationTime ? new Date(sem.stopRegistrationTime).toLocaleString(isAr ? 'ar-OM' : 'en-US') : tLabel('توقيت يدوي بمفتاح', 'Locked Manually')}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-gray-150 md:col-span-2">
                        <span className="text-gray-400 font-bold block mb-1">{tLabel('ملاحظات والضوابط بالبطاقة:', 'Rules Display Preview:')}</span>
                        <p className="text-brand-dark font-bold leading-normal truncate mb-0" title={sem.rules}>
                          {sem.rules || tLabel('لا توجد شروط خاصة مدمجة.', 'No core guidelines configured.')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (subView === 'students') {
    const filteredStudents = allStudents.filter(stud => {
      // Search term Match
      const fullName = (stud.firstName ? `${stud.firstName} ${stud.fatherName} ${stud.lastName}` : stud.name || '').toLowerCase();
      const email = (stud.email || '').toLowerCase();
      const phone = (stud.phone || '').toLowerCase();
      const stId = (stud.studentId || '').toLowerCase();
      const searchLower = studentSearch.toLowerCase();
      
      const matchesSearch = fullName.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower) || stId.includes(searchLower);
      
      // Approval Filter Match
      const isApproved = stud.approved === true;
      let matchesFilter = true;
      if (studentFilter === 'pending') matchesFilter = !isApproved;
      if (studentFilter === 'approved') matchesFilter = isApproved;

      return matchesSearch && matchesFilter;
    });

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3.5xl font-black text-brand-dark text-start">
              {t().studentList}
            </h2>
            <p className="text-xs text-slate-400 font-bold text-start mt-1">
              {lang === 'ar' ? 'إدارة واعتماد ملفات الطالبات الجدد وتحديث تصنيفات الإتقان' : 'Review and approve freshman registrations and verify levels.'}
            </p>
          </div>
          <button 
            className="px-5 py-2.5 border-2 border-brand-primary/40 text-brand-primary rounded-xl font-bold bg-white text-xs hover:bg-brand-neutral/50 transition-colors uppercase cursor-pointer"
            onClick={() => {
              setSubView('default');
              setEditingId(null);
            }}
          >
            {t().backToPanel}
          </button>
        </div>

        {/* Filter controls tab */}
        <div className="bg-white rounded-2xl border border-brand-primary/10 shadow-xs p-4 mb-6 select-none flex flex-col md:flex-row gap-4 items-center">
          
          {/* Search Input bar */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4 cursor-pointer" />
            <input 
              type="text"
              placeholder={lang === 'ar' ? 'ابحثي بالاسم الكامل، الرقم الجامعي، أو الهاتف...' : 'Search by name, ID, phone...'}
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-start"
            />
          </div>

          {/* Filtering segmented selectors */}
          <div className="flex gap-2 w-full md:w-auto justify-start md:justify-end">
            <button
              onClick={() => setStudentFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${studentFilter === 'all' ? 'bg-brand-primary text-white' : 'bg-slate-50 text-gray-500 border border-slate-150 hover:bg-slate-100'}`}
            >
              {lang === 'ar' ? 'الكل' : 'All'} ({allStudents.length})
            </button>
            <button
              onClick={() => setStudentFilter('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${studentFilter === 'pending' ? 'bg-amber-500 text-white' : 'bg-slate-50 text-gray-500 border border-slate-150 hover:bg-slate-100'}`}
            >
              {lang === 'ar' ? 'غير مفحوصة ⏳' : 'Not Checked ⏳'} ({allStudents.filter(s => !s.approved).length})
            </button>
            <button
              onClick={() => setStudentFilter('approved')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${studentFilter === 'approved' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-gray-500 border border-slate-150 hover:bg-slate-100'}`}
            >
              {lang === 'ar' ? 'مفحوصة ومعتمدة ✓' : 'Checked & Approved ✓'} ({allStudents.filter(s => s.approved).length})
            </button>
          </div>
        </div>

        {/* Display students list cards */}
        <div className="space-y-4 text-start">
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-brand-primary/10">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3 opacity-30" />
              <p className="text-gray-400 font-bold">
                {lang === 'ar' ? 'لا توجد طالبات مطابقة لهذا البحث.' : 'No students match your query.'}
              </p>
            </div>
          ) : (
            filteredStudents.map((stud, idx) => {
              const uKey = stud.studentId || stud.email;
              const isExpanded = editingId === uKey;
              const hasAudio = !!stud.voiceFileName;

              return (
                <div 
                  key={idx} 
                  className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${
                    isExpanded 
                      ? 'border-brand-primary ring-2 ring-brand-primary/10 shadow-lg' 
                      : 'border-brand-primary/10 hover:border-brand-primary/30 shadow-xs'
                  }`}
                >
                  {/* Summary row card click */}
                  <div 
                    className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 cursor-pointer select-none"
                    onClick={() => {
                      if (isExpanded) {
                        setEditingId(null);
                        setEditForm(null);
                      } else {
                        handleStartEdit(stud, uKey);
                      }
                    }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Full precise name as requested */}
                        <h4 className="text-sm sm:text-base font-extrabold text-brand-dark">
                          {getPreciseFullName(stud)}
                        </h4>
                        
                        {/* Review Status Tags */}
                        {stud.approved ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-md border border-emerald-100 font-black flex items-center gap-1">
                            ✓ {lang === 'ar' ? 'تم فحصها والموافقة' : 'Checked & Approved'}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-md border border-amber-100 font-black flex items-center gap-1 animate-pulse">
                            ⏳ {lang === 'ar' ? 'غير مفحوصة (جديد)' : 'Not Checked (New)'}
                          </span>
                        )}

                        {stud.isNew && (
                          <span className="text-[10px] bg-sky-50 text-sky-600 px-2 py-0.5 rounded-md border border-sky-100 font-black">
                            {lang === 'ar' ? 'تلاوة جديدة' : 'New Reciter'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-400 font-bold font-mono">
                        <span>📱 {stud.phone}</span>
                        <span>✉️ {stud.email}</span>
                        <span>🆔 {stud.studentId}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-end hidden sm:block">
                        <small className="text-slate-400 block text-[10px] font-black uppercase tracking-wider">
                          {lang === 'ar' ? 'المستوى' : 'Level'}
                        </small>
                        <span className="text-xs bg-brand-neutral text-brand-primary px-3 py-1 rounded-full border border-brand-primary/10 font-extrabold block mt-0.5">
                          {lang === 'ar' ? getArabicLevelName(stud.level) : stud.level}
                        </span>
                      </div>
                      
                      {/* Interaction trigger */}
                      <button className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-brand-primary" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expansion area with form and images */}
                  {isExpanded && editForm && (
                    <div className="border-t border-gray-100 bg-slate-50/50 p-6 space-y-6">
                      
                      {/* Grid for SQU University Card and recitation sound file */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        
                        {/* ID Card simulator */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs">
                          <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                            <CreditCard className="w-4 h-4 text-brand-primary" />
                            {lang === 'ar' ? 'صورة بطاقة الطالبة الجامعية السارية ' : 'SQU Student University ID Card'}
                          </h5>
                          
                          {/* SQU themed mock student card */}
                          <div className="relative w-full aspect-[1.58/1] bg-gradient-to-r from-emerald-850 to-emerald-900 rounded-xl overflow-hidden p-4 text-white shadow-md border border-emerald-950 flex flex-col justify-between">
                            {/* Card top banner */}
                            <div className="flex justify-between items-start">
                              <div className="text-start">
                                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-300 block">Sultan Qaboos University</span>
                                <span className="text-[8px] font-bold text-emerald-200 block text-start">جامعة السلطان قابوس</span>
                              </div>
                              <span className="text-[8px] bg-emerald-500/30 font-black px-1.5 py-0.5 rounded border border-emerald-500 text-emerald-300">STUDENT</span>
                            </div>

                            {/* Card details middle */}
                            <div className="flex gap-3 items-center my-2 text-start">
                              <img 
                                src={editForm.avatar || 'https://picsum.photos/seed/student_new/100/100'} 
                                alt="Student Card Avatar" 
                                className="w-12 h-12 rounded-lg object-cover border border-emerald-700 bg-emerald-950 shadow-xs"
                                referrerPolicy="no-referrer"
                              />
                              <div className="space-y-0.5 text-xs">
                                <div className="font-extrabold text-white text-[11px] truncate">
                                  {editForm.firstName ? `${editForm.firstName} ${editForm.lastName}` : editForm.name}
                                </div>
                                <div className="text-[9px] font-mono text-emerald-200 block">ID: {editForm.studentId || 'SQU65342'}</div>
                                <div className="text-[8px] text-emerald-300 font-bold">Coll: {editForm.college || 'Science'}</div>
                                <div className="text-[8px] text-emerald-300 font-bold">Cohort: {editForm.cohort || '2023'}</div>
                              </div>
                            </div>

                            {/* Card footer verification */}
                            <div className="flex justify-between items-center border-t border-emerald-800/60 pt-2">
                              <small className="text-[7px] text-emerald-300/80 font-mono">Attachment: {editForm.cardPicName}</small>
                              <span className="text-[6px] text-emerald-300 bg-white/10 px-1 py-0.5 rounded border border-emerald-600 font-extrabold">AUTHENTIC DOC</span>
                            </div>
                          </div>
                        </div>

                        {/* Audio clip player simulator */}
                        {hasAudio ? (
                          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs h-full flex flex-col justify-between">
                            <div>
                              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <AudioLines className="w-4 h-4 text-brand-primary" />
                                {lang === 'ar' ? 'ملف التلاوة الصوتي المرفق للتقييم' : 'Recitation Voice Specimen Audio'}
                              </h5>

                              {/* Interative Audio bar */}
                              <div className="bg-brand-neutral/40 rounded-xl p-4 border border-brand-primary/5 space-y-3">
                                <div className="flex items-center gap-3">
                                  {/* Play btn */}
                                  <button
                                    onClick={() => {
                                      if (playingId === uKey) {
                                        setPlayingId(null);
                                      } else {
                                        setPlayingId(uKey);
                                      }
                                    }}
                                    className="w-10 h-10 rounded-full bg-brand-primary hover:bg-brand-accent text-white flex items-center justify-center cursor-pointer shadow-md transition-transform active:scale-95"
                                  >
                                    {playingId === uKey ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white translate-x-0.5" />}
                                  </button>

                                  <div className="flex-1">
                                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1">
                                      <span>{lang === 'ar' ? 'عينة التلاوة - سورة الفاتحة' : 'Fatiha Recitation Specimen'}</span>
                                      <span className="font-mono">00:{audioTime < 10 ? '0' + audioTime : audioTime} / 00:{audioDuration}</span>
                                    </div>

                                    {/* Simulated seek string */}
                                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden relative">
                                      <div 
                                        className="h-full bg-brand-primary transition-all duration-300"
                                        style={{ width: `${(audioTime / audioDuration) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>

                                {/* Graphic visualizer bars */}
                                <div className="flex justify-center items-end gap-0.5 h-10 pt-2 px-6">
                                  {[5, 12, 18, 25, 40, 32, 10, 15, 26, 42, 50, 31, 20, 24, 39, 45, 12, 8, 22, 35, 48, 15, 6].map((hei, bIdx) => (
                                    <span 
                                      key={bIdx} 
                                      className={`w-1 rounded-t-sm transition-all duration-500 ${playingId === uKey ? 'bg-brand-primary' : 'bg-slate-300'}`}
                                      style={{ 
                                        height: playingId === uKey 
                                          ? `${Math.max(4, Math.sin(audioTime + bIdx) * (hei / 1.3) + (hei / 1.5))}%` 
                                          : `4px` 
                                      }}
                                    ></span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <p className="text-[10px] text-brand-primary font-bold bg-brand-primary/5 p-2 rounded-lg border border-brand-primary/10 mt-2 text-center">
                              💡 {lang === 'ar' ? 'استمعي للملف الصوتي ثم حددي لها تصنيف الإتقان المناسب بالأسفل.' : 'Listen to this reciter then categorize her mastery level below.'}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs h-full flex flex-col justify-center items-center text-center py-10">
                            <AudioLines className="w-8 h-8 text-slate-300 mb-2" />
                            <p className="text-gray-400 text-xs font-bold font-mono">
                              {lang === 'ar' ? 'لا يوجد ملف صوتي مرفق (هذه مستخدمة سابقة مفحوصة)' : 'No audio sample attached (Verified existing user)'}
                            </p>
                          </div>
                        )}

                      </div>

                      {/* Info modifiers form fields */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs space-y-4">
                        <h5 className="text-sm font-black text-slate-600 block border-b border-slate-100 pb-2">
                          {lang === 'ar' ? 'تعديل بيانات الحساب واعتماده' : 'Expose Information & Update Account'}
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div>
                            <label className="text-xs font-black text-slate-400 block mb-1">{lang === 'ar' ? 'الاسم الأول' : 'First Name'}</label>
                            <input 
                              type="text"
                              value={editForm.firstName || ''}
                              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary focus:outline-none rounded-xl px-3 py-2 text-xs font-bold text-start"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-black text-slate-400 block mb-1">{lang === 'ar' ? 'اسم الأب' : "Father's Name"}</label>
                            <input 
                              type="text"
                              value={editForm.fatherName || ''}
                              onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary focus:outline-none rounded-xl px-3 py-2 text-xs font-bold text-start"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-black text-slate-400 block mb-1">{lang === 'ar' ? 'اسم الجد' : "Grandfather's Name"}</label>
                            <input 
                              type="text"
                              value={editForm.grandfatherName || ''}
                              onChange={(e) => setEditForm({ ...editForm, grandfatherName: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary focus:outline-none rounded-xl px-3 py-2 text-xs font-bold text-start"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-black text-slate-400 block mb-1">{lang === 'ar' ? 'القبيلة (لقب العائلة)' : 'Family Name'}</label>
                            <input 
                              type="text"
                              value={editForm.lastName || ''}
                              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary focus:outline-none rounded-xl px-3 py-2 text-xs font-bold text-start"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs font-black text-slate-400 block mb-1">{lang === 'ar' ? 'رقم الهاتف والتواصل' : 'Phone Number'}</label>
                            <input 
                              type="text"
                              value={editForm.phone || ''}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary focus:outline-none rounded-xl px-3 py-2 text-xs font-mono font-bold text-ltr"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-black text-slate-400 block mb-1">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
                            <input 
                              type="email"
                              value={editForm.email || ''}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary focus:outline-none rounded-xl px-3 py-2 text-xs font-mono font-bold text-ltr"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-black text-slate-400 block mb-1">{lang === 'ar' ? 'الرقم الجامعي' : 'Student ID'}</label>
                            <input 
                              type="text"
                              value={editForm.studentId || ''}
                              onChange={(e) => setEditForm({ ...editForm, studentId: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary focus:outline-none rounded-xl px-3 py-2 text-xs font-mono font-bold text-ltr"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs font-black text-slate-400 block mb-1">{lang === 'ar' ? 'الكلية' : 'College'}</label>
                            <select 
                              value={editForm.college || ''}
                              onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/5 focus:outline-none rounded-xl px-3 py-2 text-xs font-bold text-start"
                            >
                              <option value="">{lang === 'ar' ? '-- اختاري الكلية --' : '-- Select SQU College --'}</option>
                              <option value="العلوم الزراعية والبحرية">العلوم الزراعية والبحرية (Agri)</option>
                              <option value="الآداب والعلوم الاجتماعية">الآداب والعلوم الاجتماعية (Arts)</option>
                              <option value="الإقتصاد والعلوم السياسية">الإقتصاد والعلوم السياسية (Econ)</option>
                              <option value="التربية">التربية (Education)</option>
                              <option value="الهندسة">الهندسة (Engineering)</option>
                              <option value="الحقوق">الحقوق (Law)</option>
                              <option value="الطب والعلوم الصحية">الطب والعلوم الصحية (Medicine)</option>
                              <option value="العلوم">العلوم (Science)</option>
                              <option value="التمريض">التمريض (Nursing)</option>
                              <option value="Other">أخرى (Other)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-black text-slate-400 block mb-1">{lang === 'ar' ? 'الدفعة الأكاديمية (Cohort)' : 'Cohort Year'}</label>
                            <input 
                              type="text"
                              value={editForm.cohort || ''}
                              onChange={(e) => setEditForm({ ...editForm, cohort: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary focus:outline-none rounded-xl px-3 py-2 text-xs font-mono font-bold text-ltr"
                            />
                          </div>

                          {/* Classification dropdown in Arabic */}
                          <div>
                            <label className="text-xs font-black text-slate-500 block mb-1 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary block"></span>
                              <span>🔑 {lang === 'ar' ? 'تصنيف مستوى الإتقان ' : 'Mastery Classification'}</span>
                            </label>
                            <select
                              value={editForm.level || ''}
                              onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                              className="w-full bg-slate-50 border border-brand-primary/40 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/5 focus:outline-none rounded-xl px-3 py-2 text-xs font-black text-brand-primary text-start"
                            >
                              <option value="غير مصنفة">{lang === 'ar' ? 'غير مصنفة' : 'Not Categorized'}</option>
                              <option value="مبتدئة">{lang === 'ar' ? 'مبتدئة' : 'Beginner'}</option>
                              <option value="تمهيدية">{lang === 'ar' ? 'تمهيدية' : 'Introductory'}</option>
                              <option value="متقدمة">{lang === 'ar' ? 'متقدمة' : 'Advanced'}</option>

                            </select>
                          </div>
                        </div>

                        {/* Save Trigger Actions */}
                        <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 mt-2">
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditForm(null);
                            }}
                            className="px-4 py-2 text-xs font-black text-slate-500 hover:bg-slate-150 rounded-xl transition-colors cursor-pointer"
                          >
                            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                          </button>
                          
                          <button
                            onClick={() => handleSaveUser('STUDENT')}
                            className="bg-brand-primary hover:bg-brand-accent text-white px-5 py-2 rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>
                              {stud.approved 
                                ? (lang === 'ar' ? 'حفظ التغييرات فقط' : 'Save Changes Only')
                                : (lang === 'ar' ? 'تصنيف واعتماد حساب الطالبة ✓' : 'Verify & Approve Student Account ✓')
                              }
                            </span>
                          </button>
                        </div>

                      </div>

                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  if (subView === 'teachers') {
    const filteredTeachers = allTeachers.filter(teach => {
      const fullName = (teach.firstName ? `${teach.firstName} ${teach.fatherName} ${teach.lastName}` : teach.name || '').toLowerCase();
      const email = (teach.email || '').toLowerCase();
      const phone = (teach.phone || '').toLowerCase();
      const emId = (teach.employeeId || '').toLowerCase();
      const searchLower = teacherSearch.toLowerCase();
      
      const matchesSearch = fullName.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower) || emId.includes(searchLower);
      
      const isApproved = teach.approved === true;
      let matchesFilter = true;
      if (teacherFilter === 'pending') matchesFilter = !isApproved;
      if (teacherFilter === 'approved') matchesFilter = isApproved;

      return matchesSearch && matchesFilter;
    });

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3.5xl font-black text-brand-dark text-start">
              {t().teacherList}
            </h2>
            <p className="text-xs text-slate-400 font-bold text-start mt-1">
              {lang === 'ar' ? 'إدارة واعتماد ملفات المعلمات الجدد وحالات التدريس المقررة' : 'Review and approve teacher accounts and configure teachings.'}
            </p>
          </div>
          <button 
            className="px-5 py-2.5 border-2 border-brand-primary/40 text-brand-primary rounded-xl font-bold bg-white text-xs hover:bg-brand-neutral/50 transition-colors uppercase cursor-pointer"
            onClick={() => {
              setSubView('default');
              setEditingId(null);
            }}
          >
            {t().backToPanel}
          </button>
        </div>

        {/* Filters control block */}
        <div className="bg-white rounded-2xl border border-brand-primary/10 shadow-xs p-4 mb-6 select-none flex flex-col md:flex-row gap-4 items-center">
          
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4 cursor-pointer" />
            <input 
              type="text"
              placeholder={lang === 'ar' ? 'ابحثي بالاسم الكامل، الرقم الوظيفي، أو الهاتف...' : 'Search teachers...'}
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-start"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto justify-start md:justify-end">
            <button
              onClick={() => setTeacherFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${teacherFilter === 'all' ? 'bg-brand-primary text-white' : 'bg-slate-50 text-gray-500 border border-slate-150 hover:bg-slate-100'}`}
            >
              {lang === 'ar' ? 'الكل' : 'All'} ({allTeachers.length})
            </button>
            <button
              onClick={() => setTeacherFilter('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${teacherFilter === 'pending' ? 'bg-amber-500 text-white' : 'bg-slate-50 text-gray-500 border border-slate-150 hover:bg-slate-100'}`}
            >
              {lang === 'ar' ? 'لم يرخص بعد ⏳' : 'Not Checked ⏳'} ({allTeachers.filter(t => !t.approved).length})
            </button>
            <button
              onClick={() => setTeacherFilter('approved')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${teacherFilter === 'approved' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-gray-500 border border-slate-150 hover:bg-slate-100'}`}
            >
              {lang === 'ar' ? 'مرخص معتمد ✓' : 'Checked & Approved ✓'} ({allTeachers.filter(t => t.approved).length})
            </button>
          </div>
        </div>

        {/* Display teachers list */}
        <div className="space-y-4 text-start">
          {filteredTeachers.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-brand-primary/10">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3 opacity-30" />
              <p className="text-gray-400 font-bold">
                {lang === 'ar' ? 'لا توجد معلمات مطابقة لهذا البحث.' : 'No teachers match your query.'}
              </p>
            </div>
          ) : (
            filteredTeachers.map((teach, idx) => {
              const uKey = teach.employeeId || teach.email;
              const isExpanded = editingId === uKey;

              return (
                <div 
                  key={idx} 
                  className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${
                    isExpanded 
                      ? 'border-brand-primary ring-2 ring-brand-primary/10 shadow-lg' 
                      : 'border-brand-primary/10 hover:border-brand-primary/30 shadow-xs'
                  }`}
                >
                  {/* Summary card item */}
                  <div 
                    className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 cursor-pointer select-none"
                    onClick={() => {
                      if (isExpanded) {
                        setEditingId(null);
                        setEditForm(null);
                      } else {
                        handleStartEdit(teach, uKey);
                      }
                    }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm sm:text-base font-extrabold text-brand-dark">
                          {getPreciseFullName(teach)}
                        </h4>
                        
                        {teach.approved ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-md border border-emerald-100 font-black flex items-center gap-1">
                            ✓ {lang === 'ar' ? 'معتمد ومفحوص ذو ترخيص' : 'Checked & Approved'}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-md border border-amber-100 font-black flex items-center gap-1 animate-pulse">
                            ⏳ {lang === 'ar' ? 'غير مفحوص (معلمة جديدة)' : 'Pending Review (New Teacher)'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-400 font-bold font-mono">
                        <span>📱 {teach.phone}</span>
                        <span>✉️ {teach.email}</span>
                        <span>🆔 {teach.employeeId || '---'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex flex-col items-end shrink-0 select-none">
                        {teach.role === 'ADMIN' ? (
                          <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-md border border-amber-600 font-black block">
                            👑 {lang === 'ar' ? 'مشرفة إدارية' : 'Admin Coordinator'}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200 font-extrabold block">
                            {lang === 'ar' ? 'معلمة تلاوة' : 'Teacher'}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTeacherAdmin(teach.email);
                          }}
                          className={`text-[9px] px-2 py-1 rounded-md font-black block mt-1 transition-all cursor-pointer border hover:scale-102 active:scale-95 select-none ${
                            teach.role === 'ADMIN'
                              ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                              : 'bg-amber-50 text-amber-650 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {teach.role === 'ADMIN'
                            ? (lang === 'ar' ? 'إخطار كمعلمة كلاسيكية' : 'Set as Simple Mentor')
                            : (lang === 'ar' ? 'ترقية لمشرفة نظام 🔑' : 'Promote to Admin 🔑')
                          }
                        </button>
                      </div>

                      <div className="text-end hidden sm:block">
                        <small className="text-slate-400 block text-[10px] font-black uppercase tracking-wider">
                          {lang === 'ar' ? 'الصفة / الترخيص' : 'Role'}
                        </small>
                        <span className="text-xs bg-brand-warm/15 text-brand-dark px-3 py-1 rounded-full border border-brand-warm/25 font-extrabold block mt-0.5">
                          {teach.level}
                        </span>
                      </div>
                      
                      <button className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-brand-primary" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expansion with teachers details form (No ID card and no audio clip, as requested) */}
                  {isExpanded && editForm && (
                    <div className="border-t border-gray-100 bg-slate-50/50 p-6 space-y-4">
                      
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs space-y-4">
                        <h5 className="text-sm font-black text-slate-600 block border-b border-slate-100 pb-2">
                          {lang === 'ar' ? 'مراجعة وتعديل بيانات المعلمة وحالة اعتمادها' : 'Modify Teacher Account & Review Credentials'}
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div>
                            <label className="text-xs font-black text-slate-400 block mb-1">{lang === 'ar' ? 'الاسم الأول' : 'First Name'}</label>
                            <input 
                              type="text"
                              value={editForm.firstName || ''}
                              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary focus:outline-none rounded-xl px-3 py-2 text-xs font-bold text-start"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-black text-slate-400 block mb-1">{lang === 'ar' ? 'اسم الأب' : "Father's Name"}</label>
                            <input 
                              type="text"
                              value={editForm.fatherName || ''}
                              onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary focus:outline-none rounded-xl px-3 py-2 text-xs font-bold text-start"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-black text-slate-400 block mb-1">{lang === 'ar' ? 'اسم الجد' : "Grandfather's Name"}</label>
                            <input 
                              type="text"
                              value={editForm.grandfatherName || ''}
                              onChange={(e) => setEditForm({ ...editForm, grandfatherName: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary focus:outline-none rounded-xl px-3 py-2 text-xs font-bold text-start"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-black text-slate-400 block mb-1">{lang === 'ar' ? 'القبيلة (اسم العائلة)' : 'Family Name'}</label>
                            <input 
                              type="text"
                              value={editForm.lastName || ''}
                              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary focus:outline-none rounded-xl px-3 py-2 text-xs font-bold text-start"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs font-black text-slate-400 block mb-1">{lang === 'ar' ? 'رقم الهاتف والتواصل' : 'Phone Number'}</label>
                            <input 
                              type="text"
                              value={editForm.phone || ''}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary focus:outline-none rounded-xl px-3 py-2 text-xs font-mono font-bold text-ltr"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-black text-slate-400 block mb-1">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
                            <input 
                              type="email"
                              value={editForm.email || ''}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary focus:outline-none rounded-xl px-3 py-2 text-xs font-mono font-bold text-ltr"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-black text-slate-400 block mb-1">{lang === 'ar' ? 'الرقم الوظيفي / الرقم التعريفي' : 'Employee ID / Work ID'}</label>
                            <input 
                              type="text"
                              value={editForm.employeeId || ''}
                              onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary focus:outline-none rounded-xl px-3 py-2 text-xs font-mono font-bold text-ltr"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs font-black text-slate-400 block mb-1">{lang === 'ar' ? 'الكلية' : 'College'}</label>
                            <select 
                                value={editForm.college || ''}
                                onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/5 focus:outline-none rounded-xl px-3 py-2 text-xs font-bold text-start"
                            >
                              <option value="">{lang === 'ar' ? '-- اختاري الكلية --' : '-- Select SQU College --'}</option>
                              <option value="العلوم الزراعية والبحرية">العلوم الزراعية والبحرية (Agri)</option>
                              <option value="الآداب والعلوم الاجتماعية">الآداب والعلوم الاجتماعية (Arts)</option>
                              <option value="الإقتصاد والعلوم السياسية">الإقتصاد والعلوم السياسية (Econ)</option>
                              <option value="التربية">التربية (Education)</option>
                              <option value="الهندسة">الهندسة (Engineering)</option>
                              <option value="الحقوق">الحقوق (Law)</option>
                              <option value="الطب والعلوم الصحية">الطب والعلوم الصحية (Medicine)</option>
                              <option value="العلوم">العلوم (Science)</option>
                              <option value="التمريض">التمريض (Nursing)</option>
                              <option value="Other">أخرى (Other)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-black text-slate-500 block mb-1">🔑 {lang === 'ar' ? 'الإجازة الحالية / مستوى التصنيف التدريسي' : 'Assigned Teaching Level'}</label>
                            <select
                              value={editForm.level || ''}
                              onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                              className="w-full bg-slate-50 border border-brand-primary/30 focus:border-brand-primary focus:outline-none rounded-xl px-3 py-2 text-xs font-black text-brand-primary text-start"
                            >
                              <option value="مجازة">{lang === 'ar' ? 'مجازة' : 'Certified / Mujazah'}</option>
                              <option value="طالبة اقراء">{lang === 'ar' ? 'طالبة اقراء' : 'Iqraa Student'}</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-black text-slate-500 block mb-1">👑 {lang === 'ar' ? 'صلاحية وإشراف النظام' : 'System Account Role'}</label>
                            <select
                              value={editForm.role || 'TEACHER'}
                              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                              className="w-full bg-slate-50 border border-brand-primary/30 focus:border-brand-primary focus:outline-none rounded-xl px-3 py-2 text-xs font-black text-brand-primary text-start"
                            >
                              <option value="TEACHER">{lang === 'ar' ? 'معلمة تلاوة (Teacher)' : 'Recitation Teacher'}</option>
                              <option value="ADMIN">{lang === 'ar' ? 'مشرفة إدارية (Admin)' : 'Admin Coordinator'}</option>
                            </select>
                          </div>
                        </div>

                        {/* Save Trigger Actions for teacher */}
                        <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 mt-2">
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditForm(null);
                            }}
                            className="px-4 py-2 text-xs font-black text-slate-500 hover:bg-slate-150 rounded-xl transition-colors cursor-pointer"
                          >
                            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                          </button>
                          
                          <button
                            onClick={() => handleSaveUser('TEACHER')}
                            className="bg-brand-primary hover:bg-brand-accent text-white px-5 py-2 rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>
                              {teach.approved 
                                ? (lang === 'ar' ? 'حفظ التغييرات فقط' : 'Save Changes Only')
                                : (lang === 'ar' ? 'الترخيص والموافقة على حساب المعلمة ✓' : 'Approve Teacher Account ✓')
                              }
                            </span>
                          </button>
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-start select-none">
      
      {/* Visual Header */}
      <div className="mb-8 border-b border-gray-100 pb-5">
        <span className="text-[10px] bg-brand-primary/10 text-brand-primary font-black px-2.5 py-1 rounded-md uppercase tracking-wider block w-fit mb-2">
          SQU Administrative Panel • جامعة السلطان قابوس
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-brand-dark">
          {t().adminControlPanel}
        </h2>
        <p className="text-gray-400 text-xs font-bold block mt-1">
          {lang === 'ar'
            ? 'بوابة ضبط حسابات النظام، معلمات التلاوة والمقرأة، وإعداد الفصول الفعالة والتسكين الذكي.'
            : 'SQU System Portal: configure member registries, manage recitation supervisors, set semesters, and run placement allocations.'
          }
        </p>
      </div>

      {/* Two Modular Tools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Tool 1: Accounts Access & System Roles Manager */}
        <div className="bg-white rounded-3xl border border-brand-primary/15 shadow-sm p-6 sm:p-8 flex flex-col justify-between hover:border-brand-primary/25 transition-all">
          <div className="space-y-4">
            <div className="bg-brand-primary/10 p-4 rounded-2xl text-brand-primary w-fit">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-brand-dark">
                {lang === 'ar' ? '١. أداة إدارة حسابات مستخدمي النظام الجديد' : '1. Accounts & System Access Directory'}
              </h3>
              <p className="text-xs text-slate-400 font-bold leading-relaxed block mt-2">
                {lang === 'ar'
                  ? 'التحقق والموافقة على طلبات التسجيل الجديدة للطالبات والمعلمات، وضبط مستويات Mastery والأرقام الجامعية والوظيفية، وتعيين أو سحب صلاحيات الإدارية والمشرفة.'
                  : 'Sift through incoming student and teacher registrants, edit academic classifications, and promote/demote administrative coordinators.'
                }
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <button
              onClick={() => setSubView('students')}
              className="px-5 py-4 bg-brand-primary hover:bg-brand-accent text-white rounded-2xl text-xs font-black shadow-md shrink-0 transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>👥</span>
              <span>{lang === 'ar' ? 'إدارة حسابات الطالبات' : 'Manage Students Directory'}</span>
            </button>

            <button
              onClick={() => setSubView('teachers')}
              className="px-5 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-black shadow-md shrink-0 transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>👩‍🏫</span>
              <span>{lang === 'ar' ? 'إدارة حسابات المعلمات' : 'Manage Teachers Directory'}</span>
            </button>
          </div>
        </div>

        {/* Tool 2: Intakes, Semesters, and Sessions Allocation Manager */}
        <div className="bg-white rounded-3xl border border-brand-primary/15 shadow-sm p-6 sm:p-8 flex flex-col justify-between hover:border-brand-primary/25 transition-all">
          <div className="space-y-4">
            <div className="bg-brand-primary/[0.03] border border-brand-primary/10 p-4 rounded-2xl text-emerald-600 w-fit">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-brand-dark">
                {lang === 'ar' ? '٢. أداة تهيئة وإدارة الفصول والتسجيل' : '2. Semesters, Intakes & Session Allocation'}
              </h3>
              <p className="text-xs text-slate-400 font-bold leading-relaxed block mt-2">
                {lang === 'ar'
                  ? 'تصميم وإطلاق فصول دراسية جديدة، تنظيم فترات استقبال طلبات التسجيل للمقرأة وجدولة فترات الإغلاق، وتوزيع الطالبات آلياً وتلقائياً أو يدوياً عبر تصميم الحلقات الفرعية.'
                  : 'Formulate academic calendar semesters, configure registration cutoff timelines, draft recitation sessions, and allocate members.'
                }
              </p>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => setSubView('semesters')}
              className="w-full px-5 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md shrink-0 transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>📅</span>
              <span>
                {lang === 'ar' ? 'إدارة الفصول والتسكين والفرز والتفويج ✦' : 'Configure Calendars & Circle Allocations ✦'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
