import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Tenant } from '../../types/tenant';

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [themeColor, setThemeColor] = useState('#0ea5e9');
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
    setTenants(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addTenant(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from('tenants').insert({ name, theme_color: themeColor });
    setName(''); setThemeColor('#0ea5e9'); setShowForm(false);
    load();
  }

  async function toggleStatus(tenant: Tenant) {
    await supabase.from('tenants').update({ status: tenant.status === 'active' ? 'suspended' : 'active' }).eq('id', tenant.id);
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">项目方管理</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors">
          + 新增项目方
        </button>
      </div>

      {showForm && (
        <form onSubmit={addTenant} className="bg-white rounded-2xl shadow-sm p-6 mb-6 space-y-3">
          <input placeholder="项目方名称 *" value={name} onChange={e => setName(e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">主题色</label>
            <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="h-8 w-16 rounded cursor-pointer" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">创建</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">取消</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-gray-500">加载中...</div> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">项目方</th>
                <th className="px-6 py-3 text-left">ID</th>
                <th className="px-6 py-3 text-left">状态</th>
                <th className="px-6 py-3 text-left">创建时间</th>
                <th className="px-6 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenants.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.theme_color }} />
                      <span className="font-medium text-gray-900">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 font-mono text-xs">{t.id}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.status === 'active' ? '运营中' : '已停用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{new Date(t.created_at).toLocaleDateString('zh-CN')}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleStatus(t)}
                      className={`text-xs px-3 py-1 rounded-lg transition-colors ${t.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {t.status === 'active' ? '停用' : '启用'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tenants.length === 0 && <div className="p-8 text-center text-gray-400">暂无项目方</div>}
        </div>
      )}
    </div>
  );
}
