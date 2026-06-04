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
  AlertCircle
} from 'lucide-react';

interface ControlPanelProps {
  user: User;
  sessions: Session[];
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  sessionRequests: SessionRequest[];
  setSessionRequests: React.Dispatch<React.SetStateAction<SessionRequest[]>>;
  adminStats: AdminStats;
  setAdminStats: React.Dispatch<React.SetStateAction<AdminStats>>;
  allStudents: GlobalStudent[];
  allTeachers: GlobalTeacher[];
  lang: 'ar' | 'en';
  t: () => any;
}

type AdminSubView = 'default' | 'students' | 'teachers';

export default function ControlPanel({
  user,
  sessions,
  setSessions,
  sessionRequests,
  setSessionRequests,
  adminStats,
  setAdminStats,
  allStudents,
  allTeachers,
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

  if (subView === 'students') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <h2 className="text-2xl sm:text-3.5xl font-black text-brand-dark text-start">
            {t().studentList}
          </h2>
          <button 
            className="px-5 py-2.5 border-2 border-brand-primary/40 text-brand-primary rounded-xl font-bold bg-white text-xs hover:bg-brand-neutral/50 transition-colors uppercase cursor-pointer"
            onClick={() => setSubView('default')}
          >
            {t().backToPanel}
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-brand-primary/10 shadow-sm p-6 select-none text-start">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-xs font-black uppercase text-start">
                  <th className={`pb-3 py-2 text-start ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{t().firstName}</th>
                  <th className="pb-3 py-2 text-center">{t().contactNumber}</th>
                  <th className="pb-3 py-2 text-center">{t().level}</th>
                  <th className="pb-3 py-2 text-center">{t().sessionName}</th>
                  <th className={`pb-3 py-2 text-end ${lang === 'ar' ? 'text-left' : 'text-right'}`}>{t().importantInfo}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-bold">
                {allStudents.map((stud, idx) => (
                  <tr key={idx} className="hover:bg-brand-neutral/5">
                    <td className="py-4 text-brand-dark font-extrabold">{stud.name}</td>
                    <td className="py-4 font-mono text-center tracking-tight">{stud.phone}</td>
                    <td className="py-4 text-center">
                      <span className="bg-brand-neutral text-brand-primary text-xs py-1 px-3 rounded-full border border-brand-primary/10">
                        {stud.level}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      {stud.session === 'Pending' ? (
                        <span className="text-red-500 font-extrabold text-xs">{t().notAssigned}</span>
                      ) : (
                        <span className="text-gray-600">{stud.session}</span>
                      )}
                    </td>
                    <td className="py-4 text-xs text-gray-400 font-medium max-w-xs overflow-hidden text-ellipsis leading-relaxed text-end">
                      {stud.info}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (subView === 'teachers') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <h2 className="text-2xl sm:text-3.5xl font-black text-brand-dark text-start">
            {t().teacherList}
          </h2>
          <button 
            className="px-5 py-2.5 border-2 border-brand-primary/40 text-brand-primary rounded-xl font-bold bg-white text-xs hover:bg-brand-neutral/50 transition-colors uppercase cursor-pointer"
            onClick={() => setSubView('default')}
          >
            {t().backToPanel}
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-brand-primary/10 shadow-sm p-6 select-none text-start">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-xs font-black uppercase text-start">
                  <th className={`pb-3 py-2 text-start ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{t().firstName}</th>
                  <th className="pb-3 py-2 text-center">{t().contactNumber}</th>
                  <th className="pb-3 py-2 text-center">{t().level}</th>
                  <th className="pb-3 py-2 text-center">{t().sessions}</th>
                  <th className={`pb-3 py-2 text-end ${lang === 'ar' ? 'text-left' : 'text-right'}`}>{t().importantInfo}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-bold">
                {allTeachers.map((teach, idx) => (
                  <tr key={idx} className="hover:bg-brand-neutral/5">
                    <td className="py-4 text-brand-dark font-extrabold">{teach.name}</td>
                    <td className="py-4 font-mono text-center tracking-tight">{teach.phone}</td>
                    <td className="py-4 text-center">
                      <span className="bg-brand-warm/15 text-brand-dark text-xs py-1 px-3 rounded-full border border-brand-warm/25">
                        {teach.level}
                      </span>
                    </td>
                    <td className="py-4 text-center text-gray-600">{teach.session}</td>
                    <td className="py-4 text-xs text-gray-400 font-medium max-w-xs overflow-hidden text-ellipsis leading-relaxed text-end">
                      {teach.info}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <h2 className="text-2xl sm:text-4xl font-black text-brand-dark mb-8 text-start">
        {t().adminControlPanel}
      </h2>

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
