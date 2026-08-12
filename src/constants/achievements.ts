import { Flame, Zap, Trophy, Target, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AchievementInfo {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export const ACHIEVEMENT_INFO: Record<string, AchievementInfo> = {
  'Week Warrior': { 
    id: 'Week Warrior',
    label: 'Week Warrior', 
    description: '7-day streak',
    icon: Flame, 
    color: '#f97316' 
  },
  'Fortnight Fighter': { 
    id: 'Fortnight Fighter',
    label: 'Fortnight Fighter', 
    description: '14-day streak',
    icon: Zap, 
    color: '#eab308' 
  },
  'Monthly Master': { 
    id: 'Monthly Master',
    label: 'Monthly Master', 
    description: '30-day streak',
    icon: Trophy, 
    color: '#3b82f6' 
  },
  'Century Quester': { 
    id: 'Century Quester',
    label: 'Century Quester', 
    description: 'Selesaikan 100 quest',
    icon: Target, 
    color: '#10b981' 
  },
  'Quest Legend': { 
    id: 'Quest Legend',
    label: 'Quest Legend', 
    description: 'Selesaikan 200 quest',
    icon: Star, 
    color: '#8b5cf6' 
  },
};
