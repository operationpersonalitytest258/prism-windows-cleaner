import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HardDrive24Regular,
  FolderOpen24Regular,
  ArrowSync24Regular,
} from '@fluentui/react-icons';
import { useSystemInfo } from '../hooks/useSystemInfo';
import './Analyzer.css';

export function Analyzer() {
  const { t } = useTranslation();
  const { info, refresh } = useSystemInfo();
  const [activeSeg, setActiveSeg] = useState<number | null>(null);

  const segments = useMemo(() => {
    const used = info.diskUsedGb;
    const total = info.diskTotalGb;
    const free = total - used;
    if (total <= 0) return [];
    const system = Math.min(used * 0.3, 40);
    const apps = Math.min(used * 0.25, 80);
    const user = Math.min(used * 0.2, 60);
    const other = used - system - apps - user;
    return [
      { labelKey: 'analyzer.system', value: system, color: 'var(--color-blue)' },
      { labelKey: 'analyzer.apps', value: apps, color: 'var(--color-purple)' },
      { labelKey: 'analyzer.userData', value: user, color: 'var(--color-amber)' },
      { labelKey: 'analyzer.other', value: Math.max(0, other), color: 'var(--color-cyan)' },
      { labelKey: 'analyzer.free', value: free, color: 'var(--color-accent)' },
    ].filter((s) => s.value > 0.1);
  }, [info]);

  const total = info.diskTotalGb;
  const ringSize = 200;
  const cx = ringSize / 2;
  const cy = ringSize / 2;
  const outerR = 85;
  const innerR = 60;

  const ringSegments = useMemo(() => {
    if (total <= 0) return [];
    let accAngle = -90;
    return segments.map((seg) => {
      const angle = (seg.value / total) * 360;
      const startAngle = accAngle;
      accAngle += angle;
      return { ...seg, startAngle, endAngle: accAngle };
    });
  }, [segments, total]);

  const arcPath = (startDeg: number, endDeg: number, r: number) => {
    const startRad = (Math.PI / 180) * startDeg;
    const endRad = (Math.PI / 180) * endDeg;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const segPath = (seg: typeof ringSegments[0]) => {
    const s1 = arcPath(seg.startAngle, seg.endAngle, outerR);
    const endRad = (Math.PI / 180) * seg.endAngle;
    const startRad = (Math.PI / 180) * seg.startAngle;
    const ix1 = cx + innerR * Math.cos(endRad);
    const iy1 = cy + innerR * Math.sin(endRad);
    const ix2 = cx + innerR * Math.cos(startRad);
    const iy2 = cy + innerR * Math.sin(startRad);
    const largeArc = seg.endAngle - seg.startAngle > 180 ? 1 : 0;
    return `${s1} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
  };

  return (
    <div className="page analyzer">
      <h2><HardDrive24Regular /> {t('analyzer.title')}</h2>
      <p className="page-desc">
        {t('analyzer.desc', { total: info.diskTotalGb, used: info.diskUsedGb })}
      </p>

      <div className="analyzer-layout">
        <div className="glass-card ring-card stagger-1">
          <svg viewBox={`0 0 ${ringSize} ${ringSize}`} className="ring-chart">
            {ringSegments.map((seg, i) => (
              <path
                key={seg.labelKey}
                d={segPath(seg)}
                fill={seg.color}
                opacity={activeSeg === null || activeSeg === i ? 1 : 0.3}
                onMouseEnter={() => setActiveSeg(i)}
                onMouseLeave={() => setActiveSeg(null)}
                className="ring-segment"
              />
            ))}
            <text x={cx} y={cy - 8} textAnchor="middle" className="ring-center-value">
              {activeSeg !== null ? `${ringSegments[activeSeg]?.value.toFixed(1)}` : `${info.diskUsedGb}`}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" className="ring-center-label">
              {activeSeg !== null ? t(ringSegments[activeSeg]?.labelKey) : t('analyzer.gbUsed')}
            </text>
          </svg>
        </div>

        <div className="disk-legend stagger-2">
          {segments.map((seg, i) => (
            <div
              key={seg.labelKey}
              className={`legend-row glass-card ${activeSeg === i ? 'active' : ''}`}
              onMouseEnter={() => setActiveSeg(i)}
              onMouseLeave={() => setActiveSeg(null)}
            >
              <span className="legend-dot" style={{ background: seg.color }} />
              <span className="legend-label">{t(seg.labelKey)}</span>
              <span className="legend-value">{seg.value.toFixed(1)} GB</span>
              <span className="legend-pct">
                {total > 0 ? `${((seg.value / total) * 100).toFixed(0)}%` : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="analyzer-actions stagger-3">
        <button className="glass-card interactive analyzer-action" disabled>
          <FolderOpen24Regular /> {t('analyzer.openScan')}
        </button>
        <button className="glass-card interactive analyzer-action" onClick={refresh}>
          <ArrowSync24Regular /> {t('analyzer.refresh')}
        </button>
      </div>
    </div>
  );
}
