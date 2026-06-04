import React from 'react';
import { MessageCircle, Mail, AlertTriangle } from 'lucide-react';

interface StaticProps {
  lang: 'ar' | 'en';
  t: () => any;
}

export function About({ lang, t }: StaticProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center animate-fade-in select-none">
      <h1 className="text-3xl sm:text-5xl font-black text-brand-dark mb-8">
        {t().about}
      </h1>
      <div className="bg-brand-primary/[0.03] border border-brand-primary/10 rounded-3xl p-6 sm:p-10 shadow-xs max-w-3xl mx-auto">
        <p className="text-lg sm:text-2xl text-brand-dark leading-loose font-serif font-bold text-center">
          {t().aboutContent}
        </p>
      </div>
    </div>
  );
}

export function Contact({ lang, t }: StaticProps) {
  const isAr = lang === 'ar';
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center animate-fade-in select-none">
      <h1 className="text-3xl sm:text-5xl font-black text-brand-dark mb-4">
        {t().contactTitle}
      </h1>
      <p className="text-lg text-brand-accent font-bold mb-10">
        {t().contactSubtitle}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {/* WhatsApp card */}
        <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm flex flex-col items-center">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-brand-dark text-lg mb-2">
            {t().contactWhatsApp}
          </h3>
          <p className="text-xl font-black text-brand-primary font-mono text-ltr">
            +968 9123 4567
          </p>
        </div>

        {/* Email card */}
        <div className="bg-white p-8 rounded-3xl border border-blue-100 shadow-sm flex flex-col items-center">
          <div className="w-14 h-14 bg-blue-50 text-brand-primary rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-brand-dark text-lg mb-2">
            {t().contactEmail}
          </h3>
          <p className="text-lg sm:text-xl font-black text-brand-primary font-mono text-ltr leading-tight">
            itqan@squ.edu.om
          </p>
        </div>
      </div>
    </div>
  );
}

export function Conditions({ lang, t }: StaticProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center animate-fade-in select-none">
      <h1 className="text-3xl sm:text-5xl font-black text-brand-dark mb-10">
        {t().conditionsTitle}
      </h1>

      <div className="flex flex-col gap-4 max-w-2xl mx-auto">
        {(t().conditionsContent as string[]).map((condition, idx) => (
          <div 
            key={idx} 
            className="bg-white p-5 rounded-2xl border border-dashed border-brand-primary/20 flex items-center justify-between gap-4 text-start hover:scale-101 transition-transform"
          >
            <span className="font-bold text-sm sm:text-base text-brand-dark leading-relaxed">
              {condition}
            </span>
            <span className="w-10 h-10 bg-brand-primary text-white font-extrabold rounded-full flex items-center justify-center flex-shrink-0 text-sm">
              {idx + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Success({ navigate, lang, t }: { navigate: (view: string) => void, lang: 'ar' | 'en', t: () => any }) {
  const isAr = lang === 'ar';
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center animate-fade-in select-none">
      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl border border-emerald-100 max-w-xl mx-auto">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h1 className="text-2xl sm:text-4.5xl font-black text-brand-primary mb-4 leading-normal">
          {t().success}
        </h1>
        <p className="text-sm sm:text-base text-gray-500 font-bold mb-8 leading-relaxed max-w-md mx-auto">
          {t().submissionNote}
        </p>
        <button 
          className="px-8 py-3.5 bg-brand-primary hover:bg-brand-accent text-white text-base font-black rounded-xl shadow-md cursor-pointer transition-all duration-200"
          onClick={() => navigate('home')}
        >
          {t().backHome}
        </button>
      </div>
    </div>
  );
}

// Low level check circle SVG helper
function CheckCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
