import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useTenantAdmin() {
  const { user } = useAuth();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setTenantId(null); setLoading(false); return; }
    supabase
      .from('tenant_admins')
      .select('tenant_id, locked')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setTenantId(data?.tenant_id ?? null);
        setLocked(data?.locked ?? false);
        setLoading(false);
      });
  }, [user]);

  return { tenantId, locked, loading };
}
