import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function AdminLayoutPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/admin/login');
  }

  const nav = [
    { to: '/admin/dashboard', icon: '📊', label: '系统概览' },
    { to: '/admin/tenants', icon: '🏢', label: '项目方管理' },
    { to: '/admin/accounts', icon: '🔑', label: '子账号管理' },
    { to: '/admin/members', icon: '👥', label: '全局会员' },
    { to: '/admin/commissions', icon: '💰', label: '全局佣金' },
    { to: '/admin/announcements', icon: '📢', label: '公告管理' },
    { to: '/admin/logs', icon: '🔍', label: '系统日志' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-lg font-bold">⚡ 超级总台</h1>
          <p className="text-gray-400 text-sm mt-1">管理控制中心</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-sky-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`
              }
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all text-left"
          >
            🚪 退出登录
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
