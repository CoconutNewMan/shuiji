import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Agent { id: string; name: string; email: string; status: string; created_at: string; }

export default function PortalMembersPage() {
  const { id } = useParams<{ id: string }>();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from('agents').select('*').eq('tenant_id', id).order('created_at', { ascending: false })
      .then(({ data }) => { setAgents(data ?? []); setLoading(false); });
  }, [id]);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">会员管理</h2>
      {loading ? <div className="text-gray-500">加载中...</div> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">姓名</th>
                <th className="px-6 py-3 text-left">邮箱</th>
                <th className="px-6 py-3 text-left">状态</th>
                <th className="px-6 py-3 text-left">加入时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {agents.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{a.name}</td>
                  <td className="px-6 py-4 text-gray-500">{a.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {a.status === 'active' ? '活跃' : '停用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{new Date(a.created_at).toLocaleDateString('zh-CN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {agents.length === 0 && <div className="p-8 text-center text-gray-400">暂无会员</div>}
        </div>
      )}
    </div>
  );
}
