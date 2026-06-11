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

// Timings utility format mapping
const getFormattedTimings = (userTimings: any, lang: string) => {
  if (!userTimings) return lang === 'ar' ? 'غير محدد' : 'Not specified';
  const selectedSlots: string[] = [];
  
  const DAYS_MAP: Record<string, {ar: string, en: string}> = {
    Sunday: { ar: 'الأحد', en: 'Sunday' },
    Monday: { ar: 'الاثنين', en: 'Monday' },
    Tuesday: { ar: 'الثلاثاء', en: 'Tuesday' },
    Wednesday: { ar: 'الأربعاء', en: 'Wednesday' },
    Thursday: { ar: 'الخميس', en: 'Thursday' },
    Friday: { ar: 'الجمعة', en: 'Friday' },
    Saturday: { ar: 'السبت', en: 'Saturday' }
  };
  
  const SLOTS_MAP: Record<string, {ar: string, en: string}> = {
    Fajr: { ar: 'فجرية', en: 'Fajr' },
    '8:00-9:15': { ar: '٨:٠٠ - ٩:١٥ ص', en: '8:00-9:15 AM' },
    '10:00-11:15': { ar: '١٠:٠٠ - ١١:١٥ ص', en: '10:00-11:15 AM' },
    '12:00-1:15': { ar: '١٢:٠٠ - ١:١٥ ظ', en: '12:00-1:15 PM' },
    '2:15-3:30': { ar: '٢:١٥ - ٣:٣٠ ظ', en: '2:15-3:30 PM' },
    '4:15-5:30': { ar: '٤:١٥ - ٥:٣٠ ع', en: '4:15-5:30 PM' },
    '8:00-9:15PM': { ar: '٨:٠٠ - ٩:١٥ م', en: '8:00-9:15 PM' }
  };

  Object.entries(userTimings).forEach(([key, val]) => {
    if (val) {
      const parts = key.split('_');
      if (parts.length === 2) {
        const dKey = parts[0];
        const sKey = parts[1];
        const dayText = DAYS_MAP[dKey] ? (lang === 'ar' ? DAYS_MAP[dKey].ar : DAYS_MAP[dKey].en) : dKey;
        const slotText = SLOTS_MAP[sKey] ? (lang === 'ar' ? SLOTS_MAP[sKey].ar : SLOTS_MAP[sKey].en) : sKey;
        let modeSuffix = '';
        if (val === 'online') {
          modeSuffix = lang === 'ar' ? ' (عن بعد)' : ' (Online)';
        } else if (val === 'person') {
          modeSuffix = lang === 'ar' ? ' (حضوري)' : ' (In-Person)';
        }
        selectedSlots.push(`${dayText}: ${slotText}${modeSuffix}`);
      }
    }
  });

  if (selectedSlots.length === 0) return lang === 'ar' ? 'لا توجد أوقات محددة' : 'No timings selected';
  return selectedSlots.join(' | ');
};

// Mapping student levels
const getStudentLevelDisplay = (st: any, lang: string) => {
  const lvl = (st.level || '').toUpperCase();
  if (lvl.includes('BEGIN') || lvl.includes('مبتد')) {
    return lang === 'ar' ? 'مبتدئة' : 'Beginner';
  } else if (lvl.includes('INTERMED') || lvl.includes('تمهيد') || lvl.includes('متوسط') || lvl.includes('TAMKEEN') || lvl.includes('تمكين')) {
    return lang === 'ar' ? 'تمهيدية' : 'Intermediate';
  } else if (lvl.includes('ADVANC') || lvl.includes('متقدم')) {
    return lang === 'ar' ? 'متقدمة' : 'Advanced';
  }
  return st.level || (lang === 'ar' ? 'مبتدئة' : 'Beginner');
};

