import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setIsAdmin(false); setLoading(false); return; }
    supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setIsAdmin(!!data);
        setLoading(false);
      });
  }, [user]);

  return { isAdmin, loading };
}
