import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface LogEntry { id: string; email: string; success: boolean; attempted_at: string; }

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('login_attempts').select('*').order('attempted_at', { ascending: false }).limit(200)
      .then(({ data }) => { setLogs(data ?? []); setLoading(false); });
  }, []);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">系统日志</h2>
      {loading ? <div className="text-gray-500">加载中...</div> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">时间</th>
                <th className="px-6 py-3 text-left">邮箱</th>
                <th className="px-6 py-3 text-left">结果</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(log => (
                <tr key={log.id} className={`hover:bg-gray-50 ${!log.success ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-4 text-gray-500">{new Date(log.attempted_at).toLocaleString('zh-CN')}</td>
                  <td className="px-6 py-4 text-gray-900">{log.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {log.success ? '✅ 成功' : '❌ 失败'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <div className="p-8 text-center text-gray-400">暂无记录</div>}
        </div>
      )}
    </div>
  );
}
