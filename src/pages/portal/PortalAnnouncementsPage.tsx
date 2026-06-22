import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Announcement } from '../../types/tenant';

export default function PortalAnnouncementsPage() {
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('announcements').select('*').order('published_at', { ascending: false })
      .then(({ data }) => { setItems(data ?? []); setLoading(false); });
  }, [id]);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">公告中心</h2>
      {loading ? <div className="text-gray-500">加载中...</div> : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                {!item.tenant_id && (
                  <span className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded-full">全员</span>
                )}
              </div>
              <p className="text-gray-600 text-sm mt-2 whitespace-pre-wrap">{item.content}</p>
              <p className="text-gray-400 text-xs mt-3">{new Date(item.published_at).toLocaleString('zh-CN')}</p>
            </div>
          ))}
          {items.length === 0 && <div className="text-center text-gray-400 py-12">暂无公告</div>}
        </div>
      )}
    </div>
  );
}
