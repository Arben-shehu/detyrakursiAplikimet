import { useEffect, useState } from 'react';

// Progress circle me SVG: nje rrethi me strokeDashoffset qe animohet
// nga 100% (i zbrazet) drejt vleres `percentage`.

export default function ScoreCircle({ percentage = 0, size = 180, strokeWidth = 12, label }) {
  const [animated, setAnimated] = useState(0);
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (animated / 100) * circumference;

  useEffect(() => {
    let raf;
    const start = performance.now();
    const dur = 1500;
    function frame(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimated(eased * percentage);
      if (t < 1) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [percentage]);

  const color = percentage >= 70 ? 'var(--ok)' : percentage >= 50 ? 'var(--warn)' : 'var(--danger)';

  return (
    <div className="score-circle" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="var(--border)" strokeWidth={strokeWidth} fill="none"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke 0.3s' }}
        />
      </svg>
      <div className="score-circle-inner">
        <div className="score-circle-pct">{Math.round(animated)}%</div>
        {label && <div className="score-circle-label">{label}</div>}
      </div>
    </div>
  );
}
