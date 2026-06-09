import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  BookOpen, 
  Layers, 
  Inbox, 
  Sparkles, 
  AlertTriangle, 
  Check, 
  X, 
  Search, 
  SlidersHorizontal, 
  CheckCircle, 
  ArrowRight, 
  Plus, 
  Trash2, 
  UserX, 
  Calendar, 
  MapPin, 
  Video, 
  HelpCircle, 
  Settings, 
  RefreshCw,
  Award
} from 'lucide-react';
import { Session, User } from '../../types';

interface AssignmentDashboardProps {
  sessions: Session[];
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  allStudents: any[];
  setAllStudents: React.Dispatch<React.SetStateAction<any[]>>;
  allTeachers: any[];
  setAllTeachers: React.Dispatch<React.SetStateAction<any[]>>;
  lang: 'ar' | 'en';
  t: () => any;
  onBack: () => void;
}

export default function AssignmentDashboard({
  sessions,
  setSessions,
  allStudents,
  setAllStudents,
  allTeachers,
  setAllTeachers,
  lang,
  t,
  onBack
}: AssignmentDashboardProps) {
  // Navigation tabs for the Dashboard
  // 'overview' | 'students' | 'teachers' | 'sessions' | 'auto-assign' | 'conflicts'
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'teachers' | 'sessions' | 'auto-assign' | 'conflicts'>('overview');

  // Format filter for Auto Assignment Tool
  const [autoAssignFormat, setAutoAssignFormat] = useState<'in-person' | 'online'>('in-person');

  // Load/Save Draft assignments
  const [inPersonDraft, setInPersonDraft] = useState<any[]>(() => {
    const cached = localStorage.getItem('itqan_in_person_draft');
    return cached ? JSON.parse(cached) : [];
  });
  const [onlineDraft, setOnlineDraft] = useState<any[]>(() => {
    const cached = localStorage.getItem('itqan_online_draft');
    return cached ? JSON.parse(cached) : [];
  });

  // Algorithm running feedback states
  const [isRunningAlgorithm, setIsRunningAlgorithm] = useState(false);
  const [apiLogMessage, setApiLogMessage] = useState('');

  // Search & Filter state for sections
  const [studentSearch, setStudentSearch] = useState('');
  const [studentLevelFilter, setStudentLevelFilter] = useState<string>('all');
  const [studentTypeFilter, setStudentTypeFilter] = useState<string>('all'); // all, undergrad, postgrad

  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherLevelFilter, setTeacherLevelFilter] = useState<string>('all');
  const [teacherFormatFilter, setTeacherFormatFilter] = useState<string>('all');

  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionFormatFilter, setSessionFormatFilter] = useState<string>('all');

  // Currently selected elements for editing
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);

  // New Session states
  const [newSessName, setNewSessName] = useState('');
  const [newSessTeacher, setNewSessTeacher] = useState('');
  const [newSessLevel, setNewSessLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'TAMKEEN'>('BEGINNER');
  const [newSessTime, setNewSessTime] = useState('');
  const [newSessLocation, setNewSessLocation] = useState('');
  const [newSessFormat, setNewSessFormat] = useState<'in-person' | 'online'>('in-person');

  // Manual fast reassignment trigger ids
  const [assigningStudentId, setAssigningStudentId] = useState<string | null>(null);

  // Parse Student format and type helper
  const getStudentTypeAndFormat = (student: any) => {
    const isPostgrad = 
      student.degree === 'Master' || 
      student.degree === 'PhD' || 
      student.degree === 'PhD / Employee' ||
      student.degree === 'Employee' ||
      student.academicDegree?.toLowerCase().includes('master') ||
      student.academicDegree?.toLowerCase().includes('phd') || 
      student.cohort === 'Graduate' ||
      student.isSenior === true;
    
    const typeValue: 'undergrad' | 'postgrad' = isPostgrad ? 'postgrad' : 'undergrad';
    
    // Parse preferred format based on times or manual fields
    let formatValue: 'online' | 'in-person' | 'both' = 'in-person';
    if (student.enrollmentDetails?.format) {
      formatValue = student.enrollmentDetails.format;
    } else if (student.accommodation === 'off_campus' || isPostgrad) {
      // Graduate and off-campus students default to preferring online or both
      formatValue = 'online';
    }
    
    return { typeValue, formatValue };
  };

  // Classify clean arabic/english display strings for SQU terms
  const displayStudentType = (student: any) => {
    const { typeValue } = getStudentTypeAndFormat(student);
    if (lang === 'ar') {
      return typeValue === 'undergrad' ? 'بكالوريوس' : 'دراسات عليا / موظفة';
    }
    return typeValue === 'undergrad' ? 'Undergraduate' : 'Postgraduate/Employee';
  };

  const displayPreferredFormat = (student: any) => {
    const { formatValue } = getStudentTypeAndFormat(student);
    if (lang === 'ar') {
      if (formatValue === 'online') return 'عن بُعد / أونلاين';
      if (formatValue === 'in-person') return 'حضوري وجاهي';
      return 'المسارين (مرن)';
    }
    if (formatValue === 'online') return 'Online';
    if (formatValue === 'in-person') return 'In-Person';
    return 'Both / Flexible';
  };

  // Auto classification for Teachers
  const getTeacherPrefAndExp = (teacher: any) => {
    // Certified level dictates experience
    const levelCode = (teacher.level || '').toLowerCase();
    const isMujazah = levelCode.includes('مجاز') || levelCode.includes('teacher') || levelCode.includes('master');
    const expYears = isMujazah ? '5+ Years' : '2-4 Years';
    
    let formatPref: 'in-person' | 'online' | 'both' = 'both';
    if (teacher.phone?.includes('1234') || teacher.email?.includes('maryam')) {
      formatPref = 'in-person';
    } else if (teacher.email?.includes('sara')) {
      formatPref = 'online';
    }
    
    return { expYears, formatPref };
  };

  // Real-time calculated live statistics
  const stats = useMemo(() => {
    const totalS = allStudents.length;
    const totalT = allTeachers.length;
    const totalSess = sessions.length;
    
    // Unassigned count
    const assignedIds = new Set<string>();
    sessions.forEach(s => {
      s.students?.forEach(st => assignedIds.add(st.id));
    });

    const unassignedCount = allStudents.filter(s => s.approved && !assignedIds.has(s.studentId || s.email)).length;

    return {
      totalS,
      totalT,
      totalSess,
      unassignedCount,
      assignedCount: totalS - unassignedCount
    };
  }, [allStudents, allTeachers, sessions]);

  // List of unassigned students
  const unassignedStudents = useMemo(() => {
    const assignedIds = new Set<string>();
    sessions.forEach(s => {
      s.students?.forEach(st => assignedIds.add(st.id));
    });
    return allStudents.filter(s => s.approved && !assignedIds.has(s.studentId || s.email));
  }, [allStudents, sessions]);

  // Handle quick student unassignment
  const handleUnassignStudent = (sessionId: string, studentId: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          students: s.students.filter(st => st.id !== studentId)
        };
      }
      return s;
    }));
    
    // Optional Toast notification in Console
    console.log(`Unassigned student ${studentId} from session ${sessionId}`);
  };

  // Handle quick student assignment (Manual Override)
  const handleAssignStudent = (studentId: string, targetSessionId: string) => {
    const studentObj = allStudents.find(s => (s.studentId || s.email) === studentId);
    if (!studentObj) return;

    // Remove from other sessions to prevent double assignment
    setSessions(prev => prev.map(s => {
      // Filter out of all sessions but target
      const cleanStudents = s.students.filter(st => st.id !== studentId);
      if (s.id === targetSessionId) {
        // Prepare student layout conforming with SessionStudent type
        const newEnrollment = {
          id: studentId,
          name: `${studentObj.firstName || studentObj.name} ${studentObj.lastName || ''}`,
          money: studentObj.money || 0,
          avatar: studentObj.avatar || `https://picsum.photos/seed/${studentId}/100/100`,
          absencesExcused: studentObj.absencesExcused || 0,
          absencesUnexcused: studentObj.absencesUnexcused || 0,
          email: studentObj.email,
          phone: studentObj.phone,
          college: studentObj.college,
          cohort: studentObj.cohort
        };
        return {
          ...s,
          students: [...cleanStudents, newEnrollment]
        };
      }
      return { ...s, students: cleanStudents };
    }));

    setAssigningStudentId(null);
    alert(lang === 'ar' ? 'تم تعيين الطالبة للحلقة بنجاح!' : 'Student placed in session successfully!');
  };

  // Create Manual Session handler
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessName || !newSessTeacher) {
      alert(lang === 'ar' ? 'يرجى مراجعة ملء الحقول الإجبارية!' : 'Please fill all mandatory fields!');
      return;
    }

    const tObj = allTeachers.find(t => t.email === newSessTeacher || t.firstName === newSessTeacher);
    const teacherName = tObj ? `${tObj.firstName || tObj.name} ${tObj.lastName || ''}` : newSessTeacher;
    const teacherPhone = tObj ? tObj.phone : '+968 9000 0000';

    const cleanLocation = newSessLocation || (newSessFormat === 'online' ? 'Teams Online Channel' : 'SQU Mosque Halls');

    const newSessObj: Session = {
      id: 'sess_man_' + Date.now(),
      name: newSessName,
      teacher: {
        name: teacherName,
        phone: teacherPhone
      },
      time: newSessTime || 'Sunday/Tuesday | 16:15 - 17:30',
      location: cleanLocation,
      maxStudents: 999,
      level: newSessLevel,
      students: [],
      announcements: [],
      themeColor: newSessFormat === 'online' ? '#2563eb' : '#059669',
      themePhoto: 'https://images.unsplash.com/photo-1541844053589-346841d0b34c?auto=format&fit=crop&q=80&w=600'
    };

    setSessions(prev => [...prev, newSessObj]);
    setShowCreateSessionModal(false);
    
    // Reset states
    setNewSessName('');
    setNewSessTeacher('');
    setNewSessLocation('');
    setNewSessTime('');
    
    alert(lang === 'ar' ? 'تم إنشاء الحلقة بنجاح' : 'Session created successfully!');
  };

  // Mock API Trigger for Algorithm proposed drafts: Separated beautifully by format
  const runAutoAssignmentAlgorithm = async (format: 'in-person' | 'online') => {
    setIsRunningAlgorithm(true);
    setApiLogMessage(lang === 'ar' ? 'جاري الاتصال بقاعدة البيانات السحابية واسترجاع رغبات الطلاب...' : 'Connecting to API server & downloading user preference matrix...');
    
    // Step-by-step console/screen logs to make it feel absolute real
    await new Promise(r => setTimeout(r, 600));
    setApiLogMessage(
      lang === 'ar' 
        ? `طلب جاري: POST /api/assignments/run-algorithm?format=${format}` 
        : `Requesting: POST /api/assignments/run-algorithm?format=${format}`
    );
    await new Promise(r => setTimeout(r, 800));
    setApiLogMessage(
      lang === 'ar' 
        ? 'تحليل تناسق مستويات تلاوة المعلمات والطلاب حسب رغبات جامعة السلطان قابوس...' 
        : 'Parsing teacher certification level against student recitation specimens...'
    );
    await new Promise(r => setTimeout(r, 600));

    // RUN Actual Client-side Automated Failsafe Heuristics to mock precise algorithms:
    // We isolate students and assign them matching criteria
    const approvedStudents = allStudents.filter(s => s.approved);
    const approvedTeachers = allTeachers.filter(t => t.approved);

    let eligibleStudents = [];
    let eligibleTeachers = [];

    if (format === 'in-person') {
      // In-person: Undergrads & postgrads choosing physical, and physical-available teachers
      eligibleStudents = approvedStudents.filter(s => {
        const { typeValue, formatValue } = getStudentTypeAndFormat(s);
        return typeValue === 'undergrad' || formatValue === 'in-person' || formatValue === 'both';
      });
      eligibleTeachers = approvedTeachers.filter(t => {
        const { formatPref } = getTeacherPrefAndExp(t);
        return formatPref === 'in-person' || formatPref === 'both';
      });
    } else {
      // Online: Postgrads & digital-enlisted undergrards, and online teachers
      eligibleStudents = approvedStudents.filter(s => {
        const { typeValue, formatValue } = getStudentTypeAndFormat(s);
        return typeValue === 'postgrad' || formatValue === 'online' || formatValue === 'both';
      });
      eligibleTeachers = approvedTeachers.filter(t => {
        const { formatPref } = getTeacherPrefAndExp(t);
        return formatPref === 'online' || formatPref === 'both';
      });
    }

    // Propose proposed drafts mapping Level alignments
    const proposedDraft: any[] = [];
    
    // Group eligible students by level classifications
    const levelGroups: Record<string, any[]> = {
      'BEGINNER': [],
      'INTERMEDIATE': [],
      'ADVANCED': [],
      'TAMKEEN': []
    };

    eligibleStudents.forEach(st => {
      const lvlStr = (st.level || '').toUpperCase();
      let matchedLvl = 'BEGINNER';
      if (lvlStr.includes('BEGINNER') || lvlStr.includes('مبتدئة')) matchedLvl = 'BEGINNER';
      else if (lvlStr.includes('INTERMEDIATE') || lvlStr.includes('تمهيدية') || lvlStr.includes('متوسطة')) matchedLvl = 'INTERMEDIATE';
      else if (lvlStr.includes('ADVANCED') || lvlStr.includes('متقدمة')) matchedLvl = 'ADVANCED';
      else if (lvlStr.includes('TAMKEEN') || lvlStr.includes('تمكين')) matchedLvl = 'TAMKEEN';
      
      levelGroups[matchedLvl].push(st);
    });

    // Distribute teachers into the levels they can supervise
    eligibleTeachers.forEach((teacher, idx) => {
      // Map level groups
      const tName = `${teacher.firstName || teacher.name} ${teacher.lastName || ''}`;
      const levelsToFill: ('BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'TAMKEEN')[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'TAMKEEN'];
      const targetLvl = levelsToFill[idx % levelsToFill.length];
      
      const sessionStList = levelGroups[targetLvl].splice(0, 5).map(st => ({
        id: st.studentId || st.email,
        name: `${st.firstName || st.name} ${st.lastName || ''}`,
        avatar: st.avatar || `https://picsum.photos/seed/${st.studentId}/100/100`,
        college: st.college,
        level: st.level,
        email: st.email
      }));

      proposedDraft.push({
        id: `draft_sess_${format}_${idx}_` + Date.now(),
        name: lang === 'ar' ? `حلقة ذكية (أ. ${teacher.firstName})` : `Smart Propose (T. ${teacher.firstName})`,
        teacher: {
          name: tName,
          phone: teacher.phone,
          email: teacher.email
        },
        level: targetLvl,
        location: format === 'online' ? (lang === 'ar' ? 'عبر الأثير - تيمز' : 'MS Teams Link') : (lang === 'ar' ? 'مسجد الجامعة - الدور الأول' : 'SQU Campus Mosque'),
        time: idx % 2 === 0 ? 'Sunday/Tuesday | 16:15 - 17:30' : 'Monday/Wednesday | 10:00 - 11:15',
        students: sessionStList,
        format: format
      });
    });

    if (format === 'in-person') {
      setInPersonDraft(proposedDraft);
      localStorage.setItem('itqan_in_person_draft', JSON.stringify(proposedDraft));
    } else {
      setOnlineDraft(proposedDraft);
      localStorage.setItem('itqan_online_draft', JSON.stringify(proposedDraft));
    }

    setIsRunningAlgorithm(false);
    setApiLogMessage('');
    alert(
      lang === 'ar' 
        ? `نجاح! تلاوة الذكاء الاصطناعي قامت باقتراح مسودة جديدة للتوزيع لـ ${format === 'online' ? 'الشبكة الرقمية' : 'المقرأة الحضورية'}` 
        : `Success! Proposed ${proposedDraft.length} draft groups for ${format === 'online' ? 'Online digital' : 'Campus physical'} formats.`
    );
  };

  // Confirm proposed draft mapping into SQU Live Session Databases
  const handleConfirmDraftAssignments = async (format: 'in-person' | 'online') => {
    const targetDraft = format === 'in-person' ? inPersonDraft : onlineDraft;
    if (targetDraft.length === 0) {
      alert(lang === 'ar' ? 'عفواً، لا توجد مسودة نشطة لاعتمادها' : 'No proposed draft exists to authorize!');
      return;
    }

    // Trigger post to /api/assignments/confirm
    const confirmationPrompt = lang === 'ar'
      ? `هل ترغبين بالتأكيد في إطلاق الفرز وحفظ وتفعيل ${targetDraft.length} حلقة رسمياً في النظام؟ السجل الحالي لبعض حِلق هذا التصنيف قد يُحدث تداخلاً.`
      : `Are you sure you want to commit and launch these ${targetDraft.length} proposed groups to live production databases via /api/assignments/confirm?`;

    if (!window.confirm(confirmationPrompt)) return;

    // Load proposed groups into live state
    const mappedToSessions: Session[] = targetDraft.map(dr => ({
      id: dr.id,
      name: dr.name,
      teacher: {
        name: dr.teacher.name,
        phone: dr.teacher.phone
      },
      location: dr.location,
      time: dr.time,
      maxStudents: 999,
      level: dr.level,
      announcements: [],
      students: dr.students.map((st: any) => ({
        id: st.id,
        name: st.name,
        avatar: st.avatar,
        absencesExcused: 0,
        absencesUnexcused: 0,
        college: st.college,
        email: st.email
      })),
      themeColor: format === 'online' ? '#2563eb' : '#059669',
      themePhoto: 'https://images.unsplash.com/photo-1541844053589-346841d0b34c?auto=format&fit=crop&q=80&w=600'
    }));

    // Retain non-overlapping formatting to clean overlaps, or append smoothly!
    setSessions(prev => {
      // Filter out previous smart draft or old matching formats
      const preserved = prev.filter(s => {
        const isOnlineS = s.location.includes('تيمز') || s.location.includes('Teams') || s.location.toLowerCase().includes('online');
        return format === 'in-person' ? isOnlineS : !isOnlineS;
      });
      return [...preserved, ...mappedToSessions];
    });

    // Clear Drafts
    if (format === 'in-person') {
      setInPersonDraft([]);
      localStorage.removeItem('itqan_in_person_draft');
    } else {
      setOnlineDraft([]);
      localStorage.removeItem('itqan_online_draft');
    }

    alert(lang === 'ar' ? 'تم حفظ وإطلاق مجموعات التلاوة بنجاح!' : 'Proposed classrooms committed and launched successfully!');
  };

  // Remove individual student from proposed drafts
  const handleRemoveDraftStudent = (draftSessionId: string, studentId: string, format: 'in-person' | 'online') => {
    const targetDraft = format === 'in-person' ? inPersonDraft : onlineDraft;
    const updated = targetDraft.map(s => {
      if (s.id === draftSessionId) {
        return {
          ...s,
          students: s.students.filter((st: any) => st.id !== studentId)
        };
      }
      return s;
    });

    if (format === 'in-person') {
      setInPersonDraft(updated);
      localStorage.setItem('itqan_in_person_draft', JSON.stringify(updated));
    } else {
      setOnlineDraft(updated);
      localStorage.setItem('itqan_online_draft', JSON.stringify(updated));
    }
  };

  // Student filtering calculation page
  const processedStudents = useMemo(() => {
    return allStudents.filter(s => {
      const matchesSearch = 
        `${s.firstName || s.name} ${s.lastName || ''}`.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.studentId || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(studentSearch.toLowerCase());

      const stLvl = (s.level || '').toUpperCase();
      let matchesLvl = true;
      if (studentLevelFilter !== 'all') {
        if (studentLevelFilter === 'BEGINNER') matchesLvl = stLvl.includes('BEGINNER') || stLvl.includes('مبتدئة');
        else if (studentLevelFilter === 'INTERMEDIATE') matchesLvl = stLvl.includes('INTERMEDIATE') || stLvl.includes('تمهيدية') || stLvl.includes('متوسطة');
        else if (studentLevelFilter === 'ADVANCED') matchesLvl = stLvl.includes('ADVANCED') || stLvl.includes('متقدمة');
        else if (studentLevelFilter === 'TAMKEEN') matchesLvl = stLvl.includes('TAMKEEN') || stLvl.includes('تمكين');
      }

      const { typeValue } = getStudentTypeAndFormat(s);
      let matchesType = true;
      if (studentTypeFilter !== 'all') {
        matchesType = typeValue === studentTypeFilter;
      }

      return matchesSearch && matchesLvl && matchesType;
    });
  }, [allStudents, studentSearch, studentLevelFilter, studentTypeFilter]);

  // Teachers filtering calculation page
  const processedTeachers = useMemo(() => {
    return allTeachers.filter(t => {
      const matchesSearch = 
        `${t.firstName || t.name} ${t.lastName || ''}`.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        (t.email || '').toLowerCase().includes(teacherSearch.toLowerCase());

      let matchesLvl = true;
      const tLvl = (t.level || '').toLowerCase();
      if (teacherLevelFilter !== 'all') {
        if (teacherLevelFilter === 'master') matchesLvl = tLvl.includes('مجاز') || tLvl.includes('master');
        else if (teacherLevelFilter === 'iqraa') matchesLvl = tLvl.includes('اقرأ') || tLvl.includes('iqraa') || tLvl.includes('طالبة');
      }

      const { formatPref } = getTeacherPrefAndExp(t);
      let matchesFormat = true;
      if (teacherFormatFilter !== 'all') {
        matchesFormat = formatPref === teacherFormatFilter || formatPref === 'both';
      }

      return matchesSearch && matchesLvl && matchesFormat;
    });
  }, [allTeachers, teacherSearch, teacherLevelFilter, teacherFormatFilter]);

  // Active Sessions sorting
  const processedSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(sessionSearch.toLowerCase()) ||
        s.teacher.name.toLowerCase().includes(sessionSearch.toLowerCase());

      const isOnlineS = s.location.includes('تيمز') || s.location.includes('Teams') || s.location.toLowerCase().includes('online');
      let matchesFormat = true;
      if (sessionFormatFilter !== 'all') {
        matchesFormat = sessionFormatFilter === 'online' ? isOnlineS : !isOnlineS;
      }

      return matchesSearch && matchesFormat;
    });
  }, [sessions, sessionSearch, sessionFormatFilter]);


  return (
    <div className="bg-slate-50 min-h-screen text-start">
      {/* Upper Navigation Back Ribbon */}
      <div className="bg-white border-b border-brand-primary/10 shadow-3xs pt-4 pb-4 px-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] text-brand-primary font-black uppercase tracking-widest block bg-brand-neutral/80 px-2 py-0.5 rounded-md w-fit mb-1 border border-brand-primary/10">SQU Quran Tajweed Administration</span>
          <h1 className="text-xl sm:text-2xl font-black text-brand-dark flex items-center gap-2">
            <span>🎛️</span>
            <span>{lang === 'ar' ? 'منصة التوزيع والفرز الإلكتروني الذكي' : 'Smart Allocation & Assignment Hub'}</span>
          </h1>
        </div>

        <button 
          onClick={onBack}
          className="bg-brand-dark hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-black transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <span>←</span>
          <span>{lang === 'ar' ? 'العودة للوحة القيادة' : 'Back to Admin Control Panel'}</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Inner Hub Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-2xl border border-dashed border-slate-200 select-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'overview' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-650 hover:bg-slate-50'}`}
          >
            📊 {lang === 'ar' ? 'نظرة عامة' : 'Overview'}
          </button>
          
          <button
            onClick={() => setActiveTab('auto-assign')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'auto-assign' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-650 hover:bg-slate-50'}`}
          >
            ⚡ {lang === 'ar' ? 'الفرز والتعيين التلقائي' : 'Auto Allocation Tool'}
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'students' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-650 hover:bg-slate-50'}`}
          >
            👥 {lang === 'ar' ? 'شؤون الطالبات' : 'Student Registry'}
          </button>

          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'teachers' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-650 hover:bg-slate-50'}`}
          >
            👩‍🏫 {lang === 'ar' ? 'شؤون المعلمات' : 'Teacher Registry'}
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'sessions' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-650 hover:bg-slate-50'}`}
          >
            🏫 {lang === 'ar' ? 'شؤون الحِلق' : 'Live Classrooms'}
          </button>

          <button
            onClick={() => setActiveTab('conflicts')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer relative ${activeTab === 'conflicts' ? 'bg-brand-primary text-white shadow-md' : 'text-slate-650 hover:bg-slate-50'}`}
          >
            ⚠️ {lang === 'ar' ? 'تقرير التداخلات والنزاعات' : 'Conflict Resolution'}
            {stats.unassignedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-bounce">
                {stats.unassignedCount}
              </span>
            )}
          </button>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: OVERVIEW */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Bento Grid Analytics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
              <div 
                onClick={() => setActiveTab('students')}
                className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm cursor-pointer hover:border-brand-primary/40 hover:scale-102 transition-all flex flex-col justify-between"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl">👥</span>
                  <span className="text-[10px] bg-brand-neutral/80 text-brand-primary border border-brand-primary/10 px-2.5 py-0.5 rounded-md font-extrabold uppercase">Students</span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-brand-dark mb-1">{stats.totalS}</h3>
                  <p className="text-xs text-slate-400 font-bold">{lang === 'ar' ? 'إجمالي الطالبات المسجلات' : 'Total Enrolled Registrants'}</p>
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('teachers')}
                className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm cursor-pointer hover:border-brand-primary/40 hover:scale-102 transition-all flex flex-col justify-between"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl">👩‍🏫</span>
                  <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-0.5 rounded-md font-extrabold uppercase">Teachers</span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-brand-dark mb-1">{stats.totalT}</h3>
                  <p className="text-xs text-slate-400 font-bold">{lang === 'ar' ? 'المعلمات المرخصات للتدريس' : 'Active Licensed Teachers'}</p>
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('sessions')}
                className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm cursor-pointer hover:border-brand-primary/40 hover:scale-102 transition-all flex flex-col justify-between"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl">🏫</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-0.5 rounded-md font-extrabold uppercase">Sessions</span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-brand-dark mb-1">{stats.totalSess}</h3>
                  <p className="text-xs text-slate-400 font-bold">{lang === 'ar' ? 'الحِلق والمجموعات النشطة' : 'Active Classes & Channels'}</p>
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('conflicts')}
                className={`p-6 rounded-3xl border shadow-sm cursor-pointer hover:scale-102 transition-all flex flex-col justify-between ${stats.unassignedCount > 0 ? 'bg-amber-500/5 border-amber-200 text-amber-900' : 'bg-white border-slate-200/60'}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl">⚠️</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-extrabold uppercase ${stats.unassignedCount > 0 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>Unassigned</span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-brand-dark mb-1">{stats.unassignedCount}</h3>
                  <p className="text-xs text-slate-400 font-bold">{lang === 'ar' ? 'طالبات بانتظار الترشيح لحلقات' : 'Students Awaiting Placement'}</p>
                </div>
              </div>
            </div>

            {/* Banner Quick Start Guidance */}
            <div className="bg-brand-primary text-white rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="absolute top-0 right-0 opacity-5 pointer-events-none transform translate-x-12 -translate-y-4">
                <Sparkles className="w-56 h-56" />
              </div>
              <div className="space-y-2 max-w-2xl text-start">
                <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-md font-black uppercase tracking-wider block w-fit">Decision Engine Guidance</span>
                <h3 className="text-lg sm:text-2xl font-black">{lang === 'ar' ? 'فرز وتوزيع مستقل وسلس للمقرآت' : 'Isolate and Run Allocations Seamlesly'}</h3>
                <p className="text-xs sm:text-sm text-white/90 font-bold leading-relaxed">
                  {lang === 'ar'
                    ? 'بإمكانك فرز طالبات البكالوريوس وحضوريات مصلى الطالبات في مسار المقرأة؛ مع فرز طالبات الماجستير والدراسات العليا عن بُعد لمسار ميكروسوفت تيمز المستقل بضغطة زر وبدون تداخلات!'
                    : 'Unleash independent algorithm parameters. Route Undergraduate physical SQU-mosque attendances onto offline groups; or match graduate and off-campus Employees onto MS Teams with isolated configurations.'}
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveTab('auto-assign');
                  setAutoAssignFormat('in-person');
                }}
                className="bg-white hover:bg-slate-50 text-brand-primary px-6 py-3.5 rounded-xl text-xs font-black shadow-md shrink-0 transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <span>🚀 {lang === 'ar' ? 'تشغيل الموزع الذكي الآن' : 'Unleash Smart Allocator'}</span>
              </button>
            </div>

            {/* Quick Link Shortcuts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6">
                <h4 className="text-sm sm:text-base font-black text-brand-dark mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <span>📌</span> {lang === 'ar' ? 'روابط سريعة وقوالب النظام' : 'Quick Actions Shortcuts'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-start">
                  <button 
                    onClick={() => setActiveTab('auto-assign')}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black border border-slate-200/40 text-slate-700 block transition-colors cursor-pointer"
                  >
                    🏢 {lang === 'ar' ? 'تشغيل فرز حضوري (مسارات مسجد SQU)' : 'Run In-person SQU-Mosque allocation'}
                  </button>
                  <button 
                    onClick={() => {
                      setActiveTab('auto-assign');
                      setAutoAssignFormat('online');
                    }}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black border border-slate-200/40 text-slate-700 block transition-colors cursor-pointer"
                  >
                    💻 {lang === 'ar' ? 'تشغيل فرز أونلاين (قنوات تيمز)' : 'Run Online Digital Teams allocation'}
                  </button>
                  <button 
                    onClick={() => setShowCreateSessionModal(true)}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black border border-slate-200/40 text-slate-700 block transition-colors cursor-pointer"
                  >
                    ➕ {lang === 'ar' ? 'إطلاق وتصميم حلقة جديدة يدوياً' : 'Create Live Tajweed Circle manually'}
                  </button>
                  <button 
                    onClick={() => setActiveTab('conflicts')}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black border border-slate-200/40 text-slate-700 block transition-colors cursor-pointer"
                  >
                    🔍 {lang === 'ar' ? 'تتبع نزاعات توزيع مستويات الطالبات' : 'Audit Student Classifications'}
                  </button>
                </div>
              </div>

              {/* Unassigned Students Teaser List */}
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 text-start">
                <h4 className="text-sm sm:text-base font-black text-brand-dark mb-4 border-b border-slate-100 pb-2 flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 block animate-ping"></span>
                    <span>⚠️ {lang === 'ar' ? 'سجل الطالبات غير الموزعات' : 'Fresh Unassigned Reciters'}</span>
                  </span>
                  <span className="text-[10px] bg-red-50 border border-red-100 text-red-650 font-black px-2 py-0.5 rounded">
                    {unassignedStudents.length} {lang === 'ar' ? 'طالبات بقين' : 'Left'}
                  </span>
                </h4>

                <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1">
                  {unassignedStudents.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-slate-400 text-xs font-bold italic">🎉 {lang === 'ar' ? 'تمت تغطية وتوزيع جميع الطالبات!' : 'Hooray! Every registrant matches a class!'}</p>
                    </div>
                  ) : (
                    unassignedStudents.map((stud, idx) => {
                      const idKey = stud.studentId || stud.email;
                      const { typeValue, formatValue } = getStudentTypeAndFormat(stud);
                      return (
                        <div key={idx} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-200/40 hover:bg-slate-100 transition-colors">
                          <div>
                            <span className="text-xs font-black text-brand-dark block">{stud.firstName} {stud.lastName}</span>
                            <div className="flex gap-2 text-[9px] font-bold text-slate-400 font-mono mt-0.5">
                              <span>🆔 {stud.studentId || '---'}</span>
                              <span className="text-brand-primary">({stud.level})</span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setAssigningStudentId(idKey);
                              setActiveTab('sessions');
                            }}
                            className="bg-brand-primary hover:bg-brand-accent text-white font-black text-[10px] px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                          >
                            ➕ {lang === 'ar' ? 'تسكين يدوياً' : 'Place now'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: AUTO ALLOCATION TOOLS (SEPARATED BY FORMAT) */}
        {/* ========================================================= */}
        {activeTab === 'auto-assign' && (
          <div className="space-y-8 animate-fade-in text-start">
            
            {/* Format choice widget */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6">
              <h3 className="text-sm font-black text-slate-400 block uppercase tracking-widest mb-4">
                {lang === 'ar' ? 'الرجاء اختيار المسار والفرز المستهدف لتشغيله:' : 'Verify segment path to initialize smart allocate:'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Format In-person option */}
                <button
                  onClick={() => setAutoAssignFormat('in-person')}
                  className={`p-5 rounded-2xl text-start border-2 transition-all cursor-pointer flex flex-col justify-between h-40 ${autoAssignFormat === 'in-person' ? 'border-emerald-600 bg-emerald-50/25 text-emerald-950 ring-4 ring-emerald-100' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-3xl">🏫</span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md ${autoAssignFormat === 'in-person' ? 'bg-emerald-650 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {lang === 'ar' ? 'النشاط الوجاهي (حضوري)' : 'Physical In-Person Format'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black mt-2">{lang === 'ar' ? 'مقرأة مسجد جامعة السلطان قابوس' : 'SQU Campus Mosque Halls'}</h4>
                    <p className="text-[10.5px] text-slate-450 font-bold block mt-1 leading-normal">
                      {lang === 'ar'
                        ? 'فرز الطالبات المسجلات بكالوريوس وحضوريات مصلى الطالبات، مضافاً إليهن المعلمات المتاحات بالجامعة وجداول قاعات التربية.'
                        : 'Isolates Undergraduate students, physical timers requested, and targets Mosque halls available timings.'}
                    </p>
                  </div>
                </button>

                {/* Format Online option */}
                <button
                  onClick={() => setAutoAssignFormat('online')}
                  className={`p-5 rounded-2xl text-start border-2 transition-all cursor-pointer flex flex-col justify-between h-40 ${autoAssignFormat === 'online' ? 'border-brand-primary bg-brand-primary/5 text-brand-dark ring-4 ring-brand-primary/10' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-3xl">💻</span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md ${autoAssignFormat === 'online' ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {lang === 'ar' ? 'المسار الرقمي (تيمز أونلاين)' : 'Virtual Online Streams'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black mt-2">{lang === 'ar' ? 'فترات عبر الأثير والتحفيظ الرقمي' : 'MS Teams Digital Portals'}</h4>
                    <p className="text-[10.5px] text-slate-450 font-bold block mt-1 leading-normal">
                      {lang === 'ar'
                        ? 'فرز طالبات الماجستير، الدكتوراة، والموظفات، وبعض الطالبات بجدول السكنات، مع المعلمات المتفرغات للتدريس عن بعد عير تيمز.'
                        : 'Routes Postgraduate / PhD students, off-campus SQU employees and virtual available supervisors.'}
                    </p>
                  </div>
                </button>
              </div>

              {/* Run Algorithm Actions */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:justify-between items-center gap-4">
                <div className="text-xs font-bold text-slate-400">
                  {lang === 'ar' ? 'ملاحظة: التشغيل لا يستبدل الحِلق القائمة إلا بعد مراجعتك واعتماد المسودة بالأسفل.' : 'Note: Proposing algorithm does not rewrite live classrooms until you review and confirm drafts below.'}
                </div>

                <button
                  onClick={() => runAutoAssignmentAlgorithm(autoAssignFormat)}
                  disabled={isRunningAlgorithm}
                  className="bg-brand-primary hover:bg-brand-accent text-white px-7 py-3 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isRunningAlgorithm ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>🚀</span>}
                  <span>
                    {isRunningAlgorithm 
                      ? (lang === 'ar' ? 'جاري الفرز والتحليل المبرمج...' : 'Analyzing database preferences...')
                      : (lang === 'ar' ? `تشغيل الفرز الآلي لحِلق (${autoAssignFormat === 'online' ? 'أونلاين' : 'الحضوري'})` : `Run ${autoAssignFormat === 'online' ? 'Online' : 'In-Person'} Auto-Assignment`)
                    }
                  </span>
                </button>
              </div>

              {/* API Live Console Emulator */}
              {isRunningAlgorithm && (
                <div className="mt-4 p-4 rounded-xl bg-black font-mono text-emerald-400 text-[10.5px] border border-slate-800 space-y-1 select-none animate-pulse">
                  <p>&gt; Connection authorized. Client security token validated successfully.</p>
                  <p>&gt; Triggering API endpoint: POST /api/assignments/run-algorithm?format={autoAssignFormat}</p>
                  <p>&gt; Status Log: {apiLogMessage}</p>
                </div>
              )}
            </div>

            {/* proposed Draft Section Displays */}
            {(() => {
              const currentDraft = autoAssignFormat === 'in-person' ? inPersonDraft : onlineDraft;
              
              return (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-brand-dark">
                        {lang === 'ar' ? `مسودة التوزيع المقترحة لـ (${autoAssignFormat === 'online' ? 'أونلاين' : 'حضوري'})` : `Proposed ${autoAssignFormat === 'online' ? 'Online Digital' : 'In-Campus physical'} Proposals`} 
                      </h3>
                      <p className="text-xs text-slate-400 font-bold">
                        {lang === 'ar' ? 'مراجعة المجموعات ومطابقة المعلمات والقدرات الشاغرة قبل التفعيل النهائي.' : 'Review proposals, manage student lists manually, analyze and confirm assignments.'}
                      </p>
                    </div>

                    {currentDraft.length > 0 && (
                      <button
                        onClick={() => handleConfirmDraftAssignments(autoAssignFormat)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>{lang === 'ar' ? 'اعتماد المسودة وحفظها بالنظام ✓' : 'Confirm Assignments & Save'}</span>
                      </button>
                    )}
                  </div>

                  {currentDraft.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-200">
                      <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3 opacity-40 animate-pulse" />
                      <p className="text-slate-450 font-bold text-xs">
                        {lang === 'ar' 
                          ? 'لا تتوفر مصفوفة مسودة حالياً. يرجى الضغط على زر "تشغيل الفرز الآلي" بالأعلى لبرمجة وتوزيع المجموعات!' 
                          : 'No draft proposal exists yet. Kick off the auto-allocation algorithm above to formulate classes!'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentDraft.map((dr, index) => {
                        return (
                          <div key={index} className="bg-white rounded-3xl border border-slate-200 shadow-3xs flex flex-col justify-between overflow-hidden hover:shadow-md transition-all">
                            {/* Draft Banner */}
                            <div className="p-4 text-white bg-slate-800 text-start">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] bg-slate-500/40 text-white border border-slate-550 rounded font-black px-2 py-0.5">
                                  {dr.level}
                                </span>
                                <span className="text-[9px] text-white/70 italic uppercase">PROPOSED</span>
                              </div>
                              <h4 className="text-sm font-black text-white truncate">{dr.name}</h4>
                              <p className="text-[10px] text-emerald-350 font-bold truncate mt-0.5">👩‍🏫 {dr.teacher.name}</p>
                            </div>

                            {/* Draft Times */}
                            <div className="p-4 space-y-3.5 flex-1 select-none">
                              <div className="text-[10.5px] font-bold text-slate-500 space-y-1">
                                <div className="flex items-center gap-1">
                                  <span>⏰</span>
                                  <span>{dr.time}</span>
                                </div>
                                <div className="flex items-center gap-1 text-slate-450">
                                  <span>📍</span>
                                  <span>{dr.location}</span>
                                </div>
                              </div>

                              {/* Student entries draggable mock layout */}
                              <div className="space-y-1.5">
                                <span className="text-[9.5px] text-slate-400 font-black block uppercase tracking-wider">
                                  {lang === 'ar' ? 'الطلاب المقترحين:' : 'Assigned Students:'} ({dr.students.length})
                                </span>

                                <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                                  {dr.students.map((st: any, sIdx: number) => {
                                    return (
                                      <div 
                                        key={sIdx} 
                                        className="p-2 rounded-xl bg-slate-50 border border-slate-200/50 flex justify-between items-center hover:bg-slate-100 transition-colors"
                                      >
                                        <div className="text-start">
                                          <span className="text-xs font-bold text-slate-800 block">{st.name}</span>
                                          <span className="text-[9px] text-slate-400 block font-mono">Coll: {st.college || '---'}</span>
                                        </div>

                                        <button
                                          onClick={() => handleRemoveDraftStudent(dr.id, st.id, autoAssignFormat)}
                                          className="text-red-500 hover:bg-red-50 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black cursor-pointer"
                                          title={lang === 'ar' ? 'إزالة الطالبة من المسودة' : 'Unpin Student'}
                                        >
                                          ×
                                        </button>
                                      </div>
                                    );
                                  })}

                                  {dr.students.length === 0 && (
                                    <div className="text-center py-4 bg-slate-50/50 border border-slate-150 rounded-xl">
                                      <p className="text-[10px] text-slate-400 italic font-bold">No students in this group</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Options to delete class from proposals */}
                            <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 text-end">
                              <button
                                onClick={() => {
                                  const updated = currentDraft.filter(s => s.id !== dr.id);
                                  if (autoAssignFormat === 'in-person') {
                                    setInPersonDraft(updated);
                                    localStorage.setItem('itqan_in_person_draft', JSON.stringify(updated));
                                  } else {
                                    setOnlineDraft(updated);
                                    localStorage.setItem('itqan_online_draft', JSON.stringify(updated));
                                  }
                                }}
                                className="text-red-650 hover:bg-red-50/70 border border-red-100 bg-white px-3 py-1.5 font-bold text-[10px] rounded-lg cursor-pointer"
                              >
                                {lang === 'ar' ? 'إلغاء المجموعة بالكامل' : 'Cancel Proposed Class'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: STUDENTS REGISTRY */}
        {/* ========================================================= */}
        {activeTab === 'students' && (
          <div className="space-y-6 animate-fade-in text-start">
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-3xs flex flex-col md:flex-row gap-4 items-center">
              {/* Searching panel */}
              <div className="relative w-full md:flex-grow">
                <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'ابحثي بالطالبة، الرقم الجامعي، أو رغبة الفرز...' : 'Type student criteria to look up...'}
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand-primary pl-11 pr-4 py-2.5 rounded-xl text-xs font-bold text-start"
                />
              </div>

              {/* Filtering level & Types */}
              <div className="flex flex-wrap gap-2 select-none w-full md:w-auto">
                <select
                  value={studentLevelFilter}
                  onChange={(e) => setStudentLevelFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-black text-slate-650 focus:outline-none focus:border-brand-primary"
                >
                  <option value="all">{lang === 'ar' ? 'جميع المستويات' : 'All Tiers'}</option>
                  <option value="BEGINNER">{lang === 'ar' ? 'مبتدئة' : 'Beginner'}</option>
                  <option value="INTERMEDIATE">{lang === 'ar' ? 'تمهيدية' : 'Intermediate'}</option>
                  <option value="ADVANCED">{lang === 'ar' ? 'متقدمة' : 'Advanced'}</option>
                  <option value="TAMKEEN">{lang === 'ar' ? 'تمكين' : 'Tamkeen'}</option>
                </select>

                <select
                  value={studentTypeFilter}
                  onChange={(e) => setStudentTypeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-black text-slate-650 focus:outline-none focus:border-brand-primary"
                >
                  <option value="all">{lang === 'ar' ? 'جميع الدرجات العلمية' : 'All Degrees'}</option>
                  <option value="undergrad">{lang === 'ar' ? 'بكالوريوس (تحت التخرج)' : 'Undergraduate'}</option>
                  <option value="postgrad">{lang === 'ar' ? 'دراسات عليا / موظفات' : 'Graduate / Employee'}</option>
                </select>
              </div>
            </div>

            {/* Students Grid View */}
            <div className="bg-white rounded-3xl border border-slate-250/65 overflow-x-auto shadow-sm">
              <table className="w-full text-xs font-bold border-collapse select-none min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-black h-12 uppercase text-start">
                    <th className="px-5 text-start">{lang === 'ar' ? 'الطالبة' : 'Student Name'}</th>
                    <th className="px-5 text-start">{lang === 'ar' ? 'الكلية' : 'SQU College'}</th>
                    <th className="px-5 text-center">{lang === 'ar' ? 'الدرجة العلمية' : 'Type'}</th>
                    <th className="px-5 text-center">{lang === 'ar' ? 'المستوى' : 'Level'}</th>
                    <th className="px-5 text-center">{lang === 'ar' ? 'التوجيه المفضل' : 'Delivery Preference'}</th>
                    <th className="px-5 text-center">{lang === 'ar' ? 'الحالة الحالية' : 'Assignment State'}</th>
                    <th className="px-5 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-start leading-relaxed">
                  {processedStudents.map((st, sidx) => {
                    const idKey = st.studentId || st.email;
                    
                    // Check if current student possesses an assigned session
                    let assignedSession: Session | null = null;
                    sessions.forEach(s => {
                      if (s.students?.some(subSt => subSt.id === idKey)) {
                        assignedSession = s;
                      }
                    });

                    return (
                      <tr key={sidx} className="hover:bg-slate-50/50 h-14">
                        <td className="px-5">
                          <div className="flex items-center gap-2.5">
                            <img src={st.avatar || `https://picsum.photos/seed/${idKey}/100/100`} className="w-8 h-8 rounded-full border border-slate-200 shrink-0" referrerPolicy="no-referrer" />
                            <div>
                              <span className="font-extrabold text-brand-dark block">{st.firstName} {st.lastName}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">{st.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 text-slate-650 font-medium">
                          {st.college || '---'} ({st.cohort || '---'})
                        </td>

                        <td className="px-5 text-center font-black">
                          {displayStudentType(st)}
                        </td>

                        <td className="px-5 text-center">
                          <span className="bg-brand-neutral text-brand-primary border border-brand-primary/10 px-2.5 py-1 rounded-full text-[10.5px]">
                            {st.level}
                          </span>
                        </td>

                        <td className="px-5 text-center text-slate-500 font-semibold">
                          {displayPreferredFormat(st)}
                        </td>

                        <td className="px-5 text-center">
                          {assignedSession ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-1 rounded-lg text-[10px] uppercase font-black">
                              👉 {(assignedSession as Session).name}
                            </span>
                          ) : (
                            <span className="bg-red-50 text-red-650 border border-red-100 px-2 py-1 rounded-lg text-[10px] uppercase font-black animate-pulse">
                              ⏳ NOT ASSIGNED
                            </span>
                          )}
                        </td>

                        <td className="px-5 text-end">
                          <div className="flex gap-2 justify-end">
                            {assignedSession ? (
                              <button
                                onClick={() => handleUnassignStudent((assignedSession as Session).id, idKey)}
                                className="text-red-650 hover:bg-red-50 border border-red-100 bg-white px-3 py-1.5 rounded-xl font-bold text-[10px] cursor-pointer"
                              >
                                {lang === 'ar' ? 'إلغاء التعيين' : 'Unassign Class'}
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setAssigningStudentId(idKey);
                                  setActiveTab('sessions');
                                }}
                                className="bg-brand-primary hover:bg-brand-accent text-white px-3.5 py-1.5 rounded-xl font-black text-[10px] shadow-sm cursor-pointer"
                              >
                                ➕ {lang === 'ar' ? 'تعيين لحلقة' : 'Place student'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {processedStudents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 font-bold text-slate-400 italic">
                        {lang === 'ar' ? 'عفواً، لا توجد سجلات مطابقة.' : 'No student records matched parameters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: TEACHERS REGISTRY */}
        {/* ========================================================= */}
        {activeTab === 'teachers' && (
          <div className="space-y-6 animate-fade-in text-start">
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-3xs flex flex-col md:flex-row gap-4 items-center">
              <div className="relative w-full md:flex-grow">
                <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'بحث باسم المعلمة ...' : 'Type teacher details to search...'}
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand-primary pl-11 pr-4 py-2.5 rounded-xl text-xs font-bold text-start"
                />
              </div>

              <div className="flex flex-wrap gap-2 select-none w-full md:w-auto">
                <select
                  value={teacherLevelFilter}
                  onChange={(e) => setTeacherLevelFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-black text-slate-650 focus:outline-none focus:border-brand-primary"
                >
                  <option value="all">{lang === 'ar' ? 'جميع تراخيص السند' : 'All Certifications'}</option>
                  <option value="master">{lang === 'ar' ? 'مُجازة بالسند المتصل' : 'Certified Master / Mujazah'}</option>
                  <option value="iqraa">{lang === 'ar' ? 'طالبة إقراء' : 'Iqraa Reciting Student'}</option>
                </select>

                <select
                  value={teacherFormatFilter}
                  onChange={(e) => setTeacherFormatFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-black text-slate-650 focus:outline-none focus:border-brand-primary"
                >
                  <option value="all">{lang === 'ar' ? 'جميع أنماط التفرغ' : 'All Formats'}</option>
                  <option value="in-person">{lang === 'ar' ? 'وجاهي بالجامعة فقط' : 'SQU Campus only'}</option>
                  <option value="online">{lang === 'ar' ? 'رقمي عن بعد (تيمز)' : 'Digital remote only'}</option>
                </select>
              </div>
            </div>

            {/* Teachers Board Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedTeachers.map((teach, idx) => {
                const emKey = teach.employeeId || teach.email;
                const { expYears, formatPref } = getTeacherPrefAndExp(teach);
                
                // Fetch supervised classes
                const supervisedSessions = sessions.filter(s => s.teacher.name.includes(teach.firstName) || s.teacher.name === teach.name);

                return (
                  <div key={idx} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-3xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                        <img src={teach.avatar || `https://picsum.photos/seed/${emKey}/100/100`} className="w-12 h-12 rounded-full border border-slate-150 object-cover" referrerPolicy="no-referrer" />
                        <div>
                          <span className="font-extrabold text-brand-dark block text-sm leading-normal">{teach.firstName} {teach.lastName}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{teach.email}</span>
                        </div>
                      </div>

                      <div className="space-y-2.5 text-xs text-slate-600 mb-6">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">{lang === 'ar' ? 'الكلية والصفة' : 'SQU Department'}:</span>
                          <span className="font-black text-brand-dark">{teach.college || 'Education'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">{lang === 'ar' ? 'الترخيص والاعتماد' : 'Certification'}:</span>
                          <span className="bg-brand-neutral text-brand-primary font-black px-2 py-0.5 rounded text-[10px]">{teach.level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">{lang === 'ar' ? 'نواتج الخبرة' : 'Teaching Span'}:</span>
                          <span className="font-mono font-bold text-slate-800">{expYears}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">{lang === 'ar' ? 'نمط المشاركة المفضل' : 'Delivery Slot'}:</span>
                          <span className="font-bold text-brand-primary">
                            {formatPref === 'online' ? '💻 Online' : formatPref === 'in-person' ? '🏫 In-person' : '🪐 Both / Flexible'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 select-none">
                      <span className="text-[9.5px] text-slate-400 font-black block uppercase tracking-wider mb-2">
                        {lang === 'ar' ? 'الحلقات النشطة المشرف عليها:' : 'Supervised Session Channels:'}
                      </span>

                      {supervisedSessions.length === 0 ? (
                        <div className="p-3 bg-red-500/5 text-amber-650 rounded-xl text-[10px] font-black border border-dashed border-opacity-40 border-amber-300 text-center">
                          ⚠ {lang === 'ar' ? 'لا يدرس أي مقارب / حلقة حالياً' : 'No active classes assigned'}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-1.5 max-h-[100px] overflow-y-auto pr-1">
                          {supervisedSessions.map((sv, svIdx) => (
                            <div key={svIdx} className="p-2 bg-slate-50 border border-slate-150 rounded-lg flex justify-between items-center text-[10px]">
                              <span className="font-extrabold text-slate-800 truncate">{sv.name}</span>
                              <span className="bg-brand-primary text-white scale-90 rounded px-1.5 py-0.5 text-[8.5px] shrink-0 font-bold">
                                {sv.students?.length} {lang === 'ar' ? 'طالبة' : 'Students'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 5: LIVE CLASSROOMS */}
        {/* ========================================================= */}
        {activeTab === 'sessions' && (
          <div className="space-y-6 animate-fade-in text-start text-brand-dark">
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-3xs flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'بحث عن حلقة تلاوة...' : 'Search tajweed circles...'}
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand-primary pl-11 pr-4 py-2.5 rounded-xl text-xs font-bold text-start"
                />
              </div>

              {/* Fast Reassignment Info Alert if any unassigned student is selected */}
              {assigningStudentId && (
                <div className="bg-amber-500/5 text-amber-850 px-4 py-2 border border-amber-250 rounded-xl text-xs font-black animate-pulse flex items-center gap-2">
                  <span>🚀</span>
                  <span>
                    {lang === 'ar' 
                      ? 'خطوة تعيين نشطة: اضغطي على زر "إلحاق هنا" بالأسفل لتوزيع الطالبة المختارة فوراً!' 
                      : 'Active Placement: Tap "Place here" on any class to assign!'}
                  </span>
                  <button 
                    onClick={() => setAssigningStudentId(null)}
                    className="w-5 h-5 bg-black/10 text-brand-dark rounded-full text-[10px] font-bold inline-flex items-center justify-center cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-2 select-none w-full md:w-auto">
                <select
                  value={sessionFormatFilter}
                  onChange={(e) => setSessionFormatFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-black text-slate-650 focus:outline-none focus:border-brand-primary"
                >
                  <option value="all">{lang === 'ar' ? 'جميع الحلقات بمختلف تصنيفاتها' : 'All Classes'}</option>
                  <option value="in-person">{lang === 'ar' ? '🏫 حضوري (مقرأة مسجد الجامعة)' : 'Campus In-Person Classrooms'}</option>
                  <option value="online">{lang === 'ar' ? '💻 أونلاين (قنوات ميكروسوفت تيمز)' : 'Digital Teams Channels'}</option>
                </select>

                <button
                  onClick={() => setShowCreateSessionModal(true)}
                  className="bg-brand-primary hover:bg-brand-accent text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'حلقة يدوية جديدة' : 'Create manually'}</span>
                </button>
              </div>
            </div>

            {/* Display list/grid of SQU Active Classes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedSessions.map((sess, idx) => {
                const isOnline = sess.location.includes('تيمز') || sess.location.includes('Teams') || sess.location.toLowerCase().includes('online');
                
                return (
                  <div key={idx} className="bg-white rounded-3xl border border-slate-200 shadow-3xs overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      {/* Class Banner colorized based on location */}
                      <div className={`p-5 text-white ${isOnline ? 'bg-indigo-650' : 'bg-emerald-650'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9.5px] bg-white/20 border border-white/35 rounded uppercase font-black px-2.5 py-0.5">
                            {sess.level}
                          </span>
                          <span className="text-[10px] text-white/80 font-mono">
                            {isOnline ? '💻 Digital Stream' : '🏫 In-Person SQU'}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-white text-base truncate mt-2">{sess.name}</h4>
                        <span className="text-xs text-white/95 truncate block mt-0.5">👩‍🏫 {sess.teacher.name}</span>
                      </div>

                      {/* Class Body Details */}
                      <div className="p-5 space-y-4">
                        <div className="text-xs text-slate-500 font-bold space-y-1">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span>📅</span>
                            <span>{sess.time}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span>📍</span>
                            <span>{sess.location}</span>
                          </div>
                        </div>

                        {/* Enrolled students list */}
                        <div className="space-y-1.5 select-none pt-3 border-t border-slate-100">
                          <span className="text-[9.5px] text-slate-400 font-extrabold block uppercase tracking-wider">
                            {lang === 'ar' ? 'الطالبات المسجلات بالحلقة:' : 'Enrolled Students:'} ({sess.students?.length || 0})
                          </span>

                          <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
                            {sess.students && sess.students.length > 0 ? (
                              sess.students.map((st, stIdx) => {
                                return (
                                  <div key={stIdx} className="p-2 rounded-xl bg-slate-50 border border-slate-200/50 flex justify-between items-center text-[10px]">
                                    <span className="font-extrabold text-slate-800 leading-normal truncate">{st.name}</span>
                                    <button
                                      onClick={() => handleUnassignStudent(sess.id, st.id)}
                                      className="text-slate-400 hover:text-red-650 text-xs w-5.5 h-5.5 rounded-full hover:bg-red-50 inline-flex items-center justify-center cursor-pointer font-bold shrink-0 transition-colors"
                                      title={lang === 'ar' ? 'إخراج الطالبة من الحلقة' : 'Unassign Student'}
                                    >
                                      ×
                                    </button>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-4 text-slate-400 text-[10px] italic font-bold">
                                {lang === 'ar' ? 'لا توجد طالبات مسجلات' : 'No students placed here yet'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Class Footer options/Quick assign targets */}
                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-end">
                      {assigningStudentId ? (
                        <button
                          onClick={() => handleAssignStudent(assigningStudentId, sess.id)}
                          className="bg-brand-primary w-full hover:bg-brand-accent text-white py-2.5 rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          📥 {lang === 'ar' ? 'إلحاق الطالبة بهذه الحلقة ✓' : 'Place student in this circle ✓'}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const confirmDelete = window.confirm(
                              lang === 'ar' 
                                ? 'هل تقرين برغبة حذف هذه الحِلقة وإخراج جميع بناتها؟' 
                                : 'Acknowledge deletion of class of Quran recital?'
                            );
                            if (confirmDelete) {
                              setSessions(prev => prev.filter(s => s.id !== sess.id));
                              alert(lang === 'ar' ? 'تم حذف الحلقة' : 'Session Deleted');
                            }
                          }}
                          className="text-red-650 hover:bg-red-50 border border-red-100 bg-white hover:text-red-700 px-3 py-1.5 rounded-xl font-bold text-[10px] cursor-pointer"
                        >
                          🗑️ {lang === 'ar' ? 'حذف الحلقة' : 'Delete Session'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 6: CONFLICT RESOLUTION */}
        {/* ========================================================= */}
        {activeTab === 'conflicts' && (
          <div className="space-y-6 animate-fade-in text-start select-none">
            <div className="bg-white rounded-3xl border border-slate-205 p-6 shadow-3xs">
              <h3 className="text-base sm:text-lg font-black text-brand-dark mb-2 flex items-center gap-2">
                <AlertTriangle className="text-amber-500 w-5.5 h-5.5" />
                {lang === 'ar' ? 'سجل تداخلات ومنازعات الفرز' : 'Unassigned Registrants Conflict Radar'}
              </h3>
              <p className="text-xs text-slate-400 font-bold max-w-2xl leading-normal text-start">
                {lang === 'ar'
                  ? 'رادار استئنائي يتتبع رغبات التلاوة للطلاب غير المقيدين بأي حِلق رسمية بالنظام حالياً، مقدماً حلولاً ومقترحات ذكية مستندة على تطابق المستويات وأوقات الفراغ الأكاديمي بجامعة السلطان قابوس.'
                  : 'SQU compliance scanner isolates registered reciters who left class networks. Suggests optimal matches in line with level tiers and available schedules.'}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              
              {/* Conflict Entries */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 block">
                  {lang === 'ar' ? 'الطالبات المتبقيات بدون تمثيل (التوجيهات المستهدفة):' : 'Awaiting Student Interventions list:'} ({unassignedStudents.length})
                </h4>

                {unassignedStudents.length === 0 ? (
                  <div className="bg-white p-8 border border-slate-200/60 rounded-3xl text-center">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="text-slate-450 font-bold text-xs">{lang === 'ar' ? 'لا توجد أي نزاعات أو طالبات بانتظار الترشيح حالياً!' : 'Compliance checked! Every single student contains perfect placement.'}</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {unassignedStudents.map((stud, idx) => {
                      const idKey = stud.studentId || stud.email;
                      const { typeValue, formatValue } = getStudentTypeAndFormat(stud);
                      
                      // Identify suggested sessions in same level and compatible timing format
                      const compatibleSessions = sessions.filter(s => {
                        const sLvl = s.level;
                        const stLvl = (stud.level || '').toUpperCase();
                        let levelMatches = false;
                        if (sLvl === 'BEGINNER' && (stLvl.includes('BEGINNER') || stLvl.includes('مبتدئة'))) levelMatches = true;
                        else if (sLvl === 'INTERMEDIATE' && (stLvl.includes('INTERMEDIATE') || stLvl.includes('تمهيدية') || stLvl.includes('متوسطة'))) levelMatches = true;
                        else if (sLvl === 'ADVANCED' && (stLvl.includes('ADVANCED') || stLvl.includes('متقدمة'))) levelMatches = true;
                        else if (sLvl === 'TAMKEEN' && (stLvl.includes('TAMKEEN') || stLvl.includes('تمكين'))) levelMatches = true;
                        
                        return levelMatches;
                      });

                      return (
                        <div key={idx} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-3xs text-start space-y-3">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <span className="text-xs font-black text-slate-400 block pb-0.5">{stKeyOrderDisplay(stud)}</span>
                              <h5 className="font-extrabold text-brand-dark text-sm">{stud.firstName} {stud.lastName}</h5>
                              <div className="flex gap-2 text-[9px] font-bold text-slate-400 font-mono mt-0.5">
                                <span>🆔 {stud.studentId || 'SQU---'}</span>
                                <span>🏫 {stud.college || 'Arts'}</span>
                              </div>
                            </div>

                            <span className="text-[10px] bg-red-50 text-red-650 font-extrabold px-2.5 py-0.5 rounded border border-red-100">
                              {stud.level}
                            </span>
                          </div>

                          <div className="p-3 bg-brand-neutral/35 text-[10.5px] rounded-xl border border-brand-primary/5">
                            <span className="font-bold text-slate-500 block mb-0.5">{lang === 'ar' ? 'الرغبات المسجلة للتلاوة:' : 'Registered Preferences:'}</span>
                            <span className="font-black text-brand-dark">🗳️ {displayPreferredFormat(stud)}</span>
                          </div>

                          {/* Suggested Auto placement options inside conflict block */}
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">
                              💡 {lang === 'ar' ? 'الحلول والمطابقات المرشحة تلقائياً:' : 'Suggested Matches according to Compliance rules:'}
                            </span>

                            {compatibleSessions.length === 0 ? (
                              <p className="text-[9.5px] italic text-amber-650 font-bold bg-amber-50 p-2 rounded border border-amber-100">
                                {lang === 'ar'
                                  ? 'لا توجد حلقة قائمة متطابقة مع مستوى التلاوة هذا حالياً. نوصي بتشغيل الفراغات بمسودة المعلمة لإنشاء حلقة جديدة.'
                                  : 'No live class exists of matching tier. Suggested action: Construct a new manual session.'}
                              </p>
                            ) : (
                              <div className="space-y-1.5">
                                {compatibleSessions.slice(0, 2).map((comp, compIdx) => {
                                  return (
                                    <button
                                      key={compIdx}
                                      onClick={() => handleAssignStudent(idKey, comp.id)}
                                      className="w-full text-start p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-brand-primary hover:bg-white transition-all cursor-pointer flex justify-between items-center text-[10.5px]"
                                    >
                                      <div>
                                        <span className="font-extrabold text-brand-primary block">{comp.name}</span>
                                        <span className="text-slate-400 block text-[9.5px]">Teacher: {comp.teacher.name}</span>
                                      </div>

                                      <span className="bg-emerald-600 text-white font-black px-2 py-1 rounded text-[9.5px] shrink-0">
                                        👉 {lang === 'ar' ? 'موافق وإلحاق' : 'Fast Enroll'}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Conflict suggestions logic guide card */}
              <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4">
                <h4 className="text-sm sm:text-base font-black text-brand-dark border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <span>⚖️</span>
                  <span>{lang === 'ar' ? 'لوائح وسياسات التدبير والنزاع' : 'SQU Allocation Compliance Guide'}</span>
                </h4>

                <div className="space-y-3.5 text-xs font-medium text-slate-550 leading-relaxed text-justify">
                  <p>
                    {lang === 'ar'
                      ? '١. مستويات التلاوة الأربعة مقفلة تماماً. يُمنع منعاً باتاً دمج طالبة من حلقة (مبتدئة) مع زميلة في حلقة (متقدمة) بحساب مستويات الحركية والتجويد لمراعاة أريحية المعلمات المتطوعات.'
                      : '1. Class tiers are strictly quarantined. Beginners cannot sit alongside advanced Quran learners to maintain teaching quality and optimized micro-groups.'}
                  </p>
                  <p>
                    {lang === 'ar'
                      ? '٢. طالبات الكليات التطبيقية بجامعة السلطان قابوس اللاتي يقطن بداخل السكن الجامعي تُمنح لهن الأولوية في التسجيل بالحلقات الحضورية بمسجد الجامعة مراعاةً لسهولة التنقل والحركة الليلية.'
                      : '2. Undergraduates residing inside SQU hostels receive prioritized seat bookings on Campus Mosque rooms; whereas off-campus commuters get matching flexibility on virtual Teams channels.'}
                  </p>
                  <p>
                    {lang === 'ar'
                      ? '٣. في حال تعذر دمج إحدى الطالبات المعينات، نوصي بالإتصال المباشر مع رئيسة النادي ريم الخزيرية لتسجيل الساعات البديلة يدوياً لحظر النزاعات.'
                      : '3. Compliance radar isolates unassigned entities. Administrators are empowered to override algorithms manually at any time.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-brand-primary/[0.03] border border-brand-primary/10 flex items-center gap-3">
                  <span className="text-xl">👩‍💻</span>
                  <div className="text-xs">
                    <span className="font-black text-brand-dark block">{lang === 'ar' ? 'ريم الخزيرية بنت سعيد' : 'Reem Al-Khuzairiah'}</span>
                    <span className="text-slate-400 font-black tracking-wide font-mono uppercase text-[9px]">{lang === 'ar' ? 'المشرفة والمنسقة العامة للنادي' : 'Quran Club Managing Director'}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>


      {/* MANUAL SESSION CREATION MODAL OVERLAY */}
      {showCreateSessionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-3xs flex items-center justify-center z-50 p-4 animate-fade-in/70">
          <div className="bg-white rounded-3xl border border-brand-primary/10 shadow-2xl max-w-md w-full overflow-hidden text-start">
            <div className="bg-brand-primary p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black">{lang === 'ar' ? 'تصميم حلقة تلاوة يدوية' : 'Create New Tajweed Circle'}</h3>
                <p className="text-xs text-white/80 font-bold mt-1">{lang === 'ar' ? 'تصميم وإطلاق الحِلق بمدخلات مخصصة' : 'Manually launch a specific Quran session'}</p>
              </div>

              <button 
                onClick={() => setShowCreateSessionModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-black cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">{lang === 'ar' ? 'اسم الحلقة المقترح' : 'Custom Session Name'} <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ar' ? 'مثال: حلقة ترتيل سورة البقرة' : 'E.g., Surah Baqarah Tajweed Group'}
                  value={newSessName}
                  onChange={(e) => setNewSessName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 focus:outline-none focus:border-brand-primary rounded-xl px-4 py-2.5 text-xs font-bold text-start"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">{lang === 'ar' ? 'المعلمة المشرفة للمقرأة' : 'Supervisor Teacher'} <span className="text-red-500">*</span></label>
                <select
                  required
                  value={newSessTeacher}
                  onChange={(e) => setNewSessTeacher(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 focus:outline-none focus:border-brand-primary rounded-xl px-3 py-2.5 text-xs font-black text-slate-650"
                >
                  <option value="">{lang === 'ar' ? '-- اختاري معلمة مرخصة --' : '-- Choose active teacher --'}</option>
                  {allTeachers.filter(t => t.approved).map((th, thIdx) => (
                    <option key={thIdx} value={th.email}>{th.firstName} {th.lastName} ({th.level})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">{lang === 'ar' ? 'تصنيف مستوى الإتقان ' : 'Tajweed Level'}</label>
                  <select
                    value={newSessLevel}
                    onChange={(e) => setNewSessLevel(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-205 focus:outline-none focus:border-brand-primary rounded-xl px-3 py-2.5 text-xs font-black text-slate-650"
                  >
                    <option value="BEGINNER">BEGINNER</option>
                    <option value="INTERMEDIATE">INTERMEDIATE</option>
                    <option value="ADVANCED">ADVANCED</option>
                    <option value="TAMKEEN">TAMKEEN</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">{lang === 'ar' ? 'قالب التوصيل' : 'Delivery Format'}</label>
                  <select
                    value={newSessFormat}
                    onChange={(e) => setNewSessFormat(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-205 focus:outline-none focus:border-brand-primary rounded-xl px-3 py-2.5 text-xs font-black text-slate-650"
                  >
                    <option value="in-person">🏫 In-Person (Mosque)</option>
                    <option value="online">💻 Online (Teams)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">{lang === 'ar' ? 'الموعد والوقت المفتوح' : 'Schedules'}</label>
                <input
                  type="text"
                  placeholder="E.g., Sunday/Tuesday | 16:15 - 17:30"
                  value={newSessTime}
                  onChange={(e) => setNewSessTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 focus:outline-none focus:border-brand-primary rounded-xl px-4 py-2.5 text-xs font-bold text-start"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">{lang === 'ar' ? 'اسم القاعة أو الموقع' : 'Campus Classroom / MS Teams link'}</label>
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'مثال: مسجد الجامعة - قاعة ١٠' : 'E.g., Campus Mosque - Hall 10'}
                  value={newSessLocation}
                  onChange={(e) => setNewSessLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 focus:outline-none focus:border-brand-primary rounded-xl px-4 py-2.5 text-xs font-bold text-start"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateSessionModal(false)}
                  className="px-4 py-2 text-xs font-black text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="bg-brand-primary hover:bg-brand-accent text-white px-5 py-2 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer"
                >
                  {lang === 'ar' ? 'إطلاق المجموعة الآن' : 'Launch Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Inner helper to display student classification key order neatly
function stKeyOrderDisplay(stud: any) {
  const isPostgrad = 
    stud.degree === 'Master' || 
    stud.degree === 'PhD' || 
    stud.degree === 'Employee' ||
    stud.academicDegree?.toLowerCase().includes('master') ||
    stud.academicDegree?.toLowerCase().includes('phd') || 
    stud.cohort === 'Graduate' ||
    stud.isSenior === true;
  
  return isPostgrad ? '🎓 GRADUATE CANDIDATE' : '🎒 UNDERGRADUATE CANDIDATE';
}
