import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', ic_number: '', referral_code: '', password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1. Create Supabase auth user
    const { data, error: signUpError } = await signUp(form.email, form.password);
    if (signUpError || !data.user) {
      setError(`注册失败: ${signUpError?.message ?? '未知错误'}`);
      setLoading(false);
      return;
    }

    // 2. Look up referrer agent by referral_code if provided
    let referrerId: string | null = null;
    if (form.referral_code.trim()) {
      const { data: referrer } = await supabase
        .from('agents')
        .select('id')
        .eq('referral_code', form.referral_code.trim().toUpperCase())
        .single();
      referrerId = referrer?.id ?? null;
    }

    // 3. Create agent profile
    const { error: agentError } = await supabase.from('agents').insert({
      user_id: data.user.id,
      referrer_id: referrerId,
      name: form.name,
      phone: form.phone,
      ic_number: form.ic_number,
    });

    setLoading(false);
    if (agentError) {
      setError(`创建档案失败: ${agentError.message}`);
      return;
    }

    // 4. Show success then redirect after 2 seconds
    setSuccess(true);
    setTimeout(() => navigate('/login'), 2000);
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-lg mx-auto px-4">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 gradient-text">{t('register_title')}</h1>
            <p className="text-gray-500">{t('register_subtitle')}</p>
          </div>

          {success && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm text-center font-semibold">
              {t('success_register')}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">{t('name_label')}</label>
                <input type="text" onChange={set('name')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-sky-600" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{t('email_label')}</label>
                <input type="email" onChange={set('email')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-sky-600" required />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">{t('phone_label')}</label>
                <input type="tel" onChange={set('phone')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-sky-600" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{t('ic_label')}</label>
                <input type="text" onChange={set('ic_number')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-sky-600" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">{t('referrer_code_label')}</label>
              <input
                type="text"
                placeholder={t('referrer_code_placeholder')}
                onChange={set('referral_code')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-sky-600 uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">{t('password_label')}</label>
              <input type="password" onChange={set('password')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-sky-600" required minLength={8} />
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" required className="mt-1" />
              <span className="text-sm text-gray-700">{t('terms_text')}</span>
            </label>
            <button type="submit" disabled={loading || success} className="btn-primary w-full disabled:opacity-60">
              {loading ? t('loading') : t('btn_register')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {t('already_account')}{' '}
            <Link to="/login" className="text-sky-600 font-semibold">{t('login_now')}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
