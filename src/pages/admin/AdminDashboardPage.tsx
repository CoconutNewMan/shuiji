import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Stats {
  totalAgents: number;
  activeAgents: number;
  totalCommissions: number;
  thisMonthCommissions: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalAgents: 0, activeAgents: 0, totalCommissions: 0, thisMonthCommissions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const thisMonth = new Date().toISOString().slice(0, 7);
      const [{ count: total }, { count: active }, { data: allComm }, { data: monthComm }] = await Promise.all([
        supabase.from('agents').select('*', { count: 'exact', head: true }),
        supabase.from('agents').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('commissions').select('amount'),
        supabase.from('commissions').select('amount').eq('month', thisMonth),
      ]);
      setStats({
        totalAgents: total ?? 0,
        activeAgents: active ?? 0,
        totalCommissions: allComm?.reduce((s, r) => s + Number(r.amount), 0) ?? 0,
        thisMonthCommissions: monthComm?.reduce((s, r) => s + Number(r.amount), 0) ?? 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    { label: '总会员数', value: stats.totalAgents, icon: '👥', color: 'bg-blue-500' },
    { label: '活跃会员', value: stats.activeAgents, icon: '✅', color: 'bg-green-500' },
    { label: '本月佣金', value: `RM ${stats.thisMonthCommissions.toFixed(2)}`, icon: '💰', color: 'bg-yellow-500' },
    { label: '累计佣金', value: `RM ${stats.totalCommissions.toFixed(2)}`, icon: '📈', color: 'bg-purple-500' },
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">系统概览</h2>
      {loading ? (
        <div className="text-gray-500">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
