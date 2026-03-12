import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n';
import {
  Settings24Regular,
  Info24Regular,
  FolderOpen24Regular,
  Color24Regular,
  LocalLanguage24Regular,
} from '@fluentui/react-icons';
import './Settings.css';

const APP_VERSION = '0.1.0';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'zh-CN', label: '简体中文' },
];

export function Settings() {
  const { t } = useTranslation();

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('prism-lang', code);
  };

  return (
    <div className="page settings">
      <h2><Settings24Regular /> {t('settings.title')}</h2>

      <div className="settings-section">
        <h3><Info24Regular /> {t('settings.about')}</h3>
        <div className="glass-card stagger-1">
          <div className="setting-row">
            <span className="setting-label">{t('settings.version')}</span>
            <span className="setting-value">v{APP_VERSION}</span>
          </div>
          <div className="setting-row">
            <span className="setting-label">{t('settings.engine')}</span>
            <span className="setting-value">Prism Core (PowerShell)</span>
          </div>
          <div className="setting-row">
            <span className="setting-label">{t('settings.framework')}</span>
            <span className="setting-value">Tauri v2 + React</span>
          </div>
          <div className="setting-row">
            <span className="setting-label">{t('settings.license')}</span>
            <span className="setting-value">MIT License</span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3><FolderOpen24Regular /> {t('settings.paths')}</h3>
        <div className="glass-card stagger-2">
          <div className="setting-row">
            <span className="setting-label">{t('settings.coreEngine')}</span>
            <span className="setting-value mono">./mole-core</span>
          </div>
          <div className="setting-row">
            <span className="setting-label">{t('settings.logPath')}</span>
            <span className="setting-value mono">%APPDATA%/prism/logs</span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3><Color24Regular /> {t('settings.appearance')}</h3>
        <div className="glass-card stagger-3">
          <div className="setting-row">
            <span className="setting-label">{t('settings.theme')}</span>
            <span className="setting-value">{t('settings.darkMode')}</span>
          </div>
          <div className="setting-row">
            <span className="setting-label"><LocalLanguage24Regular /> {t('settings.language')}</span>
            <div className="language-selector">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  className={`lang-btn ${i18n.language === lang.code ? 'active' : ''}`}
                  onClick={() => changeLanguage(lang.code)}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
