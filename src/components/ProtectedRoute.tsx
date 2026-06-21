import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../lib/i18n';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  if (loading) return <div className="flex items-center justify-center min-h-screen">{t('loading')}</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
