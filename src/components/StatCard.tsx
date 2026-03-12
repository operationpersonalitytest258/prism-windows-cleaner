interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color?: string;
  stagger?: number;
  progress?: number; // 0-100 percentage
}

export function StatCard({
  icon,
  label,
  value,
  sub,
  color = 'var(--color-blue)',
  stagger = 1,
  progress,
}: StatCardProps) {
  return (
    <div className={`glass-card stat-card stagger-${stagger}`}>
      <div className="stat-card-icon" style={{ color }}>
        {icon}
      </div>
      <div className="stat-card-info">
        <span className="stat-card-value">{value}</span>
        <span className="stat-card-label">{label}</span>
        {sub && <span className="stat-card-sub">{sub}</span>}
        {progress !== undefined && (
          <div className="stat-card-progress">
            <div
              className="stat-card-progress-fill"
              style={{
                width: `${progress}%`,
                backgroundColor: color,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
