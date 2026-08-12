import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { User, Flame, Trophy, Star, Target, Loader2, Award, Zap, AlertTriangle, Clock, ShieldCheck, Bell, BellOff } from 'lucide-react';
import { getXpLevel } from '../lib/xpUtils';
import { usePushNotification } from '../hooks/usePushNotification';
import './Profile.css';

interface Achievement {
  id: string;
  achievementType: string;
  unlockedAt: string;
}

import { ACHIEVEMENT_INFO } from '../constants/achievements';

export default function Profile() {
  const { profile, loading, refreshProfile } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const navigate = useNavigate();
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{text: string, type: 'error' | 'success'} | null>(null);
  
  // Notification state
  const { isSupported, isSubscribed, isLoading: notifLoading, enable: enableNotif, disable: disableNotif } = usePushNotification();

  // Grace period countdown
  const [graceCountdown, setGraceCountdown] = useState<{
    text: string;
    isUrgent: boolean;
    expired: boolean;
  } | null>(null);

  useEffect(() => {
    if (!profile?.streakAtRisk || !profile?.gracePeriodUntil) {
      setGraceCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(profile.gracePeriodUntil!).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setGraceCountdown({ text: '00:00:00', isUrgent: true, expired: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const text = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
      const isUrgent = hours < 12;
      setGraceCountdown({ text, isUrgent, expired: false });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [profile?.streakAtRisk, profile?.gracePeriodUntil]);

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
            {isSupported && (
              <button 
                className={`btn ${isSubscribed ? 'btn-secondary' : 'btn-primary'}`} 
                onClick={async () => {
                  if (isSubscribed) {
                    await disableNotif();
                    showToast('Notifikasi dimatikan', 'success');
                  } else {
                    const success = await enableNotif();
                    if (success) showToast('Notifikasi diaktifkan!', 'success');
                    else showToast('Gagal mengaktifkan notifikasi', 'error');
                  }
                }}
                disabled={notifLoading}
              >
                {isSubscribed ? <BellOff size={18} /> : <Bell size={18} />}
                <span>{notifLoading ? 'Tunggu...' : isSubscribed ? 'Matikan Notifikasi' : 'Aktifkan Notifikasi'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Grace Period Warning Banner */}
        {profile?.streakAtRisk && (
          <div className="profile-grace-banner" id="profile-grace-alert">
            <div className="profile-grace-inner">
              <div className="profile-grace-icon-wrap">
                <AlertTriangle size={28} className="grace-pulse-icon" />
              </div>
              <div className="profile-grace-body">
                <div className="profile-grace-title">
                  🔥 Bara Streakmu Dalam Bahaya!
                  <span className={`profile-grace-badge ${graceCountdown?.isUrgent ? 'urgent' : ''}`}>
                    <Clock size={12} />
                    {graceCountdown ? graceCountdown.text : '--:--:--'}
                  </span>
                </div>
                <p className="profile-grace-desc">
                  {graceCountdown?.expired
                    ? 'Grace period kamu sudah habis. Streak akan di-reset. Selesaikan quest sekarang untuk memulai streak baru!'
                    : 'Kamu belum menyelesaikan quest kemarin. Selesaikan minimal 1 quest sebelum waktu habis untuk menyelamatkan streak-mu dan mendapatkan bonus +20 XP!'}
                </p>
                <div className="profile-grace-steps">
                  <div className="grace-step">
                    <ShieldCheck size={14} />
                    <span>Selesaikan 1 quest di Dashboard</span>
                  </div>
                  <div className="grace-step">
                    <Flame size={14} />
                    <span>Streak kamu otomatis pulih + bonus XP</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="profile-grace-cta"
              onClick={() => navigate('/')}
            >
              Selesaikan Quest Sekarang →
            </button>
          </div>
        )}

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
          <div className={`stat-card glass-panel ${profile?.streakAtRisk ? 'profile-stat-at-risk' : ''}`}>
            <Flame className={`stat-icon ${profile?.streakAtRisk ? 'at-risk-icon' : 'orange'}`} />
            <div className="stat-content">
              <h3 style={profile?.streakAtRisk ? {color: '#f87171'} : {}}>{profile?.currentStreak}</h3>
              <p>{profile?.streakAtRisk ? '⚠️ Bara Padam' : 'Current Streak'}</p>
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
                const info = ACHIEVEMENT_INFO[ach.achievementType] || { label: ach.achievementType, description: '', icon: Award, color: '#666' };
                const Icon = info.icon;
                return (
                  <div key={ach.id} className="badge-card">
                    <div className="badge-icon-wrapper" style={{ backgroundColor: `${info.color}20`, color: info.color }}>
                      <Icon size={32} />
                    </div>
                    <h4>{info.label}</h4>
                    {info.description && <p style={{fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0'}}>{info.description}</p>}
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
