'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start space-x-6">
            <Link href="/" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">SocioMint</span>
            </Link>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-center md:space-x-6">
            <div className="flex space-x-6 mb-4 md:mb-0">
              <Link href="#" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm">
                {t('footer.terms')}
              </Link>
              <Link href="#" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm">
                {t('footer.privacy')}
              </Link>
              <Link href="#" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm">
                {t('footer.contact')}
              </Link>
            </div>
            
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {t('footer.copyright').replace('2025', currentYear.toString())}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
