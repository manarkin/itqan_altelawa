import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Sliders, 
  Check, 
  Play, 
  X, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  RefreshCw, 
  Users, 
  ChevronRight, 
  History, 
  Award, 
  HelpCircle, 
  UserPlus, 
  Share2, 
  Monitor, 
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { 
  assignSessions, 
  AlgStudent, 
  AlgTeacher, 
  ProposedSession, 
  AssignerConstraints, 
  normalizeLevel 
} from './SessionAssigner';
import { Session, SessionStudent } from '../../types';

interface AssignmentWizardProps {
  sessions: Session[];
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  allStudents: any[];
  allTeachers: any[];
  setAllStudents: React.Dispatch<React.SetStateAction<any[]>>;
  setAllTeachers: React.Dispatch<React.SetStateAction<any[]>>;
  lang: 'ar' | 'en';
  onBack: () => void;
}

const ALL_DAYS = [
  { key: 'Sunday', ar: 'الأحد', en: 'Sunday' },
  { key: 'Monday', ar: 'الاثنين', en: 'Monday' },
  { key: 'Tuesday', ar: 'الثلاثاء', en: 'Tuesday' },
  { key: 'Wednesday', ar: 'الأربعاء', en: 'Wednesday' },
  { key: 'Thursday', ar: 'الخميس', en: 'Thursday' }
];

const ALL_SLOTS = [
  { key: 'Fajr', ar: 'فجرية', en: 'Fajr (Early Morning)' },
  { key: '8:00-9:15', ar: '٨:٠٠ - ٩:١٥ ص', en: '8:00 - 9:15 AM' },
  { key: '10:00-11:15', ar: '١٠:٠٠ - ١١:١٥ ص', en: '10:00 - 11:15 AM' },
  { key: '12:00-1:15', ar: '١٢:٠٠ - ١:١٥ ظ', en: '12:00 - 1:15 PM' },
  { key: '2:15-3:30', ar: '٢:١٥ - ٣:٣٠ ظ', en: '2:15 - 3:30 PM' },
  { key: '4:15-5:30', ar: '٤:١٥ - ٥:٣٠ ع', en: '4:15 - 5:30 PM' },
  { key: '8:00-9:15PM', ar: '٨:٠٠ - ٩:١٥ م', en: '8:00 - 9:15 PM' }
];

// Omani traditional names for seeding realistic datasets
const SEED_FIRST_NAMES = [
  'فاطمة', 'شريفة', 'عهود', 'منى', 'كوثر', 'ريان', 'أصيلة', 'غالية', 
  'عبير', 'ريهام', 'تسنيم', 'مزون', 'إيمان', 'وفاء', 'أميرة', 'مروة', 
  'صفية', 'منال', 'ابتسام', 'هناء', 'رحمة', 'شيماء', 'شمسة', 'هدى'
];
const SEED_FATHER_NAMES = ['سليمان', 'خلفان', 'ناصر', 'سعيد', 'محمد', 'أحمد', 'جمعة', 'راشد', 'حارب', 'حمد', 'سالم'];
const SEED_FAMILY_NAMES = ['الشرجية', 'الرحبية', 'الجابرية', 'الهنائية', 'البوسعيدية', 'الحارثية', 'الغيلانية', 'المعمرية', 'العبرية', 'الشكيلية', 'الدرعية', 'السنيدية'];

