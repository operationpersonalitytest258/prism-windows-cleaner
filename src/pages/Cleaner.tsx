import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Spinner,
  Checkbox,
} from '@fluentui/react-components';
import {
  Globe24Regular,
  FolderOpen24Regular,
  Document24Regular,
  Apps24Regular,
  Delete24Regular,
  Checkmark24Regular,
  CheckmarkCircle24Filled,
  ChevronDown24Regular,
  ChevronRight24Regular,
} from '@fluentui/react-icons';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { MoleResult } from '../types';
import './Cleaner.css';

interface ScanItem {
  name: string;
  size: string;
  count?: number;
}

interface ScanSection {
  name: string;
  items: ScanItem[];
  done: boolean;
}

type ScanEvent =
  | { type: 'section'; name: string }
  | { type: 'item'; name: string; size: string; count?: number }
  | { type: 'success'; name: string }
  | { type: 'info'; text: string }
  | { type: 'done'; success: boolean };

export function Cleaner() {
  const { t } = useTranslation();
  const [scanning, setScanning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [sections, setSections] = useState<ScanSection[]>([]);
  const [_infoLines, setInfoLines] = useState<string[]>([]);
  const [scanDone, setScanDone] = useState(false);
  const [error, setError] = useState('');
  const [checkedSections, setCheckedSections] = useState<Record<number, boolean>>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  // Expanded/collapsed sections
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  const categories = [
    { id: 'browser', label: t('cleaner.browserCache'), icon: <Globe24Regular />, color: 'var(--color-blue)', desc: t('cleaner.browserCacheDesc') },
    { id: 'temp', label: t('cleaner.systemTemp'), icon: <FolderOpen24Regular />, color: 'var(--color-amber)', desc: t('cleaner.systemTempDesc') },
    { id: 'logs', label: t('cleaner.logs'), icon: <Document24Regular />, color: 'var(--color-purple)', desc: t('cleaner.logsDesc') },
    { id: 'apps', label: t('cleaner.appLeftovers'), icon: <Apps24Regular />, color: 'var(--color-cyan)', desc: t('cleaner.appLeftoversDesc') },
  ];



  // When sections arrive, auto-check and auto-expand all
  // eslint-disable-next-line react-hooks/exhaustive-deps — intentionally excluding checked/expanded states to avoid infinite re-render loops
  useEffect(() => {
    const newChecked: Record<number, boolean> = {};
    const newExpanded: Record<number, boolean> = {};
    const newCheckedItems: Record<string, boolean> = {};
    sections.forEach((s, i) => {
      if (checkedSections[i] === undefined) newChecked[i] = true;
      else newChecked[i] = checkedSections[i];
      if (expandedSections[i] === undefined) newExpanded[i] = true;
      else newExpanded[i] = expandedSections[i];

      s.items.forEach((_, ii) => {
        const key = `${i}-${ii}`;
        if (checkedItems[key] === undefined) newCheckedItems[key] = true;
        else newCheckedItems[key] = checkedItems[key];
      });
    });
    setCheckedSections(newChecked);
    setExpandedSections(newExpanded);
    setCheckedItems(newCheckedItems);
  }, [sections]);

  const toggleSection = (idx: number) => {
    const newState = !checkedSections[idx];
    setCheckedSections(prev => ({ ...prev, [idx]: newState }));
    
    // Also toggle all items in this section
    const section = sections[idx];
    if (section) {
      setCheckedItems(prev => {
        const updated = { ...prev };
        section.items.forEach((_, ii) => {
          updated[`${idx}-${ii}`] = newState;
        });
        return updated;
      });
    }
  };

  const toggleItem = (si: number, ii: number) => {
    const key = `${si}-${ii}`;
    setCheckedItems(prev => {
      const newState = !prev[key];
      const updated = { ...prev, [key]: newState };
      
      // Update section checkbox if all items are unchecked or at least one is checked?
      // For simplicity, let's keep section checked if any item is checked.
      const section = sections[si];
      const anyChecked = section.items.some((_, idx) => updated[`${si}-${idx}`]);
      setCheckedSections(ps => ({ ...ps, [si]: anyChecked }));
      
      return updated;
    });
  };

  const toggleExpand = (idx: number) => {
    setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const selectAll = () => {
    const allSec: Record<number, boolean> = {};
    const allItm: Record<string, boolean> = {};
    sections.forEach((s, i) => { 
      allSec[i] = true; 
      s.items.forEach((_, ii) => { allItm[`${i}-${ii}`] = true; });
    });
    setCheckedSections(allSec);
    setCheckedItems(allItm);
  };

  const deselectAll = () => {
    const allSec: Record<number, boolean> = {};
    const allItm: Record<string, boolean> = {};
    sections.forEach((s, i) => { 
      allSec[i] = false; 
      s.items.forEach((_, ii) => { allItm[`${i}-${ii}`] = false; });
    });
    setCheckedSections(allSec);
    setCheckedItems(allItm);
  };

  const checkedCount = Object.values(checkedSections).filter(Boolean).length;
  const allChecked = checkedCount === sections.length && sections.length > 0;

  // Parse size string to bytes
  const parseBytes = (sizeStr: string): number => {
    const match = sizeStr.match(/([\d.]+)\s*(KB|MB|GB|B)/i);
    if (!match) return 0;
    const val = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    if (unit === 'GB') return val * 1024 * 1024 * 1024;
    if (unit === 'MB') return val * 1024 * 1024;
    if (unit === 'KB') return val * 1024;
    return val;
  };

  // Format bytes to human-readable
  const formatBytes = (bytes: number): string => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024*1024*1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024*1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${Math.round(bytes)} B`;
  };

  // Compute section size from items
  const getSectionSize = (section: ScanSection): string => {
    let totalBytes = 0;
    let hasSize = false;
    for (const item of section.items) {
      if (item.size) {
        hasSize = true;
        totalBytes += parseBytes(item.size);
      }
    }
    if (!hasSize) return '';
    return formatBytes(totalBytes);
  };

  // Calculate total size of only checked items
  const getSelectedTotalSize = (): { size: string; bytes: number; itemCount: number } => {
    let totalBytes = 0;
    let itemCount = 0;
    sections.forEach((section, si) => {
      if (checkedSections[si] === false) return;
      section.items.forEach((item, ii) => {
        const key = `${si}-${ii}`;
        if (checkedItems[key] === false) return;
        itemCount++;
        if (item.size) {
          totalBytes += parseBytes(item.size);
        }
      });
    });
    return { size: formatBytes(totalBytes), bytes: totalBytes, itemCount };
  };

  const selectedTotal = scanned ? getSelectedTotalSize() : { size: '0 B', bytes: 0, itemCount: 0 };

  const handleScan = async () => {
    setScanning(true);
    setSections([]);
    setInfoLines([]);
    setScanDone(false);
    setError('');
    setScanned(false);
    setCheckedSections({});
    setCheckedItems({});
    setExpandedSections({});

    try {
      await invoke<MoleResult>('mole_clean_streaming', { 
        dryRun: true,
        excludeSections: null,
        excludeItems: null
      });
      setScanned(true);
    } catch (err) {
      setError(`${err}`);
    } finally {
      setScanning(false);
    }
  };

  const handleClean = async () => {
    const uncheckedSections: string[] = [];
    const uncheckedItems: string[] = [];

    sections.forEach((s, i) => {
      if (!checkedSections[i]) {
        uncheckedSections.push(s.name);
      } else {
        s.items.forEach((item, ii) => {
          if (!checkedItems[`${i}-${ii}`]) {
            uncheckedItems.push(item.name);
          }
        });
      }
    });

    setCleaning(true);
    setSections([]);
    setInfoLines([]);
    setScanDone(false);
    setError('');

    try {
      await invoke<MoleResult>('mole_clean_streaming', { 
        dryRun: false,
        excludeSections: uncheckedSections.length > 0 ? uncheckedSections : null,
        excludeItems: uncheckedItems.length > 0 ? uncheckedItems : null
      });
    } catch (err) {
      setError(`${err}`);
    } finally {
      setCleaning(false);
    }
  };

  // Listen for scan-progress events
  useEffect(() => {
    const unlisten = listen<ScanEvent>('scan-progress', (event) => {
      const data = event.payload;

      switch (data.type) {
        case 'section':
          setSections(prev => {
            // Close previous section
            const updated = prev.map((s, i) =>
              i === prev.length - 1 ? { ...s, done: true } : s
            );
            return [...updated, { name: data.name, items: [], done: false }];
          });
          break;

        case 'item':
          setSections(prev => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            return [
              ...prev.slice(0, -1),
              { ...last, items: [...last.items, { name: data.name, size: data.size, count: data.count ?? undefined }] }
            ];
          });
          break;

        case 'success':
          setSections(prev => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            return [
              ...prev.slice(0, -1),
              { ...last, items: [...last.items, { name: data.name, size: '' }] }
            ];
          });
          break;

        case 'info':
          setInfoLines(prev => [...prev, data.text]);
          break;

        case 'done':
          setSections(prev => prev.map(s => ({ ...s, done: true })));
          setScanDone(true);
          break;
      }
    });

    return () => { unlisten.then(fn => fn()); };
  }, []);

  return (
    <div className="page cleaner">
      <div className="page-header">
        <h2><Delete24Regular /> {t('cleaner.title')}</h2>
        <p className="page-desc">{t('cleaner.desc')}</p>
      </div>

      {/* Category cards — collapse after scan to save space */}
      <div className={`cleaner-categories ${scanned ? 'collapsed' : ''}`}>
        {categories.map((cat, i) => (
          <div key={cat.id} className={`glass-card category-card stagger-${i + 1}`}>
            <div className="category-icon" style={{ color: cat.color }}>{cat.icon}</div>
            <div className="category-info">
              <span className="category-label">{cat.label}</span>
              <span className="category-desc">{cat.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons — always visible */}
      <div className="cleaner-actions">
        <Button appearance="primary" size="large" icon={scanning ? undefined : <Delete24Regular />} onClick={handleScan} disabled={scanning || cleaning}>
          {scanning ? t('cleaner.scanning') : t('cleaner.scan')}
        </Button>
        {scanned && (
          <Button appearance="primary" size="large" icon={cleaning ? undefined : <Checkmark24Regular />} onClick={handleClean} disabled={scanning || cleaning || checkedCount === 0}>
            {cleaning ? t('cleaner.cleaning') : `${t('cleaner.clean')} (${checkedCount}) — ${selectedTotal.size}`}
          </Button>
        )}
      </div>

      {/* Select all / Deselect all + total size */}
      {scanned && sections.length > 0 && !scanning && !cleaning && (
        <div className="select-actions">
          <div className="select-left">
            <button className="link-btn" onClick={allChecked ? deselectAll : selectAll}>
              {allChecked ? t('cleaner.deselectAll') : t('cleaner.selectAll')}
            </button>
            <span className="selected-count">{checkedCount} / {sections.length} {t('cleaner.selected')}</span>
          </div>
          {selectedTotal.bytes > 0 && (
            <span className="selected-total-size">{selectedTotal.size}</span>
          )}
        </div>
      )}

      {/* Streaming scan results */}
      {(sections.length > 0 || scanning || cleaning) && (
        <div className="scan-results">
          {sections.map((section, si) => (
            <div key={si} className={`glass-card scan-section ${section.done ? 'done' : 'active'} ${checkedSections[si] === false ? 'unchecked' : ''}`}>
              <div className="scan-section-header">
                <span className="scan-section-left">
                  {/* Checkbox */}
                  {scanned && section.done && !scanning && !cleaning && (
                    <Checkbox
                      checked={checkedSections[si] !== false}
                      onChange={() => toggleSection(si)}
                      className="section-checkbox"
                    />
                  )}
                  {/* Icon */}
                  {section.done
                    ? <CheckmarkCircle24Filled className="section-icon done" />
                    : <Spinner size="tiny" className="section-icon" />
                  }
                  {/* Name */}
                  <span className="scan-section-name-text">{section.name}</span>
                </span>
                <span className="scan-section-right">
                  {/* Section total size */}
                  {(() => {
                    const sectionSize = section.done ? getSectionSize(section) : '';
                    return sectionSize ? <span className="scan-section-size">{sectionSize}</span> : null;
                  })()}
                  {/* Item count badge */}
                  {section.items.length > 0 && (
                    <span className="scan-section-count">{section.items.length} {t('cleaner.itemsLabel')}</span>
                  )}
                  {/* Expand/collapse toggle */}
                  {section.items.length > 0 && (
                    <button className="expand-btn" onClick={() => toggleExpand(si)}>
                      {expandedSections[si] !== false ? <ChevronDown24Regular /> : <ChevronRight24Regular />}
                    </button>
                  )}
                </span>
              </div>
              {/* Items list — collapsible */}
              {section.items.length > 0 && expandedSections[si] !== false && (
                <div className="scan-items">
                  {section.items.map((item, ii) => (
                    <div key={ii} className={`scan-item ${checkedItems[`${si}-${ii}`] === false ? 'unchecked' : ''}`}>
                      <span className="scan-item-left">
                        {scanned && section.done && !scanning && !cleaning && (
                          <Checkbox
                            checked={checkedItems[`${si}-${ii}`] !== false}
                            onChange={() => toggleItem(si, ii)}
                            className="item-checkbox"
                          />
                        )}
                        <span className="scan-item-name">{item.name}</span>
                      </span>
                      <div className="scan-item-meta">
                        {item.count != null && item.count > 0 && (
                          <span className="scan-item-count">{item.count} {t('cleaner.itemsLabel')}</span>
                        )}
                        {item.size && <span className="scan-item-size">{item.size}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Active scanning indicator */}
          {(scanning || cleaning) && !scanDone && (
            <div className="glass-card scan-section active scanning-pulse">
              <div className="scan-section-header">
                <span className="scan-section-left">
                  <Spinner size="tiny" className="section-icon" />
                  <span className="scan-section-name-text">
                    {scanning ? t('cleaner.scanningProgress') : t('cleaner.cleaningProgress')}
                  </span>
                </span>
              </div>
            </div>
          )}
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
