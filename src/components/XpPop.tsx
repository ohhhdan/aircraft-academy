import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface XpPopProps {
  /** Increment to retrigger the pop */
  trigger: number;
  amount?: number;
  label?: string;
}

/** Brief floating “+XP” toast for first-try correct answers. */
export function XpPop({ trigger, amount = 2, label = 'XP' }: XpPopProps) {
  const [shown, setShown] = useState<{ key: number; amount: number; label: string } | null>(null);

  useEffect(() => {
    if (trigger <= 0) return;
    setShown({ key: trigger, amount, label });
    const t = window.setTimeout(() => setShown(null), 1600);
    return () => window.clearTimeout(t);
  }, [trigger, amount, label]);

  if (!shown || typeof document === 'undefined') return null;

  return createPortal(
    <div key={shown.key} className="xp-pop" role="status" aria-live="polite">
      +{shown.amount} {shown.label}
    </div>,
    document.body
  );
}
