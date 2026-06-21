import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../hooks/useAuth';
import type { Lang } from '../types';

export default function Navbar() {
  const { t, lang, setLang } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const langs: { code: Lang; label: string }[] = [
    { code: 'zh', label: '中文' },
    { code: 'en', label: 'EN' },
    { code: 'ms', label: 'BM' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center text-white text-xl">
            💧
          </div>
          <span className="font-bold text-lg text-gray-900">[BRAND]</span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-gray-700 hover:text-sky-600 font-medium transition-colors">
            {t('nav_home')}
          </Link>
          <Link to="/products" className="text-gray-700 hover:text-sky-600 font-medium transition-colors">
            {t('nav_products')}
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="text-gray-700 hover:text-sky-600 font-medium transition-colors">
                {t('nav_dashboard')}
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-700 hover:text-sky-600 font-medium transition-colors"
              >
                {t('nav_logout')}
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary text-sm">
              {t('nav_login')}
            </Link>
          )}
        </nav>

        {/* Language Switcher */}
        <div className="flex items-center gap-1 text-sm">
          {langs.map((l, i) => (
            <span key={l.code} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-300">|</span>}
              <button
                onClick={() => setLang(l.code)}
                className={`px-1 transition-colors ${
                  lang === l.code ? 'text-sky-600 font-bold' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {l.label}
              </button>
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
