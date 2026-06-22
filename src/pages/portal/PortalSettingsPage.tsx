import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function PortalSettingsPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    setMessage(''); setError('');
    if (newPassword !== confirm) { setError('两次输入的新密码不一致'); return; }
    if (newPassword.length < 8) { setError('新密码至少需要8位'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    if (err) { setError(err.message); } else { setMessage('密码修改成功'); setNewPassword(''); setConfirm(''); }
    setLoading(false);
  }

  return (
    <div className="p-8 max-w-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">账号设置</h2>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">修改密码</h3>
        <form onSubmit={handleChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {message && <p className="text-green-600 text-sm">{message}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-sky-600 text-white py-2 rounded-lg font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors">
            {loading ? '保存中...' : '保存修改'}
          </button>
        </form>
      </div>
    </div>
  );
}
