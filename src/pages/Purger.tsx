import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FolderZip24Regular,
  Delete24Regular,
  Checkmark24Regular,
  FolderOpen24Regular,
  CheckmarkCircle24Filled,
  ArrowSync24Regular,
  DismissCircle24Filled,
} from '@fluentui/react-icons';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Button, Spinner, ProgressBar, Checkbox } from '@fluentui/react-components';
import type { MoleResult } from '../types';
import './Purger.css';

interface PurgeItem {
  path: string;
  sizeMB: number;
  name: string;
  status?: 'success' | 'failed';
}

interface PurgeSummary {
  totalCount: number;
  totalSize: string;
  cleaned?: number;
  failed?: number;
}

type PurgeEvent =
  | { type: 'scanning'; text: string }
  | { type: 'item'; path: string; name: string; size_mb: number; status?: string }
  | { type: 'summary'; total_count: number; total_size: string; cleaned?: number; failed?: number }
  | { type: 'done'; success: boolean };

const targets = [
  { id: 'node', label: 'node_modules', pattern: 'Node.js', color: 'var(--color-accent)' },
  { id: 'gradle', label: '.gradle / build', pattern: 'Gradle / Android', color: 'var(--color-blue)' },
  { id: 'cargo', label: 'target', pattern: 'Rust / Maven', color: 'var(--color-amber)' },
  { id: 'dart', label: '.dart_tool / Pods', pattern: 'Dart / iOS', color: 'var(--color-cyan)' },
  { id: 'python', label: '__pycache__ / .venv', pattern: 'Python', color: 'var(--color-purple)' },
  { id: 'dotnet', label: 'bin / obj', pattern: '.NET (C#, F#)', color: 'var(--color-red)' },
  { id: 'web', label: '.next / .nuxt / dist', pattern: 'Web frameworks', color: 'var(--color-teal)' },
  { id: 'misc', label: 'More', pattern: 'Terraform, Unity, Swift, Zig', color: 'var(--color-text-muted)' },
];

function formatSize(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
}

// State: idle → scanning → scanned → cleaning → cleaned
type PurgePhase = 'idle' | 'scanning' | 'scanned' | 'cleaning' | 'cleaned';

