import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Agent {
  id: string;
  name: string;
  phone: string;
  ic_number: string;
  status: string;
  wallet_balance: number;
  commission_total: number;
  created_at: string;
}

export default function AdminMembersPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadAgents(); }, []);

  async function loadAgents() {
    const { data } = await supabase.from('agents').select('*').order('created_at', { ascending: false });
    setAgents(data ?? []);
    setLoading(false);
  }

  async function toggleStatus(agent: Agent) {
    const newStatus = agent.status === 'active' ? 'suspended' : 'active';
    await supabase.from('agents').update({ status: newStatus }).eq('id', agent.id);
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: newStatus } : a));
  }

  const filtered = agents.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.phone.includes(search) ||
    a.ic_number.includes(search)
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">会员管理</h2>
        <span className="text-gray-500 text-sm">共 {agents.length} 名会员</span>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="搜索姓名、电话、身份证号..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {loading ? (
        <div className="text-gray-500">加载中...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">姓名</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">电话</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">身份证</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">钱包余额</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">累计佣金</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map(agent => (
                <tr key={agent.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{agent.name}</td>
                  <td className="px-6 py-4 text-gray-600">{agent.phone}</td>
                  <td className="px-6 py-4 text-gray-600">{agent.ic_number}</td>
                  <td className="px-6 py-4 text-gray-600">RM {Number(agent.wallet_balance).toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-600">RM {Number(agent.commission_total).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      agent.status === 'active' ? 'bg-green-100 text-green-700' :
                      agent.status === 'suspended' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {agent.status === 'active' ? '活跃' : agent.status === 'suspended' ? '已暂停' : '停用'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStatus(agent)}
                      className={`text-sm px-3 py-1 rounded-lg font-medium transition-all ${
                        agent.status === 'active'
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {agent.status === 'active' ? '暂停' : '恢复'}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">暂无会员</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
