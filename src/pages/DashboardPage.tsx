import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { Agent, Commission, Subscription } from '../types';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [monthlyCommission, setMonthlyCommission] = useState(0);
  const [teamCount, setTeamCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Fetch agent profile
      const { data: agentData } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setAgent(agentData);

      if (!agentData) { setLoading(false); return; }

      // Fetch active subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('agent_id', agentData.id)
        .eq('status', 'active')
        .single();
      setSubscription(subData);

      // Fetch this month's commissions
      const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data: commData } = await supabase
        .from('commissions')
        .select('amount')
        .eq('agent_id', agentData.id)
        .eq('month', thisMonth);
      const total = (commData ?? []).reduce((sum: number, c: Pick<Commission, 'amount'>) => sum + c.amount, 0);
      setMonthlyCommission(total);

      // Count team (level 1 only for display; full count via org chart)
      const { count } = await supabase
        .from('agents')
        .select('id', { count: 'exact', head: true })
        .eq('referrer_id', agentData.id);
      setTeamCount(count ?? 0);

      setLoading(false);
    };

    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
        {t('loading')}
      </div>
    );
  }

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header: Name + Agent ID */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black">
              {t('hello_name')}{agent?.name ?? ''}
            </h1>
            <p className="text-gray-500 mt-1">{t('dashboard_title')}</p>
            {agent?.referral_code && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-sky-50 border border-sky-200 rounded-xl">
                <span className="text-sm font-semibold text-gray-600">{t('my_agent_id')}:</span>
                <span className="font-black text-sky-700 text-lg tracking-widest">{agent.referral_code}</span>
              </div>
            )}
          </div>
          {/* Buy Course CTA */}
          <Link to="/products" className="btn-primary inline-flex items-center gap-2 text-base">
            💧 {t('buy_course')}
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-10">
          <div className="card p-6">
            <p className="text-gray-500 text-sm font-semibold mb-2">{t('rental_status')}</p>
            <div className={`text-2xl font-black mb-1 ${subscription ? 'text-emerald-600' : 'text-gray-400'}`}>
              {subscription ? t('status_active') : t('status_inactive')}
            </div>
            <p className="text-xs text-gray-400">Curlec Auto-Debit</p>
          </div>
          <div className="card p-6">
            <p className="text-gray-500 text-sm font-semibold mb-2">{t('monthly_commission')}</p>
            <div className="text-3xl font-black gradient-text mb-1">
              RM {monthlyCommission.toFixed(2)}
            </div>
          </div>
          <div className="card p-6">
            <p className="text-gray-500 text-sm font-semibold mb-2">{t('wallet_balance')}</p>
            <div className="text-3xl font-black gradient-text mb-1">
              RM {(agent?.wallet_balance ?? 0).toFixed(2)}
            </div>
          </div>
          <div className="card p-6">
            <p className="text-gray-500 text-sm font-semibold mb-2">{t('team_size')}</p>
            <div className="text-3xl font-black gradient-text mb-1">{teamCount}</div>
            <p className="text-xs text-gray-400">{t('team_sub')}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-bold text-lg mb-4">{t('org_title')}</h3>
            <p className="text-gray-500 text-sm mb-4">{t('team_sub')}</p>
            <Link to="/org" className="btn-primary inline-block">
              {t('view_org')}
            </Link>
          </div>
          <div className="card p-6">
            <h3 className="font-bold text-lg mb-4">{t('commission_records')}</h3>
            <p className="text-gray-500 text-sm mb-4">
              {t('monthly_commission')}: RM {monthlyCommission.toFixed(2)}
            </p>
            {agent?.referral_code && (
              <p className="text-xs text-gray-400">
                {t('my_agent_id')}: {agent.referral_code}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
