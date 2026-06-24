import { useState } from 'react';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setEmailLoading(true);
    setEmailSuccess('');
    setEmailError('');
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setEmailLoading(false);
    if (error) {
      setEmailError(error.message);
    } else {
      setEmailSuccess(t('settings_email_sent'));
      setNewEmail('');
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setPasswordLoading(true);
    setPasswordSuccess('');
    setPasswordError('');
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    setPasswordLoading(false);
    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess(t('settings_password_sent'));
    }
  };

  return (
    <section className="py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-black mb-8">{t('settings_title')}</h1>

        {/* Change Email */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{t('settings_change_email')}</h2>
          <p className="text-sm text-gray-500 mb-4">
            {t('email_label')}: <span className="font-semibold text-gray-700">{user?.email}</span>
          </p>
          <form onSubmit={handleChangeEmail} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('settings_new_email')}
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@example.com"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
            {emailError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                {emailError}
              </p>
            )}
            {emailSuccess && (
              <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
                {emailSuccess}
              </p>
            )}
            <div>
              <button
                type="submit"
                disabled={emailLoading}
                className="btn-primary disabled:opacity-60"
              >
                {emailLoading ? t('loading') : t('settings_send_confirm')}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4">{t('settings_change_password')}</h2>
          <p className="text-sm text-gray-500 mb-4">
            {t('forgot_password')} — {t('settings_send_reset').toLowerCase()}
          </p>
          {passwordError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4">
              {passwordError}
            </p>
          )}
          {passwordSuccess && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 mb-4">
              {passwordSuccess}
            </p>
          )}
          <button
            onClick={handleResetPassword}
            disabled={passwordLoading}
            className="btn-primary disabled:opacity-60"
          >
            {passwordLoading ? t('loading') : t('settings_send_reset')}
          </button>
        </div>
      </div>
    </section>
  );
}
