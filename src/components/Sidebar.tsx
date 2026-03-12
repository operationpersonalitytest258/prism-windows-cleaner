import { useTranslation } from 'react-i18next';
import {
  Home24Regular,
  Home24Filled,
  Delete24Regular,
  Delete24Filled,
  AppsList24Regular,
  AppsList24Filled,
  Flash24Regular,
  Flash24Filled,
  HardDrive24Regular,
  HardDrive24Filled,
  PulseSquare24Regular,
  PulseSquare24Filled,
  FolderZip24Regular,
  FolderZip24Filled,
  Settings24Regular,
} from '@fluentui/react-icons';
import './Sidebar.css';

export type PageId =
  | 'dashboard'
  | 'cleaner'
  | 'uninstaller'
  | 'optimizer'
  | 'analyzer'
  | 'monitor'
  | 'purger'
  | 'settings';

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

const navItemDefs: {
  id: PageId;
  labelKey: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
}[] = [
  { id: 'dashboard',   labelKey: 'nav.dashboard',   icon: <Home24Regular />,        activeIcon: <Home24Filled /> },
  { id: 'cleaner',     labelKey: 'nav.cleaner',     icon: <Delete24Regular />,      activeIcon: <Delete24Filled /> },
  { id: 'uninstaller', labelKey: 'nav.uninstaller', icon: <AppsList24Regular />,    activeIcon: <AppsList24Filled /> },
  { id: 'optimizer',   labelKey: 'nav.optimizer',   icon: <Flash24Regular />,       activeIcon: <Flash24Filled /> },
  { id: 'analyzer',    labelKey: 'nav.analyzer',    icon: <HardDrive24Regular />,   activeIcon: <HardDrive24Filled /> },
  { id: 'monitor',     labelKey: 'nav.monitor',     icon: <PulseSquare24Regular />, activeIcon: <PulseSquare24Filled /> },
  { id: 'purger',      labelKey: 'nav.purger',      icon: <FolderZip24Regular />,   activeIcon: <FolderZip24Filled /> },
];

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { t } = useTranslation();

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" />
            <path
              d="M10 22V14L16 10L22 14V22L16 18L10 22Z"
              fill="white"
              fillOpacity="0.9"
            />
            <defs>
              <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#22C55E" />
                <stop offset="1" stopColor="#16A34A" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="sidebar-brand">
          <span className="sidebar-title">Prism</span>
          <span className="sidebar-subtitle">SYSTEM CLEANER</span>
        </div>
      </div>

      <div className="sidebar-nav">
        {navItemDefs.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && <span className="sidebar-item-indicator" />}
              <span className="sidebar-item-icon">
                {isActive ? item.activeIcon : item.icon}
              </span>
              <span className="sidebar-item-label">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <button
          className={`sidebar-item ${activePage === 'settings' ? 'active' : ''}`}
          onClick={() => onNavigate('settings')}
        >
          <span className="sidebar-item-icon">
            <Settings24Regular />
          </span>
          <span className="sidebar-item-label">{t('nav.settings')}</span>
        </button>
        <span className="sidebar-version">v0.1.0-alpha</span>
      </div>
    </nav>
  );
}
