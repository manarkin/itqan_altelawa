import React, { useState } from 'react';
import { User } from '../types';
import { Camera, GraduationCap, X, CheckCircle } from 'lucide-react';

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
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phone, setPhone] = useState(user.phone || '');
  const [college, setCollege] = useState(user.college || '');
  const [degree, setDegree] = useState(user.degree || 'Bachelor');
  const [cohort, setCohort] = useState(user.cohort || '');
  const [isSenior, setIsSenior] = useState(user.isSenior || false);

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
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        firstName,
        lastName,
        phone,
        college,
        degree,
        cohort,
        isSenior
      };
    });

    setEditing(false);
    alert(lang === 'ar' ? 'تم تحديث البيانات بنجاح!' : 'Profile updated successfully!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-start select-none">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Avatar & core stats (5 columns) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-brand-primary/10 shadow-lg p-8 relative overflow-hidden h-full flex flex-col justify-between">
            <div className="bg-brand-primary absolute top-0 left-0 right-0 h-28 pointer-events-none"></div>

            <div className="text-center relative z-10 pt-8">
              <div className="mb-4 inline-block relative group select-none">
                <img 
                  src={user.avatar || 'https://picsum.photos/seed/student/200/200'} 
                  alt="" 
                  className="w-40 h-40 rounded-full border-4 border-white shadow-xl object-cover hover:shadow-2xl transition-shadow"
                  referrerPolicy="no-referrer"
                />
                
                <label 
                  htmlFor="pfp-upload" 
                  className="absolute bottom-1 right-1 bg-brand-warm text-brand-dark p-2.5 rounded-full shadow-lg cursor-pointer hover:scale-110 active:scale-90 transition-transform flex items-center justify-center border-2 border-white select-none"
                  title={lang === 'ar' ? 'تحديث الصورة الشخصية' : 'Change Face Avatar'}
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

              <h2 className="text-2xl font-black text-brand-dark mb-1">
                {user.firstName} {user.lastName}
              </h2>
              <span className="bg-brand-neutral text-brand-primary text-xs font-black px-4 py-1.5 rounded-full border border-brand-primary/10 tracking-wider">
                {lang === 'ar' ? t()[user.role.toLowerCase()] || user.role : user.role}
              </span>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex flex-col gap-5">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">
                    {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <div className="font-extrabold text-sm text-brand-dark tracking-tight leading-none">
                    {user.email}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">
                    {lang === 'ar' ? 'رقم الهاتف والتواصل' : 'Mobile Number'}
                  </label>
                  <div className="font-extrabold text-sm text-brand-dark font-mono tracking-tight leading-none text-ltr">
                    {user.phone || '---'}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: details & settings forms (7 columns) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl border border-brand-primary/10 shadow-lg p-6 sm:p-8 h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <h4 className="text-lg sm:text-xl font-black text-brand-dark flex items-center gap-2">
                  <GraduationCap className="text-brand-primary w-6 h-6" />
                  {t().academicDegree}
                </h4>
                <button 
                  className="px-4 py-2 text-xs border border-brand-primary/30 text-brand-primary font-black rounded-lg hover:bg-brand-primary/5 transition-all cursor-pointer"
                  onClick={() => setEditing(!editing)}
                >
                  {editing ? (lang === 'ar' ? 'إلغاء' : 'Cancel') : t().editProfile}
                </button>
              </div>

              {!editing ? (
                /* Details view */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-black text-gray-400 block mb-1 uppercase tracking-wider">{t().college}</label>
                    <p className="font-extrabold text-brand-dark text-base">{user.college || '---'}</p>
                  </div>

                  <div>
                    <label className="text-xs font-black text-gray-400 block mb-1 uppercase tracking-wider">{t().academicDegree}</label>
                    <p className="font-extrabold text-brand-dark text-base">
                      {lang === 'ar' && user.degree ? t()[`degree${user.degree}`] || user.degree : user.degree || '---'}
                    </p>
                  </div>

                  {user.degree === 'Bachelor' && (
                    <div>
                      <label className="text-xs font-black text-gray-400 block mb-1 uppercase tracking-wider font-mono">{t().cohort}</label>
                      <p className="font-extrabold text-brand-dark font-mono text-base">{user.cohort || '---'}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-black text-gray-400 block mb-1 uppercase tracking-wider">{t().senior}</label>
                    <div>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
                        user.isSenior 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-gray-100 text-gray-400 border border-gray-200'
                      }`}>
                        {user.isSenior ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{t().yes}</span>
                          </>
                        ) : (
                          <span>{t().no}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black text-gray-400 block mb-1 uppercase tracking-wider">{t().level}</label>
                    <p className="font-extrabold text-brand-primary text-base">
                      {lang === 'ar' ? t()[user.level?.toLowerCase() || 'beginner'] || user.level : user.level}
                    </p>
                  </div>
                </div>
              ) : (
                /* Edit Form view */
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-black text-gray-400 block mb-1">{t().firstName}</label>
                      <input 
                        type="text" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold"
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-gray-400 block mb-1">{t().lastName}</label>
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
                    <div>
                      <label className="text-xs font-black text-gray-400 block mb-1">{t().phoneNumber}</label>
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold"
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-gray-400 block mb-1">{t().college}</label>
                      <input 
                        type="text" 
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold"
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-black text-gray-400 block mb-1">{t().academicDegree}</label>
                      <select 
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold"
                      >
                        <option value="Bachelor">{t().degreeBachelor}</option>
                        <option value="Master">{t().degreeMaster}</option>
                        <option value="PhD">{t().degreePhD}</option>
                        <option value="Employee">{t().degreeEmployee}</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-xs font-black text-gray-400 block mb-1 font-mono">{t().cohort}</label>
                      <input 
                        type="number" 
                        value={cohort}
                        placeholder="e.g. 2023"
                        onChange={(e) => setCohort(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="editSenior" 
                      checked={isSenior}
                      onChange={(e) => setIsSenior(e.target.checked)}
                      className="w-4.5 h-4.5 border-gray-200 text-brand-primary rounded" 
                    />
                    <label htmlFor="editSenior" className="text-sm font-black text-brand-dark cursor-pointer select-none">
                      {t().senior}
                    </label>
                  </div>

                  <div className="flex gap-3 pt-5 border-t border-gray-50">
                    <button 
                      type="submit" 
                      className="flex-1 bg-brand-primary text-white py-3 rounded-xl text-sm font-black hover:bg-brand-accent transition-colors cursor-pointer"
                    >
                      {t().save}
                    </button>
                    <button 
                      type="button" 
                      className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-xl text-sm font-black transition-colors"
                      onClick={() => setEditing(false)}
                    >
                      {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Extra decorative quote */}
            <div className="mt-8 p-4 rounded-2xl bg-brand-primary/[0.03] border border-brand-primary/10 text-center select-none">
              <p className="text-xs font-serif text-brand-accent italic mb-0 leading-relaxed font-bold">
                {lang === 'ar' 
                  ? '“خيركم من تعلّم القرآن وعلمه”' 
                  : '“The best among you are those who learn the Quran and teach it.”'}
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
