import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { User, Flame, Trophy, Star, Target, Loader2, Award, Zap } from 'lucide-react';
import './Profile.css';

interface Achievement {
  id: string;
  achievementType: string;
  unlockedAt: string;
}

const ACHIEVEMENT_INFO: Record<string, { label: string, icon: any, color: string }> = {
  'Week Warrior': { label: 'Week Warrior', icon: Flame, color: '#f97316' },
  'Fortnight Fighter': { label: 'Fortnight Fighter', icon: Zap, color: '#eab308' },
  'Monthly Master': { label: 'Monthly Master', icon: Trophy, color: '#3b82f6' },
  'Century Quester': { label: 'Century Quester', icon: Target, color: '#10b981' },
  'Quest Legend': { label: 'Quest Legend', icon: Star, color: '#8b5cf6' },
  'Perfect Week': { label: 'Perfect Week', icon: Award, color: '#ec4899' },
};

export default function Profile() {
  const { profile, loading } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchAchievements();
    }
  }, [profile]);

  const fetchAchievements = async () => {
    try {
      const res = await fetch('/api/achievements', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setAchievements(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || loadingStats) {
    return (
      <div className="profile-page">
        <Navbar />
        <div className="loading-screen">
          <Loader2 className="spin" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Navbar />
      
      <div className="profile-container">
        <div className="profile-header glass-panel">
          <div className="avatar-wrapper">
            <div className="avatar-placeholder">
              <User size={48} />
            </div>
          </div>
          
          <div className="profile-info">
            <h1>{profile?.name}</h1>
            <p className="username">@{profile?.username || 'user'}</p>
            <p className="email">{profile?.email}</p>
          </div>
          
          <div className="profile-actions">
            <button className="btn-secondary">Edit Profile</button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card glass-panel">
            <Flame className="stat-icon orange" />
            <div className="stat-content">
              <h3>{profile?.currentStreak}</h3>
              <p>Current Streak</p>
            </div>
          </div>
          
          <div className="stat-card glass-panel">
            <Trophy className="stat-icon yellow" />
            <div className="stat-content">
              <h3>{profile?.maxStreak}</h3>
              <p>Max Streak</p>
            </div>
          </div>
          
          <div className="stat-card glass-panel">
            <Star className="stat-icon purple" />
            <div className="stat-content">
              <h3>{profile?.totalXp}</h3>
              <p>Total XP</p>
            </div>
          </div>
          
          <div className="stat-card glass-panel">
            <Target className="stat-icon blue" />
            <div className="stat-content">
              <h3>{profile?.monthlyXp}</h3>
              <p>Monthly XP</p>
            </div>
          </div>
        </div>

        <div className="achievements-section glass-panel">
          <div className="section-header">
            <Award className="section-icon" />
            <h2>Achievements</h2>
          </div>
          
          {achievements.length === 0 ? (
            <div className="empty-state">
              <p>Belum ada achievement yang terbuka. Terus selesaikan quest untuk mendapatkan badge!</p>
            </div>
          ) : (
            <div className="badges-grid">
              {achievements.map(ach => {
                const info = ACHIEVEMENT_INFO[ach.achievementType] || { label: ach.achievementType, icon: Award, color: '#666' };
                const Icon = info.icon;
                return (
                  <div key={ach.id} className="badge-card">
                    <div className="badge-icon-wrapper" style={{ backgroundColor: `${info.color}20`, color: info.color }}>
                      <Icon size={32} />
                    </div>
                    <h4>{info.label}</h4>
                    <span className="date">Unlocked {new Date(ach.unlockedAt).toLocaleDateString()}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
