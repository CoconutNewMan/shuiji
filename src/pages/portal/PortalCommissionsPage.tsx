import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Commission { id: string; agent_id: string; amount: number; month: string; }

export default function PortalCommissionsPage() {
  const { id } = useParams<{ id: string }>();
  const [records, setRecords] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from('commissions').select('*').eq('tenant_id', id).order('month', { ascending: false })
      .then(({ data }) => { setRecords(data ?? []); setLoading(false); });
  }, [id]);

  const total = records.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">佣金记录</h2>
      <p className="text-gray-500 text-sm mb-6">累计佣金：<span className="font-semibold text-gray-900">RM {total.toFixed(2)}</span></p>
      {loading ? <div className="text-gray-500">加载中...</div> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">月份</th>
                <th className="px-6 py-3 text-left">会员ID</th>
                <th className="px-6 py-3 text-right">金额 (RM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">{r.month}</td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">{r.agent_id}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">{Number(r.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {records.length === 0 && <div className="p-8 text-center text-gray-400">暂无记录</div>}
        </div>
      )}
    </div>
  );
}
