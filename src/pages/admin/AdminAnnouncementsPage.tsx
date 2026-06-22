import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Announcement, Tenant } from '../../types/tenant';

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetTenantId, setTargetTenantId] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    const [{ data: ann }, { data: t }] = await Promise.all([
      supabase.from('announcements').select('*').order('published_at', { ascending: false }),
      supabase.from('tenants').select('id, name').eq('status', 'active'),
    ]);
    setItems(ann ?? []);
    setTenants(t ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from('announcements').insert({
      title,
      content,
      tenant_id: targetTenantId || null,
    });
    setTitle(''); setContent(''); setTargetTenantId(''); setShowForm(false);
    load();
  }

  async function deleteItem(id: string) {
    if (!confirm('确定删除这条公告？')) return;
    await supabase.from('announcements').delete().eq('id', id);
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">公告管理</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors">
          + 发布公告
        </button>
      </div>

      {showForm && (
        <form onSubmit={publish} className="bg-white rounded-2xl shadow-sm p-6 mb-6 space-y-3">
          <input placeholder="公告标题 *" value={title} onChange={e => setTitle(e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          <textarea placeholder="公告内容 *" value={content} onChange={e => setContent(e.target.value)} required rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          <select value={targetTenantId} onChange={e => setTargetTenantId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="">全员广播</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <div className="flex gap-2">
            <button type="submit" className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">发布</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">取消</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-gray-500">加载中...</div> : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    {!item.tenant_id && <span className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded-full">全员</span>}
                  </div>
                  <p className="text-gray-600 text-sm mt-2 whitespace-pre-wrap">{item.content}</p>
                  <p className="text-gray-400 text-xs mt-3">{new Date(item.published_at).toLocaleString('zh-CN')}</p>
                </div>
                <button onClick={() => deleteItem(item.id)} className="text-xs text-red-500 hover:text-red-700 ml-4">删除</button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-center text-gray-400 py-12">暂无公告</div>}
        </div>
      )}
    </div>
  );
}
