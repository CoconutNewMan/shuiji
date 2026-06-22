import { Outlet, NavLink, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function PortalLayoutPage() {
  const { signOut } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/portal/login');
  }

  const nav = [
    { to: `/portal/${id}/dashboard`, icon: '📊', label: '项目概览' },
    { to: `/portal/${id}/tasks`, icon: '✅', label: '工作事项' },
    { to: `/portal/${id}/members`, icon: '👥', label: '会员管理' },
    { to: `/portal/${id}/commissions`, icon: '💰', label: '佣金记录' },
    { to: `/portal/${id}/announcements`, icon: '📢', label: '公告中心' },
    { to: `/portal/${id}/settings`, icon: '⚙️', label: '账号设置' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-sky-900 text-white flex flex-col">
        <div className="p-6 border-b border-sky-800">
          <h1 className="text-lg font-bold">🏢 项目后台</h1>
          <p className="text-sky-300 text-sm mt-1 truncate">{id}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-sky-600 text-white' : 'text-sky-200 hover:bg-sky-800'}`
              }
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-sky-800">
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 text-sm text-sky-200 hover:text-white hover:bg-sky-800 rounded-lg transition-all text-left"
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
