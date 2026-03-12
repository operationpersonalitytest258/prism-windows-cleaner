import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  ProgressBar,
  Spinner,
} from '@fluentui/react-components';
import {
  Globe24Regular,
  FolderOpen24Regular,
  Document24Regular,
  Apps24Regular,
  Delete24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';
import { invoke } from '@tauri-apps/api/core';
import type { MoleResult } from '../types';
import './Cleaner.css';

export function Cleaner() {
  const { t } = useTranslation();
  const [scanning, setScanning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState('');

  const categories = [
    { id: 'browser', label: t('cleaner.browserCache'), icon: <Globe24Regular />, color: 'var(--color-blue)', desc: t('cleaner.browserCacheDesc') },
    { id: 'temp', label: t('cleaner.systemTemp'), icon: <FolderOpen24Regular />, color: 'var(--color-amber)', desc: t('cleaner.systemTempDesc') },
    { id: 'logs', label: t('cleaner.logs'), icon: <Document24Regular />, color: 'var(--color-purple)', desc: t('cleaner.logsDesc') },
    { id: 'apps', label: t('cleaner.appLeftovers'), icon: <Apps24Regular />, color: 'var(--color-cyan)', desc: t('cleaner.appLeftoversDesc') },
  ];

  const handleScan = async () => {
    setScanning(true);
    setResult('');
    try {
      const res = await invoke<MoleResult>('mole_clean', { dryRun: true });
      setResult(res.stdout || res.stderr);
      setScanned(true);
    } catch (err) {
      setResult(`Error: ${err}`);
    } finally {
      setScanning(false);
    }
  };

  const handleClean = async () => {
    setCleaning(true);
    try {
      const res = await invoke<MoleResult>('mole_clean', { dryRun: false });
      setResult(res.stdout || res.stderr);
    } catch (err) {
      setResult(`Error: ${err}`);
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="page cleaner">
      <div className="page-header">
        <h2><Delete24Regular /> {t('cleaner.title')}</h2>
        <p className="page-desc">{t('cleaner.desc')}</p>
      </div>

      <div className="cleaner-categories">
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

      {scanning && (
        <div className="glass-card scan-progress">
          <div className="scan-header">
            <Spinner size="tiny" />
            <span>{t('cleaner.scanning')}</span>
          </div>
          <ProgressBar />
        </div>
      )}

      {result && (
        <div className="glass-card result-output">
          <pre>{result}</pre>
        </div>
      )}

      <div className="cleaner-actions">
        <Button appearance="primary" size="large" icon={scanning ? undefined : <Delete24Regular />} onClick={handleScan} disabled={scanning || cleaning}>
          {scanning ? t('cleaner.scanning') : t('cleaner.scan')}
        </Button>
        {scanned && (
          <Button appearance="primary" size="large" icon={cleaning ? undefined : <Checkmark24Regular />} onClick={handleClean} disabled={scanning || cleaning}>
            {cleaning ? t('cleaner.cleaning') : t('cleaner.clean')}
          </Button>
        )}
      </div>
    </div>
  );
}
