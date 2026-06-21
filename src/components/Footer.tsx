import { useTranslation } from '../lib/i18n';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm">
        <p>© {new Date().getFullYear()} [BRAND]. {t('footer_rights')}.</p>
      </div>
    </footer>
  );
}
