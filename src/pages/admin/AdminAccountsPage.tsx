import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { TenantAdmin, Tenant } from '../../types/tenant';

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<(TenantAdmin & { tenant_name: string })[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [unlockReason, setUnlockReason] = useState('');
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState('');

  async function load() {
    const [{ data: admins }, { data: t }] = await Promise.all([
      supabase.from('tenant_admins').select('*').order('created_at', { ascending: false }),
      supabase.from('tenants').select('id, name'),
    ]);
    const tenantMap = Object.fromEntries((t ?? []).map(x => [x.id, x.name]));
    setAccounts((admins ?? []).map(a => ({ ...a, tenant_name: tenantMap[a.tenant_id] ?? '-' })));
    setTenants(t ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    const { error } = await supabase.from('tenant_admins').insert({
      tenant_id: tenantId,
      email: email.toLowerCase(),
      user_id: null,
    });
    if (error) { setFormError(error.message); return; }
    setEmail(''); setTenantId(''); setShowForm(false);
    load();
  }

  async function unlock(account: TenantAdmin) {
    if (!unlockReason.trim()) { alert('请填写解锁原因'); return; }
    await supabase.from('tenant_admins').update({
      locked: false,
      failed_attempts: 0,
      locked_at: null,
    }).eq('id', account.id);
    await supabase.from('login_attempts').insert({ email: account.email, success: true });
    setUnlockingId(null);
    setUnlockReason('');
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">子账号管理</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors">
          + 新增账号
        </button>
      </div>

      {showForm && (
        <form onSubmit={createAccount} className="bg-white rounded-2xl shadow-sm p-6 mb-6 space-y-3">
          <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">请先在 Supabase Dashboard → Authentication → Users 创建用户，再在此处登记账号信息。</p>
          <select value={tenantId} onChange={e => setTenantId(e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="">选择项目方 *</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input type="email" placeholder="邮箱 *" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          {formError && <p className="text-red-600 text-sm">{formError}</p>}
          <div className="flex gap-2">
            <button type="submit" className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">登记</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">取消</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-gray-500">加载中...</div> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">邮箱</th>
                <th className="px-6 py-3 text-left">所属项目</th>
                <th className="px-6 py-3 text-left">状态</th>
                <th className="px-6 py-3 text-left">失败次数</th>
                <th className="px-6 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accounts.map(a => (
                <tr key={a.id} className={`hover:bg-gray-50 ${a.locked ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-4 font-medium text-gray-900">{a.email}</td>
                  <td className="px-6 py-4 text-gray-500">{a.tenant_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.locked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {a.locked ? '🔒 已锁定' : '✅ 正常'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{a.failed_attempts}/5</td>
                  <td className="px-6 py-4">
                    {a.locked && (
                      unlockingId === a.id ? (
                        <div className="flex gap-2 items-center">
                          <input placeholder="解锁原因 *" value={unlockReason} onChange={e => setUnlockReason(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-xs w-32" />
                          <button onClick={() => unlock(a)} className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">确认</button>
                          <button onClick={() => setUnlockingId(null)} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">取消</button>
                        </div>
                      ) : (
                        <button onClick={() => setUnlockingId(a.id)}
                          className="text-xs px-3 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors">
                          解锁
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {accounts.length === 0 && <div className="p-8 text-center text-gray-400">暂无账号</div>}
        </div>
      )}
    </div>
  );
}