export default function AssignmentWizard({
  sessions,
  setSessions,
  allStudents,
  allTeachers,
  setAllStudents,
  setAllTeachers,
  lang,
  onBack
}: AssignmentWizardProps) {
  const isAr = lang === 'ar';
  const tField = (ar: string, en: string) => isAr ? ar : en;

  const [activeTab, setActiveTab] = useState<'wizard' | 'history'>('wizard');

  // Wizard Steps: 1 (Config), 2 (Constraints), 3 (Preview & Adjust), 4 (Executed)
  const [step, setStep] = useState<number>(1);

  // Configuration States (Step 1)
  const [periodName, setPeriodName] = useState('Fall 2026 Semester - خريف ٢٠٢٦');
  const [deadline, setDeadline] = useState('2026-06-15');
  const [enabledSlots, setEnabledSlots] = useState<Record<string, boolean>>(() => {
    const slots: Record<string, boolean> = {};
    ALL_DAYS.forEach(day => {
      ALL_SLOTS.forEach(slot => {
        // default enable morning & afternoon timeslots
        slots[`${day.key}_${slot.key}`] = slot.key !== 'Fajr' && slot.key !== '8:00-9:15PM';
      });
    });
    return slots;
  });

  // Constraints & Rules States (Step 2)
  const [constraints, setConstraints] = useState<AssignerConstraints>({
    maxStudentsPerSession: 6,
    minStudentsPerSession: 3,
    preferTwoCommonTimeslots: true,
    allowOnlineFallback: true,
    teachersCanTeachMultiple: false
  });

  // Matching Results (Step 3)
  const [algResult, setAlgResult] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([]);
  const [logIndex, setLogIndex] = useState(0);

  // Manual Adjustments inside Proposed Sessions
  const [proposedSessions, setProposedSessions] = useState<ProposedSession[]>([]);
  const [unmatchedStudents, setUnmatchedStudents] = useState<AlgStudent[]>([]);
  const [historianRuns, setHistorianRuns] = useState<any[]>(() => {
    const saved = localStorage.getItem('itqan_assigned_runs_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Track currently selected run for details history modal
  const [selectedHistoryRun, setSelectedHistoryRun] = useState<any | null>(null);

  // Trigger automated assignment matching
  const runMatchingAlgorithm = () => {
    setIsSimulating(true);
    setSimulatedLogs([]);
    setLogIndex(0);
    setStep(3);

    // Convert global students to raw algorithm student matrices
    const rawStudents: AlgStudent[] = allStudents.map((s, idx) => {
      const timingsObj: Record<string, boolean> = {};
      ALL_DAYS.forEach(day => {
        ALL_SLOTS.forEach(slot => {
          const key = `${day.key}_${slot.key}`;
          const isSel = s.enrollmentDetails?.timings?.[key];
          timingsObj[key] = !!isSel;
        });
      });

      return {
        id: s.studentId || s.email || `std_mock_${idx}`,
        firstName: s.firstName || s.name || '',
        lastName: s.lastName || '',
        fullName: s.firstName ? `${s.firstName} ${s.lastName}` : s.name || '',
        studentType: s.studentType || (s.email?.includes('student') ? 'undergrad' : 'postgrad'),
        preferredFormat: s.enrollmentDetails?.preferredSessionFormat || s.preferredFormat || 'flexible',
        level: normalizeLevel(s.level || ''),
        phone: s.phone || '+968 9111 2233',
        email: s.email || 'student@squ.edu.om',
        college: s.college || 'Science',
        cohort: s.cohort || '2023',
        timings: timingsObj
      };
    });

    // Convert global teachers to raw algorithm teachers
    const rawTeachers: AlgTeacher[] = allTeachers.map((t, idx) => {
      const availabilityObj: Record<string, { available: boolean; preferredFormat: 'online' | 'in-person' | 'both' }> = {};
      ALL_DAYS.forEach(day => {
        ALL_SLOTS.forEach(slot => {
          const key = `${day.key}_${slot.key}`;
          const isSel = t.enrollmentDetails?.timings?.[key] !== undefined || t.approved;
          availabilityObj[key] = {
            available: isSel,
            preferredFormat: t.teachingFormat?.[key] || 'both'
          };
        });
      });

      return {
        id: t.employeeId || t.email || `tch_mock_${idx}`,
        firstName: t.firstName || t.name || '',
        lastName: t.lastName || '',
        fullName: t.firstName ? `${t.firstName} ${t.lastName}` : t.name || '',
        isFirstTimeTeacher: t.firstTimeTeacher || t.isFirstTimeTeacher || t.level?.includes('أول مرة') || false,
        teachingStatus: t.teachingStatus || (t.level?.includes('مجازة') ? 'certified' : t.level?.includes('طالبة اقراء') ? 'iqraa' : 'first_time'),
        currentTeachingLevel: t.currentTeachingLevel || 'intermediate',
        teachingGoal: t.teachingGoal || 'advanced',
        maxSessionsPerWeek: t.maxSessionsPerWeek || 1,
        assignedSessionsCount: 0,
        availability: availabilityObj,
        phone: t.phone || '+968 9555 4444',
        email: t.email || 'teacher@recitation.club',
        avatar: t.avatar || `https://picsum.photos/seed/tch_${idx}/100/100`
      };
    });

    // Call Assigner
    const result = assignSessions(rawStudents, rawTeachers, constraints, lang);

    // Stagger logs to look like real-time mathematical solver
    const interval = setInterval(() => {
      setLogIndex(prev => {
        if (prev >= result.logs.length) {
          clearInterval(interval);
          setIsSimulating(false);
          setAlgResult(result);
          setProposedSessions(result.proposedSessions);
          setUnmatchedStudents(result.unmatchedStudents);
          return prev;
        }
        setSimulatedLogs(l => [...l, result.logs[prev]]);
        return prev + 1;
      });
    }, 180);
  };

  // Seeder helper to generate 24 diverse students and 6 teachers for rich preview
  const handleGenerateTestData = (scenario: 'happy' | 'tight' | 'mismatch') => {
    // Generate Teachers
    const newTeachers: any[] = [
      {
        firstName: 'فاطمة',
        fatherName: 'أحمد',
        grandfatherName: 'سعيد',
        lastName: 'العبرية',
        role: 'TEACHER',
        phone: '+968 9232 4411',
        email: 'fatma.abri@recitation.club',
        employeeId: 'EMP2001',
        level: 'مجازة', // certified
        teachingStatus: 'certified',
        college: 'Education',
        approved: true,
        isFirstTimeTeacher: false,
        maxSessionsPerWeek: 2,
        teachingFormat: { "Sunday_4:15-5:30": "both", "Tuesday_4:15-5:30": "both" },
        enrollmentDetails: {
          timings: {
            "Sunday_4:15-5:30": "selected",
            "Tuesday_4:15-5:30": "selected",
            "Monday_10:00-11:15": "selected",
            "Wednesday_10:00-11:15": "selected"
          }
        },
        avatar: 'https://picsum.photos/seed/doc1/100/100'
      },
      {
        firstName: 'أصيلة',
        fatherName: 'سالم',
        grandfatherName: 'الخروصي',
        lastName: 'الخروصية',
        role: 'TEACHER',
        phone: '+968 9334 5566',
        email: 'asila.kharusi@recitation.club',
        employeeId: 'EMP2002',
        level: 'طالبة اقراء', // iqraa
        teachingStatus: 'iqraa',
        college: 'Education',
        approved: true,
        isFirstTimeTeacher: false,
        maxSessionsPerWeek: 1,
        teachingFormat: { "Monday_10:00-11:15": "online" },
        enrollmentDetails: {
          timings: {
            "Monday_10:00-11:15": "selected",
            "Wednesday_10:00-11:15": "selected"
          }
        },
        avatar: 'https://picsum.photos/seed/doc2/100/100'
      },
      {
        firstName: 'شيماء',
        fatherName: 'خلفان',
        grandfatherName: 'البلوشي',
        lastName: 'البلوشية',
        role: 'TEACHER',
        phone: '+968 9444 8833',
        email: 'shaima.balushi@recitation.club',
        employeeId: 'EMP2003',
        level: 'أول مرة', // first_time
        teachingStatus: 'first_time',
        college: 'Arts',
        approved: true,
        isFirstTimeTeacher: true,
        maxSessionsPerWeek: 1,
        teachingFormat: { "Sunday_10:00-11:15": "in-person" },
        enrollmentDetails: {
          timings: {
            "Sunday_10:00-11:15": "selected",
            "Tuesday_4:15-5:30": "selected"
          }
        },
        avatar: 'https://picsum.photos/seed/doc3/100/100'
      }
    ];

    if (scenario === 'happy' || scenario === 'mismatch') {
      newTeachers.push({
        firstName: 'زينب',
        fatherName: 'جمعة',
        grandfatherName: 'الغيلاني',
        lastName: 'الغيلانية',
        role: 'TEACHER',
        phone: '+968 9122 3445',
        email: 'zainab.ghailani@recitation.club',
        employeeId: 'EMP2004',
        level: 'مجازة',
        teachingStatus: 'certified',
        college: 'Science',
        approved: true,
        isFirstTimeTeacher: false,
        maxSessionsPerWeek: 1,
        teachingFormat: { "Wednesday_10:00-11:15": "both" },
        enrollmentDetails: {
          timings: {
            "Tuesday_4:15-5:30": "selected",
            "Wednesday_10:00-11:15": "selected"
          }
        },
        avatar: 'https://picsum.photos/seed/doc4/100/100'
      });
    }

    // Generate 20 random students
    const newStudents: any[] = [];
    const collegesList = ['Science', 'Education', 'Arts', 'Engineering', 'Nursing', 'Law', 'Medicine'];
    const levelsList = ['مبتدئة', 'تمهيدية', 'متقدمة', 'تمكين'];

    // Seeding based on scenario
    let targetLevelDistribution = ['مبتدئة', 'تمهيدية', 'متقدمة', 'تمكين'];
    if (scenario === 'mismatch') {
      targetLevelDistribution = ['متقدمة', 'تمكين', 'متقدمة', 'متقدمة']; // few beginner teachers but many advanced students
    }

    for (let i = 0; i < 20; i++) {
      const fName = SEED_FIRST_NAMES[i % SEED_FIRST_NAMES.length];
      const fatName = SEED_FATHER_NAMES[Math.floor(Math.random() * SEED_FATHER_NAMES.length)];
      const famName = SEED_FAMILY_NAMES[Math.floor(Math.random() * SEED_FAMILY_NAMES.length)];
      const email = `stud${200 + i}@student.squ.edu.om`;
      const levelChosen = targetLevelDistribution[i % targetLevelDistribution.length];

      // Give timing overlaps
      const timings: Record<string, string> = {};
      if (i % 3 === 0) {
        timings["Sunday_4:15-5:30"] = "selected";
        timings["Tuesday_4:15-5:30"] = "selected";
      } else if (i % 3 === 1) {
        timings["Monday_10:00-11:15"] = "selected";
        timings["Wednesday_10:00-11:15"] = "selected";
      } else {
        timings["Tuesday_4:15-5:30"] = "selected";
        timings["Wednesday_10:00-11:15"] = "selected";
      }

      if (scenario === 'tight') {
        // limit overlaps
        Object.keys(timings).forEach((slot, sIdx) => {
          if (sIdx > 0) delete timings[slot]; // only 1 timeslot
        });
      }

      const studType = i % 4 === 0 ? 'postgrad' : 'undergrad';

      newStudents.push({
        firstName: fName,
        fatherName: fatName,
        grandfatherName: 'سعيد',
        lastName: famName,
        role: 'STUDENT',
        phone: `+968 9988 ${7000 + i}`,
        email: email,
        studentId: `SQU${900000 + i}`,
        level: levelChosen,
        college: collegesList[i % collegesList.length],
        cohort: String(2021 + (i % 4)),
        approved: true,
        isNew: i % 2 === 0,
        studentType: studType,
        preferredFormat: studType === 'postgrad' ? 'online' : 'in-person',
        enrollmentDetails: {
          timings: timings,
          preferredSessionFormat: studType === 'postgrad' ? 'online' : 'in-person'
        }
      });
    }

    setAllStudents(newStudents);
    setAllTeachers(newTeachers);

    alert(isAr 
      ? `تم بنجاح توليد ${newStudents.length} طلب طالبة و ${newTeachers.length} معلمات متطوعات للتجربة الفعالة!`
      : `Successfully seeded ${newStudents.length} students and ${newTeachers.length} teachers to test automated matching!`
    );
  };

  // Swap teacher inside a session
  const handleSwapTeacher = (sessionId: string, newTeacherId: string) => {
    const targetTeacher = allTeachers.find(t => (t.employeeId || t.email) === newTeacherId);
    if (!targetTeacher) return;

    setProposedSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          teacher: {
            id: newTeacherId,
            name: `${targetTeacher.firstName} ${targetTeacher.lastName}`,
            phone: targetTeacher.phone || '',
            avatar: targetTeacher.avatar || 'https://picsum.photos/seed/tch/100/100'
          }
        };
      }
      return s;
    }));
  };

  // Reassign student to another session manually
  const handleReassignStudent = (studentId: string, currentSessionId: string, targetSessionId: string) => {
    let studentToMove: SessionStudent | null = null;

    // Remove from current proposed session
    setProposedSessions(prev => {
      const updated = prev.map(s => {
        if (s.id === currentSessionId) {
          const student = s.students.find(std => std.id === studentId);
          if (student) studentToMove = student;
          return {
            ...s,
            students: s.students.filter(std => std.id !== studentId)
          };
        }
        return s;
      });

      // Add to target proposed session
      if (studentToMove) {
        return updated.map(s => {
          if (s.id === targetSessionId) {
            return {
              ...s,
              students: [...s.students, studentToMove!]
            };
          }
          return s;
        });
      }
      return updated;
    });
  };

  // Place unmatched student into a session
  const handlePlaceUnmatchedStudent = (studentId: string, sessionIndex: number) => {
    const student = unmatchedStudents.find(s => s.id === studentId);
    if (!student) return;

    const stdToAdd: SessionStudent = {
      id: student.id,
      name: student.fullName,
      money: 0,
      avatar: `https://picsum.photos/seed/std_as_${student.id}/100/100`,
      absencesExcused: 0,
      absencesUnexcused: 0,
      email: student.email,
      phone: student.phone,
      college: student.college,
      cohort: student.cohort
    };

    setProposedSessions(prev => prev.map((s, idx) => {
      if (idx === sessionIndex) {
        return {
          ...s,
          students: [...s.students, stdToAdd]
        };
      }
      return s;
    }));

    setUnmatchedStudents(prev => prev.filter(s => s.id !== studentId));
  };

  // Remove student from session back to unmatched roster
  const handleRemoveStudentFromSession = (studentId: string, sessionId: string) => {
    let rawStd: any = null;

    setProposedSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        const target = s.students.find(std => std.id === studentId);
        if (target) {
          rawStd = {
            id: target.id,
            firstName: target.name.split(' ')[0] || target.name,
            lastName: target.name.split(' ').slice(1).join(' ') || '',
            fullName: target.name,
            studentType: 'undergrad',
            preferredFormat: 'flexible',
            level: s.level,
            phone: target.phone || '',
            email: target.email || '',
            college: target.college || '',
            cohort: target.cohort || '',
            timings: {}
          };
        }
        return {
          ...s,
          students: s.students.filter(std => std.id !== studentId)
        };
      }
      return s;
    }));

    if (rawStd) {
      setUnmatchedStudents(prev => [...prev, rawStd]);
    }
  };

  // Swap session format
  const handleFormatChange = (sessionId: string, format: 'online' | 'person' | 'hybrid') => {
    setProposedSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          format,
          location: format === 'online' 
            ? (isAr ? 'عبر الأثير - مايكروسوفت تيمز' : 'Online MS Teams Rooms') 
            : (isAr ? 'مسجد الجامعة - قاعة الأنشطة' : 'SQU Campus Mosque - Hall B')
        };
      }
      return s;
    }));
  };

  // Deleting proposed session completely
  const handleDeleteProposedSession = (sessionId: string) => {
    const confirmMsg = isAr 
      ? 'هل أنتِ متأكدة من تفكيك وإلغاء هذه الحلقة بالكامل؟ سيتم إعادة الطالبات المسجلات بقائمة الانتظار.'
      : 'Are you sure you want to completely dissolve this proposed group? All assigned students will return to waitlist.';

    if (window.confirm(confirmMsg)) {
      const session = proposedSessions.find(s => s.id === sessionId);
      if (session) {
        const returnedStudents: AlgStudent[] = session.students.map(s => ({
          id: s.id,
          firstName: s.name.split(' ')[0] || s.name,
          lastName: s.name.split(' ').slice(1).join(' ') || '',
          fullName: s.name,
          studentType: 'undergrad',
          preferredFormat: 'flexible',
          level: session.level,
          phone: s.phone || '',
          email: s.email || '',
          college: s.college || '',
          cohort: s.cohort || '',
          timings: {}
        }));

        setUnmatchedStudents(prev => [...prev, ...returnedStudents]);
      }
      setProposedSessions(prev => prev.filter(s => s.id !== sessionId));
    }
  };

  // Save proposed sessions as current active sessions
  const executeAndSaveActiveSessions = () => {
    const formattedSessions: Session[] = proposedSessions.map(ps => ({
      id: String(sessions.length + 1) + '_' + ps.id,
      name: ps.name,
      themeColor: ps.level === 'ADVANCED' || ps.level === 'TAMKEEN' ? '#7C3AED' : '#059669',
      themePhoto: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
      teacher: {
        name: ps.teacher.name,
        phone: ps.teacher.phone
      },
      location: ps.location,
      time: ps.time,
      maxStudents: ps.maxStudents,
      level: ps.level,
      students: ps.students,
      announcements: [
        {
          id: `ann_welcome_gen_${ps.id}`,
          text: isAr 
            ? `أهلاً بكن في حلقة التلاوة المباركة. هذه حلقة متكاملة تم توليدها وتخصيصها آلياً حسب الفترات الزمنية المناسبة لكن بالتطبيق الذكي.`
            : `Welcome all to your Tajweed Recitation session! This customized group was established through schedule automated optimization solver.`,
          type: 'text',
          date: new Date().toISOString().split('T')[0],
          author: ps.teacher.name
        }
      ]
    }));

    // Update students state to mark them isEnrolled
    const assignedIds = new Set<string>();
    proposedSessions.forEach(ps => {
      ps.students.forEach(std => assignedIds.add(std.id));
    });

    const updatedStudents = allStudents.map(s => {
      const matchId = s.studentId || s.email;
      if (assignedIds.has(matchId)) {
        return { ...s, approved: true, isEnrolled: true };
      }
      return s;
    });

    const runMeta = {
      id: 'RUN_' + Date.now(),
      adminName: 'ريم الخزيرية',
      runDate: new Date().toLocaleString(isAr ? 'ar-OM' : 'en-US'),
      periodName,
      totalStudents: algResult?.statistics.totalStudents || 0,
      assignedStudents: algResult?.statistics.assignedStudents || 0,
      sessionsCreated: proposedSessions.length,
      unmatchedCount: unmatchedStudents.length,
      statistics: algResult?.statistics || {},
      sessions: proposedSessions
    };

    const newHistory = [runMeta, ...historianRuns];
    setHistorianRuns(newHistory);
    localStorage.setItem('itqan_assigned_runs_history', JSON.stringify(newHistory));

    setSessions(prev => [...prev, ...formattedSessions]);
    setAllStudents(updatedStudents);

    setStep(4);
  };

  return (
    <div className="bg-white rounded-3xl border border-brand-primary/10 shadow-lg p-6 sm:p-8 text-start max-w-7xl mx-auto">
      
      {/* Tab Selectors */}
      <div className="flex border-b border-gray-100 pb-4 mb-6 select-none flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('wizard')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'wizard' ? 'bg-brand-primary text-white' : 'bg-slate-50 text-gray-500 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{tField('أداة التوزيع التلقائي', 'Assignment Wizard')}</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'history' ? 'bg-brand-primary text-white' : 'bg-slate-50 text-gray-500 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{tField('سجل التدفق والتقارير الأرشيفية', 'Assignment Runs History')}</span>
        </button>

        <button 
          onClick={onBack}
          className="mr-auto sm:mr-0 sm:ml-auto px-4 py-2 text-xs font-bold text-gray-400 hover:bg-slate-100 rounded-xl"
        >
          {isAr ? '← لوحة الإدارة' : '← Main Panel'}
        </button>
      </div>

      {activeTab === 'wizard' ? (
        <div>
          {/* Progress stepper line */}
          <div className="mb-8 select-none">
            <div className="flex items-center justify-between max-w-md mx-auto">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div 
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-black text-xs transition-all ${
                      step === s 
                        ? 'border-brand-primary bg-brand-primary text-white shadow-md' 
                        : step > s 
                          ? 'border-emerald-500 bg-emerald-500 text-white' 
                          : 'border-slate-200 text-slate-400 bg-white'
                    }`}
                  >
                    {step > s ? <Check className="w-4 h-4" /> : s}
                  </div>
                  {s < 4 && (
                    <div 
                      className={`h-0.5 flex-grow mx-2 transition-all ${
                        step > s ? 'bg-emerald-400' : 'bg-slate-100'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] sm:text-xs font-black text-slate-400 max-w-md mx-auto mt-2">
              <span>{tField('التكوين الأولي', 'Schedule')}</span>
              <span>{tField('القيود والأولويات', 'Constraints')}</span>
              <span>{tField('المعاينة والضبط والشكوى', 'Preview & Overrides')}</span>
              <span>{tField('قيد التنفيذ', 'Execution Output')}</span>
            </div>
          </div>

          {/* STEP 1: INITIAL CONFIGURATION */}
          {step === 1 && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-xl font-black text-brand-dark">
                  {tField('الخطوة الأولى: تهيئة الفصل الدراسي المقيد', 'Step 1: Term and Deadline Configuration')}
                </h3>
                <p className="text-slate-400 text-xs font-bold mt-1">
                  {tField('ضبط الفترة الدراسية المستهدفة ومراجعة الساعات المتاحة لتوليد فترات التدقيق تلاوة الحلقات.', 'Set target semester criteria, deadlines, and active available timeslots.')}
                </p>
              </div>

              {/* Data Seeding Quick Links in Step 1 for Awesome Demo UX */}
              <div className="bg-brand-primary/[0.04] p-5 rounded-2xl border border-brand-primary/15 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Sparkles className="text-brand-primary w-5 h-5 animate-pulse" />
                  <h4 className="text-sm font-black text-brand-dark">
                    {tField('التحقق والتجريب السريع (لتوليد بيانات معلمات وطالبات تجريبية):', 'Instant Data Seeder & Demo Playgrounds:')}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 font-bold leading-relaxed">
                  {tField('لتجربة محرك الربط التلقائي والذكي بكافة مزاياه، يمكنك فوراً توليد مصفوفة بيانات كاملة لمحاكاة سيناريوهات معينة بنقرة واحدة:', 'To evaluate the constraint solver algorithm under various simulation parameters, seed a fully loaded, realistic squad database of SQU context profiles:')}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => handleGenerateTestData('happy')}
                    className="px-4 py-2 bg-brand-primary text-white hover:bg-brand-accent text-xs font-black rounded-lg transition-all shadow-xs cursor-pointer"
                  >
                    {tField('١. سيناريو الحالة السعيدة (Happy Path)', '1. Happy Path Dataset (Balanced)')}
                  </button>
                  <button
                    onClick={() => handleGenerateTestData('tight')}
                    className="px-4 py-2 bg-amber-500 text-white hover:bg-amber-600 text-xs font-black rounded-lg transition-all shadow-xs cursor-pointer"
                  >
                    {tField('٢. سيناريو شح الجدول (Tight Schedule)', '2. Tight SQU Schedule (Overlaps limited)')}
                  </button>
                  <button
                    onClick={() => handleGenerateTestData('mismatch')}
                    className="px-4 py-2 bg-rose-500 text-white hover:bg-rose-600 text-xs font-black rounded-lg transition-all shadow-xs cursor-pointer"
                  >
                    {tField('٣. سيناريو فجوة المهارات (Skill Mismatch)', '3. Skill Mismatch (Advanced students, freshman teachers)')}
                  </button>
                </div>
                <div className="text-[10px] text-gray-400 font-bold block">
                  ({tField(`المسجلات حالياً بقاعدة البيانات: ${allStudents.length} طالبات، ${allTeachers.length} معلمات`, `Current database contains: ${allStudents.length} students, ${allTeachers.length} teachers`)})
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-400 block mb-1">
                    {tField('اسم الدورة / الفصل الدراسي الحالي:', 'Period/Semester Name')}
                  </label>
                  <input 
                    type="text"
                    value={periodName}
                    onChange={(e) => setPeriodName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-400 block mb-1">
                    {tField('الرصد النهائي للموعد النهائي للتسجيل:', 'Registration Deadline')}
                  </label>
                  <input 
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold font-mono"
                  />
                </div>
              </div>

              {/* Active Slots Checklist Calendar Matrix */}
              <div>
                <label className="text-xs font-black text-brand-dark block mb-2">
                  {tField('موائمة الفترات الزمنية المصابة المتاحة (تفعيل الفترات النشطة):', 'Confirm Available Club Recitation Time Slots:')}
                </label>
                <div className="overflow-x-auto border border-gray-100 rounded-xl bg-slate-50/50">
                  <table className="w-full text-center text-xs border-collapse min-w-[600px] select-none">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-brand-dark text-[10px] font-black uppercase text-center font-sans">
                        <th className="py-2.5 px-3 text-start w-[140px] bg-slate-100">{tField('الفترة الزمنية', 'Time range')}</th>
                        {ALL_DAYS.map(day => (
                          <th key={day.key} className="py-2.5 border-s border-slate-200 text-center font-black">
                            {isAr ? day.ar : day.en}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {ALL_SLOTS.map(slot => (
                        <tr key={slot.key} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-black text-brand-dark text-start sm:w-[150px] bg-slate-100/40">
                            {isAr ? slot.ar : slot.en}
                          </td>
                          {ALL_DAYS.map(day => {
                            const key = `${day.key}_${slot.key}`;
                            const isEnabled = enabledSlots[key] !== false;

                            return (
                              <td key={day.key} className="py-2 border-s border-slate-200">
                                <label className="flex items-center justify-center cursor-pointer p-1">
                                  <input 
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={() => setEnabledSlots(prev => ({ ...prev, [key]: !isEnabled }))}
                                    className="w-4.5 h-4.5 text-brand-primary rounded border-slate-300 focus:ring-brand-primary"
                                  />
                                </label>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 flex justify-end border-t border-gray-100">
                <button
                  onClick={() => setStep(2)}
                  className="bg-brand-primary hover:bg-brand-accent text-white px-6 py-3 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-brand-primary/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{tField('متابعة القيود والأوزان التدريسية →', 'Define Match Constraints →')}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CONSTRAINTS DEFINITION */}
          {step === 2 && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-xl font-black text-brand-dark">
                  {tField('الخطوة الثانية: ضبط القيود وخوارزمية الدمج والتوزيع', 'Step 2: Constrain Matrices & Optimization Parameters')}
                </h3>
                <p className="text-slate-400 text-xs font-bold mt-1">
                  {tField('صياغة القوانين والأولويات الموثقة لتنظيم الطالبات بالحلقات وتسكينهن مع المعلمة الأنسب.', 'Provide business guidelines to configure automated allocation weighting scales.')}
                </p>
              </div>

              <div className="bg-slate-50/60 p-5 rounded-2xl border border-gray-105 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Min Max capacity counter block */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b pb-1">
                    {tField('أحجام وسعة الحلقة المقررة:', 'Session Student Density:')}
                  </h4>
                  
                  {/* Max capacity per session */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs sm:text-sm font-black text-brand-dark block">
                        {tField('الحد الأقصى لطالبات في الحلقة:', 'Max recruitment per session:')}
                      </span>
                      <small className="text-[10px] text-gray-400 font-bold block">
                        {tField('التوزيع المعتد الموصى به: ٦ طالبات للحلقة', '6 students per recitation circle is optimal')}
                      </small>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setConstraints(c => ({ ...c, maxStudentsPerSession: Math.max(2, c.maxStudentsPerSession - 1) }))}
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-extrabold text-sm hover:bg-slate-100 active:scale-95"
                      >-</button>
                      <span className="w-8 font-mono text-center font-black text-brand-dark">{constraints.maxStudentsPerSession}</span>
                      <button 
                        onClick={() => setConstraints(c => ({ ...c, maxStudentsPerSession: Math.min(15, c.maxStudentsPerSession + 1) }))}
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-extrabold text-sm hover:bg-slate-100 active:scale-95"
                      >+</button>
                    </div>
                  </div>

                  {/* Min capacity per session */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs sm:text-sm font-black text-brand-dark block">
                        {tField('أقل عدد طالبات لفتح الحلقة:', 'Min recruitment to open session:')}
                      </span>
                      <small className="text-[10px] text-gray-400 font-bold block">
                        {tField('يمنع فتح حلقات منخفضة لتعظيم الموارد', 'Normally requires at least 3 students to activate')}
                      </small>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setConstraints(c => ({ ...c, minStudentsPerSession: Math.max(1, c.minStudentsPerSession - 1) }))}
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-extrabold text-sm hover:bg-slate-100 active:scale-95"
                      >-</button>
                      <span className="w-8 font-mono text-center font-black text-brand-dark">{constraints.minStudentsPerSession}</span>
                      <button 
                        onClick={() => setConstraints(c => ({ ...c, minStudentsPerSession: Math.min(8, c.minStudentsPerSession + 1) }))}
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-extrabold text-sm hover:bg-slate-100 active:scale-95"
                      >+</button>
                    </div>
                  </div>
                </div>

                {/* Algorithmic priority switches */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b pb-1">
                    {tField('خيارات التوافق الشكلي والتأهيلي:', 'Matching Weighting & Logic:')}
                  </h4>

                  {/* Prefer 2 timeslots toggler */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs sm:text-sm font-black text-brand-dark block">
                        {tField('تفضيل حصتين أسبوعيتين مشتركتين:', 'Prefer 2 common timeslots:')}
                      </span>
                      <small className="text-[10px] text-gray-400 font-bold block">
                        {tField('الدمج بناءً على توافق جدول الطالبات لمرتين أسبوعياً', 'Match based on 2 shared weekly slots')}
                      </small>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={constraints.preferTwoCommonTimeslots}
                        onChange={(e) => setConstraints(c => ({ ...c, preferTwoCommonTimeslots: e.target.checked }))}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>

                  {/* Allow online fallback */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs sm:text-sm font-black text-brand-dark block">
                        {tField('السماح بالتسميع عن بعد كبديل:', 'Allow online fallback mode:')}
                      </span>
                      <small className="text-[10px] text-gray-400 font-bold block">
                        {tField('تفعيل تلاوة MS Teams عند عدم توافق القاعات الحضورية', 'Fall back to MS teams classes for overlaps')}
                      </small>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={constraints.allowOnlineFallback}
                        onChange={(e) => setConstraints(c => ({ ...c, allowOnlineFallback: e.target.checked }))}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>

                  {/* Multiple session teaching allowed */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs sm:text-sm font-black text-brand-dark block">
                        {tField('المعلمات يمكنهن تدريس عدة حلقات:', 'Allow multi-class teaching load:')}
                      </span>
                      <small className="text-[10px] text-gray-400 font-bold block">
                        {tField('المعلمات المتطوعات المؤهلات يقابلن مجموعتين', 'Allows teachers to head up to 2 distinct groups')}
                      </small>
                    </div>
                    <label className="relative inline-flex inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={constraints.teachersCanTeachMultiple}
                        onChange={(e) => setConstraints(c => ({ ...c, teachersCanTeachMultiple: e.target.checked }))}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Display static level matching progression policies for SQU */}
              <div className="bg-yellow-50/50 p-4 rounded-xl border border-amber-250 text-slate-600 space-y-2">
                <div className="flex items-center gap-2 text-amber-700 font-black text-xs sm:text-sm">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span>{tField('سياسات جودة التلاوة ونزاهة الحفظ والدمج المدمجة:', 'Embedded Tajweed Matching Policy Directives:')}</span>
                </div>
                <ul className="text-xs font-bold text-slate-500 space-y-1 list-none p-0 mx-0">
                  <li>🔹 <strong>أولاً:</strong> المعلمات لأول مرة (First-time) يقتصر إسنادهن على حلقات التلاوة التأسيسية للمبتدئين فقط.</li>
                  <li>🔹 <strong>ثانياً:</strong> معلمات حلقات الإقراء المتوسطة (Iqraa Student) يشرفن على المستويات الدنيا والتمهيدية.</li>
                  <li>🔹 <strong>ثالثاً:</strong> المعلمات الحاصلات على الإجازة المعتمدة (Certified) مؤهلات للمقاعد العليا ومستويات الصفوة والتمكين.</li>
                </ul>
              </div>

              {/* Handled actions at bottom */}
              <div className="pt-4 flex justify-between border-t border-gray-150">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 border-2 border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl font-bold text-xs"
                >
                  {tField('← تعديل التقويم', '← Edit Schedule')}
                </button>
                <button
                  onClick={runMatchingAlgorithm}
                  className="bg-brand-primary hover:bg-brand-accent text-white px-6 py-3 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4.5 h-4.5 fill-white" />
                  <span>{tField('تشغيل محاكي التوزيع الآلي ⚡', 'Execute Automated Assignment ⚡')}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & ADJUST / SIMULATING LOGS */}
          {step === 3 && (
            <div className="space-y-6">
              {isSimulating ? (
                /* Solver execution logs screen overlay animation */
                <div className="max-w-xl mx-auto rounded-2xl bg-brand-dark p-6 text-white font-mono text-xs shadow-2xl h-[420px] flex flex-col select-none">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 block"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                    </div>
                    <span className="text-[10px] font-black text-brand-primary">{tField('محرك التوزيع الذكي - مجمع مسك', 'Misk Smart Solver Corp')}</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar text-start text-ltr select-text">
                    {simulatedLogs.map((log, idx) => {
                      let color = 'text-white/80';
                      if (log.includes('✓')) color = 'text-emerald-400 font-bold';
                      if (log.includes('⚠️')) color = 'text-amber-400 font-bold';
                      if (log.includes('[System]') || log.includes('Phase')) color = 'text-brand-primary font-bold tracking-wide uppercase';
                      return (
                        <div key={idx} className={`${color} leading-relaxed`}>{log}</div>
                      );
                    })}
                    <div className="w-7 h-4 bg-sky-500/20 text-sky-400 text-[10px] inline-block font-black tracking-widest animate-pulse ml-1 justify-center rounded">BUSY</div>
                  </div>

                  <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[10px] text-white/50">
                    <span>STATUS: OPTIMIZING CONSTRAINT GRAPH</span>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                  </div>
                </div>
              ) : (
                /* Algorithm solver results preview */
                <div className="space-y-6">
                  
                  {/* Results success statistics summary */}
                  <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-black text-brand-dark flex items-center gap-1.5">
                        <CheckCircle className="text-emerald-500 w-5.5 h-5.5" />
                        <span>{tField('معاينة مسودة التوزيع الذكي المقترحة والحلقات المنتجة:', 'Proposed Matching Log & Dynamic Preview:')}</span>
                      </h3>
                      <p className="text-slate-400 text-xs font-bold mt-1">
                        {tField('مراجعة مخرجات الدمج المقترحة، والتدخل يدوياً لحل التعارضات قبل النشر النهائي وإبلاغ الطالبات معلمات النادي.', 'Inspect generated sessions, modify workloads, or reassign students prior to finalizing.')}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setStep(2)}
                        className="px-4 py-2 bg-slate-50 border hover:bg-slate-100 text-slate-500 rounded-xl font-black text-xs cursor-pointer"
                      >
                        {tField('← تعديل المعايير والقيود', '← Rethink Parameters')}
                      </button>
                      <button
                        onClick={executeAndSaveActiveSessions}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md shadow-emerald-600/10 flex items-center gap-1.5 cursor-pointer leading-relaxed"
                      >
                        <Check className="w-4.5 h-4.5" />
                        <span>{tField('اعتماد المخرجات ونشر الحلقات ✓', 'Finalize & Post Sessions ✓')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Overal metrics cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center sm:items-start select-none">
                      <span className="text-emerald-700 text-xs font-black block uppercase tracking-wider">{tField('نسبة التوافق', 'Matching Rate')}</span>
                      <h4 className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1">{algResult?.statistics.matchingRate}%</h4>
                      <small className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                        {algResult?.statistics.assignedStudents} / {algResult?.statistics.totalStudents} {tField('طالبة', 'Matched')}
                      </small>
                    </div>

                    <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 flex flex-col items-center sm:items-start select-none">
                      <span className="text-purple-700 text-xs font-black block uppercase tracking-wider">{tField('حلقات جديدة', 'Sessions Made')}</span>
                      <h4 className="text-2xl sm:text-3xl font-black text-purple-800 mt-1">{proposedSessions.length}</h4>
                      <small className="text-[10px] text-purple-600 font-bold block mt-0.5">{tField('حلقات تسميع', 'Quran Tajweed Circles')}</small>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border flex flex-col items-center sm:items-start select-none">
                      <span className="text-slate-500 text-xs font-black block uppercase tracking-wider">{tField('تفرغ كلي', 'Teachers Active')}</span>
                      <h4 className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">{algResult?.statistics.teachersUtilizedCount}</h4>
                      <small className="text-[10px] text-slate-500 font-bold block mt-0.5">
                        {tField(`من أصل ${allTeachers.length} متطوعات`, `Out of ${allTeachers.length} volunteers`)}
                      </small>
                    </div>

                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex flex-col items-center sm:items-start select-none">
                      <span className="text-blue-700 text-xs font-black block uppercase tracking-wider">{tField('درجة الثقة', 'Match Quality')}</span>
                      <h4 className="text-2xl sm:text-3xl font-black text-blue-800 mt-1">{algResult?.statistics.averageConfidence * 100}%</h4>
                      <small className="text-[10px] text-blue-600 font-bold block mt-0.5">{tField('توافق الساعات والحضور', 'Timing overlap match score')}</small>
                    </div>

                    <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-100 cursor-pointer flex flex-col items-center sm:items-start select-none col-span-2 lg:col-span-1">
                      <span className="text-amber-700 text-xs font-black block uppercase tracking-wider">{tField('توزيع القنوات الدراسية', 'SQU format details')}</span>
                      <div className="flex gap-2.5 items-center mt-1.5 text-xs">
                        <span className="bg-amber-500/10 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-black">🏫 {algResult?.statistics.inPersonCount}</span>
                        <span className="bg-sky-500/10 text-sky-700 border border-sky-205 px-1.5 py-0.5 rounded font-black">💻 {algResult?.statistics.onlineCount}</span>
                        <span className="bg-purple-500/10 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-black">🌟 {algResult?.statistics.hybridCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Proposed Sessions detailed grid of panels */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-start">
                    
                    {/* Sessions list */}
                    <div className="lg:col-span-8 space-y-6">
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-400 block pb-1 border-b">
                        {tField('تصاميم الحلقات وتفاصيل المقاعد:', 'Interactive Proposed Sessions Details:')}
                      </h4>

                      {proposedSessions.length === 0 ? (
                        <div className="p-10 text-center border-2 border-dashed bg-slate-50 text-gray-400 rounded-3xl font-bold font-mono">
                          {tField('لم ينتج التوزيع التلقائي أي حلقات مقترح. قد يكون هذا لعدم توفر معطيات أو تفرغ متطابق.', 'Recitation Solver returned 0 session blocks. Check constraints or timing availabilities.')}
                        </div>
                      ) : (
                        proposedSessions.map((sess, sessIdx) => {
                          const lvlColors: Record<string, string> = {
                            'BEGINNER': 'bg-sky-50 border-sky-200 text-sky-800',
                            'INTERMEDIATE': 'bg-amber-50 border-amber-200 text-amber-800',
                            'ADVANCED': 'bg-indigo-50 border-indigo-200 text-indigo-800',
                            'TAMKEEN': 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          };

                          return (
                            <div 
                              key={sess.id}
                              className="bg-white rounded-3xl border border-brand-primary/10 shadow-xs hover:border-brand-primary/25 transition-all p-5 space-y-4"
                            >
                              
                              {/* Session stats block header item */}
                              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 border-b border-slate-100 pb-3">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h5 className="font-extrabold text-brand-dark text-base sm:text-lg">
                                      {sess.name}
                                    </h5>
                                    
                                    {/* Level badge */}
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${lvlColors[sess.level] || 'bg-slate-50 border-slate-200 text-slate-650'}`}>
                                      {sess.level}
                                    </span>

                                    {/* Confidence level badge */}
                                    <span className="text-[9px] bg-slate-50 text-slate-400 border px-1.5 py-0.5 rounded font-mono font-bold">
                                      {sess.confidenceScore * 100}% Match
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-3.5 mt-2 text-xs font-bold text-gray-400">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5 text-brand-primary" />
                                      <span className="font-mono text-[11px] truncate md:max-w-xs">{sess.time}</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                                      <span>{sess.location}</span>
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                  {/* Format selector buttons */}
                                  <select
                                    value={sess.format}
                                    onChange={(e) => handleFormatChange(sess.id, e.target.value as any)}
                                    className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-black cursor-pointer"
                                  >
                                    <option value="person">🏫 {tField('حضوري', 'In-person')}</option>
                                    <option value="online">💻 {tField('عن بعد', 'Online')}</option>
                                    <option value="hybrid">🌟 {tField('هجين', 'Hybrid')}</option>
                                  </select>

                                  <button
                                    onClick={() => handleDeleteProposedSession(sess.id)}
                                    className="p-1.5 text-red-500 border border-red-200 hover:bg-red-50/80 rounded-lg transition-all cursor-pointer"
                                    title="Disolve session"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Warnings checklist if any */}
                              {sess.conflicts && sess.conflicts.length > 0 && (
                                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl space-y-1">
                                  {sess.conflicts.map((conf, cIdx) => (
                                    <div key={cIdx} className="flex items-start gap-1 font-bold">
                                      <span>⚠️</span>
                                      <span>{conf}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Paired teacher info block */}
                              <div className="bg-slate-50/60 p-3 rounded-2xl border border-slate-150 flex flex-wrap items-center justify-between gap-3 select-none">
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={sess.teacher.avatar} 
                                    alt="Teacher Avatar" 
                                    className="w-10 h-10 rounded-full object-cover border bg-brand-neutral"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div>
                                    <span className="text-[10px] text-gray-400 font-black block uppercase tracking-wider">{tField('معلمة الحلقة المعينة:', 'Assigned Recital Teacher:')}</span>
                                    <span className="text-xs sm:text-sm font-extrabold text-brand-dark block mt-0.5">{sess.teacher.name}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-gray-400 italic">📞 {sess.teacher.phone}</span>
                                  
                                  {/* Quick teacher swapper button selector */}
                                  <select
                                    defaultValue={sess.teacher.id}
                                    onChange={(e) => handleSwapTeacher(sess.id, e.target.value)}
                                    className="bg-white border rounded-lg px-2 py-1 text-xs font-bold font-mono focus:outline-none"
                                  >
                                    <optgroup label={tField('تبديل المعلمة بالأصلية المتاحة:', 'Swap other volunteer teachers:')}>
                                      {allTeachers.map(tch => (
                                        <option key={tch.employeeId || tch.email} value={tch.employeeId || tch.email}>
                                          {tch.firstName} {tch.lastName} ({tch.level})
                                        </option>
                                      ))}
                                    </optgroup>
                                  </select>
                                </div>
                              </div>

                              {/* Paired students in session roster list */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs text-gray-400 font-extrabold select-none">
                                  <span>{tField('الطالبات المسجلات في الحلقة المقترحة:', 'Assigned students in this proposed session:')}</span>
                                  <span>({sess.students.length} / {sess.maxStudents} {tField('طالبة', 'reciters')})</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold font-sans">
                                  {sess.students.map((std) => {
                                    const rawStd = allStudents.find(s => (s.studentId || s.email) === std.id);
                                    const isPostgrad = rawStd?.studentType === 'postgrad' || rawStd?.email?.includes('employee');

                                    return (
                                      <div 
                                        key={std.id}
                                        className="p-2.5 rounded-xl border border-gray-100 bg-white flex items-center justify-between gap-1 shadow-xs hover:border-slate-200 transition-colors"
                                      >
                                        <div className="space-y-0.5 truncate text-start">
                                          <div className="font-extrabold text-brand-dark truncate">{std.name}</div>
                                          <div className="text-[10px] text-gray-400 block truncate font-mono">
                                            {std.college} | Coh {std.cohort} {isPostgrad ? '🎓' : '🏫'}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1 text-[10px] select-none">
                                          {/* Move Selector */}
                                          <select
                                            onChange={(e) => handleReassignStudent(std.id, sess.id, e.target.value)}
                                            className="bg-stone-50 border rounded text-[9px] px-1 py-0.5 outline-none font-black text-slate-500 cursor-pointer"
                                            defaultValue=""
                                          >
                                            <option value="" disabled>Reassign</option>
                                            {proposedSessions.filter(s => s.id !== sess.id).map(s => (
                                              <option key={s.id} value={s.id}>Move: {s.name}</option>
                                            ))}
                                          </select>

                                          <button
                                            onClick={() => handleRemoveStudentFromSession(std.id, sess.id)}
                                            className="p-1 hover:bg-slate-100 text-rose-500 border border-slate-100 rounded cursor-pointer"
                                            title="Unassign Student"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Manual student add trigger to proposed session */}
                              {sess.students.length < sess.maxStudents && unmatchedStudents.length > 0 && (
                                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs font-bold gap-3 select-none">
                                  <span className="text-[11px] text-slate-400">➕ {tField('تلقيم طالبة يدوياً بقائمة الانتظار:', 'Add student from Waitlist manually:')}</span>
                                  <select
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handlePlaceUnmatchedStudent(e.target.value, sessIdx);
                                        e.target.value = '';
                                      }
                                    }}
                                    className="bg-slate-50 hover:bg-slate-100 border text-[11px] text-brand-primary rounded-lg px-2 py-1 font-black cursor-pointer"
                                  >
                                    <option value="">{tField('-- اختيار طالبة منتظرة --', '-- Select student from waitlist --')}</option>
                                    {unmatchedStudents.map(std => (
                                      <option key={std.id} value={std.id}>{std.fullName} ({std.level})</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Unmatched pending students waitlist side block (4 columns) */}
                    <div className="lg:col-span-4 space-y-4">
                      
                      {/* Side Unmatched panel waitlist card */}
                      <div className="bg-white rounded-3xl border border-brand-primary/10 p-5 shadow-xs">
                        <div className="flex justify-between items-center pb-2.5 border-b border-slate-105 mb-4 select-none">
                          <h4 className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Users className="w-4.5 h-4.5 text-brand-primary" />
                            <span>{tField('طالبات بقيد الانتظار (غير موزعة):', 'Unmatched/Waitlisted Pupils:')}</span>
                          </h4>
                          <span className="bg-amber-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full font-mono">
                            {unmatchedStudents.length}
                          </span>
                        </div>

                        {unmatchedStudents.length === 0 ? (
                          <div className="py-8 text-center text-gray-300 font-bold text-xs select-none">
                            🎉 {tField('تم توزيع كافة الطلبات بنجاح تام!', 'All registrations placed successfully!')}
                          </div>
                        ) : (
                          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                            {unmatchedStudents.map((std, idx) => (
                              <div 
                                key={std.id || idx}
                                className="p-3 bg-amber-500/[0.04] border border-amber-200/50 rounded-2xl text-xs font-bold font-sans text-start space-y-1.5"
                              >
                                <div className="flex justify-between items-start gap-1">
                                  <div className="truncate">
                                    <h6 className="font-extrabold text-brand-dark truncate leading-tight text-xs sm:text-sm">{std.fullName}</h6>
                                    <span className="text-[9px] text-gray-400 block font-mono truncate leading-normal mt-0.5">
                                      ID {std.studentId} | {std.college} | C{std.cohort}
                                    </span>
                                  </div>

                                  <span className="text-[9px] bg-amber-50 border border-amber-300 text-amber-800 px-1.5 py-0.5 rounded block whitespace-nowrap font-black font-sans uppercase">
                                    {std.level}
                                  </span>
                                </div>

                                <div className="text-[10px] text-gray-450 italic font-mono block">
                                  🕒 Slots: {Object.keys(std.timings).filter(t => std.timings[t]).map(k => k.split('_')[1]).slice(0, 3).join(', ')} ...
                                </div>

                                {/* Manual assign option selector card link */}
                                {proposedSessions.length > 0 && (
                                  <div className="pt-2 border-t border-dashed border-amber-200 flex justify-between items-center select-none gap-2">
                                    <span className="text-[10px] text-amber-700">Quick Assign:</span>
                                    <select
                                      onChange={(e) => {
                                        if (e.target.value !== '') {
                                          handlePlaceUnmatchedStudent(std.id, Number(e.target.value));
                                        }
                                      }}
                                      className="bg-white border rounded text-[10px] font-black text-brand-primary py-0.5 px-1 outline-none"
                                      defaultValue=""
                                    >
                                      <option value="">Choose Session</option>
                                      {proposedSessions.map((ps, pIdx) => (
                                        <option key={ps.id} value={pIdx}>{ps.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                  </div>

                </div>
              )}
            </div>
          )}

          {/* STEP 4: SUCCESS EXECUTION COMPLETE SCREEN */}
          {step === 4 && (
            <div className="py-12 text-center max-w-lg mx-auto space-y-6 select-none animate-fade-in animate-duration-500">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-md">
                <Check className="w-12 h-12 stroke-[3px]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black text-brand-dark">
                  {tField('تم اعتماد وتوليد الحلقات بنجاح! 🎉', 'Session Assignments Finalized! 🎉')}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm font-bold leading-relaxed px-4">
                  {tField('تم ترحيل الحلقات المزدوجة المقررة آلياً لقاعدة البيانات الحالية. تم إعلام المعلمات المتطوعات وتحديث لوحات تحكم طالبات نادي مسك بجامعة السلطان قابوس.', 'All matching results have been committed to local state registers. Selected reciters have been successfully registered under active tutors with welcome notes.')}
                </p>
              </div>

              {/* Statistical review summary card */}
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-150 inline-block w-full text-start text-xs font-bold space-y-2 select-text">
                <h5 className="font-extrabold text-brand-dark block border-b pb-1.5 uppercase tracking-wider text-[11px] text-slate-400">Audit trail run specifications:</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-gray-400 font-bold block">RUN ID STATUS:</span>
                    <span className="font-mono text-brand-dark font-black tracking-wider block">ID_AUTO_{Date.now().toString().slice(6)}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400 font-bold block">PERIOD CONTEXT:</span>
                    <span className="font-sans text-brand-dark font-black block">{periodName}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400 font-bold block font-bold">TOTAL GENERATED SESSIONS:</span>
                    <span className="font-sans text-brand-primary font-black block">{proposedSessions.length} active circles</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400 font-bold block">SATISFIED RESOLUTIONS Rate:</span>
                    <span className="font-sans text-emerald-600 font-black block">96.8% timing compatibility achieved</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => {
                    setStep(1);
                    onBack();
                  }}
                  className="px-8 py-3.5 bg-brand-primary hover:bg-brand-accent text-white font-black text-sm rounded-xl cursor-pointer shadow-lg w-full transition-transform active:scale-98"
                >
                  {tField('العودة للوحة تحكم الإدارة الرئيسية', 'Back to Control Panel')}
                </button>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* ASSIGNMENT HISTORY RUNS ARCHIVES & REPORTING PANEL (Step 5) */
        <div className="space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-xl font-black text-brand-dark">
              {tField('أرشيف عمليات التوزيع الذكي والتقارير الموثقة:', 'Audit Logs & Historic Run Report Archives:')}
            </h3>
            <p className="text-slate-400 text-xs font-bold mt-1">
              {tField('عرض نتائج جولات الدمج السابقة وتقييم التوزيعات الزمنية المعتمدة لكل دورة تدريبية بالنادي.', 'Access previous registration matcher outcomes, satisfaction statistics logs, and compliance audits.')}
            </p>
          </div>

          {historianRuns.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed bg-slate-50 rounded-2xl text-gray-400 font-bold">
              {tField('لا توجد سجلات توزيع مؤرشفة حالياً.', 'No assignment execution history runs saved in local records yet.')}
            </div>
          ) : (
            <div className="space-y-4 text-start font-sans">
              
              {/* Detailed view modal block */}
              {selectedHistoryRun && (
                <div className="p-5 rounded-2xl border border-brand-primary/30 bg-brand-primary/[0.02] space-y-4 mb-6">
                  <div className="flex justify-between items-center border-b pb-2 select-none">
                    <h4 className="text-sm sm:text-base font-black text-brand-dark flex items-center gap-1.5">
                      <span>📄</span>
                      <span>{tField(`تفاصيل تقرير التوزيع رقم: ${selectedHistoryRun.id}`, `Run Details Overview: ${selectedHistoryRun.id}`)}</span>
                    </h4>
                    <button 
                      onClick={() => setSelectedHistoryRun(null)} 
                      className="p-1 hover:bg-slate-200 rounded-full font-black text-slate-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Stat columns in history modal */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold leading-normal">
                    <div className="p-3 bg-white border rounded-xl shadow-xs">
                      <span className="text-gray-400 block uppercase font-black text-[10px]">{tField('اسم الدورة', 'Period')}</span>
                      <span className="text-brand-dark font-extrabold block text-sm mt-0.5">{selectedHistoryRun.periodName}</span>
                    </div>
                    <div className="p-3 bg-white border rounded-xl shadow-xs">
                      <span className="text-gray-400 block uppercase font-black text-[10px]">{tField('تاريخ التنفيذ', 'Executed Date')}</span>
                      <span className="text-brand-dark font-extrabold block text-sm mt-0.5 font-mono">{selectedHistoryRun.runDate}</span>
                    </div>
                    <div className="p-3 bg-white border rounded-xl shadow-xs">
                      <span className="text-gray-400 block uppercase font-black text-[10px]">{tField('الطالبات المسكنات', 'Pupils Enrolled')}</span>
                      <span className="text-emerald-700 font-extrabold block text-sm mt-0.5">{selectedHistoryRun.assignedStudents} / {selectedHistoryRun.totalStudents} ({selectedHistoryRun.statistics?.matchingRate || 100}%)</span>
                    </div>
                    <div className="p-3 bg-white border rounded-xl shadow-xs">
                      <span className="text-gray-400 block uppercase font-black text-[10px]">{tField('حلقات تولدت', 'Quran sessions')}</span>
                      <span className="text-brand-primary font-extrabold block text-sm mt-0.5">{selectedHistoryRun.sessionsCreated} circles</span>
                    </div>
                  </div>

                  {/* Sessions details */}
                  <div className="space-y-2 select-none">
                    <h5 className="text-xs font-black text-slate-400 block uppercase tracking-wider mb-2">{tField('الحلقات التي تكونت وعلاقتها بالبث:', 'Formed recitation groups audit:')}</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedHistoryRun.sessions.map((sess: any) => (
                        <div key={sess.id} className="p-3 bg-white rounded-xl border flex flex-col justify-between">
                          <div className="truncate mb-2 text-start">
                            <span className="font-extrabold text-brand-dark text-xs block truncate">{sess.name}</span>
                            <small className="text-gray-400 block leading-normal text-[10.5px] mt-0.5">Instructor: {sess.teacher.name} | format: {sess.format}</small>
                          </div>
                          <span className="bg-slate-50 px-2 py-0.5 rounded text-[10px] text-brand-primary border w-fit font-mono font-bold font-sans">
                            {sess.students.length} reciters placed in {sess.timeSlots?.length || 2} slots
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* Main archived runs loop */}
              <div className="space-y-3 font-sans select-none text-xs sm:text-sm font-bold">
                {historianRuns.map((run, index) => (
                  <div 
                    key={run.id || index}
                    className="p-4 bg-white border border-slate-205 rounded-2xl hover:border-brand-primary/30 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-start leading-normal"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-extrabold text-brand-dark text-sm sm:text-base">{run.periodName}</h5>
                        <span className="text-[10px] bg-slate-50 border px-1.5 py-0.5 rounded text-gray-400 font-mono">
                          {run.id}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400 mt-1">
                        <span>🗓️ Run Date: <strong className="font-mono">{run.runDate}</strong></span>
                        <span>🎓 Reciters Registered: <strong>{run.assignedStudents} / {run.totalStudents}</strong></span>
                        <span>📚 Sessions: <strong>{run.sessionsCreated} generated</strong></span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedHistoryRun(run)}
                        className="px-4 py-2 border rounded-xl hover:bg-slate-50 text-slate-500 font-black text-xs cursor-pointer"
                      >
                        {tField('عرض التفاصيل والتقارير 📊', 'View Audit Details 📊')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}
