import { Role, User } from '../types';
import { BookOpen, Globe, LogOut, Menu, X } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  currentView: string;
  navigate: (view: string) => void;
  lang: 'ar' | 'en';
  toggleLanguage: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  handleLogout: () => void;
  t: () => any;
}

export default function Navbar({
  user,
  currentView,
  navigate,
  lang,
  toggleLanguage,
  mobileMenuOpen,
  setMobileMenuOpen,
  handleLogout,
  t
}: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 h-20 bg-white/95 backdrop-blur-md border-b-2 border-brand-warm z-50 transition-all duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo Section */}
        <div 
          className="flex items-center gap-3 cursor-pointer select-none" 
          onClick={() => navigate('home')}
        >
          <div className="w-11 h-11 bg-brand-primary rounded-2xl flex items-center justify-center shadow-md shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all duration-200">
            <BookOpen className="text-white w-6 h-6" />
          </div>
          <span className="hidden md:block text-2xl font-black text-brand-dark tracking-tight">
            {t().title}
          </span>
        </div>

        {/* Game HUD for Student in Header */}
        {user && user.role === 'STUDENT' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/5 border border-brand-primary/15 shadow-xs select-none">
            {/* Coins */}
            <div 
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-100 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200" 
              title={lang === 'ar' ? 'الرصيد المالي الذهبي' : 'Gold Coins Balance'}
            >
              <span className="text-lg">🪙</span>
              <span className="font-bold text-gray-800 text-sm font-mono">{user.money}</span>
            </div>

            {/* Excused Absences */}
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-gray-100 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200"
              title={lang === 'ar' ? 'غياب بعذر' : 'Excused Absences'}
            >
              <span className="w-5.5 h-5.5 rounded-full flex items-center justify-center bg-amber-500 text-white font-black text-xs font-mono shadow-sm">
                {user.absencesExcused}
              </span>
              <span className="text-xs font-bold text-gray-500 hidden sm:inline">
                {lang === 'ar' ? 'بعذر' : 'Exc.'}
              </span>
            </div>

            {/* Unexcused Absences */}
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-gray-100 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200"
              title={lang === 'ar' ? 'غياب بدون عذر' : 'Unexcused Absences'}
            >
              <span className="w-5.5 h-5.5 rounded-full flex items-center justify-center bg-red-600 text-white font-black text-xs font-mono shadow-sm">
                {user.absencesUnexcused}
              </span>
              <span className="text-xs font-bold text-gray-500 hidden sm:inline">
                {lang === 'ar' ? 'غياب' : 'Abs.'}
              </span>
            </div>
          </div>
        )}

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-6">
          <button 
            className={`text-base font-bold transition-colors duration-200 ${currentView === 'home' ? 'text-brand-primary' : 'text-gray-500 hover:text-brand-dark'}`} 
            onClick={() => navigate('home')}
          >
            {t().heroTitle}
          </button>
          
          {user ? (
            <>
              <button 
                className={`text-base font-bold transition-colors duration-200 ${currentView === 'mysession' ? 'text-brand-primary' : 'text-gray-500 hover:text-brand-dark'}`} 
                onClick={() => navigate('mysession')}
              >
                {t().mySession}
              </button>
              <button 
                className={`text-base font-bold transition-colors duration-200 ${currentView === 'profile' ? 'text-brand-primary' : 'text-gray-500 hover:text-brand-dark'}`} 
                onClick={() => navigate('profile')}
              >
                {t().profile}
              </button>
              {user.role === 'ADMIN' && (
                <button 
                  className={`text-base font-bold transition-colors duration-200 ${currentView === 'controlpanel' ? 'text-brand-primary' : 'text-gray-500 hover:text-brand-dark'}`} 
                  onClick={() => navigate('controlpanel')}
                >
                  {t().controlPanel}
                </button>
              )}
            </>
          ) : (
            <button 
              className="text-base font-bold text-gray-500 hover:text-brand-dark transition-colors duration-200" 
              onClick={() => navigate('about')}
            >
              {t().about}
            </button>
          )}

          <div className="flex items-center gap-3 border-l pl-4 border-gray-100">
            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-primary/30 hover:bg-brand-primary/5 text-xs font-bold text-brand-primary transition-all duration-200"
              onClick={toggleLanguage}
            >
              <Globe className="w-4.5 h-4.5" />
              <span>{lang === 'en' ? 'AR' : 'EN'}</span>
            </button>

            {user && (
              <button 
                className="text-red-500 hover:text-red-700 p-1 rounded-xl hover:bg-red-50 transition-colors duration-200" 
                onClick={handleLogout}
                title={lang === 'ar' ? 'تسجيل الخروج' : 'Log out'}
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu toggle */}
        <div className="lg:hidden flex items-center gap-3">
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-primary/30 text-xs font-bold text-brand-primary"
            onClick={toggleLanguage}
          >
            <span>{lang === 'en' ? 'AR' : 'EN'}</span>
          </button>
          <button 
            className="p-2 text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all duration-200"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`absolute top-20 left-0 right-0 bg-white border-b-3 border-brand-warm shadow-xl transition-all duration-300 overflow-hidden ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <div className="px-4 py-6 flex flex-col gap-4 text-center bg-brand-neutral/30">
          <button 
            className={`text-lg font-black ${currentView === 'home' ? 'text-brand-primary' : 'text-gray-500'}`} 
            onClick={() => { navigate('home'); setMobileMenuOpen(false); }}
          >
            {t().heroTitle}
          </button>
          
          {user ? (
            <>
              <button 
                className={`text-lg font-black ${currentView === 'mysession' ? 'text-brand-primary' : 'text-gray-500'}`} 
                onClick={() => { navigate('mysession'); setMobileMenuOpen(false); }}
              >
                {t().mySession}
              </button>
              <button 
                className={`text-lg font-black ${currentView === 'profile' ? 'text-brand-primary' : 'text-gray-500'}`} 
                onClick={() => { navigate('profile'); setMobileMenuOpen(false); }}
              >
                {t().profile}
              </button>
              {user.role === 'ADMIN' && (
                <button 
                  className={`text-lg font-black ${currentView === 'controlpanel' ? 'text-brand-primary' : 'text-gray-500'}`} 
                  onClick={() => { navigate('controlpanel'); setMobileMenuOpen(false); }}
                >
                  {t().controlPanel}
                </button>
              )}
              <button 
                className="text-lg font-black text-red-500 hover:text-red-700 mt-2"
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
              >
                {t().logout}
              </button>
            </>
          ) : (
            <>
              <button 
                className="text-lg font-black text-gray-500"
                onClick={() => { navigate('about'); setMobileMenuOpen(false); }}
              >
                {t().about}
              </button>
              <button 
                className="text-lg font-black text-brand-primary hover:text-brand-accent mt-2"
                onClick={() => { navigate('login'); setMobileMenuOpen(false); }}
              >
                {t().login}
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
