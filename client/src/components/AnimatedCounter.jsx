import { useEffect, useState } from 'react';

// Numerator i animuar nga 0 deri te `to`.
// Perdorim easeOutCubic per nje ndjesi me natyrale.

export default function AnimatedCounter({ to, durationMs = 1200, suffix = '' }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (to == null) return;
    let raf;
    const start = performance.now();
    const target = Number(to);

    function frame(now) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [to, durationMs]);

  return <>{value}{suffix}</>;
}
