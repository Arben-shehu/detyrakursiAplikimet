import { useEffect, useRef, useState } from 'react';

// Timer qe nis nga startedAt-i i marre nga server-i.
// Thirret onTimeUp() vetem nje here kur arrin 0.

export default function Timer({ startedAt, limitMinutes, onTimeUp }) {
  const [remaining, setRemaining] = useState(() => compute(startedAt, limitMinutes));
  const firedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      const left = compute(startedAt, limitMinutes);
      setRemaining(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        clearInterval(id);
        onTimeUp && onTimeUp();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt, limitMinutes, onTimeUp]);

  const mins = Math.max(0, Math.floor(remaining / 60));
  const secs = Math.max(0, remaining % 60);
  const warn = remaining <= 60;

  return (
    <div className={`timer ${warn ? 'timer-warn' : ''}`}>
      Koha: {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  );
}

function compute(startedAt, limitMinutes) {
  const start = new Date(startedAt).getTime();
  const elapsed = Math.floor((Date.now() - start) / 1000);
  return Math.max(0, limitMinutes * 60 - elapsed);
}
