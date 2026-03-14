import { useTranslation } from 'react-i18next';
import {
  Desktop24Regular,
  DesktopPulse24Regular,
  Storage24Regular,
  Wifi124Regular,
  BroomRegular,
  FlashRegular,
  ShieldCheckmarkRegular,
  ArrowSyncRegular,
  Timer24Regular,
  Info24Regular,
} from '@fluentui/react-icons';
import { HealthScore } from '../components/HealthScore';
import { StatCard } from '../components/StatCard';
import { useSystemInfo } from '../hooks/useSystemInfo';
import type { PageId } from '../components/Sidebar';
import './Dashboard.css';

function formatNet(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
}

interface DashboardProps {
  onNavigate?: (page: PageId) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { t } = useTranslation();
  const { info, loading } = useSystemInfo();

  const memPercent = info.memoryTotalGb > 0
    ? Math.round((info.memoryUsedGb / info.memoryTotalGb) * 100)
    : 0;
  const diskPercent = info.diskTotalGb > 0
    ? Math.round((info.diskUsedGb / info.diskTotalGb) * 100)
    : 0;

  const quickActions = [
    { label: t('dashboard.scanAll'), desc: t('dashboard.scanAllDesc'), icon: <BroomRegular />, color: 'text-accent', target: 'cleaner' as PageId },
    { label: t('dashboard.quickOptimize'), desc: t('dashboard.quickOptimizeDesc'), icon: <FlashRegular />, color: 'text-blue', target: 'optimizer' as PageId },
    { label: t('dashboard.securityCheck'), desc: t('dashboard.securityCheckDesc'), icon: <ShieldCheckmarkRegular />, color: 'text-purple', target: 'monitor' as PageId },
    { label: t('dashboard.updateClean'), desc: t('dashboard.updateCleanDesc'), icon: <ArrowSyncRegular />, color: 'text-cyan', target: 'purger' as PageId },
  ];

  return (
    <div className="page dashboard">
      <h2>{t('dashboard.title')}</h2>

      <div className="system-banner glass-card stagger-1">
        <span className="system-banner-item">
          <Info24Regular />
          {info.osName} {info.osVersion}
        </span>
        <span className="system-banner-item">
          <Desktop24Regular />
          {info.cpuName || t('common.loading')} ({info.cpuCores} {t('common.cores')})
        </span>
        <span className="system-banner-item">
          <Timer24Regular />
          {t('dashboard.uptime', { hours: info.uptimeHours })}
        </span>
      </div>

      <div className="dashboard-top">
        <HealthScore score={info.healthScore} />

        <div className="dashboard-stats">
          <StatCard
            icon={<Desktop24Regular />}
            label={t('dashboard.cpuUsage')}
            value={loading ? '...' : `${info.cpuUsage}%`}
            color="var(--color-blue)"
            stagger={2}
            progress={info.cpuUsage}
          />
          <StatCard
            icon={<DesktopPulse24Regular />}
            label={t('dashboard.memory')}
            value={loading ? '...' : `${info.memoryUsedGb} / ${info.memoryTotalGb} GB`}
            sub={t('dashboard.used', { pct: memPercent })}
            color="var(--color-purple)"
            stagger={3}
            progress={memPercent}
          />
          <StatCard
            icon={<Storage24Regular />}
            label={t('dashboard.disk')}
            value={loading ? '...' : `${info.diskUsedGb} / ${info.diskTotalGb} GB`}
            sub={t('dashboard.used', { pct: diskPercent })}
            color="var(--color-amber)"
            stagger={4}
            progress={diskPercent}
          />
          <StatCard
            icon={<Wifi124Regular />}
            label={t('dashboard.network')}
            value={loading ? '...' : `↓ ${formatNet(info.networkRxSpeedMb)}/s   ↑ ${formatNet(info.networkTxSpeedMb)}/s`}
            sub={loading ? '' : `Total: ↓ ${formatNet(info.networkReceivedMb)}   ↑ ${formatNet(info.networkTransmittedMb)}`}
            color="var(--color-accent)"
            stagger={5}
          />
        </div>
      </div>

      <h3 className="section-title stagger-5">{t('dashboard.quickActions')}</h3>
      <div className="quick-actions stagger-6">
        {quickActions.map((action) => (
          <button
            key={action.label}
            className="action-card glass-card interactive"
            onClick={() => onNavigate?.(action.target)}
          >
            <span className={`action-icon ${action.color}`}>
              {action.icon}
            </span>
            <span className="action-label">{action.label}</span>
            <span className="action-desc">{action.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
