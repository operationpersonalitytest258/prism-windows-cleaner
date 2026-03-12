import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FolderZip24Regular,
  Delete24Regular,
  Checkmark24Regular,
  FolderOpen24Regular,
} from '@fluentui/react-icons';
import { invoke } from '@tauri-apps/api/core';
import { Button, Spinner, ProgressBar } from '@fluentui/react-components';
import type { MoleResult } from '../types';
import './Purger.css';

const targets = [
  { id: 'node', label: 'node_modules', pattern: '**/node_modules', color: 'var(--color-accent)' },
  { id: 'gradle', label: '.gradle / build', pattern: '**/.gradle, **/build', color: 'var(--color-blue)' },
  { id: 'cargo', label: 'target (Rust)', pattern: '**/target', color: 'var(--color-amber)' },
  { id: 'dart', label: '.dart_tool / build', pattern: '**/.dart_tool', color: 'var(--color-cyan)' },
  { id: 'python', label: '__pycache__ / .venv', pattern: '**/__pycache__', color: 'var(--color-purple)' },
  { id: 'dotnet', label: 'bin / obj (.NET)', pattern: '**/bin, **/obj', color: 'var(--color-red)' },
];

export function Purger() {
  const { t } = useTranslation();
  const [running, setRunning] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [done, setDone] = useState(false);
  const [output, setOutput] = useState('');

  const handlePurge = async (preview: boolean) => {
    setRunning(true);
    setDryRun(preview);
    setDone(false);
    setOutput('');
    try {
      const res = await invoke<MoleResult>('mole_purge', { dryRun: preview });
      setOutput(res.stdout || res.stderr || t('common.done'));
      setDone(true);
    } catch (err) {
      setOutput(`Error: ${err}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="page purger">
      <h2><FolderZip24Regular /> {t('purger.title')}</h2>
      <p className="page-desc">{t('purger.desc')}</p>

      <div className="purge-targets">
        {targets.map((tgt, i) => (
          <div key={tgt.id} className={`glass-card purge-card stagger-${i + 1}`}>
            <div className="purge-icon" style={{ color: tgt.color }}>
              <FolderOpen24Regular />
            </div>
            <div className="purge-info">
              <span className="purge-label">{tgt.label}</span>
              <span className="purge-pattern">{tgt.pattern}</span>
            </div>
            {done && <Checkmark24Regular className="purge-check" />}
          </div>
        ))}
      </div>

      {running && (
        <div className="glass-card purge-progress">
          <div className="purge-progress-header">
            <Spinner size="tiny" />
            <span>{dryRun ? t('purger.scanning') : t('purger.cleaning')}</span>
          </div>
          <ProgressBar />
        </div>
      )}

      {output && (
        <div className="glass-card result-output">
          <pre>{output}</pre>
        </div>
      )}

      <div className="purge-actions">
        <Button size="large" appearance="subtle" onClick={() => handlePurge(true)} disabled={running}>
          {t('purger.dryRun')}
        </Button>
        <Button size="large" appearance="primary" icon={<Delete24Regular />} onClick={() => handlePurge(false)} disabled={running}>
          {running ? t('purger.cleaning') : t('purger.startClean')}
        </Button>
      </div>
    </div>
  );
}
