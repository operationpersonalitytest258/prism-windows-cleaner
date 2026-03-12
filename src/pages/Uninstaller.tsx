import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AppsList24Regular,
  Search24Regular,
  ArrowSort24Regular,
  Delete24Regular,
  Info24Regular,
} from '@fluentui/react-icons';
import { invoke } from '@tauri-apps/api/core';
import { Button, Spinner } from '@fluentui/react-components';
import './Uninstaller.css';

interface InstalledApp {
  name: string; publisher: string; version: string;
  size_kb: number; size_human: string; source: string;
}

function formatSize(kb: number): string {
  if (kb <= 0) return 'N/A';
  if (kb < 1024) return `${kb} KB`;
  if (kb < 1048576) return `${(kb / 1024).toFixed(1)} MB`;
  return `${(kb / 1048576).toFixed(1)} GB`;
}

type SortField = 'name' | 'size' | 'publisher';

export function Uninstaller() {
  const { t } = useTranslation();
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('size');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [uninstalling, setUninstalling] = useState(false);

  const loadApps = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await invoke<InstalledApp[]>('list_installed_apps');
      setApps(list);
    } catch (err) {
      setError(t('uninstaller.loadError', { error: String(err) }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadApps(); }, []);

  const filteredAndSorted = useMemo(() => {
    let list = apps.filter((a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.publisher ?? '').toLowerCase().includes(search.toLowerCase())
    );
    list.sort((a, b) => {
      switch (sortBy) {
        case 'size': return (b.size_kb ?? 0) - (a.size_kb ?? 0);
        case 'name': return a.name.localeCompare(b.name);
        case 'publisher': return (a.publisher ?? '').localeCompare(b.publisher ?? '');
        default: return 0;
      }
    });
    return list;
  }, [apps, search, sortBy]);

  const toggleSelect = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const totalSelectedSize = useMemo(
    () => apps.filter((a) => selected.has(a.name)).reduce((s, a) => s + (a.size_kb ?? 0), 0),
    [apps, selected]
  );

  const cycleSortField = () => {
    const fields: SortField[] = ['size', 'name', 'publisher'];
    const idx = fields.indexOf(sortBy);
    setSortBy(fields[(idx + 1) % fields.length]);
  };

  const sortLabel = {
    size: t('uninstaller.sortSize'),
    name: t('uninstaller.sortName'),
    publisher: t('uninstaller.sortPublisher'),
  }[sortBy];

  return (
    <div className="page uninstaller">
      <h2><AppsList24Regular /> {t('uninstaller.title')}</h2>
      <p className="page-desc">
        {t('uninstaller.desc', { count: apps.length })}
      </p>

      <div className="uninstaller-toolbar glass-card stagger-1">
        <div className="search-box">
          <Search24Regular />
          <input type="text" placeholder={t('uninstaller.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="sort-btn" onClick={cycleSortField}>
          <ArrowSort24Regular /> {sortLabel}
        </button>
      </div>

      {loading && (
        <div className="glass-card loading-card stagger-2">
          <Spinner size="small" /> {t('uninstaller.scanning')}
        </div>
      )}

      {error && !loading && (
        <div className="glass-card error-banner stagger-2">
          <Info24Regular /> {error}
        </div>
      )}

      <div className="app-list stagger-2">
        {filteredAndSorted.map((app) => (
          <div key={app.name} className={`app-row glass-card ${selected.has(app.name) ? 'selected' : ''}`} onClick={() => toggleSelect(app.name)}>
            <div className="app-checkbox">
              <div className={`checkbox ${selected.has(app.name) ? 'checked' : ''}`} />
            </div>
            <div className="app-info">
              <span className="app-name">{app.name}</span>
              <span className="app-meta">
                {app.publisher || t('uninstaller.unknown')} · v{app.version || '?'}
                {app.source === 'WindowsStore' && <span className="badge-uwp">UWP</span>}
              </span>
            </div>
            <span className="app-size">{formatSize(app.size_kb)}</span>
          </div>
        ))}
        {filteredAndSorted.length === 0 && !loading && (
          <div className="glass-card empty-state">{t('uninstaller.noResults')}</div>
        )}
      </div>

      {selected.size > 0 && (
        <div className="uninstaller-footer glass-card">
          <span>{t('uninstaller.selected', { count: selected.size, size: formatSize(totalSelectedSize) })}</span>
          <Button
            appearance="primary" icon={<Delete24Regular />} size="medium" disabled={uninstalling}
            onClick={async () => {
              const names = Array.from(selected);
              if (!confirm(t('uninstaller.confirmTitle', { count: names.length, names: names.join('\n') }))) return;
              setUninstalling(true);
              try {
                for (const name of names) {
                  try {
                    await invoke<{ success: boolean; stdout: string; stderr: string }>('mole_uninstall_app', { appName: name });
                  } catch (err) { console.error(`Failed to uninstall ${name}:`, err); }
                }
                setSelected(new Set());
                loadApps();
              } finally { setUninstalling(false); }
            }}
          >
            {uninstalling ? t('uninstaller.uninstalling') : t('uninstaller.uninstall')}
          </Button>
        </div>
      )}
    </div>
  );
}
