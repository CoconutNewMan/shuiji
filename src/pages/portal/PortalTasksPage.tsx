import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Task } from '../../types/tenant';

const COLUMNS: { key: Task['status']; label: string }[] = [
  { key: 'todo', label: '待办' },
  { key: 'in_progress', label: '进行中' },
  { key: 'done', label: '已完成' },
];

export default function PortalTasksPage() {
  const { id } = useParams<{ id: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');

  async function load() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('tenant_id', id)
      .order('created_at', { ascending: false });
    setTasks(data ?? []);
  }

  useEffect(() => { load(); }, [id]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from('tasks').insert({ tenant_id: id, title, description, assignee });
    setTitle(''); setDescription(''); setAssignee(''); setShowForm(false);
    load();
  }

  async function moveTask(taskId: string, status: Task['status']) {
    await supabase.from('tasks').update({ status }).eq('id', taskId);
    load();
  }

  async function deleteTask(taskId: string) {
    await supabase.from('tasks').delete().eq('id', taskId);
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">工作事项</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors"
        >
          + 新增任务
        </button>
      </div>

      {showForm && (
        <form onSubmit={addTask} className="bg-white rounded-2xl shadow-sm p-6 mb-6 space-y-3">
          <input
            placeholder="任务标题 *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <textarea
            placeholder="描述（可选）"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <input
            placeholder="负责人（可选）"
            value={assignee}
            onChange={e => setAssignee(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <div className="flex gap-2">
            <button type="submit" className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">保存</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">取消</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map(col => (
          <div key={col.key} className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-700 mb-3">{col.label} ({tasks.filter(t => t.status === col.key).length})</h3>
            <div className="space-y-2">
              {tasks.filter(t => t.status === col.key).map(task => (
                <div key={task.id} className="border border-gray-100 rounded-xl p-3">
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  {task.description && <p className="text-xs text-gray-500 mt-1">{task.description}</p>}
                  {task.assignee && <p className="text-xs text-sky-600 mt-1">👤 {task.assignee}</p>}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {COLUMNS.filter(c => c.key !== col.key).map(c => (
                      <button
                        key={c.key}
                        onClick={() => moveTask(task.id, c.key)}
                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        → {c.label}
                      </button>
                    ))}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-xs px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
