import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function PortalLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isLocked = params.get('locked') === '1';

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: adminRow } = await supabase
      .from('tenant_admins')
      .select('locked, failed_attempts, tenant_id, user_id')
      .eq('email', email.toLowerCase())
      .single();

    if (adminRow?.locked) {
      setError('账号已锁定，请联系管理员解锁。');
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      const newAttempts = (adminRow?.failed_attempts ?? 0) + 1;
      const shouldLock = newAttempts >= 5;

      await supabase
        .from('tenant_admins')
        .update({
          failed_attempts: newAttempts,
          locked: shouldLock,
          locked_at: shouldLock ? new Date().toISOString() : null,
        })
        .eq('email', email.toLowerCase());

      await supabase.from('login_attempts').insert({ email, success: false });

      if (shouldLock) {
        setError('登录失败次数过多，账号已锁定。请联系管理员解锁。');
      } else {
        setError(`密码错误。已失败 ${newAttempts}/5 次。`);
      }
      setLoading(false);
      return;
    }

    await supabase
      .from('tenant_admins')
      .update({ failed_attempts: 0 })
      .eq('email', email.toLowerCase());

    await supabase.from('login_attempts').insert({ email, success: true });

    // Link user_id if not yet linked
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser && !adminRow?.user_id) {
      await supabase
        .from('tenant_admins')
        .update({ user_id: currentUser.id })
        .eq('email', email.toLowerCase());
    }

    const tenantId = adminRow?.tenant_id;
    if (tenantId) {
      navigate(`/portal/${tenantId}/dashboard`);
    } else {
      setError('找不到关联项目，请联系管理员。');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">项目后台登录</h1>
        <p className="text-gray-500 text-sm mb-6">请使用管理员提供的账号登录</p>

        {isLocked && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            账号已锁定，请联系管理员解锁。
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 text-white py-2 rounded-lg font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}