export function Purger() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<PurgePhase>('idle');
  const [items, setItems] = useState<PurgeItem[]>([]);
  const [summary, setSummary] = useState<PurgeSummary | null>(null);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  // Listen for purge-progress events
  useEffect(() => {
    const unlisten = listen<PurgeEvent>('purge-progress', (event) => {
      const data = event.payload;

      switch (data.type) {
        case 'scanning':
          setStatusText(data.text);
          break;

        case 'item':
          setItems(prev => {
            const newItems = [...prev, {
              path: data.path,
              sizeMB: data.size_mb,
              name: data.name,
              status: data.status as 'success' | 'failed' | undefined,
            }];
            // Auto-check new items during dry run (no status = dry run item)
            if (!data.status) {
              setCheckedItems(prev => ({ ...prev, [newItems.length - 1]: true }));
            }
            return newItems;
          });
          break;

        case 'summary':
          setSummary({
            totalCount: data.total_count,
            totalSize: data.total_size,
            cleaned: data.cleaned ?? undefined,
            failed: data.failed ?? undefined,
          });
          break;

        case 'done':
          break;
      }
    });

    return () => { unlisten.then(fn => fn()); };
  }, []);

  const handleDryRun = async () => {
    setPhase('scanning');
    setItems([]);
    setSummary(null);
    setStatusText('');
    setError('');
    setCheckedItems({});
    try {
      await invoke<MoleResult>('mole_purge_streaming', { dryRun: true });
      setPhase('scanned');
    } catch (err) {
      setError(`${err}`);
      setPhase('idle');
    }
  };

  const handleClean = async () => {
    // Collect paths of checked items only
    const selectedPaths = items
      .filter((_, i) => checkedItems[i])
      .map(item => item.path);

    if (selectedPaths.length === 0) return;

    // Save state for error recovery
    const prevItems = [...items];
    const prevChecked = { ...checkedItems };

    setPhase('cleaning');
    setItems([]);
    setSummary(null);
    setStatusText('');
    setError('');
    try {
      await invoke<MoleResult>('mole_purge_paths', { paths: selectedPaths });
      setPhase('cleaned');
    } catch (err) {
      setError(`${err}`);
      // Restore previous state so user can retry
      setItems(prevItems);
      setCheckedItems(prevChecked);
      setPhase('scanned');
    }
  };

  const handleReset = () => {
    setPhase('idle');
    setItems([]);
    setSummary(null);
    setStatusText('');
    setError('');
    setCheckedItems({});
  };

  const isRunning = phase === 'scanning' || phase === 'cleaning';

  // Calculate selected totals
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const selectedSizeMB = items.reduce((acc, item, i) => checkedItems[i] ? acc + item.sizeMB : acc, 0);
  const selectedSizeStr = formatSize(selectedSizeMB);
  const allChecked = items.length > 0 && checkedCount === items.length;

  const toggleItem = (index: number) => {
    setCheckedItems(prev => ({ ...prev, [index]: !prev[index] }));
  };
  const selectAll = () => {
    const next: Record<number, boolean> = {};
    items.forEach((_, i) => { next[i] = true; });
    setCheckedItems(next);
  };
  const deselectAll = () => {
    setCheckedItems({});
  };

  return (
    <div className="page purger">
      <h2><FolderZip24Regular /> {t('purger.title')}</h2>
      <p className="page-desc">{t('purger.desc')}</p>

      <div className={`purge-targets ${phase !== 'idle' ? 'collapsed' : ''}`}>
        {targets.map((tgt, i) => (
          <div key={tgt.id} className={`glass-card purge-card stagger-${i + 1}`}>
            <div className="purge-icon" style={{ color: tgt.color }}>
              <FolderOpen24Regular />
            </div>
            <div className="purge-info">
              <span className="purge-label">{tgt.label}</span>
              <span className="purge-pattern">{tgt.pattern}</span>
            </div>
            {(phase === 'scanned' || phase === 'cleaned') && <Checkmark24Regular className="purge-check" />}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="purge-actions">
        {phase === 'cleaned' ? (
          <>
            <Button size="large" appearance="subtle" icon={<ArrowSync24Regular />} onClick={handleReset}>
              {t('purger.scanAgain')}
            </Button>
          </>
        ) : (
          <>
            <Button size="large" appearance="subtle" icon={<ArrowSync24Regular />} onClick={handleDryRun} disabled={isRunning}>
              {phase === 'scanning' ? t('purger.scanning') : t('purger.dryRun')}
            </Button>
            {phase === 'scanned' && (
              <Button size="large" appearance="primary" icon={<Delete24Regular />} onClick={handleClean} disabled={isRunning || checkedCount === 0}>
                {`${t('purger.startClean')} (${checkedCount}) — ${selectedSizeStr}`}
              </Button>
            )}
          </>
        )}
      </div>

      {/* Select all / Deselect all + total size */}
      {phase === 'scanned' && items.length > 0 && !isRunning && (
        <div className="purge-summary-bar">
          <div className="select-left">
            <button className="link-btn" onClick={allChecked ? deselectAll : selectAll}>
              {allChecked ? t('cleaner.deselectAll') : t('cleaner.selectAll')}
            </button>
            <span className="selected-count">{checkedCount} / {items.length} {t('cleaner.selected')}</span>
          </div>
          <span className="purge-summary-size">{selectedSizeStr}</span>
        </div>
      )}

      {/* Cleaned summary bar */}
      {phase === 'cleaned' && items.length > 0 && (() => {
        // Compute stats from items (always available, fallback if summary missing)
        const successItems = items.filter(it => it.status === 'success');
        const failedItems = items.filter(it => it.status === 'failed');
        const cleanedSizeMB = successItems.reduce((acc, it) => acc + it.sizeMB, 0);
        const cleanedSizeStr = formatSize(cleanedSizeMB);
        const successCount = summary?.cleaned ?? successItems.length;
        const failedCount = summary?.failed ?? failedItems.length;
        const totalSizeStr = summary?.totalSize ?? cleanedSizeStr;

        return (
          <div className="glass-card purge-clean-summary">
            <div className="purge-clean-summary-row">
              <div className="purge-clean-stat success">
                <CheckmarkCircle24Filled className="icon-success" />
                <span className="stat-value">{successCount}</span>
                <span className="stat-label">{t('purger.cleaned')}</span>
              </div>
              {failedCount > 0 && (
                <div className="purge-clean-stat failed">
                  <DismissCircle24Filled className="icon-failed" />
                  <span className="stat-value">{failedCount}</span>
                  <span className="stat-label">{t('purger.failed')}</span>
                </div>
              )}
              <div className="purge-clean-stat total">
                <span className="stat-size">{totalSizeStr}</span>
                <span className="stat-label">{t('purger.freedSpace')}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Running indicator with live status */}
      {isRunning && (
        <div className="glass-card purge-progress">
          <div className="purge-progress-header">
            <Spinner size="tiny" />
            <span>{phase === 'scanning' ? t('purger.scanning') : t('purger.cleaning')}</span>
          </div>
          {statusText && <span className="purge-status-text">{statusText}</span>}
          <ProgressBar />
        </div>
      )}

      {/* Streaming results — items appear one by one */}
      {items.length > 0 && (
        <div className="purge-results">
          {items.map((item, i) => (
            <div key={i} className={`purge-result-item ${item.status === 'failed' ? 'failed' : ''} ${item.status === 'success' ? 'success' : ''}`}>
              {/* Checkbox for dry run items (no status) */}
              {!item.status && phase === 'scanned' && (
                <Checkbox
                  checked={!!checkedItems[i]}
                  onChange={() => toggleItem(i)}
                  className="purge-item-checkbox"
                />
              )}
              <div className="purge-result-icon">
                {item.status === 'success' ? (
                  <CheckmarkCircle24Filled className="icon-success" />
                ) : item.status === 'failed' ? (
                  <DismissCircle24Filled className="icon-failed" />
                ) : (
                  <FolderOpen24Regular className="icon-folder" />
                )}
              </div>
              <div className="purge-result-info">
                <span className="purge-result-name">{item.name}</span>
                <span className="purge-result-path">{item.path}</span>
              </div>
              {item.sizeMB > 0 && (
                <span className={`purge-result-size ${item.sizeMB >= 1024 ? 'large' : item.sizeMB >= 100 ? 'medium' : ''}`}>
                  {formatSize(item.sizeMB)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="glass-card result-output error">
          <pre>{error}</pre>
        </div>
      )}
    </div>
  );
}
