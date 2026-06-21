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
    name: { zh: '净水机 Pro 标准版', en: 'Water Purifier Pro Standard', ms: 'Penapis Air Pro Standard' },
    features: {
      zh: ['RO 反渗透过滤', '冷热双温', '免费安装维修'],
      en: ['RO Filtration', 'Hot & Cold', 'Free Installation & Service'],
      ms: ['Penapisan RO', 'Panas & Sejuk', 'Pasang & Servis Percuma'],
    },
    image: 'https://placehold.co/400x400/e0f2fe/0369a1?text=Pro',
  },
  {
    id: 2,
    name: { zh: '净水机 Plus 豪华版', en: 'Water Purifier Plus Deluxe', ms: 'Penapis Air Plus Deluxe' },
    features: {
      zh: ['8级过滤系统', '冷热温三温', '智能水质显示', '免费安装维修'],
      en: ['8-Stage Filter', 'Hot/Warm/Cold', 'Smart Water Quality Display', 'Free Installation & Service'],
      ms: ['Penapis 8 Peringkat', 'Panas/Suam/Sejuk', 'Paparan Kualiti Air Pintar', 'Pasang & Servis Percuma'],
    },
    image: 'https://placehold.co/400x400/e0f2fe/0369a1?text=Plus',
  },
  {
    id: 3,
    name: { zh: '净水机 Lite 入门版', en: 'Water Purifier Lite Basic', ms: 'Penapis Air Lite Asas' },
    features: {
      zh: ['5级过滤系统', '常温出水', '免费安装维修'],
      en: ['5-Stage Filter', 'Room Temperature', 'Free Installation & Service'],
      ms: ['Penapis 5 Peringkat', 'Suhu Bilik', 'Pasang & Servis Percuma'],
    },
    image: 'https://placehold.co/400x400/e0f2fe/0369a1?text=Lite',
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
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('monthly_rental')}</p>
                    <p className="text-2xl font-black gradient-text">RM_PRICE</p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-semibold">
                    40% {t('level1_label').split(' ')[0]}
                  </span>
                </div>
                <Link to="/register" className="btn-primary w-full block text-center text-sm">
                  💧 {t('join_as_agent')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
