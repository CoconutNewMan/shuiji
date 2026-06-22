import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Commission {
  id: string;
  amount: number;
  level: number;
  month: string;
  status: string;
  created_at: string;
  agent: { name: string } | null;
  source_agent: { name: string } | null;
}

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => { loadCommissions(); }, [filterMonth]);

  async function loadCommissions() {
    setLoading(true);
    const { data } = await supabase
      .from('commissions')
      .select('*, agent:agent_id(name), source_agent:source_agent_id(name)')
      .eq('month', filterMonth)
      .order('created_at', { ascending: false });
    setCommissions((data as Commission[]) ?? []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('commissions').update({ status }).eq('id', id);
    setCommissions(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  }

  const total = commissions.reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">佣金记录</h2>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm">本月合计: <strong className="text-gray-900">RM {total.toFixed(2)}</strong></span>
          <input
            type="month"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500">加载中...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">收款人</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">来源</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">层级</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">金额</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">月份</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {commissions.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{c.agent?.name ?? '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{c.source_agent?.name ?? '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      c.level === 1 ? 'bg-sky-100 text-sky-700' :
                      c.level === 2 ? 'bg-emerald-100 text-emerald-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>第{c.level}代</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">RM {Number(c.amount).toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-600">{c.month}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      c.status === 'paid' ? 'bg-green-100 text-green-700' :
                      c.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {c.status === 'paid' ? '已发放' : c.status === 'approved' ? '已批准' : '待审核'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {c.status !== 'paid' && (
                      <button
                        onClick={() => updateStatus(c.id, c.status === 'pending' ? 'approved' : 'paid')}
                        className="text-sm px-3 py-1 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-lg font-medium transition-all"
                      >
                        {c.status === 'pending' ? '批准' : '标记发放'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {commissions.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">本月暂无佣金记录</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
