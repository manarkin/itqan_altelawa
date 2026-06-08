import React, { useState } from 'react';
import { 
  User, 
  Session, 
  SessionRequest, 
  AdminStats, 
  GlobalStudent, 
  GlobalTeacher 
} from '../types';
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
  Sparkles,
  Monitor
} from 'lucide-react';
import AssignmentWizard from './AssignmentWizard/AssignmentWizard';
import OnlineAssignmentWizard from './AssignmentWizard/OnlineAssignmentWizard';

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
}

type AdminSubView = 'default' | 'students' | 'teachers' | 'sessions' | 'assignment-wizard' | 'online-assignment-wizard';

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
  t
}: ControlPanelProps) {
  const [subView, setSubView] = useState<AdminSubView>('default');

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
        return 'تمهيدية';
      case 'ADVANCED':
      case 'متقدمة':
        return 'متقدمة';
      case 'TAMKEEN':
      case 'تمكين':
        return 'تمكين';
      default: return lvl || 'غير مصنفة';
    }
  };

  const getPreciseFullName = (item: any) => {
    if (item.firstName) {
      return `${item.firstName} بنت ${item.fatherName || '---'} بن ${item.grandfatherName || '---'} ${item.lastName || ''}`;
    }
    return item.name || '---';
  };

  if (subView === 'assignment-wizard') {
    return (
      <AssignmentWizard 
        sessions={sessions}
        setSessions={setSessions}
        allStudents={allStudents}
        allTeachers={allTeachers}
        setAllStudents={setAllStudents}
        setAllTeachers={setAllTeachers}
        lang={lang}
        onBack={() => setSubView('default')}
      />
    );
  }

  if (subView === 'online-assignment-wizard') {
    return (
      <OnlineAssignmentWizard 
        sessions={sessions}
        setSessions={setSessions}
        allStudents={allStudents}
        allTeachers={allTeachers}
        setAllStudents={setAllStudents}
        setAllTeachers={setAllTeachers}
        lang={lang}
        onBack={() => setSubView('default')}
      />
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
                              <option value="تمكين">{lang === 'ar' ? 'تمكين' : 'Tamkeen'}</option>
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

                    <div className="flex items-center gap-3">
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <h2 className="text-2xl sm:text-4xl font-black text-brand-dark mb-8 text-start">
        {t().adminControlPanel}
      </h2>

      {/* Dual Core Assignment Utility Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 select-none">
        
        {/* Banner 1: In-person standard matching */}
        <div className="bg-gradient-to-br from-brand-primary to-brand-accent p-6 sm:p-7 rounded-3xl text-white shadow-sm relative overflow-hidden flex flex-col justify-between space-y-4">
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <BookOpen className="w-44 h-44" />
          </div>
          <div className="space-y-2 text-start relative">
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider block w-fit">
              {lang === 'ar' ? 'حضوري وتناسقي' : 'In-Person & Hybrid Engine'}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
              {lang === 'ar' ? 'معالج التوزيع التلقائي للحلقات (حضوري)' : 'Intelligent Offline Session Assignment Wizard'}
            </h3>
            <p className="text-white/85 text-xs font-bold leading-relaxed">
              {lang === 'ar' 
                ? 'استخدمي الخوارزمية المقيدة لتوزيع الطالبات في حلقات تلاوة فيزيائية داخل مقار جامعة السلطان قابوس بالتوافق مع المعلمات.'
                : 'Deploy the main constraint heuristic to match SQU student timetables with available in-person teacher slots across campuses.'}
            </p>
          </div>
          <button
            onClick={() => setSubView('assignment-wizard')}
            className="bg-white text-brand-primary hover:bg-slate-50 px-5 py-3 rounded-xl text-xs font-black transition-all transform hover:-translate-y-0.5 shadow-xs flex items-center gap-2 cursor-pointer w-fit z-10"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            <span>{lang === 'ar' ? 'تشغيل الموزع الحضوري ' : 'Launch In-Person Wizard'}</span>
          </button>
        </div>

        {/* Banner 2: Online-only virtual matching */}
        <div className="bg-gradient-to-br from-indigo-955 to-brand-primary p-6 sm:p-7 rounded-3xl text-white shadow-sm relative overflow-hidden flex flex-col justify-between space-y-4">
          <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none">
            <Monitor className="w-44 h-44" />
          </div>
          <div className="space-y-2 text-start relative">
            <span className="bg-emerald-500/25 border border-emerald-400/40 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider block w-fit text-emerald-300">
              {lang === 'ar' ? 'افتراضي بالكامل أونلاين' : '100% Virtual Engine'}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
              {lang === 'ar' ? 'محرك تسكين الطالبات والمعلمات عبر الإنترنت (أونلاين)' : 'Virtual & Online Student Assignment Utility'}
            </h3>
            <p className="text-white/85 text-xs font-bold leading-relaxed">
              {lang === 'ar' 
                ? 'مخصص لتسكين طالبات الدراسات العليا والموظفات المقيدات بصيغة أونلاين وتجنيح غرف مايكروسوفت تيمز تلقائياً لكل حلقة.'
                : 'Custom-tailored matching engine configured exclusively for online reciters and postgraduates with SQU Microsoft Teams link spawning.'}
            </p>
          </div>
          <button
            onClick={() => setSubView('online-assignment-wizard')}
            className="bg-emerald-500 text-white hover:bg-emerald-600 px-5 py-3 rounded-xl text-xs font-black transition-all transform hover:-translate-y-0.5 shadow-xs flex items-center gap-2 cursor-pointer w-fit z-10"
          >
            <Monitor className="w-3.5 h-3.5 text-white" />
            <span>{lang === 'ar' ? 'تشغيل الموزع الافتراضي أونلاين' : 'Launch Online Assigner'}</span>
          </button>
        </div>

      </div>

      {/* Grid Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 select-none">
        
        {/* Total Students card */}
        <div 
          className="bg-brand-primary/[0.03] p-6 rounded-3xl border border-brand-primary/15 shadow-sm hover:scale-103 cursor-pointer transition-all duration-300 flex flex-col items-center sm:items-start text-center sm:text-start"
          onClick={() => setSubView('students')}
        >
          <div className="bg-white p-3 rounded-2xl shadow-sm text-brand-primary mb-4 w-fit">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-3xl font-black text-brand-dark mb-1">{adminStats.totalStudents}</h3>
          <p className="text-gray-400 text-xs font-black block uppercase tracking-wider">{t().studentList}</p>
        </div>

        {/* Total Teachers card */}
        <div 
          className="bg-brand-primary/[0.03] p-6 rounded-3xl border border-brand-primary/15 shadow-sm hover:scale-103 cursor-pointer transition-all duration-300 flex flex-col items-center sm:items-start text-center sm:text-start"
          onClick={() => setSubView('teachers')}
        >
          <div className="bg-white p-3 rounded-2xl shadow-sm text-amber-500 mb-4 w-fit">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-3xl font-black text-brand-dark mb-1">{adminStats.totalTeachers}</h3>
          <p className="text-gray-400 text-xs font-black block uppercase tracking-wider">{t().teacher}</p>
        </div>

        {/* Sessions card */}
        <div className="bg-brand-primary/[0.03] p-6 rounded-3xl border border-brand-primary/15 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-start">
          <div className="bg-white p-3 rounded-2xl shadow-sm text-emerald-500 mb-4 w-fit">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-3xl font-black text-brand-dark mb-1">{adminStats.totalSessions}</h3>
          <p className="text-gray-400 text-xs font-black block uppercase tracking-wider">{t().totalSessions}</p>
        </div>

        {/* Requests box card */}
        <div className="bg-brand-primary p-6 rounded-3xl shadow-lg flex flex-col items-center sm:items-start text-center sm:text-start text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 pointer-events-none opacity-5">
            <Inbox className="w-24 h-24" />
          </div>
          <div className="bg-white/10 p-3 rounded-2xl text-white mb-4 w-fit">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-3xl font-black text-white mb-1">{adminStats.pendingRequests}</h3>
          <p className="text-white/70 text-xs font-black block uppercase tracking-wider">{t().requests}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-start">
        {/* Join Application queue logs (8 columns) */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl border border-brand-primary/10 shadow-sm p-6">
            <h4 className="text-lg sm:text-xl font-black text-brand-dark mb-5 flex items-center gap-2">
              <UserPlus className="text-brand-primary w-5.5 h-5.5" />
              {t().manageRequests}
            </h4>

            <div className="overflow-x-auto select-none">
              {sessionRequests.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center border border-dashed rounded-2xl bg-gray-50/50">
                  <AlertCircle className="opacity-15 text-gray-400 w-12 h-12 mb-3" />
                  <p className="text-gray-400 font-bold mb-0">No pending join requests.</p>
                </div>
              ) : (
                <table className="w-full text-sm border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-xs font-black uppercase text-start">
                      <th className={`pb-3 py-2 text-start ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{t().firstName}</th>
                      <th className="pb-3 py-2 text-center">{t().level}</th>
                      <th className="pb-3 py-2 text-center">{t().overview}</th>
                      <th className={`pb-3 py-2 text-end ${lang === 'ar' ? 'text-left' : 'text-right'}`}>Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-bold select-none">
                    {sessionRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-brand-neutral/5">
                        <td className="py-4 text-brand-dark font-extrabold">{req.name}</td>
                        <td className="py-4 text-center">
                          <span className="bg-brand-neutral text-brand-primary border border-brand-primary/10 text-xs py-1 px-3 rounded-full font-mono">
                            {req.level}
                          </span>
                        </td>
                        <td className="py-4 text-center text-gray-400 font-mono text-xs">{req.date}</td>
                        <td className="py-4 text-end">
                          <div className={`flex items-center gap-2 ${lang === 'ar' ? 'justify-start' : 'justify-end'}`}>
                            <button 
                              className="px-4 py-1.5 rounded-full bg-brand-primary text-white text-xs font-black hover:bg-brand-accent transition-all cursor-pointer shadow-xs"
                              onClick={() => handleApproveJoinRequest(req.id)}
                            >
                              {t().approve}
                            </button>
                            <button 
                              className="px-4 py-1.5 rounded-full border border-gray-150 hover:bg-gray-50 text-gray-500 text-xs font-bold transition-all"
                              onClick={() => handleRejectJoinRequest(req.id)}
                            >
                              {t().reject}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Sessions list summary side (4 columns) */}
        <div className="lg:col-span-4 select-none">
          <div className="bg-white rounded-3xl border border-brand-primary/10 shadow-sm p-6">
            <h4 className="text-lg sm:text-xl font-black text-brand-dark mb-5 flex items-center gap-2">
              <Layers className="text-amber-500 w-5.5 h-5.5" />
              {t().sessions}
            </h4>
            <div className="flex flex-col gap-3">
              {sessions.map((sess) => (
                <div 
                  key={sess.id} 
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-center justify-between"
                >
                  <div>
                    <div className="font-extrabold text-brand-dark text-sm leading-snug">{sess.name}</div>
                    <small className="text-gray-400 block font-bold leading-normal mt-0.5">{sess.teacher.name}</small>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-xl text-brand-primary border border-brand-primary/10 font-bold text-xs">
                    {sess.students.length} / {sess.maxStudents}
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
