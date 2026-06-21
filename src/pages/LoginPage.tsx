import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(t('error_login'));
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-md mx-auto px-4">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
              💧
            </div>
            <h1 className="text-3xl font-bold mb-2">{t('login_title')}</h1>
            <p className="text-gray-500">{t('login_subtitle')}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">{t('email_label')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-sky-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">{t('password_label')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-sky-600"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-60"
            >
              {loading ? t('loading') : t('btn_login')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              {t('no_account')}{' '}
              <Link to="/register" className="text-sky-600 font-semibold hover:text-sky-700">
                {t('become_agent')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
