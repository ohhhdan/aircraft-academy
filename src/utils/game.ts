/** Local calendar day key YYYY-MM-DD */
export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function yesterdayKey(d = new Date()): string {
  const y = new Date(d);
  y.setDate(y.getDate() - 1);
  return todayKey(y);
}

export function calcStreakAfterPractice(
  prevStreak: number,
  lastPracticeDate: string | null,
  now = new Date()
): { streak: number; isNewDay: boolean } {
  const today = todayKey(now);
  if (lastPracticeDate === today) {
    return { streak: Math.max(1, prevStreak), isNewDay: false };
  }
  if (lastPracticeDate === yesterdayKey(now)) {
    return { streak: Math.max(1, prevStreak) + 1, isNewDay: true };
  }
  return { streak: 1, isNewDay: true };
}
