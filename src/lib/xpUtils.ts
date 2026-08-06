export interface XpTier {
  level: number;
  name: string;
  icon: string;
  badgeColor: string;
  minXp: number;
  maxXp: number | null; // null if top tier
}

export const XP_TIERS: XpTier[] = [
  { level: 1, name: 'Rookie', icon: '🌱', badgeColor: '#10b981', minXp: 0, maxXp: 200 },
  { level: 2, name: 'Challenger', icon: '🔥', badgeColor: '#f97316', minXp: 200, maxXp: 500 },
  { level: 3, name: 'Warrior', icon: '⚡', badgeColor: '#3b82f6', minXp: 500, maxXp: 1000 },
  { level: 4, name: 'Legend', icon: '🏆', badgeColor: '#eab308', minXp: 1000, maxXp: 2000 },
  { level: 5, name: 'Grand Master', icon: '👑', badgeColor: '#a855f7', minXp: 2000, maxXp: null },
];

export interface XpLevelInfo {
  level: number;
  name: string;
  icon: string;
  title: string;
  badgeColor: string;
  minXp: number;
  maxXp: number | null;
  currentXp: number;
  progress: number; // 0 - 100%
  xpInLevel: number;
  xpNeeded: number | null;
  nextTier: XpTier | null;
}

export function getXpLevel(totalXp: number = 0): XpLevelInfo {
  const xp = Math.max(0, Math.floor(totalXp || 0));
  
  // Find matching tier
  let currentTier = XP_TIERS[0];
  for (let i = XP_TIERS.length - 1; i >= 0; i--) {
    if (xp >= XP_TIERS[i].minXp) {
      currentTier = XP_TIERS[i];
      break;
    }
  }

  const nextTierIndex = XP_TIERS.findIndex(t => t.level === currentTier.level + 1);
  const nextTier = nextTierIndex !== -1 ? XP_TIERS[nextTierIndex] : null;

  if (!currentTier.maxXp || !nextTier) {
    // Max Level reached
    return {
      level: currentTier.level,
      name: currentTier.name,
      icon: currentTier.icon,
      title: `${currentTier.icon} ${currentTier.name}`,
      badgeColor: currentTier.badgeColor,
      minXp: currentTier.minXp,
      maxXp: null,
      currentXp: xp,
      progress: 100,
      xpInLevel: xp - currentTier.minXp,
      xpNeeded: null,
      nextTier: null,
    };
  }

  const range = currentTier.maxXp - currentTier.minXp;
  const xpInLevel = Math.max(0, xp - currentTier.minXp);
  const progress = Math.min(100, Math.max(0, Math.round((xpInLevel / range) * 100)));
  const xpNeeded = Math.max(0, currentTier.maxXp - xp);

  return {
    level: currentTier.level,
    name: currentTier.name,
    icon: currentTier.icon,
    title: `${currentTier.icon} ${currentTier.name}`,
    badgeColor: currentTier.badgeColor,
    minXp: currentTier.minXp,
    maxXp: currentTier.maxXp,
    currentXp: xp,
    progress,
    xpInLevel,
    xpNeeded,
    nextTier,
  };
}
