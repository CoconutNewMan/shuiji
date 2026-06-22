import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function AdminLayoutPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/admin/login');
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-lg font-bold">🔧 管理后台</h1>
          <p className="text-gray-400 text-sm mt-1">水机奖励系统</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-sky-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`
            }
          >
            📊 概览
          </NavLink>
          <NavLink
            to="/admin/members"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-sky-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`
            }
          >
            👥 会员管理
          </NavLink>
          <NavLink
            to="/admin/commissions"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-sky-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`
            }
          >
            💰 佣金记录
          </NavLink>
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

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
