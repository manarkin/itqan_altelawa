import React, { useState } from 'react';
import { User } from '../types';
import { Camera, GraduationCap, CheckCircle, Phone, Mail, Lock, BookOpen, ShieldCheck, UserCheck } from 'lucide-react';
import MaskedPasswordInput from './MaskedPasswordInput';

interface ProfileProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  lang: 'ar' | 'en';
  t: () => any;
}

export default function Profile({
  user,
  setUser,
  lang,
  t
}: ProfileProps) {
  const isAr = lang === 'ar';
  const tField = (ar: string, en: string) => isAr ? ar : en;

  const isTeacherOrAdmin = user.role === 'TEACHER' || user.role === 'ADMIN';

  // Setup options
  const STUDENT_LEVELS = [
    { key: 'مبتدئة', labelAr: 'مبتدئة', labelEn: 'Beginner' },
    { key: 'تمهيدية', labelAr: 'تمهيدية', labelEn: 'Introductory' },
    { key: 'متقدمة', labelAr: 'متقدمة', labelEn: 'Advanced' }
  ];

  const TEACHER_LEVELS = [
    { key: 'مجازة', labelAr: 'مجازة', labelEn: 'Certified / Mujazah' },
    { key: 'طالبة اقراء', labelAr: 'طالبة إقراء', labelEn: 'Iqraa Student' }
  ];

  const defaultLevel = isTeacherOrAdmin ? 'مجازة' : 'مبتدئة';

  // Form states
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phone, setPhone] = useState(user.phone || '');
  const [password, setPassword] = useState(user.password || '123456');
  const [college, setCollege] = useState(user.college || '');
  const [cohort, setCohort] = useState(user.cohort || '');
  const [level, setLevel] = useState(user.level || defaultLevel);

  // New Password Change flow states
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePfpUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const imgFile = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUser(prev => prev ? { ...prev, avatar: event.target?.result as string } : null);
        }
      };
      reader.readAsDataURL(imgFile);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    let finalPassword = password;
    if (changePassword) {
      if (!newPassword) {
        alert(tField('يرجى إدخال كلمة المرور الجديدة!', 'Please enter the new password!'));
        return;
      }
      if (newPassword !== confirmPassword) {
        alert(tField('كلمتا المرور غير متطابقتين!', 'Passwords do not match!'));
        return;
      }
      finalPassword = newPassword;
    }

    setUser(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        firstName,
        lastName,
        phone,
        password: finalPassword,
        college,
        cohort,
        level
      };
      localStorage.setItem('itqan_user', JSON.stringify(updated));
      return updated;
    });

    setChangePassword(false);
    setNewPassword('');
    setConfirmPassword('');
    setEditing(false);
    alert(tField('تم تحديث البيانات والملف الشخصي بنجاح!', 'Profile updated successfully!'));
  };


  // Get current Level label
  const getLevelLabel = (lvlKey: string) => {
    const allOptions = [...STUDENT_LEVELS, ...TEACHER_LEVELS];
    const match = allOptions.find(o => o.key === lvlKey);
    if (match) {
      return isAr ? match.labelAr : match.labelEn;
    }
    return lvlKey;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 select-none text-start">
      
      {/* SINGLE UNIFIED PROFILE CARD */}
      <div className="bg-white rounded-3xl border border-brand-primary/10 shadow-xl overflow-hidden relative">
        
        {/* Banner/Cover Background */}
        <div className="bg-gradient-to-r from-brand-primary to-amber-500 h-32 w-full absolute top-0 left-0 right-0 pointer-events-none" />

        {/* Content Body */}
        <div className="relative z-10 pt-16 px-6 sm:px-10 pb-10">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group mb-3 select-none mt-[-3rem]">
              <img 
                src={user.avatar || 'https://picsum.photos/seed/student/200/200'}
                alt="" 
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover hover:shadow-xl transition-shadow bg-white"
                referrerPolicy="no-referrer"
              />
              <label 
                htmlFor="pfp-upload" 
                className="absolute bottom-1 right-1 bg-brand-primary text-white p-2.5 rounded-full shadow-lg cursor-pointer hover:scale-110 active:scale-90 transition-transform flex items-center justify-center border-2 border-white select-none"
                title={tField('تحديث الصورة الشخصية', 'Change Face Avatar')}
              >
                <Camera className="w-4.5 h-4.5" />
                <input 
                  type="file" 
                  id="pfp-upload" 
                  className="sr-only" 
                  accept="image/*"
                  onChange={handlePfpUpload}
                />
              </label>
            </div>

            <h3 className="text-2xl font-black text-brand-dark mb-1">
              {user.firstName} {user.lastName}
            </h3>
            
            <span className="bg-brand-neutral/80 text-brand-primary text-xs font-black px-4 py-1.5 rounded-full border border-brand-primary/15 tracking-wider inline-flex items-center gap-1.5">
              {isTeacherOrAdmin ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
                  <span>{user.role === 'ADMIN' ? tField('مشرفة النادي', 'Admin Coordinator') : tField('معلمة وموجهة', 'Recitation Mentor')}</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-3.5 h-3.5 text-brand-primary" />
                  <span>{tField('طالبة بنادي مسك', 'Misk SQU Student Member')}</span>
                </>
              )}
            </span>
          </div>

          {/* Form Action Toggle */}
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
            <h4 className="text-base sm:text-lg font-black text-brand-dark flex items-center gap-2">
              <span>👤</span>
              <span>{tField('بيانات ومحددات الملف الشخصي', 'SQU Profile Details')}</span>
            </h4>
            
            <button 
              type="button"
              className="px-4.5 py-2 text-xs border-2 border-brand-primary text-brand-primary font-black rounded-xl hover:bg-brand-primary/5 active:bg-brand-primary/10 transition-all cursor-pointer"
              onClick={() => {
                // If canceling, reset the values
                if (editing) {
                  setFirstName(user.firstName);
                  setLastName(user.lastName);
                  setPhone(user.phone || '');
                  setPassword(user.password || '123456');
                  setCollege(user.college || '');
                  setCohort(user.cohort || '');
                  setLevel(user.level || defaultLevel);
                  setChangePassword(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }
                setEditing(!editing);
              }}
            >
              {editing ? tField('إلغاء التعديل', 'Cancel') : tField('تعديل البيانات', 'Modify Profile')}
            </button>
          </div>

          {!editing ? (
            /* ================= VIEW MODE ================= */
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-xs sm:text-sm">
                
                {/* Full name */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-gray-400 block font-bold mb-1 uppercase tracking-wider">{tField('الاسم الكامل بالبرنامج', 'Full Name')}</span>
                  <p className="font-extrabold text-brand-dark">{user.firstName} {user.lastName}</p>
                </div>

                {/* Email (view-only) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-gray-400 block font-bold mb-1 uppercase tracking-wider">{tField('البريد الإلكتروني للجامعة', 'Email Address')}</span>
                  <p className="font-extrabold text-brand-dark text-ltr">{user.email}</p>
                </div>

                {/* Phone Number (editable) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-gray-400 block font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{tField('رقم الهاتف والتواصل', 'Active phone / WhatsApp')}</span>
                  </span>
                  <p className="font-extrabold text-brand-dark text-ltr font-mono">{user.phone || '---'}</p>
                </div>



                {/* College */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-gray-400 block font-bold mb-1 uppercase tracking-wider">{tField('الكلية الجامعية بالبرنامج', 'SQU College')}</span>
                  <p className="font-extrabold text-brand-dark">{user.college || '---'}</p>
                </div>

                {/* Level */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-gray-400 block font-bold mb-1 uppercase tracking-wider">{tField('مستوى التلاوة المنسق', 'Coordination Level')}</span>
                  <p className="font-extrabold text-brand-primary">
                    {getLevelLabel(user.level || defaultLevel)}
                  </p>
                </div>

                {/* Cohort (only if student) */}
                {!isTeacherOrAdmin && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-gray-400 block font-bold mb-1 uppercase tracking-wider">{tField('الدفعة الأكاديمية (Cohort)', 'Academic Cohort')}</span>
                    <p className="font-extrabold text-brand-dark font-mono">{user.cohort || '---'}</p>
                  </div>
                )}

              </div>
            </div>
          ) : (
            /* ================= EDIT MODE ================= */
            <form onSubmit={handleSaveProfile} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-400 block mb-1">{tField('الاسم الأول', 'First Name')}</label>
                  <input 
                    type="text" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold"
                    required 
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-400 block mb-1">{tField('اسم العائلة', 'Last Name')}</label>
                  <input 
                    type="text" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold"
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone Change */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-black text-gray-400 block mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-brand-primary" />
                    <span>{tField('رقم التواصل والهاتف', 'Phone Number')}</span>
                  </label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold text-ltr font-mono"
                    required 
                  />
                </div>
              </div>

              {/* Toggle option to change password */}
              <div className="p-4 bg-brand-neutral/30 rounded-2xl border border-brand-primary/10 space-y-4">
                <div className="flex items-center gap-2.5">
                  <input 
                    type="checkbox" 
                    id="changePasswordCheckbox"
                    checked={changePassword}
                    onChange={(e) => {
                      setChangePassword(e.target.checked);
                      if (!e.target.checked) {
                        setNewPassword('');
                        setConfirmPassword('');
                      }
                    }}
                    className="w-5 h-5 text-brand-primary border-gray-200 rounded cursor-pointer" 
                  />
                  <label htmlFor="changePasswordCheckbox" className="text-xs sm:text-sm font-black text-brand-dark cursor-pointer select-none">
                    {tField('تغيير كلمة المرور الشخصية', 'Change my personal account password')}
                  </label>
                </div>

                {changePassword && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-brand-primary/10 animate-fade-in text-start">
                    <div>
                      <label className="text-xs font-black text-gray-400 block mb-1 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-brand-primary" />
                        <span>{tField('كلمة المرور الجديدة', 'New Password')}</span>
                      </label>
                      <MaskedPasswordInput 
                        value={newPassword}
                        onChange={setNewPassword}
                        className="w-full bg-white border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold text-ltr"
                        placeholder="••••••••"
                        required={changePassword}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-black text-gray-400 block mb-1 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-brand-primary" />
                        <span>{tField('تأكيد كلمة المرور الجديدة', 'Verify New Password')}</span>
                      </label>
                      <MaskedPasswordInput 
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        className="w-full bg-white border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold text-ltr"
                        placeholder="••••••••"
                        required={changePassword}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-400 block mb-1">{tField('الكلية / مكان العمل', 'College / Inst.')}</label>
                  <input 
                    type="text" 
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold"
                    required 
                  />
                </div>

                {/* Level Selection matching specific roles (Locked for users) */}
                <div>
                  <label className="text-xs font-black text-gray-400 block mb-1">{tField('المستوى الدراسي المقيد', 'Placement Level')}</label>
                  <div className="w-full bg-slate-100 border border-gray-150 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-500 flex items-center justify-between cursor-not-allowed select-none">
                    <span>{getLevelLabel(level)}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md border border-slate-300 font-extrabold flex items-center gap-1">
                      🔒 {tField('لا يمكن تعديله', 'Read-Only')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cohort edit (only for students) */}
              {!isTeacherOrAdmin && (
                <div>
                  <label className="text-xs font-black text-gray-400 block mb-1">{tField('الدفعة الأكاديمية (Cohort Year)', 'Academic Cohort Year')}</label>
                  <input 
                    type="number" 
                    value={cohort}
                    onChange={(e) => setCohort(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold font-mono text-ltr"
                    placeholder="e.g. 2023"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="submit" 
                  className="flex-1 bg-brand-primary text-white py-3 rounded-xl text-sm font-black hover:bg-brand-accent transition-colors cursor-pointer"
                >
                  {tField('حفظ التعديلات', 'Save Changes')}
                </button>
                <button 
                  type="button" 
                  className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-xl text-sm font-black transition-colors"
                  onClick={() => {
                    // Restore standard values and end editing mode
                    setFirstName(user.firstName);
                    setLastName(user.lastName);
                    setPhone(user.phone || '');
                    setPassword(user.password || '123456');
                    setCollege(user.college || '');
                    setCohort(user.cohort || '');
                    setLevel(user.level || defaultLevel);
                    setEditing(false);
                  }}
                >
                  {tField('إلغاء', 'Cancel')}
                </button>
              </div>

            </form>
          )}

          {/* SQU Quote at bottom */}
          <div className="mt-8 p-4 rounded-2xl bg-brand-primary/[0.03] border border-brand-primary/10 text-center select-none">
            <p className="text-xs font-serif text-brand-primary italic mb-0 leading-relaxed font-bold">
              {tField('“خيركم من تعلّم القرآن وعلمه”', '“The best among you are those who learn the Quran and teach it.”')}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
