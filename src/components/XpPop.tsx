import { useEffect, useState } from 'react';

interface XpPopProps {
  /** Increment to retrigger the pop */
  trigger: number;
  amount?: number;
  label?: string;
}

/** Brief floating “+XP” toast for first-try correct answers. */
export function XpPop({ trigger, amount = 2, label = 'XP' }: XpPopProps) {
  const [visible, setVisible] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (trigger <= 0) return;
    setKey((k) => k + 1);
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 900);
    return () => window.clearTimeout(t);
  }, [trigger]);

  if (!visible) return null;

  return (
    <div key={key} className="xp-pop" aria-live="polite">
      +{amount} {label}
    </div>
  );
}
