import { Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-4 py-2 bg-sky-400/20 rounded-full text-sky-200 text-sm font-semibold mb-6 border border-sky-400/30">
              Pure Water, Healthy Life
            </div>
            <h1 className="text-5xl font-black leading-tight mb-6">{t('hero_title')}</h1>
            <p className="text-lg text-gray-200 mb-8 leading-relaxed">{t('hero_subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/products" className="btn-primary bg-white text-sky-700 hover:bg-gray-100 inline-flex items-center gap-2">
                {t('hero_browse')}
              </Link>
              {!user && (
                <Link to="/register" className="btn-primary inline-flex items-center gap-2">
                  {t('hero_join')}
                </Link>
              )}
              {user && (
                <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">
                  {t('nav_dashboard')}
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="bg-gradient-to-br from-sky-300 to-blue-600 rounded-3xl p-12 text-center">
              <div className="text-8xl mb-4">💧</div>
              <p className="text-white font-bold text-xl">[BRAND]</p>
            </div>
          </div>
        </div>
      </section>

      {/* Commission Plan */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 gradient-text">{t('commission_title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('commission_desc')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card p-8 text-center">
              <div className="text-6xl font-black gradient-text mb-3">40%</div>
              <h3 className="text-xl font-bold mb-2">{t('level1_label')}</h3>
              <p className="text-gray-500 text-sm">你直接推荐的会员每月付租，你得 40%</p>
            </div>
            <div className="card p-8 text-center border-sky-200">
              <div className="text-6xl font-black gradient-text mb-3">3%</div>
              <h3 className="text-xl font-bold mb-2">{t('level2_label')}</h3>
              <p className="text-gray-500 text-sm">下线推荐的会员付租，你得 3%</p>
            </div>
            <div className="card p-8 text-center">
              <div className="text-6xl font-black gradient-text mb-3">2%</div>
              <h3 className="text-xl font-bold mb-2">{t('level3_label')}</h3>
              <p className="text-gray-500 text-sm">三层推荐的会员付租，你得 2%</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-4xl font-black mb-6 gradient-text">准备好开始了吗？</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user && (
              <Link to="/register" className="btn-primary">{t('hero_join')}</Link>
            )}
            {user && (
              <Link to="/dashboard" className="btn-primary">{t('nav_dashboard')}</Link>
            )}
            <Link to="/products" className="btn-secondary">{t('hero_browse')}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
