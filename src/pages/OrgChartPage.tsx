import { useEffect, useState } from 'react';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import OrgNode from '../components/OrgNode';
import type { TeamMember } from '../types';

interface OrgData {
  level1: TeamMember[];
  level2: TeamMember[];
  level3: TeamMember[];
  agentId: string;
}

export default function OrgChartPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [org, setOrg] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Get own agent id
      const { data: self } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!self) { setLoading(false); return; }

      // Level 1: direct downlines
      const { data: l1 } = await supabase
        .from('agents')
        .select('id, name, email, status, created_at, referrer_id')
        .eq('referrer_id', self.id)
        .order('created_at', { ascending: false });

      const level1: TeamMember[] = l1 ?? [];

      // Level 2: downlines of level 1
      let level2: TeamMember[] = [];
      if (level1.length > 0) {
        const l1Ids = level1.map((a) => a.id);
        const { data: l2 } = await supabase
          .from('agents')
          .select('id, name, email, status, created_at, referrer_id')
          .in('referrer_id', l1Ids)
          .order('created_at', { ascending: false });
        level2 = l2 ?? [];
      }

      // Level 3: downlines of level 2
      let level3: TeamMember[] = [];
      if (level2.length > 0) {
        const l2Ids = level2.map((a) => a.id);
        const { data: l3 } = await supabase
          .from('agents')
          .select('id, name, email, status, created_at, referrer_id')
          .in('referrer_id', l2Ids)
          .order('created_at', { ascending: false });
        level3 = l3 ?? [];
      }

      setOrg({ agentId: self.id, level1, level2, level3 });
      setLoading(false);
    };

    load();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-gray-500">{t('loading')}</div>;
  }

  const levels = [
    { key: 'org_level1' as const, members: org?.level1 ?? [], color: 'sky' as const },
    { key: 'org_level2' as const, members: org?.level2 ?? [], color: 'emerald' as const },
    { key: 'org_level3' as const, members: org?.level3 ?? [], color: 'orange' as const },
  ];

  return (
    <section className="py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-black mb-8">{t('org_title')}</h1>

        {/* Root node */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-sky-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-2">
            💧
          </div>
          <p className="font-semibold text-sky-700">{t('org_you')}</p>
          <p className="text-xs text-gray-400">ID: {org?.agentId?.slice(0, 8)}</p>
        </div>

        {/* 3 Levels */}
        <div className="space-y-8">
          {levels.map(({ key, members, color }) => (
            <div key={key}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-3 h-3 rounded-full ${
                  color === 'sky' ? 'bg-sky-500' : color === 'emerald' ? 'bg-emerald-500' : 'bg-orange-500'
                }`} />
                <h3 className="font-bold text-gray-700">{t(key)}</h3>
                <span className={`ml-auto text-xs px-3 py-1 rounded-full font-semibold ${
                  color === 'sky' ? 'bg-sky-100 text-sky-700' :
                  color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {members.length} {t('members_unit')}
                </span>
              </div>
              {members.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-2 pl-6">
                  {members.map((m) => (
                    <OrgNode key={m.id} member={m} color={color} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm pl-6">{t('org_empty')}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
