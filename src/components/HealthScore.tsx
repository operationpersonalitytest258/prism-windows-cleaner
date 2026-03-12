import { useTranslation } from 'react-i18next';
import './HealthScore.css';

interface HealthScoreProps {
  score: number;
}

export function HealthScore({ score }: HealthScoreProps) {
  const { t } = useTranslation();
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return 'var(--color-accent)';
    if (score >= 60) return 'var(--color-amber)';
    return 'var(--color-red)';
  };

  const getLabel = () => {
    if (score >= 80) return t('health.good');
    if (score >= 60) return t('health.fair');
    return t('health.attention');
  };

  const color = getColor();

  return (
    <div className="health-score glass-card stagger-1">
      <svg viewBox="0 0 120 120" className="health-ring">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="60" cy="60" r="52" className="health-ring-bg" />
        <circle
          cx="60"
          cy="60"
          r="52"
          className="health-ring-fill"
          filter="url(#glow)"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            stroke: color,
          }}
        />
      </svg>
      <div className="health-score-value">
        <span className="health-score-number" style={{ color }}>
          {score}
        </span>
        <span className="health-score-label">{getLabel()}</span>
      </div>
    </div>
  );
}
