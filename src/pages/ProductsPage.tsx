import { Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import type { Lang } from '../types';

interface Product {
  id: number;
  name: Record<Lang, string>;
  features: Record<Lang, string[]>;
  image: string;
}

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: { zh: '商业培训课程', en: 'Business Training Course', ms: 'Kursus Latihan Perniagaan' },
    features: {
      zh: ['每月 RM600 服务费', '三代佣金奖励', '7天无理由退款保障', '加入代理推广网络'],
      en: ['RM600 monthly service fee', '3-generation commission rewards', '7-day no-reason refund guarantee', 'Join agent referral network'],
      ms: ['Yuran perkhidmatan RM600 sebulan', 'Ganjaran komisen 3 generasi', 'Jaminan bayaran balik 7 hari', 'Sertai rangkaian ejen'],
    },
    image: 'https://placehold.co/400x400/e0f2fe/0369a1?text=课程',
  },
];

export default function ProductsPage() {
  const { t, lang } = useTranslation();

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black mb-2 gradient-text">{t('products_title')}</h1>
          <p className="text-lg text-gray-600">{t('products_subtitle')}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {PRODUCTS.map((product) => (
            <div key={product.id} className="card overflow-hidden hover:shadow-xl transition-shadow">
              <div className="aspect-square bg-sky-50 flex items-center justify-center">
                <img src={product.image} alt={product.name[lang as Lang]} className="w-2/3 h-2/3 object-contain" />
              </div>
              <div className="p-6">
                <p className="text-xs text-sky-600 font-semibold uppercase tracking-wide mb-2">
                  {t('monthly_rental')}
                </p>
                <h3 className="font-bold text-xl mb-4">{product.name[lang as Lang]}</h3>
                <ul className="space-y-2 mb-6">
                  {product.features[lang as Lang].map((f) => (
                    <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-sky-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('monthly_fee')}</p>
                    <p className="text-2xl font-black gradient-text">RM 600</p>
                    <p className="text-xs text-gray-400">{t('per_month')}</p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-semibold">
                    40% {t('commission')}
                  </span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 text-xs text-amber-700 font-medium">
                  🛡️ {t('refund_policy')}
                </div>
                <Link to="/register" className="btn-primary w-full block text-center text-sm">
                  🎓 {t('join_as_agent')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
