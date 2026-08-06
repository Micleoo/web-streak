import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { User, Flame, Trophy, Star, Target, Loader2, Award, Zap, Sparkles } from 'lucide-react';
import { getXpLevel } from '../lib/xpUtils';
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
};

export default function Profile() {
  const { profile, loading, refreshProfile } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{text: string, type: 'error' | 'success'} | null>(null);

  const showToast = (text: string, type: 'error' | 'success') => {
    setToastMessage({text, type});
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (profile) {
      fetchAchievements();
      setEditName(profile.name);
      setEditUsername(profile.username || '');
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

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editUsername.trim()) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          username: editUsername
        })
      });
      
      const data = await res.json();
      if (data.error) {
        showToast(data.error, 'error');
      } else {
        await refreshProfile();
        setIsEditing(false);
        showToast('Profile berhasil diperbarui!', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Gagal memperbarui profil', 'error');
    } finally {
      setSaving(false);
    }
  };

  const xpInfo = useMemo(() => {
    return getXpLevel(profile?.totalXp || 0);
  }, [profile?.totalXp]);

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
        <div className="profile-header glass-panel" style={{position: 'relative'}}>
          {toastMessage && (
            <div style={{
              position: 'fixed', bottom: '24px', right: '24px',
              background: toastMessage.type === 'error' ? 'var(--danger-color)' : 'var(--success-color)',
              color: 'white', padding: '12px 24px', borderRadius: '8px', zIndex: 9999,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)', animation: 'pop 0.3s ease-out'
            }}>
              {toastMessage.text}
            </div>
          )}
          <div className="avatar-wrapper">
            <div className="avatar-placeholder">
              <User size={48} />
            </div>
          </div>
          
          <div className="profile-info">
            {isEditing ? (
              <div className="edit-profile-form" style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                  className="quest-input" 
                  placeholder="Name"
                />
                <input 
                  type="text" 
                  value={editUsername} 
                  onChange={e => setEditUsername(e.target.value)} 
                  className="quest-input" 
                  placeholder="Username"
                />
              </div>
            ) : (
              <>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap'}}>
                  <h1>{profile?.name}</h1>
                  <span className={`profile-tier-pill tier-${xpInfo.level}`}>
                    {xpInfo.icon} Lv.{xpInfo.level} {xpInfo.name}
                  </span>
                </div>
                <p className="username">@{profile?.username || 'user'}</p>
                <p className="email">{profile?.email}</p>
              </>
            )}
          </div>
          
          <div className="profile-actions" style={{display: 'flex', gap: '8px'}}>
            {isEditing ? (
              <>
                <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button className="btn btn-secondary" onClick={() => setIsEditing(false)} disabled={saving}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>Edit Profile</button>
            )}
          </div>
        </div>

        {/* XP Level Tier Card */}
        <div className="profile-xp-card glass-panel">
          <div className="profile-xp-header">
            <div className="xp-tier-title">
              <span className="tier-icon">{xpInfo.icon}</span>
              <div>
                <h3>Level {xpInfo.level}: {xpInfo.name}</h3>
                <p className="tier-subtitle">
                  {xpInfo.nextTier ? `${xpInfo.xpNeeded} XP lagi untuk mencapai ${xpInfo.nextTier.name} ${xpInfo.nextTier.icon}` : 'Tingkat Tertinggi Tercapai! 👑'}
                </p>
              </div>
            </div>
            <div className="profile-xp-total">
              <strong>{(profile?.totalXp || 0).toLocaleString()}</strong> XP
            </div>
          </div>
          <div className="profile-xp-bar-container">
            <div 
              className="profile-xp-bar-fill"
              style={{ width: `${xpInfo.progress}%` }}
            />
          </div>
          <div className="profile-xp-footer">
            <span>{xpInfo.minXp} XP (Lv.{xpInfo.level})</span>
            <span>{xpInfo.progress}% Menuju Level {xpInfo.level + 1}</span>
            <span>{xpInfo.maxXp ? `${xpInfo.maxXp} XP (Lv.${xpInfo.level + 1})` : 'Max'}</span>
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
              <h3>{(profile?.totalXp || 0).toLocaleString()}</h3>
              <p>Total XP (Lv.{xpInfo.level})</p>
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
