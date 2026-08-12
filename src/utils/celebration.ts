import confetti from 'canvas-confetti';

export function triggerConfetti(options?: {
  particleCount?: number;
  spread?: number;
  colors?: string[];
}) {
  const defaults = {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#f97316', '#fbbf24', '#fca5a5', '#ff6b6b'] // orange + gold + red
  };

  const config = { ...defaults, ...options };

  return confetti(config as confetti.Options);
}

export function triggerSmallConfetti() {
  triggerConfetti({
    particleCount: 50,
    spread: 45
  });
}

export function triggerBigConfetti() {
  triggerConfetti({
    particleCount: 150,
    spread: 90,
    colors: ['#f97316', '#fbbf24', '#fca5a5', '#ff6b6b', '#a78bfa']
  });
}
