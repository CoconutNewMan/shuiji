import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTenantAdmin } from '../hooks/useTenantAdmin';

export default function PortalProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { tenantId, locked, loading: adminLoading } = useTenantAdmin();
  const { id } = useParams<{ id: string }>();

  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user || !tenantId) return <Navigate to="/portal/login" replace />;
  if (locked) return <Navigate to="/portal/login?locked=1" replace />;
  if (id && id !== tenantId) return <Navigate to="/portal/login" replace />;

  return <>{children}</>;
}
