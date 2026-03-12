import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Flash24Regular,
  Wifi124Regular,
  Storage24Regular,
  ArrowSync24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';
import { invoke } from '@tauri-apps/api/core';
import { Button, Spinner, ProgressBar } from '@fluentui/react-components';
import type { MoleResult } from '../types';
import './Optimizer.css';

export function Optimizer() {
  const { t } = useTranslation();
  const [running, setRunning] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [done, setDone] = useState(false);
  const [output, setOutput] = useState('');

  const tasks = [
    { id: 'dns', label: t('optimizer.dns'), desc: t('optimizer.dnsDesc'), icon: <Wifi124Regular />, color: 'var(--color-blue)' },
    { id: 'icon', label: t('optimizer.icon'), desc: t('optimizer.iconDesc'), icon: <Storage24Regular />, color: 'var(--color-amber)' },
    { id: 'font', label: t('optimizer.font'), desc: t('optimizer.fontDesc'), icon: <Flash24Regular />, color: 'var(--color-purple)' },
    { id: 'thumbnail', label: t('optimizer.thumbnail'), desc: t('optimizer.thumbnailDesc'), icon: <ArrowSync24Regular />, color: 'var(--color-cyan)' },
  ];

  const handleOptimize = async (preview: boolean) => {
    setRunning(true);
    setDryRun(preview);
    setDone(false);
    setOutput('');
    try {
      const res = await invoke<MoleResult>('mole_optimize', { dryRun: preview });
      setOutput(res.stdout || res.stderr || t('common.done'));
      setDone(true);
    } catch (err) {
      setOutput(`Error: ${err}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="page optimizer">
      <h2><Flash24Regular /> {t('optimizer.title')}</h2>
      <p className="page-desc">{t('optimizer.desc')}</p>

      <div className="opt-tasks">
        {tasks.map((task, i) => (
          <div key={task.id} className={`glass-card opt-card stagger-${i + 1}`}>
            <div className="opt-icon" style={{ color: task.color }}>{task.icon}</div>
            <div className="opt-info">
              <span className="opt-label">{task.label}</span>
              <span className="opt-desc">{task.desc}</span>
            </div>
            {done && <Checkmark24Regular className="opt-check" />}
          </div>
        ))}
      </div>

      {running && (
        <div className="glass-card opt-progress">
          <Spinner size="tiny" /> <span>{dryRun ? t('optimizer.previewing') : t('optimizer.running')}</span>
          <ProgressBar />
        </div>
      )}

      {output && (
        <div className="glass-card result-output">
          <pre>{output}</pre>
        </div>
      )}

      <div className="opt-actions">
        <Button size="large" appearance="subtle" onClick={() => handleOptimize(true)} disabled={running}>
          {t('optimizer.preview')}
        </Button>
        <Button size="large" appearance="primary" icon={<Flash24Regular />} onClick={() => handleOptimize(false)} disabled={running}>
          {running ? t('optimizer.running') : t('optimizer.start')}
        </Button>
      </div>
    </div>
  );
}
