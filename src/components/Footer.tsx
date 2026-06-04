interface FooterProps {
  navigate: (view: string) => void;
  lang: 'ar' | 'en';
  t: () => any;
}

export default function Footer({ navigate, lang, t }: FooterProps) {
  return (
    <footer className="py-8 bg-white border-t border-gray-100 select-none mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-gray-400 text-xs sm:text-sm font-bold mb-4">
          &copy; 2026 {t().title}. {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
        </p>
        <div className="flex justify-center gap-6">
          <button 
            className="text-xs sm:text-sm font-black text-brand-primary hover:text-brand-accent hover:underline cursor-pointer" 
            onClick={() => navigate('contact')}
          >
            {t().contact}
          </button>
          <button 
            className="text-xs sm:text-sm font-black text-brand-primary hover:text-brand-accent hover:underline cursor-pointer" 
            onClick={() => navigate('conditions')}
          >
            {t().terms}
          </button>
        </div>
      </div>
    </footer>
  );
}
