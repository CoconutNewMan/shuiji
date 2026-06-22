import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function PortalDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const [stats, setStats] = useState({ members: 0, thisMonthComm: 0, pendingTasks: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const thisMonth = new Date().toISOString().slice(0, 7);
    Promise.all([
      supabase.from('agents').select('*', { count: 'exact', head: true }).eq('tenant_id', id),
      supabase.from('commissions').select('amount').eq('tenant_id', id).eq('month', thisMonth),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('tenant_id', id).neq('status', 'done'),
    ]).then(([{ count: members }, { data: comm }, { count: pending }]) => {
      setStats({
        members: members ?? 0,
        thisMonthComm: comm?.reduce((s, r) => s + Number(r.amount), 0) ?? 0,
        pendingTasks: pending ?? 0,
      });
      setLoading(false);
    });
  }, [id]);

  const cards = [
    { label: '项目会员', value: stats.members, icon: '👥', color: 'bg-blue-500' },
    { label: '本月佣金', value: `RM ${stats.thisMonthComm.toFixed(2)}`, icon: '💰', color: 'bg-yellow-500' },
    { label: '待完成任务', value: stats.pendingTasks, icon: '📋', color: 'bg-orange-500' },
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">项目概览</h2>
      {loading ? (
        <div className="text-gray-500">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map(card => (
            <div key={card.label} className="bg-white rounded-2xl shadow-sm p-6">
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center text-xl mb-4`}>
                {card.icon}
              </div>
              <p className="text-gray-500 text-sm">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