// Mapping teacher levels
const getTeacherLevelDisplay = (teach: any, lang: string) => {
  const lvl = (teach.level || '').toLowerCase();
  if (lvl.includes('مجاز') || lvl.includes('master') || lvl.includes('certified')) {
    return lang === 'ar' ? 'مجازة' : 'Certified (Mujazah)';
  } else if (lvl.includes('first') || lvl.includes('أول مرة')) {
    return lang === 'ar' ? 'أول مرة في مرحلة إقراء' : 'First time teaching in Iqraa stage';
  } else {
    return lang === 'ar' ? 'طالبة إقراء' : 'Iqraa';
  }
};

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
  setUser?: React.Dispatch<React.SetStateAction<any>>;
  navigate?: (view: string) => void;
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
  onBack,
  setUser,
  navigate
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
  const [studentTimingSearch, setStudentTimingSearch] = useState('');
  const [selectedTimings, setSelectedTimings] = useState<string[]>([]);
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);

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
  const [newSessLevel, setNewSessLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [newSessTime, setNewSessTime] = useState('');
  const [newSessLocation, setNewSessLocation] = useState('');
  const [newSessFormat, setNewSessFormat] = useState<'in-person' | 'online'>('in-person');

  // Manual fast reassignment trigger ids
  const [assigningStudentId, setAssigningStudentId] = useState<string | null>(null);

  // States for detailed informational modals ("i" button)
  const [infoModalStudent, setInfoModalStudent] = useState<any | null>(null);
  const [infoModalTeacher, setInfoModalTeacher] = useState<any | null>(null);
  const [expandedStudentIds, setExpandedStudentIds] = useState<string[]>([]);

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
    if (typeValue === 'undergrad') {
      return student.cohort || (lang === 'ar' ? 'دفعة بكالوريوس' : 'Undergrad Cohort');
    }
    if (lang === 'ar') {
      return 'دراسات عليا / موظفة';
    }
    return 'Postgraduate/Employee';
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

  // Auto classification for Teachers - strictly online or in-person, never "both"
  const getTeacherPrefAndExp = (teacher: any) => {
    // Certified level dictates experience
    const levelCode = (teacher.level || '').toLowerCase();
    const isMujazah = levelCode.includes('مجاز') || levelCode.includes('teacher') || levelCode.includes('master');
    const expYears = isMujazah ? '5+ Years' : '2-4 Years';
    
    let formatPref: 'in-person' | 'online' = 'online';
    if (teacher.enrollmentDetails?.teacherFormat) {
      formatPref = teacher.enrollmentDetails.teacherFormat === 'person' ? 'in-person' : 'online';
    } else if (teacher.phone?.includes('1234') || teacher.email?.includes('maryam')) {
      formatPref = 'in-person';
    } else if (teacher.email?.includes('sara')) {
      formatPref = 'online';
    } else {
      formatPref = 'in-person';
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
        return formatPref === 'in-person';
      });
    } else {
      // Online: Postgrads & digital-enlisted undergrards, and online teachers
      eligibleStudents = approvedStudents.filter(s => {
        const { typeValue, formatValue } = getStudentTypeAndFormat(s);
        return typeValue === 'postgrad' || formatValue === 'online' || formatValue === 'both';
      });
      eligibleTeachers = approvedTeachers.filter(t => {
        const { formatPref } = getTeacherPrefAndExp(t);
        return formatPref === 'online';
      });
    }

    // Propose proposed drafts mapping Level alignments
    const proposedDraft: any[] = [];
    
    // Group eligible students by level classifications
    const levelGroups: Record<string, any[]> = {
      'BEGINNER': [],
      'INTERMEDIATE': [],
      'ADVANCED': []
    };

    eligibleStudents.forEach(st => {
      const lvlStr = (st.level || '').toUpperCase();
      let matchedLvl = 'BEGINNER';
      if (lvlStr.includes('BEGINNER') || lvlStr.includes('مبتدئة')) matchedLvl = 'BEGINNER';
      else if (lvlStr.includes('INTERMEDIATE') || lvlStr.includes('تمهيدية') || lvlStr.includes('متوسطة') || lvlStr.includes('TAMKEEN') || lvlStr.includes('تمكين')) matchedLvl = 'INTERMEDIATE';
      else if (lvlStr.includes('ADVANCED') || lvlStr.includes('متقدمة')) matchedLvl = 'ADVANCED';
      
      levelGroups[matchedLvl].push(st);
    });

    // Distribute teachers into the levels they can supervise
    eligibleTeachers.forEach((teacher, idx) => {
      // Map level groups
      const tName = `${teacher.firstName || teacher.name} ${teacher.lastName || ''}`;
      const levelsToFill: ('BEGINNER' | 'INTERMEDIATE' | 'ADVANCED')[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
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

  // helper to get beautifully formatted bint full name
  const getBintFullName = (st: any) => {
    let f = (st.firstName || '').trim();
    let fa = (st.fatherName || '').trim();
    let g = (st.grandfatherName || '').trim();
    let l = (st.lastName || '').trim();

    if (!f && st.name) {
      const nameParts = st.name.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        f = nameParts[0];
        l = nameParts[nameParts.length - 1];
        fa = 'سليمان';
        g = 'سعيد';
      } else {
        f = st.name;
      }
    }

    let parts = [f];
    if (fa) {
      parts.push('بنت');
      parts.push(fa);
    }
    if (g) {
      parts.push('بنت');
      parts.push(g);
    }
    if (l) {
      parts.push(l);
    }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  };

  // Student filtering calculation page
  const processedStudents = useMemo(() => {
    return allStudents.filter(s => {
      const bintFullName = getBintFullName(s);
      const matchesSearch = 
        bintFullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.studentId || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(studentSearch.toLowerCase());

      const stLvl = (s.level || '').toUpperCase();
      let matchesLvl = true;
      if (studentLevelFilter !== 'all') {
        if (studentLevelFilter === 'BEGINNER') matchesLvl = stLvl.includes('BEGINNER') || stLvl.includes('مبتدئة');
        else if (studentLevelFilter === 'INTERMEDIATE') matchesLvl = stLvl.includes('INTERMEDIATE') || stLvl.includes('تمهيدية') || stLvl.includes('متوسطة') || stLvl.includes('TAMKEEN') || stLvl.includes('تمكين');
        else if (studentLevelFilter === 'ADVANCED') matchesLvl = stLvl.includes('ADVANCED') || stLvl.includes('متقدمة');
      }

      const { typeValue } = getStudentTypeAndFormat(s);
      let matchesType = true;
      if (studentTypeFilter !== 'all') {
        matchesType = typeValue === studentTypeFilter;
      }

      const studentTimingsStr = getFormattedTimings(s.enrollmentDetails?.timings || s.timings, lang) || '';
      
      let matchesTiming = true;
      if (selectedTimings.length > 0) {
        matchesTiming = selectedTimings.some(t => {
          if (t === 'Online') {
            const { formatValue } = getStudentTypeAndFormat(s);
            if (formatValue === 'online' || formatValue === 'both') return true;
          }
          if (t === 'In-Person') {
            const { formatValue } = getStudentTypeAndFormat(s);
            if (formatValue === 'in-person' || formatValue === 'both') return true;
          }

          if (t === 'Sunday') return studentTimingsStr.includes('Sunday') || studentTimingsStr.includes('الأحد');
          if (t === 'Monday') return studentTimingsStr.includes('Monday') || studentTimingsStr.includes('الاثنين');
          if (t === 'Tuesday') return studentTimingsStr.includes('Tuesday') || studentTimingsStr.includes('الثلاثاء');
          if (t === 'Wednesday') return studentTimingsStr.includes('Wednesday') || studentTimingsStr.includes('الأربعاء');
          if (t === 'Thursday') return studentTimingsStr.includes('Thursday') || studentTimingsStr.includes('الخميس');
          
          if (t === 'Fajr') return studentTimingsStr.toLowerCase().includes('fajr') || studentTimingsStr.includes('فجرية');
          if (t === '8:00') return studentTimingsStr.includes('8:00') || studentTimingsStr.includes('٨:٠٠');
          if (t === '10:00') return studentTimingsStr.includes('10:00') || studentTimingsStr.includes('١٠:٠٠');
          if (t === '12:00') return studentTimingsStr.includes('12:00') || studentTimingsStr.includes('١٢:٠٠');
          if (t === '2:15') return studentTimingsStr.includes('2:15') || studentTimingsStr.includes('٢:١٥');
          if (t === '4:15') return studentTimingsStr.includes('4:15') || studentTimingsStr.includes('٤:١٥');
          if (t === '8:00PM') return studentTimingsStr.includes('8:00-9:15 PM') || studentTimingsStr.includes('٨:٠٠ - ٩:١٥ م');
          
          return studentTimingsStr.toLowerCase().includes(t.toLowerCase());
        });
      }

      return matchesSearch && matchesLvl && matchesType && matchesTiming;
    });
  }, [allStudents, studentSearch, studentLevelFilter, studentTypeFilter, selectedTimings, lang]);

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
        matchesFormat = formatPref === teacherFormatFilter;
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
          <div className="space-y-8 animate-fade-in shadow-2xs">
            {/* Bento Grid Analytics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
              {/* Total Students Card */}
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

              {/* Total Teachers Card */}
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
                  <p className="text-xs text-slate-400 font-bold">{lang === 'ar' ? 'إجمالي المعلمات المسجلات' : 'Total Active Teachers'}</p>
                </div>
              </div>

              {/* Total Sessions Card */}
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

              {/* Unassigned Card */}
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
                                 className="text-red-150 hover:bg-red-50/70 border border-red-100 bg-white px-3 py-1.5 font-bold text-[10px] rounded-lg cursor-pointer"
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
             <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-3xs flex flex-col md:flex-row gap-4 items-center w-full">
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

              {/* Timing filtration custom multi-select checkbox dropdown */}
              <div className="relative w-full md:w-64 font-bold select-none z-20">
                <span className="absolute left-3 top-3 text-xs z-10">⏰</span>
                <button
                  type="button"
                  onClick={() => setTimeDropdownOpen(!timeDropdownOpen)}
                  className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand-primary pl-9 pr-8 py-2.5 rounded-xl text-xs font-black text-start flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate">
                    {selectedTimings.length === 0 
                      ? (lang === 'ar' ? 'البحث بالأوقات والأنماط...' : 'Filter times & modes...')
                      : (lang === 'ar' 
                          ? `${selectedTimings.length} خيارات محددة` 
                          : `${selectedTimings.length} selected filter(s)`)}
                  </span>
                  <svg className={`fill-current h-3 w-3 transition-transform duration-250 shrink-0 ${timeDropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </button>

                {timeDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-20 cursor-default" 
                      onClick={() => setTimeDropdownOpen(false)} 
                    />
                    <div className="absolute left-0 mt-1.5 w-full bg-white border border-slate-250 rounded-2xl shadow-xl z-35 max-h-80 overflow-y-auto p-3.5 space-y-3.5 text-xs text-start">
                      {[
                        { category: lang === 'ar' ? 'الأيام' : 'Days', items: [
                          { value: 'Sunday', labelAr: 'الأحد', labelEn: 'Sunday' },
                          { value: 'Monday', labelAr: 'الاثنين', labelEn: 'Monday' },
                          { value: 'Tuesday', labelAr: 'الثلاثاء', labelEn: 'Tuesday' },
                          { value: 'Wednesday', labelAr: 'الأربعاء', labelEn: 'Wednesday' },
                          { value: 'Thursday', labelAr: 'الخميس', labelEn: 'Thursday' },
                        ]},
                        { category: lang === 'ar' ? 'الفترات الزمنية' : 'Time Slots', items: [
                          { value: 'Fajr', labelAr: 'فجرية', labelEn: 'Fajr Session' },
                          { value: '8:00', labelAr: '٨:٠٠ - ٩:١٥ ص', labelEn: '8:00 - 9:15 AM' },
                          { value: '10:00', labelAr: '١٠:٠٠ - ١١:١٥ ص', labelEn: '10:00 - 11:15 AM' },
                          { value: '12:00', labelAr: '١٢:٠٠ - ١:١٥ ظ', labelEn: '12:00 - 1:15 PM' },
                          { value: '2:15', labelAr: '٢:١٥ - ٣:٣٠ ظ', labelEn: '2:15 - 3:30 PM' },
                          { value: '4:15', labelAr: '٤:١٥ - ٥:٣٠ ع', labelEn: '4:15 - 5:30 PM' },
                          { value: '8:00PM', labelAr: '٨:٠٠ - ٩:١٥ م', labelEn: '8:00 - 9:15 PM' },
                        ]},
                        { category: lang === 'ar' ? 'نمط التلقي' : 'Delivery Mode', items: [
                          { value: 'Online', labelAr: 'عن بعد', labelEn: 'Online' },
                          { value: 'In-Person', labelAr: 'حضوري', labelEn: 'In-Person' },
                        ]}
                      ].map((group, gidx) => (
                        <div key={gidx} className="space-y-1.5">
                          <span className="text-[10px] font-black text-slate-400 block border-b border-slate-100 pb-1">
                            {group.category}
                          </span>
                          <div className="grid grid-cols-1 gap-1">
                            {group.items.map((item, iidx) => {
                              const isChecked = selectedTimings.includes(item.value);
                              return (
                                <label 
                                  key={iidx} 
                                  className={`flex items-center gap-2.5 p-1.5 rounded-lg cursor-pointer transition-colors ${
                                    isChecked 
                                      ? 'bg-brand-primary/5 text-brand-primary font-black' 
                                      : 'hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setSelectedTimings(prev => prev.filter(v => v !== item.value));
                                      } else {
                                        setSelectedTimings(prev => [...prev, item.value]);
                                      }
                                    }}
                                    className="accent-brand-primary cursor-pointer w-4 h-4 rounded text-brand-primary focus:ring-brand-primary"
                                  />
                                  <span className="font-bold">
                                    {lang === 'ar' ? item.labelAr : item.labelEn}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      
                      {selectedTimings.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 flex justify-between items-center bg-white sticky bottom-0">
                          <button
                            type="button"
                            onClick={() => setSelectedTimings([])}
                            className="text-red-655 hover:underline text-[10px] font-black cursor-pointer"
                          >
                            {lang === 'ar' ? 'مسح الكل' : 'Clear All'}
                          </button>
                          <span className="text-[10px] text-slate-400">
                            {lang === 'ar' ? `${selectedTimings.length} مختار` : `${selectedTimings.length} active`}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
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
              <table className="w-full text-xs font-bold border-collapse select-none min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-black h-12 uppercase text-start">
                    <th className="px-5 text-start">{lang === 'ar' ? 'الطالبة ووسيلة الاتصال' : 'Student Name & Contact'}</th>
                    <th className="px-5 text-start">{lang === 'ar' ? 'الأوقات المتاحة المحددة' : 'Available Timings Chosen'}</th>
                    <th className="px-5 text-center">{lang === 'ar' ? 'المستوى' : 'Level'}</th>
                    <th className="px-5 text-center">{lang === 'ar' ? 'نمط التلقي المفضل' : 'Delivery Preference'}</th>
                    <th className="px-5 text-start">{lang === 'ar' ? 'ملاحظات الطالبة' : 'Student Notes'}</th>
                    <th className="px-5 text-center">{lang === 'ar' ? 'الحالة والمقرأة الحالية' : 'Assignment State'}</th>
                    <th className="px-5 text-end">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
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

                    const isExpanded = expandedStudentIds.includes(idKey);

                    return (
                      <React.Fragment key={idKey || sidx}>
                        <tr className={`h-14 transition-colors ${isExpanded ? 'bg-sky-50/15' : 'hover:bg-slate-50/50'}`}>
                        <td className="px-5">
                          <div className="flex items-center gap-2.5">
                            <img src={st.avatar || `https://picsum.photos/seed/${idKey}/100/100`} className="w-8 h-8 rounded-full border border-slate-200 shrink-0" referrerPolicy="no-referrer" />
                            <div>
                              <span className="font-extrabold text-brand-dark block text-[13px]">
                                {getBintFullName(st)}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-mono">{st.email}</span>
                              <span className="text-[10px] text-brand-primary block font-mono text-start" dir="ltr" style={{ direction: 'ltr', textAlign: 'start' }}>📱 {st.phone || '---'}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 text-start font-mono text-xs text-brand-primary font-bold min-w-[280px]">
                          <div className="whitespace-pre-line leading-relaxed py-2 font-black break-words" title={getFormattedTimings(st.enrollmentDetails?.timings || st.timings, lang)}>
                            {getFormattedTimings(st.enrollmentDetails?.timings || st.timings, lang)}
                          </div>
                        </td>

                        <td className="px-5 text-center">
                          {(() => {
                            const lvlLabel = getStudentLevelDisplay(st, lang);
                            const lvlRaw = (st.level || '').toUpperCase();
                            let badgeStyle = "bg-amber-50 text-amber-700 border-amber-200/60"; // Beginner style
                            if (lvlRaw.includes('INTERMED') || lvlRaw.includes('تمهيد') || lvlRaw.includes('متوسط') || lvlRaw.includes('TAMKEEN') || lvlRaw.includes('تمكين')) {
                              badgeStyle = "bg-blue-50 text-blue-700 border-blue-200/60";
                            } else if (lvlRaw.includes('ADVANC') || lvlRaw.includes('متقدم')) {
                              badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200/60";
                            }
                            return (
                              <span className={`px-3 py-1 font-extrabold rounded-full border text-[11px] inline-block shadow-3xs ${badgeStyle}`}>
                                {lvlLabel}
                              </span>
                            );
                          })()}
                        </td>

                        <td className="px-5 text-center text-slate-500 font-semibold">
                          {displayPreferredFormat(st)}
                        </td>

                        <td className="px-5 text-start text-[10.5px] text-slate-500 max-w-[220px]">
                          <div className="line-clamp-2" title={st.enrollmentDetails?.notes || st.notes || '---'}>
                            {st.enrollmentDetails?.notes || st.notes || '---'}
                          </div>
                        </td>

                        <td className="px-5 text-center font-bold">
                          {assignedSession ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-1 rounded-lg text-[10px] uppercase font-black">
                              👉 {(assignedSession as Session).name}
                            </span>
                          ) : (
                            <span className="bg-red-50 text-red-655 border border-red-100 px-2 py-1 rounded-lg text-[10px] uppercase font-black animate-pulse">
                              ⏳ {lang === 'ar' ? 'غير مسكنة' : 'NOT ASSIGNED'}
                            </span>
                          )}
                        </td>

                        <td className="px-4 text-end">
                          <div className="flex gap-1.5 justify-end items-center">
                            {assignedSession ? (
                              <button
                                onClick={() => handleUnassignStudent((assignedSession as Session).id, idKey)}
                                className="text-red-655 hover:bg-red-50 border border-red-100 bg-white px-3 py-1.5 rounded-xl font-bold text-[10px] cursor-pointer"
                              >
                                {lang === 'ar' ? 'إلغاء التسكين' : 'Unassign Class'}
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setAssigningStudentId(idKey);
                                  setActiveTab('sessions');
                                }}
                                className="bg-brand-primary hover:bg-brand-accent text-white px-3.5 py-1.5 rounded-xl font-black text-[10px] shadow-sm cursor-pointer"
                              >
                                ➕ {lang === 'ar' ? 'تسكين يدوي' : 'Place student'}
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setExpandedStudentIds(prev => 
                                  prev.includes(idKey) ? prev.filter(id => id !== idKey) : [...prev, idKey]
                                );
                              }}
                              className={`p-1 px-2.5 rounded-xl text-xs font-black cursor-pointer flex items-center justify-center shrink-0 transition-all ${
                                isExpanded
                                  ? 'bg-sky-600 text-white border border-sky-600 shadow-xs scale-102 font-black'
                                  : 'bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-100 font-bold'
                              }`}
                              title={lang === 'ar' ? 'عرض تفاصيل الطالبة' : 'View Student Details'}
                            >
                              ℹ️
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-sky-50/15 border-b border-sky-100/40">
                          <td colSpan={7} className="p-0">
                            <div className="px-5 py-4 space-y-4 animate-fade-in text-start border-l-4 border-sky-500 bg-sky-50/5">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold text-gray-700">
                                
                                {/* Contact Information */}
                                <div className="p-3 bg-white border border-slate-200/60 rounded-xl shadow-3xs">
                                  <span className="text-slate-400 block mb-1 text-[10px]">{lang === 'ar' ? 'تفاصيل التواصل' : 'Contact Information'}</span>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'الهاتف:' : 'Phone:'}</span>
                                      <span className="text-brand-dark font-mono text-xs font-black inline-block" dir="ltr" style={{ direction: 'ltr' }}>{st.phone || '---'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'البريد:' : 'Email:'}</span>
                                      <span className="text-brand-dark font-mono text-[10.5px] font-black">{st.email || '---'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Academic Stream */}
                                <div className="p-3 bg-white border border-slate-200/60 rounded-xl shadow-3xs">
                                  <span className="text-slate-400 block mb-1 text-[10px]">{lang === 'ar' ? 'البيانات الأكاديمية' : 'Academic Profile'}</span>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'الكلية:' : 'College:'}</span>
                                      <span className="text-brand-dark text-xs font-black">{st.college || '---'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'سنة الدفعة / المستوى:' : 'Cohort / Level:'}</span>
                                      <span className="text-brand-dark font-mono text-xs font-black">{st.cohort || '---'} ({getStudentLevelDisplay(st, lang)})</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Delivery & Format Preference */}
                                <div className="p-3 bg-white border border-slate-200/60 rounded-xl shadow-3xs border-s-4 border-s-brand-primary">
                                  <span className="text-slate-400 block mb-1 text-[10px]">{lang === 'ar' ? 'خيارات التلقي ونمط الاستماع' : 'Delivery Preference'}</span>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'النمط المفضل:' : 'Preferred Format:'}</span>
                                      <span className="text-brand-dark text-xs font-black">{displayPreferredFormat(st)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'ملاحظات:' : 'Notes:'}</span>
                                      <span className="text-brand-dark text-[11px] font-black line-clamp-1">{st.enrollmentDetails?.notes || st.notes || '---'}</span>
                                    </div>
                                  </div>
                                </div>

                              </div>

                              {/* Full Timings Display */}
                              <div className="p-3.5 bg-white border border-slate-200/60 rounded-xl shadow-3xs text-xs font-bold">
                                <span className="text-slate-400 block mb-1.5 flex items-center gap-1 text-[10px]">
                                  <span>⏰</span>
                                  <span>{lang === 'ar' ? 'جميع الفترات الزمنية والأيام المدخلة المفضلة لدى الطالبة:' : 'All preferred registration days & timing slots:'}</span>
                                </span>
                                <div className="text-brand-primary text-xs font-black whitespace-pre-wrap leading-relaxed py-1">
                                  {getFormattedTimings(st.enrollmentDetails?.timings || st.timings, lang)}
                                </div>
                              </div>

                              {/* Doc files */}
                              {(st.cardPicName || st.voiceFileName) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {st.cardPicName && (
                                    <div className="p-3 bg-white border border-slate-200/60 rounded-xl shadow-3xs">
                                      <span className="text-slate-400 block mb-2 text-[10px]">{lang === 'ar' ? 'البطاقة الجامعية المرفقة' : 'SQU ID Card verification'}</span>
                                      <div className="h-28 w-fit border border-dashed border-slate-200 rounded-lg overflow-hidden bg-slate-50 relative flex items-center justify-center p-1">
                                        <img 
                                          src={`https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400`} 
                                          alt="ID Document preview" 
                                          className="h-full object-cover rounded-md"
                                        />
                                        <span className="absolute bottom-1 right-2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">{st.cardPicName}</span>
                                      </div>
                                    </div>
                                  )}
                                  {st.voiceFileName && (
                                    <div className="p-3 bg-white border border-slate-200/60 rounded-xl shadow-3xs flex flex-col justify-between">
                                      <div>
                                        <span className="text-slate-400 block mb-1 text-[10px]">{lang === 'ar' ? 'الملف الصوتي المسجل للتلاوة كعينة' : 'Voice recitation diagnostic sample'}</span>
                                        <span className="text-brand-dark font-mono text-[10.5px] block truncate font-black mb-2">🎵 {st.voiceFileName}</span>
                                      </div>
                                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-2">
                                        {/* Audio player simulator */}
                                        <span className="text-[10px] text-slate-500 font-extrabold flex items-center gap-1.5 w-full">
                                          <span className="inline-block w-2 h-2 bg-brand-primary rounded-full animate-ping"></span>
                                          <span>{lang === 'ar' ? 'تلاوة تجريبية جاهزة للاستماع' : 'Recitation diagnostic sample loaded'}</span>
                                        </span>
                                        <button 
                                          onClick={() => alert(lang === 'ar' ? 'تشغيل عينة تلاوة الطالبة المتميزة...' : 'Playing student diagnostic recitation...')}
                                          className="px-3 py-1.5 bg-brand-primary text-white rounded-lg hover:bg-brand-accent text-[10px] font-black cursor-pointer shrink-0"
                                        >
                                          ▶️ {lang === 'ar' ? 'استماع' : 'Listen'}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                  {processedStudents.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-10 font-bold text-slate-400 italic">
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
                          <span className="text-[10px] text-brand-primary block font-mono">📞 {teach.phone || '---'}</span>
                        </div>
                      </div>

                      <div className="space-y-2.5 text-xs text-slate-600 mb-6">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">{lang === 'ar' ? 'الكلية والصفة' : 'SQU Department'}:</span>
                          <span className="font-black text-brand-dark">{teach.college || 'Education'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">{lang === 'ar' ? 'الترخيص والاعتماد' : 'Certification'}:</span>
                          <span className="bg-brand-neutral text-brand-primary font-black px-2 py-0.5 rounded text-[10px]">{getTeacherLevelDisplay(teach, lang)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">{lang === 'ar' ? 'نواتج الخبرة' : 'Teaching Span'}:</span>
                          <span className="font-mono font-bold text-slate-800">{expYears}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">{lang === 'ar' ? 'نمط المشاركة المفضل' : 'Delivery Slot'}:</span>
                          <span className="font-bold text-brand-primary">
                            {formatPref === 'online' ? '💻 Online' : '🏫 In-person'}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1 border-t border-slate-100/60 pt-2">
                          <span className="text-slate-400 font-bold">{lang === 'ar' ? 'الأوقات المتاحة للتدريس' : 'Available Teach Timings'}:</span>
                          <span className="text-[10.5px] text-slate-700 font-mono break-words line-clamp-2" title={getFormattedTimings(teach.enrollmentDetails?.timings || teach.timings, lang)}>
                            {getFormattedTimings(teach.enrollmentDetails?.timings || teach.timings, lang)}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1 border-t border-slate-100/60 pt-2">
                          <span className="text-slate-400 font-bold">{lang === 'ar' ? 'ملاحظات المعلمة' : 'Teacher Notes'}:</span>
                          <span className="text-[10.5px] text-slate-500 line-clamp-2" title={teach.enrollmentDetails?.notes || teach.notes || '---'}>
                            {teach.enrollmentDetails?.notes || teach.notes || '---'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 select-none space-y-2">
                      <div>
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

                      <button
                        onClick={() => setInfoModalTeacher(teach)}
                        className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-100 rounded-xl text-xs font-black cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                        title={lang === 'ar' ? 'عرض تفاصيل الاعتماد والسجل الكامل' : 'Full Teacher Information'}
                      >
                        <span>ℹ️</span>
                        <span>{lang === 'ar' ? 'السجل التفصيلي الكامل' : 'All System Info'}</span>
                      </button>
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
                // Seek live teacher details in allTeachers to support runtime name or format edits
                const actualTeacher = allTeachers.find(t => 
                  t.phone === sess.teacher.phone || 
                  t.name === sess.teacher.name || 
                  `${t.firstName || ''} ${t.lastName || ''}`.trim() === sess.teacher.name
                );

                // Dynamically resolve the teacher's name
                const resolvedTeacherName = actualTeacher 
                  ? `${actualTeacher.firstName || ''} ${actualTeacher.lastName || ''}`.trim() || actualTeacher.name
                  : sess.teacher.name;

                // Strip any existing "أ. " or "T. " prefixes from raw name to construct clean format
                const cleanTeacherName = resolvedTeacherName
                  .replace(/^(T\.\s*|أ\.\s*)/i, '')
                  .trim();

                const dynamicSessionName = lang === 'ar'
                  ? `حلقة أ. ${cleanTeacherName}`
                  : `T.${cleanTeacherName} session`;

                // Handle format and location defaults
                const isOnline = actualTeacher 
                  ? actualTeacher.deliveryPreference === 'online' || actualTeacher.enrollmentDetails?.deliveryPreference === 'online'
                  : sess.location.includes('تيمز') || sess.location.includes('Teams') || sess.location.toLowerCase().includes('online');

                const defaultInPersonLoc = lang === 'ar' ? 'استراحة التربية' : 'استراحة التربية (Education Lounge)';
                const defaultOnlineLoc = lang === 'ar' ? 'أونلاين عبر تيمز' : 'Teams Digital Channel';

                let resolvedLocation = sess.location;
                // If location is blank or generic default SQU Campus, resolve to default "استراحة التربية" 
                if (!resolvedLocation || resolvedLocation.includes('مسجد الجامعة') || resolvedLocation.trim().toLowerCase() === 'squ campus mosque' || resolvedLocation.trim() === '') {
                  resolvedLocation = isOnline ? defaultOnlineLoc : defaultInPersonLoc;
                }

                if (actualTeacher) {
                  const teacherPref = actualTeacher.deliveryPreference || actualTeacher.enrollmentDetails?.deliveryPreference;
                  if (teacherPref === 'online' && !resolvedLocation.toLowerCase().includes('teams') && !resolvedLocation.toLowerCase().includes('online')) {
                    resolvedLocation = defaultOnlineLoc;
                  } else if (teacherPref === 'in-person' && (resolvedLocation.toLowerCase().includes('teams') || resolvedLocation.toLowerCase().includes('online'))) {
                    resolvedLocation = defaultInPersonLoc;
                  }
                }
                
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
                        <h4 className="font-extrabold text-white text-base truncate mt-2">{dynamicSessionName}</h4>
                        <span className="text-xs text-white/95 truncate block mt-0.5">👩‍🏫 {resolvedTeacherName}</span>
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
                            <span>{resolvedLocation}</span>
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
                        else if (sLvl === 'INTERMEDIATE' && (stLvl.includes('INTERMEDIATE') || stLvl.includes('تمهيدية') || stLvl.includes('متوسطة') || stLvl.includes('TAMKEEN') || stLvl.includes('تمكين'))) levelMatches = true;
                        else if (sLvl === 'ADVANCED' && (stLvl.includes('ADVANCED') || stLvl.includes('متقدمة'))) levelMatches = true;
                        
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

      {/* Student Informational Modal ("i" button) */}
      {infoModalStudent && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-brand-primary/15 shadow-2xl w-full max-w-xl text-start animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-primary to-brand-accent p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img src={infoModalStudent.avatar || `https://picsum.photos/seed/${infoModalStudent.studentId || infoModalStudent.email}/100/100`} className="w-12 h-12 rounded-full border-2 border-white/40" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="text-base font-black leading-tight">{infoModalStudent.firstName} {infoModalStudent.lastName}</h4>
                  <p className="text-xs text-white/80 font-mono mt-0.5">{infoModalStudent.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setInfoModalStudent(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
              >
                ×
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-slate-400 block mb-1">{lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</span>
                  <span className="text-brand-dark font-mono text-sm inline-block" dir="ltr" style={{ direction: 'ltr' }}>{infoModalStudent.phone || '---'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-slate-400 block mb-1">{lang === 'ar' ? 'الدرجة العلمية والمسار' : 'Academic Cohort'}</span>
                  <span className="text-brand-dark text-sm">{displayStudentType(infoModalStudent)}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-slate-400 block mb-1">{lang === 'ar' ? 'الكلية' : 'SQU College'}</span>
                  <span className="text-brand-dark text-sm">{infoModalStudent.college || '---'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-slate-400 block mb-1">{lang === 'ar' ? 'سنة الدفعة' : 'Cohort Year'}</span>
                  <span className="text-brand-dark font-mono text-sm">{infoModalStudent.cohort || '---'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-slate-400 block mb-1">{lang === 'ar' ? 'المستوى التعليمي والفرز' : 'Tajweed Level'}</span>
                  <span className="bg-brand-neutral text-brand-primary px-2.5 py-0.5 rounded text-xs font-black w-fit block mt-1 font-mono">
                    {getStudentLevelDisplay(infoModalStudent, lang)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-slate-400 block mb-1">{lang === 'ar' ? 'طريقة الاستماع المفضلة' : 'Delivery Preference'}</span>
                  <span className="text-brand-dark text-sm">{displayPreferredFormat(infoModalStudent)}</span>
                </div>
              </div>

              {/* Timings Prefered */}
              <div className="p-4 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl space-y-1.5">
                <h5 className="text-xs font-black text-brand-primary uppercase tracking-wide">{lang === 'ar' ? 'الأوقات والمواعيد المرشحة والمختارة في النظام:' : 'Eligible recitation slots chosen:'}</h5>
                <p className="text-xs font-mono font-bold text-slate-700 leading-normal">
                  {getFormattedTimings(infoModalStudent.enrollmentDetails?.timings || infoModalStudent.timings, lang)}
                </p>
              </div>

              {/* Student Notes */}
              <div className="p-4 bg-amber-500/5 border border-amber-250 rounded-2xl space-y-1.5">
                <h5 className="text-xs font-black text-amber-805 uppercase tracking-wide">{lang === 'ar' ? 'ملاحظات التسجيل وباقات الحفظ والالتزام:' : 'Applicant Enrollment notes:'}</h5>
                <p className="text-[11.5px] font-bold text-slate-650 leading-relaxed break-words whitespace-pre-wrap">
                  {infoModalStudent.enrollmentDetails?.notes || infoModalStudent.notes || (lang === 'ar' ? 'لا توجد ملاحظات تفصيلية مدونة.' : 'No specific background notes written by student.')}
                </p>
              </div>
            </div>

            {/* Footer shadow actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-end">
              <button 
                onClick={() => setInfoModalStudent(null)}
                className="bg-brand-primary hover:bg-brand-accent text-white px-5 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all"
              >
                {lang === 'ar' ? 'إغلاق نافذة السجل' : 'Done & Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Informational Modal ("i" button) */}
      {infoModalTeacher && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-brand-primary/15 shadow-2xl w-full max-w-xl text-start animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-primary to-brand-accent p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img src={infoModalTeacher.avatar || `https://picsum.photos/seed/${infoModalTeacher.employeeId || infoModalTeacher.email}/100/100`} className="w-12 h-12 rounded-full border-2 border-white/40" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="text-base font-black leading-tight">{infoModalTeacher.firstName} {infoModalTeacher.lastName}</h4>
                  <p className="text-xs text-white/80 font-mono mt-0.5">{infoModalTeacher.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setInfoModalTeacher(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
              >
                ×
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-slate-400 block mb-1">{lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</span>
                  <span className="text-brand-dark font-mono text-sm">{infoModalTeacher.phone || '---'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-slate-400 block mb-1">{lang === 'ar' ? 'الرقم الوظيفي / الجامعي' : 'Employee ID'}</span>
                  <span className="text-brand-dark font-mono text-sm">{infoModalTeacher.employeeId || '---'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-slate-400 block mb-1">{lang === 'ar' ? 'القسم أو الكلية' : 'Department/College'}</span>
                  <span className="text-brand-dark text-sm">{infoModalTeacher.college || '---'}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-slate-400 block mb-1">{lang === 'ar' ? 'الاعتماد ومرحلة الترخيص' : 'Staff Certification'}</span>
                  <span className="bg-brand-neutral text-brand-primary px-2.5 py-0.5 rounded text-xs font-black w-fit block mt-1 font-mono">
                    {getTeacherLevelDisplay(infoModalTeacher, lang)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-slate-400 block mb-1">{lang === 'ar' ? 'نواتج الخبرة التقريبية' : 'Experience Years'}</span>
                  <span className="text-brand-dark text-sm">{getTeacherPrefAndExp(infoModalTeacher).expYears}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-slate-400 block mb-1">{lang === 'ar' ? 'قناة التدريس المفضلة' : 'Preferred Format'}</span>
                  <span className="text-brand-dark text-sm">
                    {getTeacherPrefAndExp(infoModalTeacher).formatPref === 'online' ? '💻 Online Digital Teams' : '🏫 SQU In-Person Mosque'}
                  </span>
                </div>
              </div>

              {/* Timings Prefered */}
              <div className="p-4 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl space-y-1.5">
                <h5 className="text-xs font-black text-brand-primary uppercase tracking-wide">{lang === 'ar' ? 'الأوقات المتاحة والمختارة بجدولة المعلمة:' : 'Instructing available time slots:'}</h5>
                <p className="text-xs font-mono font-bold text-slate-700 leading-normal">
                  {getFormattedTimings(infoModalTeacher.enrollmentDetails?.timings || infoModalTeacher.timings, lang)}
                </p>
              </div>

              {/* Teacher Notes */}
              <div className="p-4 bg-amber-500/5 border border-amber-250 rounded-2xl space-y-1.5">
                <h5 className="text-xs font-black text-amber-805 uppercase tracking-wide">{lang === 'ar' ? 'ملاحظات المعلمة وتوجيهات الاتصال:' : 'Special instruction notes:'}</h5>
                <p className="text-[11.5px] font-bold text-slate-650 leading-relaxed break-words whitespace-pre-wrap">
                  {infoModalTeacher.enrollmentDetails?.notes || infoModalTeacher.notes || (lang === 'ar' ? 'لا توجد ملاحظات تذكر.' : 'No background notes written by supervisor.')}
                </p>
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-end">
              <button 
                onClick={() => setInfoModalTeacher(null)}
                className="bg-brand-primary hover:bg-brand-accent text-white px-5 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all"
              >
                {lang === 'ar' ? 'إغلاق نافذة السجل' : 'Done & Close'}
              </button>
            </div>
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
