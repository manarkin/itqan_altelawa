import React, { useState } from 'react';

interface LoginProps {
  handleLogin: (email: string, password?: string) => void;
  navigate: (view: string) => void;
  lang: 'ar' | 'en';
  t: () => any;
}

export default function Login({
  handleLogin,
  navigate,
  lang,
  t
}: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isAr = lang === 'ar';
  const tField = (ar: string, en: string) => isAr ? ar : en;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      handleLogin(email, password);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 select-none">
      <div className="bg-white rounded-3xl border border-brand-primary/15 shadow-xl p-6 sm:p-8">
        
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-brand-dark mb-1">
            {t().welcomeBack}
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm font-bold">
            {t().signInAccount}
          </p>
        </div>

        {/* Shortcuts card listing roles */}
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150 mb-6 text-center">
          <p className="text-[0.65rem] font-black text-brand-accent uppercase tracking-wider mb-2.5">
            {tField('حسابات تجريبية سريعة', 'Demo Shortcuts')}
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <button 
              type="button" 
              className="px-3.5 py-1.5 bg-white border border-gray-200 text-xs font-black text-brand-dark rounded-xl shadow-xs hover:bg-brand-neutral/30 transition-colors cursor-pointer" 
              onClick={() => handleLogin('admin@test.com')}
            >
              {tField('مسؤولة النادي', 'Admin')}
            </button>
            <button 
              type="button" 
              className="px-3.5 py-1.5 bg-white border border-gray-200 text-xs font-black text-brand-dark rounded-xl shadow-xs hover:bg-brand-neutral/30 transition-colors cursor-pointer" 
              onClick={() => handleLogin('teacher@test.com')}
            >
              {tField('المعلمة مريم', 'Teacher')}
            </button>
            <button 
              type="button" 
              className="px-3.5 py-1.5 bg-white border border-gray-200 text-xs font-black text-brand-dark rounded-xl shadow-xs hover:bg-brand-neutral/30 transition-colors cursor-pointer" 
              onClick={() => handleLogin('student@test.com')}
            >
              {tField('الطالبة أمل', 'Student')}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-start">
          <div>
            <label className="text-xs font-black text-gray-400 block mb-1">
              {tField('الرقم الجامعي/الوظيفي أو البريد الإلكتروني', 'ID or Email Address')}
            </label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold text-ltr" 
              required 
              placeholder={tField('مثال: الرقم الجامعي أو البريد الإلكتروني', 'e.g. your ID or registered email')}
            />
          </div>

          <div>
            <label className="text-xs font-black text-gray-400 block mb-1">
              {t().password}
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold text-ltr" 
              required 
              placeholder="••••••••"
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              className="w-full py-3.5 bg-brand-primary text-white text-sm font-black rounded-xl hover:bg-brand-accent shadow-md shadow-brand-primary/15 transition-all cursor-pointer"
            >
              {t().login}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center font-bold">
          <p className="text-gray-400 text-xs sm:text-sm mb-0">
            {tField('ليس لديكِ حساب بالبرنامج؟', 'Don\'t have an account?')} 
            <button 
              className="px-1 text-brand-primary hover:text-brand-accent font-black border-none bg-none outline-none text-decoration-none cursor-pointer" 
              onClick={() => navigate('register')}
            >
              {tField('سجلي الآن!', 'Register Now')}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
