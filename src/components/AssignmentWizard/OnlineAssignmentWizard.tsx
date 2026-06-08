import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Sliders, 
  Check, 
  Play, 
  X, 
  AlertTriangle, 
  Monitor, 
  Clock, 
  RefreshCw, 
  Users, 
  ChevronRight, 
  History, 
  Award, 
  HelpCircle, 
  CheckCircle,
  Video,
  Globe,
  Link,
  Laptop
} from 'lucide-react';
import { 
  assignSessions, 
  AlgStudent, 
  AlgTeacher, 
  ProposedSession, 
  AssignerConstraints 
} from './SessionAssigner';
import { Session, SessionStudent } from '../../types';

interface OnlineAssignmentWizardProps {
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

export default function OnlineAssignmentWizard({
  sessions,
  setSessions,
  allStudents,
  allTeachers,
  setAllStudents,
  setAllTeachers,
  lang,
  onBack
}: OnlineAssignmentWizardProps) {
  const isAr = lang === 'ar';
  const tField = (ar: string, en: string) => isAr ? ar : en;

  const [step, setStep] = useState<number>(1);
  const [periodName, setPeriodName] = useState('Online fall 2026 - تلاوة أونلاين خريف ٢٠٢٦');
  const [autoAssignLinks, setAutoAssignLinks] = useState(true);

  // Constraints optimized for online sessions
  const [constraints, setConstraints] = useState<AssignerConstraints>({
    maxStudentsPerSession: 8, // Online supports slightly larger groupings
    minStudentsPerSession: 3,
    preferTwoCommonTimeslots: true,
    allowOnlineFallback: true,
    teachersCanTeachMultiple: true
  });

  // Filter students who are online-only or postgraduates/employees (who default to online)
  const onlineStudentsFiltered = allStudents.filter(s => 
    s.preferredFormat === 'online' || 
    s.studentType === 'postgrad' || 
    s.email?.includes('employee')
  );

  // Filter teachers willing to teach online
  const onlineTeachersFiltered = allTeachers.filter(t => 
    t.teachingFormat === 'online' || 
    t.teachingFormat === 'hybrid' || 
    !t.teachingFormat
  );

  // Algorithm states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([]);
  const [proposedSessions, setProposedSessions] = useState<ProposedSession[]>([]);
  const [unmatchedStudents, setUnmatchedStudents] = useState<AlgStudent[]>([]);
  const [stats, setStats] = useState<any>(null);

  const runOnlineMatching = () => {
    setIsSimulating(true);
    setSimulatedLogs([]);
    setStep(2);

    const logPrefix = (enText: string, arText: string) => isAr ? arText : enText;

    const logs: string[] = [
      logPrefix('Initializing Virtual Session Assignment Algorithm...', 'بدء تشغيل خوارزمية توزيع حَلَقات التلاوة الافتراضية...'),
      logPrefix(`Filtering online target audience: ${onlineStudentsFiltered.length} matching students.`, `تصفية الفئة المستهدفة أونلاين: تم العثور على ${onlineStudentsFiltered.length} طالبة.`),
      logPrefix(`Filtering available virtual teachers: ${onlineTeachersFiltered.length} active teachers.`, `تصفية المعلمات المستعدات للتعليم الافتراضي: ${onlineTeachersFiltered.length} معلمة.`),
      logPrefix('Setting constraints matrices (Location = SQU Microsoft Teams Room)...', 'ضبط مصفوفات القيود (المجال = غُرف مايكروسوفت تيمز جامعة السلطان قابوس)...'),
      logPrefix('Calculating calendar overlaps between online candidates...', 'حساب التداخلات الزمنية بين جداول الطالبات الافتراضيات...'),
      logPrefix('Greedy matching level categories (Beginner, Intermediate, Advanced, Tamkeen)...', 'دمج الفئات المستهدفة حسب المستويات (مبتدئة، تمهيدية، متقدمة، تمكين)...'),
    ];

    let currentLogIdx = 0;
    const interval = setInterval(() => {
      if (currentLogIdx < logs.length) {
        setSimulatedLogs(prev => [...prev, logs[currentLogIdx]]);
        currentLogIdx++;
      } else {
        clearInterval(interval);
        
        // Execute real assignment of online candidates
        const algStudents: AlgStudent[] = onlineStudentsFiltered.map(s => ({
          id: s.studentId || s.email,
          firstName: s.firstName || s.name.split(' ')[0],
          lastName: s.lastName || s.name.split(' ')[1] || '',
          fullName: s.name,
          studentType: s.studentType || 'undergrad',
          preferredFormat: 'online',
          level: s.level === 'تمهيدية' || s.level === 'متوسطة' ? 'INTERMEDIATE' : s.level === 'متقدمة' ? 'ADVANCED' : s.level === 'تمكين' ? 'TAMKEEN' : 'BEGINNER',
          phone: s.phone,
          email: s.email,
          college: s.college,
          cohort: s.cohort,
          timings: s.enrollmentDetails?.timings || {}
        }));

        const algTeachers: AlgTeacher[] = onlineTeachersFiltered.map(t => {
          const avail: any = {};
          ALL_DAYS.forEach(d => {
            ALL_SLOTS.forEach(s => {
              avail[`${d.key}_${s.key}`] = { available: true, preferredFormat: 'online' };
            });
          });
          return {
            id: t.employeeId || t.email,
            firstName: t.firstName || t.name.split(' ')[0],
            lastName: t.lastName || t.name.split(' ')[1] || '',
            fullName: t.name,
            isFirstTimeTeacher: t.isFirstTimeTeacher || false,
            teachingStatus: t.teachingStatus || 'iqraa',
            currentTeachingLevel: 'all',
            teachingGoal: t.comment || '',
            maxSessionsPerWeek: t.maxSessionsPerWeek || 2,
            assignedSessionsCount: 0,
            availability: t.enrollmentDetails?.timings || avail,
            phone: t.phone,
            email: t.email,
            avatar: t.avatar
          };
        });

        const result = assignSessions(algStudents, algTeachers, constraints, lang);

        // Customize results for Online context (e.g. assign virtual links and set format = 'online')
        const virtualizedProposed: ProposedSession[] = result.proposedSessions.map((sess, idx) => {
          const roomNum = idx + 1;
          const teamsLink = `https://teams.microsoft.com/l/meetup-join/19%3ameeting_SQU_Tajweed_Room_${roomNum}_${Math.random().toString(36).substring(2, 10)}%40thread.v2/0?context=%7b%22Tid%22%3a%22squ.edu.om%22%7d`;
          return {
            ...sess,
            location: autoAssignLinks ? `SQU Teams Room ${roomNum}` : tField('منصة مايكروسوفت تيمز', 'Microsoft Teams'),
            format: 'online',
            name: `${tField('حلقة افتراضية', 'Virtual Circle')} ${sess.name.replace('Session', 'Room')}`,
            conflicts: [teamsLink] // Store the generated link inside conflicts or custom field
          };
        });

        setProposedSessions(virtualizedProposed);
        setUnmatchedStudents(result.unmatchedStudents);
        setStats({
          totalMatched: virtualizedProposed.reduce((acc, cr) => acc + cr.students.length, 0),
          totalUnmatched: result.unmatchedStudents.length,
          utilizationRate: result.statistics.utilizationRate,
          roomsCreated: virtualizedProposed.length
        });
        setIsSimulating(false);
        setStep(3);
      }
    }, 450);
  };

  const handleApplyProposedSessions = () => {
    // Commit virtual sessions to standard active list
    const newSessions: Session[] = proposedSessions.map(sess => {
      const isPostgrad = sess.students.some(s => s.cohort?.includes('الخامسة') || s.email?.includes('employee'));
      const themeColor = isPostgrad ? 'emerald' : 'indigo';
      return {
        id: sess.id,
        name: sess.name,
        teacher: {
          id: sess.teacher.id,
          name: sess.teacher.name,
          role: 'TEACHER',
          avatar: sess.teacher.avatar,
          phone: sess.teacher.phone,
          email: sess.teacher.id.includes('@') ? sess.teacher.id : `${sess.teacher.id}@squ.edu.om`
        },
        maxStudents: sess.maxStudents,
        location: sess.location,
        time: sess.time,
        themeColor: themeColor,
        isOnline: true,
        onlineLink: sess.conflicts[0] || 'https://teams.microsoft.com/l/meetup-join/squ',
        students: sess.students.map(s => {
          const raw = allStudents.find(o => o.studentId === s.id || o.email === s.id || o.id === s.id);
          return {
            id: s.id,
            name: s.name,
            money: 10,
            avatar: s.avatar || `https://picsum.photos/seed/${s.id}/80/80`,
            absencesExcused: 0,
            absencesUnexcused: 0,
            email: s.email || `${s.id}@student.squ.edu.om`,
            phone: s.phone || '+968 9345 6789',
            college: s.college || tField('كلية العلوم', 'Science'),
            cohort: s.cohort || '2023',
            enrollmentDetails: raw?.enrollmentDetails
          };
        })
      };
    });

    setSessions(prev => [...prev, ...newSessions]);
    
    // Save to history
    const savedRuns = localStorage.getItem('itqan_assigned_runs_history');
    const runsList = savedRuns ? JSON.parse(savedRuns) : [];
    const formattedRun = {
      id: 'run_online_' + Date.now(),
      date: new Date().toLocaleDateString(lang === 'ar' ? 'ar-OM' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
      periodName: periodName,
      type: 'online',
      sessionsCount: newSessions.length,
      assignedCount: stats?.totalMatched || 0,
      unassignedCount: stats?.totalUnmatched || 0,
      sessions: newSessions
    };
    localStorage.setItem('itqan_assigned_runs_history', JSON.stringify([formattedRun, ...runsList]));

    setStep(4);
  };

  const handleRemoveStudent = (stdId: string, sessId: string) => {
    setProposedSessions(prev => prev.map(sess => {
      if (sess.id !== sessId) return sess;
      const target = sess.students.find(s => s.id === stdId);
      if (target) {
        setUnmatchedStudents(u => [...u, {
          id: target.id,
          firstName: target.name.split(' ')[0],
          lastName: target.name.split(' ')[1] || '',
          fullName: target.name,
          studentType: 'undergrad',
          preferredFormat: 'online',
          level: 'BEGINNER',
          phone: target.phone || '',
          email: target.email || '',
          college: target.college || '',
          cohort: target.cohort || '',
          timings: {}
        }]);
      }
      return {
        ...sess,
        students: sess.students.filter(s => s.id !== stdId)
      };
    }));
  };

  const handlePlaceStudent = (stdId: string, sessId: string) => {
    const studentObj = unmatchedStudents.find(s => s.id === stdId);
    if (!studentObj) return;

    setProposedSessions(prev => prev.map(sess => {
      if (sess.id !== sessId) return sess;
      return {
        ...sess,
        students: [
          ...sess.students,
          {
            id: studentObj.id,
            name: studentObj.fullName,
            avatar: `https://picsum.photos/seed/${studentObj.id}/100/100`,
            email: studentObj.email,
            phone: studentObj.phone,
            college: studentObj.college,
            cohort: studentObj.cohort,
            money: 10,
            absencesExcused: 0,
            absencesUnexcused: 0
          }
        ]
      };
    }));

    setUnmatchedStudents(prev => prev.filter(s => s.id !== stdId));
  };

  const handleEditVirtualLink = (sessId: string, newLink: string) => {
    setProposedSessions(prev => prev.map(sess => {
      if (sess.id === sessId) {
        return {
          ...sess,
          conflicts: [newLink] // Using conflicts array index 0 to store custom virtual teams link
        };
      }
      return sess;
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-start font-sans">
      
      {/* Header and Back navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 mb-6">
        <div>
          <span className="text-xs font-bold text-brand-primary uppercase tracking-widest block mb-1">
            {tField('أداة التوزيع الافتراضية المخصصة', 'Specialized Virtual Assignment Utility')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-brand-dark flex items-center gap-2">
            <Monitor className="text-brand-primary w-7 h-7" />
            {tField('موزّع حَلَقات التلاوة أونلاين فقط', 'Online-Only Student Assignment Assigner')}
          </h2>
        </div>
        <button
          onClick={onBack}
          className="mt-3 sm:mt-0 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-bold rounded-xl transition-all w-fit cursor-pointer"
        >
          {tField('← عودة للوحة التحكم', '← Back to Dashboard')}
        </button>
      </div>

      {/* STEPPROGRESS BAR */}
      <div className="flex items-center justify-between max-w-xl mb-8">
        {[
          { num: 1, label: tField('تصفية وتهيئة', 'Config & Filters') },
          { num: 2, label: tField('حساب المصفوفة', 'Solving overlapping') },
          { num: 3, label: tField('معاينة الحلقات', 'Preview Roster') },
          { num: 4, label: tField('مكتمل', 'Committed') },
        ].map((s, idx, arr) => (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center gap-1.5 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-colors ${
                step === s.num ? 'bg-brand-primary text-white ring-4 ring-brand-primary/20' : step > s.num ? 'bg-emerald-500 text-white' : 'bg-gray-250 text-gray-500'
              }`}>
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span className="text-[10px] sm:text-xs font-extrabold text-gray-400 whitespace-nowrap">{s.label}</span>
            </div>
            {idx < arr.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 transition-colors ${step > s.num ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1: CONFIGURE ONLINE RULES AND VIEW FILTERED TARGET DATA */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 select-none">
          
          {/* Rules and Setup form (5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-brand-primary/10 shadow-xs space-y-6">
            <h3 className="text-lg font-black text-brand-dark flex items-center gap-2">
              <Sliders className="text-brand-primary w-5 h-5" />
              {tField('إعدادات الغرف الافتراضية والقيود', 'Virtual Rooms & Allocation Setup')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-extrabold uppercase mb-1 block">
                  {tField('عنوان الدورة / الفترة:', 'Academic Session Title:')}
                </label>
                <input 
                  type="text" 
                  value={periodName}
                  onChange={(e) => setPeriodName(e.target.value)}
                  className="w-full text-xs font-bold border border-slate-200 rounded-xl px-4 py-3 bg-stone-50 text-brand-dark focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-extrabold uppercase mb-1 block">
                    {tField('أقصى مقاعد بالحلقة:', 'Max seats per Room:')}
                  </label>
                  <select
                    className="w-full border rounded-xl py-3 px-3 text-xs font-bold text-brand-dark bg-stone-50 cursor-pointer"
                    value={constraints.maxStudentsPerSession}
                    onChange={(e) => setConstraints(prev => ({ ...prev, maxStudentsPerSession: Number(e.target.value) }))}
                  >
                    <option value={4}>4 {tField('طالبات', 'students')}</option>
                    <option value={6}>6 {tField('طالبات', 'students')}</option>
                    <option value={8}>8 {tField('طالبات', 'students')}</option>
                    <option value={10}>10 {tField('طالبات', 'students')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-extrabold uppercase mb-1 block">
                    {tField('أقل مقاعد للتسكين:', 'Min seats per Room:')}
                  </label>
                  <select
                    className="w-full border rounded-xl py-3 px-3 text-xs font-bold text-brand-dark bg-stone-50 cursor-pointer"
                    value={constraints.minStudentsPerSession}
                    onChange={(e) => setConstraints(prev => ({ ...prev, minStudentsPerSession: Number(e.target.value) }))}
                  >
                    <option value={2}>2 {tField('طالبات', 'students')}</option>
                    <option value={3}>3 {tField('طالبات', 'students')}</option>
                    <option value={4}>4 {tField('طالبات', 'students')}</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-brand-primary/[0.03] border border-brand-primary/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-brand-dark leading-snug">
                      {tField('توليد روابط تيمز تلقائياً:', 'Auto-generate SQU Teams links:')}
                    </div>
                    <small className="text-gray-400 block font-bold leading-normal mt-0.5">
                      {tField('سيتم كتابة وتجنيح روابط غرف افتراضية مخصصة لكل حلقة.', 'Create and assign dedicated MS Teams meeting paths.')}
                    </small>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={autoAssignLinks}
                    onChange={(e) => setAutoAssignLinks(e.target.checked)}
                    className="w-5 h-5 text-brand-primary cursor-pointer accent-brand-primary"
                  />
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-brand-dark leading-snug">
                      {tField('تفضيل موعدين منفصلين:', 'Prefer 2 common timeslots:')}
                    </div>
                    <small className="text-gray-400 block font-bold leading-normal mt-0.5">
                      {tField('محاولة توزيع الطالبات على موعدين في الأسبوع لتكثيف التعلم.', 'Encourage grouping based on twice-weekly study dates.')}
                    </small>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={constraints.preferTwoCommonTimeslots}
                    onChange={(e) => setConstraints(prev => ({ ...prev, preferTwoCommonTimeslots: e.target.checked }))}
                    className="w-5 h-5 text-brand-primary cursor-pointer accent-brand-primary"
                  />
                </div>
              </div>

              <button
                onClick={runOnlineMatching}
                className="w-full py-4 text-xs sm:text-sm font-black bg-brand-primary text-white hover:bg-brand-accent rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-brand-primary/10 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                <span>{tField('تشغيل محرك التوزيع الافتراضي', 'Run Automated Online Assignment Engine')}</span>
              </button>
            </div>
          </div>

          {/* Targeted candidates breakdown (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-brand-primary/[0.03] p-5 rounded-3xl border border-brand-primary/15 flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary text-white rounded-xl flex items-center justify-center shadow-sm">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-brand-dark leading-snug">
                  {tField('مجموع المسجلات المتاحات للتوزيع أونلاين', 'Total Online Reciter Candidates Available')}
                </h4>
                <p className="text-[10.5px] text-gray-400 font-bold mb-0 mt-0.5">
                  {tField(
                    `تشمل هذه القائمة الطالبات المسجلات اللواتي يفضلن الصيغة عبر الإنترنت والموظفات وطالبات الدراسات العليا.`,
                    `Includes students preferring online instruction, postgraduates, and SQU employees.`
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                <span className="text-3xl font-black text-brand-primary font-mono">{onlineStudentsFiltered.length}</span>
                <span className="text-[10px] text-gray-400 font-black tracking-wider uppercase mt-1">{tField('طالبة افتراضية بانتظار التسكين', 'Online Candidates')}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                <span className="text-3xl font-black text-amber-500 font-mono">
                  {onlineStudentsFiltered.filter(s => s.studentType === 'postgrad' || s.email?.includes('employee')).length}
                </span>
                <span className="text-[10px] text-gray-400 font-black tracking-wider uppercase mt-1">{tField('طالبات دراسات عليا وموظفات', 'Postgrads & Employees')}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center col-span-2 md:col-span-1">
                <span className="text-3xl font-black text-emerald-500 font-mono">{onlineTeachersFiltered.length}</span>
                <span className="text-[10px] text-gray-400 font-black tracking-wider uppercase mt-1">{tField('معلمات تطوعيات مفترضات', 'Eligible Teachers')}</span>
              </div>
            </div>

            {/* Preview lists of students */}
            <div className="bg-white rounded-3xl border border-gray-150 p-6">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                {tField('كشف الطالبات المرشحات للتوزيع أونلاين:', 'Online candidates ready for simulation:')}
              </h4>
              <div className="max-h-[350px] overflow-y-auto divide-y font-bold text-xs">
                {onlineStudentsFiltered.map(std => {
                  const isPostgrad = std.studentType === 'postgrad' || std.email?.includes('employee');
                  return (
                    <div key={std.studentId || std.email} className="py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/50">
                      <div>
                        <div className="text-brand-dark font-black tracking-tight">{std.name}</div>
                        <small className="text-gray-400 block font-bold leading-normal mt-0.5">{std.college} | Coh {std.cohort}</small>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-brand-primary/10 text-brand-primary text-[9px] px-2 py-0.5 rounded-full font-black">
                          {std.level}
                        </span>
                        <span>{isPostgrad ? '🎓' : '🏫'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* STEP 2: METRIC SOLVING MATRIX / TERMINAL LOGS EFFECT */}
      {step === 2 && (
        <div className="bg-stone-900 text-stone-200 p-6 sm:p-8 rounded-3xl border border-stone-800 shadow-2xl relative overflow-hidden flex flex-col select-none">
          <div className="absolute top-2 right-4 flex items-center gap-1.5 opacity-30 select-none">
            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
            <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full" />
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
          </div>

          <div className="flex items-center gap-3.5 border-b border-stone-800 pb-4 mb-6">
            <RefreshCw className="w-5 h-5 text-brand-primary animate-spin" />
            <div className="text-start">
              <h4 className="text-sm sm:text-base font-black text-white leading-normal">
                {tField('معالج الحساب والفرز المكثف قيد التشغيل...', 'Solver algorithm is calculating global state overlays...')}
              </h4>
              <small className="text-stone-500 font-bold block mt-0.5">SQU Quranic Tajweed Club Cluster Core #OML02</small>
            </div>
          </div>

          {/* Logs Output */}
          <div className="flex-1 max-h-[380px] overflow-y-auto font-mono text-[10.5px] sm:text-xs text-stone-300 space-y-2 py-3 text-start bg-stone-950/45 p-4 rounded-2xl scrollbar-thin scrollbar-thumb-stone-800">
            {simulatedLogs.map((log, lIdx) => (
              <div key={lIdx} className="leading-relaxed select-text flex gap-1 items-start">
                <span className="text-stone-500 select-none">[{lIdx + 1}]</span>
                <span className={`${log.includes('[النظام]') || log.includes('[System]') ? 'text-brand-primary font-bold' : log.includes('Filtering') || log.includes('تصفية') ? 'text-emerald-400' : 'text-stone-300'}`}>
                  {log}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-stone-500 font-bold select-none pt-2">
              <span className="w-1.5 h-3 bg-brand-primary animate-pulse" />
              <span>{tField('مصفوفة المعالجة قيد المخطط العشوائي...', 'Matrix solver calculating heuristics...')}</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW GENERATED VIRTUAL SESSIONS & MANUAL overrideS */}
      {step === 3 && (
        <div className="space-y-8">
          
          {/* Result Banner stats */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
            <div className="text-center md:text-start">
              <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">{tField('حلقات التلاوة التي تم تأسيسها:', 'Virtual Rooms Created:')}</span>
              <span className="text-2xl sm:text-3.5xl font-black text-brand-dark font-mono leading-none block mt-1">{stats?.roomsCreated}</span>
            </div>
            <div className="text-center md:text-start">
              <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">{tField('الطالبات المسكنات بنجاح:', 'Placed Online Reciters:')}</span>
              <span className="text-2xl sm:text-3.5xl font-black text-emerald-600 font-mono leading-none block mt-1">{stats?.totalMatched} / {onlineStudentsFiltered.length}</span>
            </div>
            <div className="text-center md:text-start">
              <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">{tField('طالبات بقائمة الانتظار:', 'Waitlisted Reciters:')}</span>
              <span className="text-2xl sm:text-3.5xl font-black text-amber-600 font-mono leading-none block mt-1">{stats?.totalUnmatched}</span>
            </div>
            <div className="text-center md:text-start">
              <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">{tField('نسبة نجاح التوزيع الافتراضي:', 'Online Success Rate:')}</span>
              <span className="text-2xl sm:text-3.5xl font-black text-brand-primary font-mono leading-none block mt-1">{stats?.utilizationRate}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* MATCHED PROPOSED VIRTUAL SESSIONS ROSTER LIST (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <h3 className="text-lg font-black text-brand-dark flex items-center justify-between">
                <span>{tField('معاينة وخصائص الحلقات الافتراضية المقترحة:', 'Review Generated proposed virtual sessions:')}</span>
                <span className="bg-brand-primary text-white text-xs px-3 py-1 rounded-full font-black font-mono">
                  {proposedSessions.length} {tField('حلقة مقترحة', 'rooms')}
                </span>
              </h3>

              {proposedSessions.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center bg-gray-50 rounded-3xl border select-none">
                  <AlertTriangle className="text-amber-500 w-12 h-12 mb-3" />
                  <p className="text-gray-500 font-black">{tField('لم يتم تأسيس أي حلقة! الرجاء تخفيف قيود التسكين وإعادة تشغيل المحرك.', 'No virtual rooms generated! Please ease constraints and retry.')}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {proposedSessions.map((sess, idx) => (
                    <div 
                      key={sess.id}
                      className="bg-white border rounded-3xl shadow-sm p-6 space-y-4 hover:border-brand-primary/30 transition-all border-slate-150"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
                        <div className="space-y-1 text-start">
                          <span className="text-[10px] font-black text-brand-primary uppercase bg-brand-primary/10 px-2 py-0.5 rounded">
                            {sess.level}
                          </span>
                          <h4 className="text-base font-black text-brand-dark">
                            🎨 {sess.name}
                          </h4>
                          <span className="text-xs text-gray-500 block font-bold font-mono">
                            🗓️ Mapped: <span className="text-brand-dark font-extrabold">{sess.time}</span>
                          </span>
                        </div>

                        {/* Teacher Assign selector */}
                        <div className="text-start space-y-1">
                          <label className="text-[10px] text-gray-400 font-extrabold block lowercase tracking-tight">
                            {tField('المعلمة الافتراضية المقررة:', 'Volunteering teacher on duty:')}
                          </label>
                          <div className="text-xs font-black text-brand-dark flex items-center gap-2">
                            <img src={sess.teacher.avatar} alt="" className="w-6 h-6 rounded-full" />
                            <span>{sess.teacher.name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Room Link customization */}
                      <div className="bg-stone-50 p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-bold leading-normal">
                        <div className="flex items-center gap-2 truncate">
                          <Video className="w-4 h-4 text-brand-primary flex-shrink-0" />
                          <span className="text-gray-400">Teams Meet URL:</span>
                          <span className="font-mono text-gray-500 truncate select-text">{sess.conflicts[0] || 'N/A'}</span>
                        </div>
                        <button
                          onClick={() => {
                            const newLink = prompt(tField('تعديل رابط غرفه مايكروسوفت تيمز:', 'Change virtual MS Teams link:'), sess.conflicts[0]);
                            if (newLink) handleEditVirtualLink(sess.id, newLink);
                          }}
                          className="px-3 py-1 bg-white hover:bg-slate-100 border rounded-lg text-[10px] font-black text-brand-primary whitespace-nowrap cursor-pointer transition-colors"
                        >
                          ✏️ {tField('تعديل الرابط', 'Edit meeting link')}
                        </button>
                      </div>

                      {/* Paired students directory with SQU specifications */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs text-gray-400 font-extrabold select-none">
                          <span>{tField('الطالبات المسجلات بالحلقة الافتراضية:', 'Assigned students in this virtual session:')}</span>
                          <span>({sess.students.length} / {sess.maxStudents} {tField('طالبة', 'students')})</span>
                        </div>

                        {/* List of enrolled students showing custom profiles */}
                        <div className="grid grid-cols-1 gap-2.5 font-sans">
                          {sess.students.map((std) => {
                            const originalObj = allStudents.find(o => o.studentId === std.id || o.email === std.id || o.id === std.id);
                            const collId = originalObj?.studentId || std.id;
                            const levelVal = originalObj?.level || std.level || 'مبتدئة';
                            const timesKeys = originalObj?.enrollmentDetails?.timings 
                              ? Object.keys(originalObj.enrollmentDetails.timings).filter(key => originalObj.enrollmentDetails.timings[key] === 'selected') 
                              : [];

                            return (
                              <div 
                                key={std.id}
                                className="p-3.5 rounded-2xl border bg-slate-50/50 hover:bg-white transition-all hover:border-slate-350 grid grid-cols-1 md:grid-cols-12 gap-3"
                              >
                                <div className="md:col-span-10 text-start space-y-1.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-extrabold text-brand-dark text-xs sm:text-sm">{std.name}</span>
                                    <span className="bg-brand-primary/10 text-brand-primary text-[9px] px-1.5 py-0.5 rounded font-black font-sans">
                                      {levelVal}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-gray-500 text-[10.5px] font-bold">
                                    <div>🎓 {tField('الكلية:', 'College:')} <span className="text-gray-700">{std.college || originalObj?.college}</span></div>
                                    <div>🗓️ {tField('الدفعة:', 'Cohort Study:')} <span className="text-gray-700">{std.cohort || originalObj?.cohort}</span></div>
                                    <div className="font-mono">🆔 ID: <span className="text-gray-700">{collId}</span></div>
                                    <div className="font-mono">📱 {tField('الهاتف المسجل:', 'Registered Phone:')} <span className="text-gray-700 font-extrabold">{std.phone || originalObj?.phone}</span></div>
                                  </div>

                                  {/* Mapped times list */}
                                  {timesKeys.length > 0 && (
                                    <div className="pt-1.5 border-t border-gray-100 flex flex-wrap gap-1 items-center">
                                      <span className="text-[9.5px] text-gray-400 font-extrabold uppercase mr-1">{tField('مواعيدها المختارة:', 'Selected timeslots:')}</span>
                                      {timesKeys.map(key => {
                                        const parts = key.split('_');
                                        const dayAr: Record<string, string> = { Sunday: 'أحد', Monday: 'إثنين', Tuesday: 'ثلاثاء', Wednesday: 'أربعاء', Thursday: 'خميس' };
                                        const dayName = isAr ? (dayAr[parts[0]] || parts[0]) : parts[0].substring(0, 3);
                                        return (
                                          <span key={key} className="bg-amber-50 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-black border border-amber-200">
                                            {dayName} ({parts[1]})
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                                <div className="md:col-span-2 flex items-center justify-end pl-0 md:pl-3 border-t md:border-t-0 md:border-l border-gray-100 pt-2 lg:pt-0">
                                  <button
                                    onClick={() => handleRemoveStudent(std.id, sess.id)}
                                    className="flex items-center justify-center gap-1 w-full py-1.5 hover:bg-rose-50 text-rose-500 border rounded-lg text-[10px] font-black cursor-pointer transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>{tField('إخراج', 'Remove')}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Place waitlisted manually */}
                      {sess.students.length < sess.maxStudents && unmatchedStudents.length > 0 && (
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4 text-xs font-bold text-start">
                          <span className="text-slate-400 select-none">➕ {tField('إضافة طالبة من قائمة الانتظار يدويّاً:', 'Enlist waiting student manually:')}</span>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handlePlaceStudent(e.target.value, sess.id);
                                e.target.value = '';
                              }
                            }}
                            className="bg-stone-50 border hover:bg-slate-100 font-black cursor-pointer text-brand-primary rounded-lg text-[11px] px-2 py-1 outline-none"
                            defaultValue=""
                          >
                            <option value="" disabled>{tField('-- اختيار طالبة منتظرة --', '-- Select student from waitlist --')}</option>
                            {unmatchedStudents.map(std => (
                              <option key={std.id} value={std.id}>{std.fullName} ({std.level})</option>
                            ))}
                          </select>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* UNMATCHED WAITLIST (4 cols) */}
            <div className="lg:col-span-4 select-none">
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-amber-600 w-5 h-5 flex-shrink-0" />
                  <h4 className="text-sm font-black text-amber-900 mb-0">
                    {tField('قيد الانتظار لم يجد تماثل للتوقيتات:', 'Unassigned Online Reciters waitlist:')}
                  </h4>
                </div>
                <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
                  {tField(
                    'قائمة الطالبات المسكنات في صيغة أونلاين ولكن لم تجد الخوارزمية معلمات متطوعات يتقاطعن مع توقيتاتهن وساعاتهن الدراسية بجامعة السلطان قابوس.',
                    'Waitlisted students preferring online who had zero timetable overlaps with virtual-volunteer teachers.'
                  )}
                </p>

                {unmatchedStudents.length === 0 ? (
                  <div className="p-5 font-black text-xs text-emerald-800 bg-emerald-100/35 border border-dashed rounded-2xl text-center">
                    🎉 {tField('تمت الموافقة وتسكين ١٠٠٪ من الطالبات الافتراضيات!', 'All target online students successfully scheduled!')}
                  </div>
                ) : (
                  <div className="divide-y divide-amber-100 max-h-[300px] overflow-y-auto pr-1">
                    {unmatchedStudents.map(std => (
                      <div key={std.id} className="py-2.5 text-xs text-brand-dark flex flex-col text-start space-y-0.5">
                        <div className="font-extrabold">{std.fullName}</div>
                        <small className="text-gray-400 block font-bold mt-0.5">{std.college} | Coh {std.cohort}</small>
                        <span className="text-[9.5px] uppercase tracking-tight text-gray-400 block font-mono">🆔 ID: {std.id}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="border-t pt-5 flex items-center justify-end select-none">
            <button
              onClick={handleApplyProposedSessions}
              className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 font-black text-white text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{tField('تأكيد وحفظ روابط وتوزيعات الحلقة الحالية 📥', 'Confirm & Commit Assigned Virtual circles 📥')}</span>
            </button>
          </div>

        </div>
      )}

      {/* STEP 4: SUCCESS RECONCILING AND COMMITING ROOMS */}
      {step === 4 && (
        <div className="bg-emerald-50 border border-emerald-200/55 p-8 rounded-3xl space-y-5 text-center max-w-xl mx-auto select-none shadow-sm">
          <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-3xl shadow-lg shadow-emerald-500/20">
            ✓
          </div>
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-emerald-950">
              {tField('تم حفظ وتجنيح الحلقات في تيمز بنجاح!', 'Virtual Circles generated & committed!')}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-800 font-bold leading-relaxed px-2">
              {tField(
                'تم تفعيل الموزّع وحفظ وتثبيت روابط غرف مايكروسوفت تيمز الرسمية وتسكين الطالبات بنادي التلاوة بنجاح. يمكن للمعلمات الآن إرسال إشعارات الانضمام الفوري للطالبات.',
                'The online matching state has been recorded. SQU Microsoft Teams session URLs are fully bound, and direct rosters are loaded into the instructor portal.'
              )}
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onBack}
              className="px-5 py-2.5 bg-brand-primary text-white hover:bg-brand-accent text-xs sm:text-sm font-black rounded-lg transition-all w-full sm:w-auto cursor-pointer"
            >
              {tField('الانتقال للوحة التحكم 🗃️', 'Navigate to Control Panel 🗃️')}
            </button>
            <button
              onClick={() => {
                setStep(1);
                setStats(null);
                setProposedSessions([]);
                setUnmatchedStudents([]);
              }}
              className="px-5 py-2.5 bg-white border border-gray-250 hover:bg-gray-50 text-gray-500 text-xs sm:text-sm font-bold rounded-lg transition-all w-full sm:w-auto cursor-pointer"
            >
              {tField('بدء دورة توزيع جديدة 🔄', 'Start new round 🔄')}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
