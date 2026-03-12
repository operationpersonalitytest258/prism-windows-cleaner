import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PulseSquare24Regular,
  Desktop24Regular,
  DesktopPulse24Regular,
  Storage24Regular,
} from '@fluentui/react-icons';
import { invoke } from '@tauri-apps/api/core';
import './Monitor.css';

interface DataPoint { time: number; value: number; }
const MAX_POINTS = 60;
const REFRESH_MS = 2000;

function MiniChart({ data, color, label, unit, current, waitingText }: {
  data: DataPoint[]; color: string; label: string; unit: string; current: string; waitingText: string;
}) {
  const svgWidth = 400;
  const svgHeight = 120;
  const padding = { top: 10, right: 10, bottom: 4, left: 10 };
  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;

  if (data.length < 2) {
    return (
      <div className="glass-card monitor-chart">
        <div className="chart-header">
          <span className="chart-label">{label}</span>
          <span className="chart-value" style={{ color }}>--</span>
        </div>
        <div className="chart-placeholder">{waitingText}</div>
      </div>
    );
  }

  const maxVal = Math.max(100, ...data.map((d) => d.value));
  const points = data
    .map((d, i) => {
      const x = padding.left + (i / (MAX_POINTS - 1)) * chartW;
      const y = padding.top + chartH - (d.value / maxVal) * chartH;
      return `${x},${y}`;
    })
    .join(' ');

  const firstX = padding.left;
  const lastX = padding.left + ((data.length - 1) / (MAX_POINTS - 1)) * chartW;
  const bottomY = padding.top + chartH;
  const areaPath = `M${firstX},${bottomY} L${points.split(' ').join(' L')} L${lastX},${bottomY} Z`;

  return (
    <div className="glass-card monitor-chart">
      <div className="chart-header">
        <span className="chart-label">{label}</span>
        <span className="chart-value" style={{ color }}>{current}{unit}</span>
      </div>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="chart-svg">
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[25, 50, 75].map((pct) => {
          const y = padding.top + chartH - (pct / maxVal) * chartH;
          return <line key={pct} x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="rgba(148,163,184,0.08)" strokeDasharray="4,4" />;
        })}
        <path d={areaPath} fill={`url(#grad-${label})`} />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.length > 0 && (() => {
          const last = data[data.length - 1];
          const dotCx = padding.left + ((data.length - 1) / (MAX_POINTS - 1)) * chartW;
          const dotCy = padding.top + chartH - (last.value / maxVal) * chartH;
          return (
            <>
              <circle cx={dotCx} cy={dotCy} r="4" fill={color} />
              <circle cx={dotCx} cy={dotCy} r="8" fill={color} fillOpacity="0.2" />
            </>
          );
        })()}
      </svg>
    </div>
  );
}

export function Monitor() {
  const { t } = useTranslation();
  const [cpuHistory, setCpuHistory] = useState<DataPoint[]>([]);
  const [memHistory, setMemHistory] = useState<DataPoint[]>([]);
  const [diskHistory, setDiskHistory] = useState<DataPoint[]>([]);
  const tickRef = useRef(0);

  const fetchData = useCallback(async () => {
    try {
      const data = await invoke<{
        cpu_usage: number; memory_used_gb: number; memory_total_gb: number;
        disk_used_gb: number; disk_total_gb: number;
      }>('get_system_info');
      const now = tickRef.current++;
      const memPct = data.memory_total_gb > 0 ? (data.memory_used_gb / data.memory_total_gb) * 100 : 0;
      const diskPct = data.disk_total_gb > 0 ? (data.disk_used_gb / data.disk_total_gb) * 100 : 0;
      setCpuHistory((prev) => [...prev.slice(-MAX_POINTS + 1), { time: now, value: data.cpu_usage }]);
      setMemHistory((prev) => [...prev.slice(-MAX_POINTS + 1), { time: now, value: memPct }]);
      setDiskHistory((prev) => [...prev.slice(-MAX_POINTS + 1), { time: now, value: diskPct }]);
    } catch { /* Outside Tauri */ }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  const lastCpu = cpuHistory[cpuHistory.length - 1]?.value ?? 0;
  const lastMem = memHistory[memHistory.length - 1]?.value ?? 0;
  const lastDisk = diskHistory[diskHistory.length - 1]?.value ?? 0;

  return (
    <div className="page monitor">
      <h2><PulseSquare24Regular /> {t('monitor.title')}</h2>
      <p className="page-desc">{t('monitor.desc')}</p>

      <div className="monitor-grid">
        <MiniChart data={cpuHistory} color="var(--color-blue)" label={t('monitor.cpu')} unit="%" current={lastCpu.toFixed(1)} waitingText={t('monitor.waiting')} />
        <MiniChart data={memHistory} color="var(--color-purple)" label={t('monitor.memoryLabel')} unit="%" current={lastMem.toFixed(1)} waitingText={t('monitor.waiting')} />
        <MiniChart data={diskHistory} color="var(--color-amber)" label={t('monitor.diskLabel')} unit="%" current={lastDisk.toFixed(1)} waitingText={t('monitor.waiting')} />
      </div>

      <div className="monitor-legend">
        <span><Desktop24Regular /> {t('monitor.cpu')}</span>
        <span><DesktopPulse24Regular /> {t('monitor.memoryLabel')}</span>
        <span><Storage24Regular /> {t('monitor.diskLabel')}</span>
        <span className="legend-info">
          {t('monitor.showRecent', { points: MAX_POINTS, minutes: (MAX_POINTS * REFRESH_MS / 1000 / 60).toFixed(0) })}
        </span>
      </div>
    </div>
  );
}
