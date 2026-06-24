import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

interface Stats {
  totalAgents: number;
  activeAgents: number;
  totalCommissions: number;
  thisMonthCommissions: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalAgents: 0, activeAgents: 0, totalCommissions: 0, thisMonthCommissions: 0 });
  const [loading, setLoading] = useState(true);

  // Logo upload state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoMsg, setLogoMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const thisMonth = new Date().toISOString().slice(0, 7);
      const [{ count: total }, { count: active }, { data: allComm }, { data: monthComm }] = await Promise.all([
        supabase.from('agents').select('*', { count: 'exact', head: true }),
        supabase.from('agents').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('commissions').select('amount'),
        supabase.from('commissions').select('amount').eq('month', thisMonth),
      ]);
      setStats({
        totalAgents: total ?? 0,
        activeAgents: active ?? 0,
        totalCommissions: allComm?.reduce((s, r) => s + Number(r.amount), 0) ?? 0,
        thisMonthCommissions: monthComm?.reduce((s, r) => s + Number(r.amount), 0) ?? 0,
      });
      setLoading(false);

      // Load existing logo
      const { data: setting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'logo_url')
        .single();
      if (setting?.value) setLogoUrl(setting.value);
    }
    load();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size
    const allowed = ['image/jpeg', 'image/png', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      setLogoMsg('仅支持 JPG / PNG / SVG 格式');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoMsg('文件大小不能超过 2MB');
      return;
    }

    setLogoUploading(true);
    setLogoMsg('');

    const ext = file.name.split('.').pop();
    const path = `logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('brand-assets')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setLogoMsg('上传失败：' + uploadError.message);
      setLogoUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    // Save to settings table
    // SQL hint: CREATE TABLE settings (key text PRIMARY KEY, value text);
    const { error: dbError } = await supabase
      .from('settings')
      .upsert({ key: 'logo_url', value: publicUrl });

    if (dbError) {
      setLogoMsg('保存失败：' + dbError.message);
    } else {
      setLogoUrl(publicUrl);
      setLogoMsg('上传成功！');
    }
    setLogoUploading(false);
  };

  const cards = [
    { label: '总会员数', value: stats.totalAgents, icon: '👥', color: 'bg-blue-500' },
    { label: '活跃会员', value: stats.activeAgents, icon: '✅', color: 'bg-green-500' },
    { label: '本月佣金', value: `RM ${stats.thisMonthCommissions.toFixed(2)}`, icon: '💰', color: 'bg-yellow-500' },
    { label: '累计佣金', value: `RM ${stats.totalCommissions.toFixed(2)}`, icon: '📈', color: 'bg-purple-500' },
  ];

  return (
    <div className="p-8 space-y-10">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">系统概览</h2>
        {loading ? (
          <div className="text-gray-500">加载中...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map(card => (
              <div key={card.label} className="bg-white rounded-2xl shadow-sm p-6">
                <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center text-xl mb-4`}>
                  {card.icon}
                </div>
                <p className="text-gray-500 text-sm">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Settings - Logo Upload */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">系统设置</h2>
        <div className="bg-white rounded-2xl shadow-sm p-6 max-w-md">
          <h3 className="font-semibold text-gray-800 mb-4">品牌 Logo</h3>

          {/* Current logo preview */}
          <div className="w-32 h-32 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center mb-4 bg-gray-50 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="Brand Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-gray-400 text-sm text-center px-2">暂无 Logo</span>
            )}
          </div>

          <p className="text-xs text-gray-400 mb-4">
            建议尺寸: 200x200px，最大 2MB，支持 JPG / PNG / SVG
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/svg+xml"
            className="hidden"
            onChange={handleLogoUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={logoUploading}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-semibold hover:bg-sky-700 disabled:opacity-60 transition-colors"
          >
            {logoUploading ? '上传中...' : '选择并上传 Logo'}
          </button>

          {logoMsg && (
            <p className={`mt-3 text-sm font-medium ${logoMsg.includes('成功') ? 'text-emerald-600' : 'text-red-600'}`}>
              {logoMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
