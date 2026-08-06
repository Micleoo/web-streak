import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Check, Plus, Trophy, User, Trash2, Code, Dumbbell, BookOpen, Gamepad2, Users, Home, Target, Search, X, UserPlus, AlertTriangle, History, Clock, ArrowDown, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { getXpLevel } from '../lib/xpUtils';
import './Dashboard.css';

interface Quest {
  id: string;
  name: string;
  category?: string;
  estimatedMinutes?: number;
}

interface LeaderboardUser {
  id: string;
  name: string;
  username?: string;
  currentStreak: number;
  totalXp: number;
}

const CATEGORIES = [
  { id: 'coding', icon: <Code size={14} />, label: 'Coding' },
  { id: 'exercise', icon: <Dumbbell size={14} />, label: 'Exercise' },
  { id: 'learning', icon: <BookOpen size={14} />, label: 'Learning' },
  { id: 'hobby', icon: <Gamepad2 size={14} />, label: 'Hobby' },
  { id: 'social', icon: <Users size={14} />, label: 'Social' },
  { id: 'chore', icon: <Home size={14} />, label: 'Chore' }
];

const MOTIVATIONS = [
  "Siap menaklukkan hari ini? 🚀",
  "Streak-mu menunggumu! 🔥",
  "Hari baru, quest baru! 💪",
  "Yuk lanjutkan progresmu! ⚡"
];

const Dashboard = () => {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  
  const [quests, setQuests] = useState<Quest[]>([]);
  const [completedQuestIds, setCompletedQuestIds] = useState<Set<string>>(new Set());
  const [newQuest, setNewQuest] = useState('');
  const [newQuestCategory, setNewQuestCategory] = useState('coding');
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [newQuestMinutes, setNewQuestMinutes] = useState('');
  const [newQuestTimeUnit, setNewQuestTimeUnit] = useState('m');
  
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);
  const [editQuestName, setEditQuestName] = useState('');
  const [editQuestCategory, setEditQuestCategory] = useState('coding');
  const [editCustomCategory, setEditCustomCategory] = useState('');
  const [editQuestMinutes, setEditQuestMinutes] = useState('');
  const [editQuestTimeUnit, setEditQuestTimeUnit] = useState('m');
  
  const [toastMessage, setToastMessage] = useState<{text: string, type: 'error' | 'success'} | null>(null);

  const showToast = (text: string, type: 'error' | 'success') => {
    setToastMessage({text, type});
    setTimeout(() => setToastMessage(null), 3000);
  };
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');
  
  // Friends State
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardUser[]>([]);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  // History State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyQuest, setHistoryQuest] = useState<Quest | null>(null);
  const [questHistoryData, setQuestHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [graceCountdown, setGraceCountdown] = useState<{
    text: string;
    isUrgent: boolean;
    expired: boolean;
  } | null>(null);

  const xpInfo = useMemo(() => {
    return getXpLevel(profile?.totalXp || 0);
  }, [profile?.totalXp]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Selamat Pagi';
    if (hour >= 12 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }, []);
  
  const motivation = useMemo(() => {
    return MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
  }, []);

  const navigate = useNavigate();

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

  useEffect(() => {
    if (user) {
      fetchData();
      const intervalId = setInterval(fetchLeaderboardsOnly, 60000);
      return () => clearInterval(intervalId);
    }
  }, [user, profile, navigate]);

  const parseLeaderboardData = (res: any): LeaderboardUser[] => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.leaderboard)) return res.leaderboard;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  const fetchLeaderboardsOnly = async () => {
    try {
      const [leaderboardRes, friendsRes] = await Promise.all([
        fetch('/api/leaderboard').then(r => r.json()),
        fetch('/api/leaderboard?tab=friends').then(r => r.json())
      ]);
      setLeaderboard(parseLeaderboardData(leaderboardRes));
      setFriendsLeaderboard(parseLeaderboardData(friendsRes));
    } catch(e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [questsRes, leaderboardRes, friendsRes, requestsRes] = await Promise.all([
        fetch('/api/quests').then(r => r.json()),
        fetch('/api/leaderboard').then(r => r.json()),
        fetch('/api/leaderboard?tab=friends').then(r => r.json()),
        fetch('/api/friends/requests').then(r => r.json())
      ]);
      
      if (questsRes.quests) {
        setQuests(questsRes.quests);
      }
      if (questsRes.completedIds) {
        setCompletedQuestIds(new Set(questsRes.completedIds)); 
      }
      setLeaderboard(parseLeaderboardData(leaderboardRes));
      setFriendsLeaderboard(parseLeaderboardData(friendsRes));
      if (Array.isArray(requestsRes)) setFriendRequests(requestsRes);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSearchFriends = async (e: React.FormEvent) => {
    e.preventDefault();
    if (friendSearchQuery.length < 3) return;
    try {
      const res = await fetch(`/api/friends/search?q=${friendSearchQuery}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSearchResults(data);
      } else if (data.results) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendRequest = async (friendId: string) => {
    try {
      await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId })
      });
      showToast('Permintaan pertemanan terkirim!', 'success');
      setSearchResults(searchResults.filter((u: any) => u.id !== friendId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRespondRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      await fetch('/api/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action })
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };


  const handleAddQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuest.trim() || !user) return;
    
    let totalMinutes = newQuestMinutes ? parseInt(newQuestMinutes, 10) : undefined;
    if (totalMinutes && newQuestTimeUnit === 'h') totalMinutes *= 60;
    
    const categoryToSave = newQuestCategory === 'custom' && newCustomCategory.trim() ? newCustomCategory.trim() : newQuestCategory;

    try {
      const res = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newQuest, 
          category: categoryToSave,
          estimatedMinutes: totalMinutes 
        })
      });
      const data = await res.json();
      if (data && !data.error) {
        setQuests([...quests, data]);
        setNewQuest('');
        setNewQuestMinutes('');
        setNewCustomCategory('');
      }
    } catch(e) { console.error(e) }
  };
  
  const handleDeleteQuest = async (questId: string) => {
    if (!confirm('Apakah kamu yakin ingin menghapus quest ini?')) return;
    
    // Optimistic UI update
    setQuests(quests.filter(q => q.id !== questId));
    
    try {
      const res = await fetch(`/api/quests/${questId}`, { method: 'DELETE' });
      if (!res.ok) fetchData(); // revert if error
    } catch (e) {
      console.error(e);
      fetchData();
    }
  };

  const handleEditClick = (quest: Quest) => {
    setEditingQuestId(quest.id);
    setEditQuestName(quest.name);
    
    const isCustom = quest.category && !CATEGORIES.some(c => c.id === quest.category);
    if (isCustom) {
      setEditQuestCategory('custom');
      setEditCustomCategory(quest.category!);
    } else {
      setEditQuestCategory(quest.category || 'coding');
      setEditCustomCategory('');
    }
    
    if (quest.estimatedMinutes) {
      if (quest.estimatedMinutes % 60 === 0 && quest.estimatedMinutes > 0) {
        setEditQuestMinutes(String(quest.estimatedMinutes / 60));
        setEditQuestTimeUnit('h');
      } else {
        setEditQuestMinutes(String(quest.estimatedMinutes));
        setEditQuestTimeUnit('m');
      }
    } else {
      setEditQuestMinutes('');
      setEditQuestTimeUnit('m');
    }
  };

  const handleViewHistory = async (quest: Quest) => {
    setHistoryQuest(quest);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    setQuestHistoryData([]);
    
    try {
      const res = await fetch(`/api/quests/${quest.id}/history`);
      const data = await res.json();
      setQuestHistoryData(data);
    } catch(e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSaveEdit = async (questId: string) => {
    if (!editQuestName.trim()) return;
    
    let totalMinutes = editQuestMinutes ? parseInt(editQuestMinutes, 10) : undefined;
    if (totalMinutes && editQuestTimeUnit === 'h') totalMinutes *= 60;

    const categoryToSave = editQuestCategory === 'custom' && editCustomCategory.trim() ? editCustomCategory.trim() : editQuestCategory;
    
    // Optimistic UI update
    const originalQuests = [...quests];
    setQuests(quests.map(q => q.id === questId ? {
      ...q,
      name: editQuestName,
      category: categoryToSave,
      estimatedMinutes: totalMinutes
    } : q));
    setEditingQuestId(null);
    
    try {
      const res = await fetch(`/api/quests/${questId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editQuestName,
          category: categoryToSave,
          estimatedMinutes: totalMinutes
        })
      });
      if (!res.ok) setQuests(originalQuests); // revert on error
    } catch (e) {
      console.error(e);
      setQuests(originalQuests);
    }
  };


  const handleCheckQuest = async (questId: string) => {
    if (!user || !profile) return;

    try {
      const res = await fetch(`/api/quests/${questId}/check`, { method: 'POST' });
      const data = await res.json();
      if (data.error) {
         showToast(data.error, 'error');
         fetchData();
         return;
      }
      
      if (data.gracePeriodRestored) {
        showToast('🔥 BARA BERHASIL DIPULIHKAN! Bonus +30 XP didapatkan!', 'success');
      } else if (data.message) {
        showToast(data.message, 'success');
      }

      await refreshProfile();
      fetchData(); // reload leaderboard and completions
    } catch (e) {
      console.error(e);
      fetchData();
    }
  };

  const getCategoryIcon = (catId?: string) => {
    const cat = CATEGORIES.find(c => c.id === catId);
    return cat ? cat.icon : <Target size={14} />;
  };

  const getCategoryLabel = (catId?: string) => {
    if (!catId) return 'General';
    const cat = CATEGORIES.find(c => c.id === catId);
    return cat ? cat.label : catId;
  };

  if (authLoading || (loading && user)) {
    return (
      <div className="dashboard-page">
        <Navbar />
        <div style={{padding: '100px', textAlign: 'center'}}>Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="dashboard-page">
        <Navbar />
        <div style={{padding: '100px', textAlign: 'center'}}>
          Please <a href="/login" style={{color: 'var(--primary-color)'}}>login</a> to view your dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Navbar />
      
      <main className="dashboard-container container">
        {/* Left Column: Quests */}
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
        <div className="dashboard-main">
          <header className="dashboard-header">
            <h1 className="dashboard-title">{greeting}, {profile.name || 'User'}!</h1>
            <p className="dashboard-subtitle">{motivation} Kamu punya {quests.length - completedQuestIds.size} quest tersisa hari ini.</p>
          </header>

          {profile.streakAtRisk && (
            <div className="grace-period-banner" id="grace-period-alert">
              <div className="grace-period-content">
                <AlertTriangle size={24} className="warning-icon" />
                <div className="banner-text">
                  <strong>
                    Bara Kamu Padam!
                    {graceCountdown && (
                      <span className={`countdown-badge ${graceCountdown.isUrgent ? 'urgent' : ''}`}>
                        <Clock size={12} style={{marginRight: '2px'}} />
                        {graceCountdown.text}
                      </span>
                    )}
                  </strong>
                  <p>
                    {graceCountdown?.expired
                      ? 'Grace period telah berakhir. Selesaikan quest untuk memulai streak baru!'
                      : 'Selesaikan minimal 1 quest sebelum batas waktu untuk memulihkan Bara (+20 XP bonus restore & streak terselamatkan).'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                className="grace-period-action-btn"
                onClick={() => {
                  const questInput = document.querySelector('.main-input') as HTMLInputElement;
                  if (questInput) {
                    questInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    questInput.focus();
                  }
                }}
              >
                <ArrowDown size={14} /> Selesaikan Quest Sekarang
              </button>
            </div>
          )}

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className={`stat-card glass-panel ${profile.streakAtRisk ? 'at-risk' : ''} ${profile.currentStreak >= 3 && !profile.streakAtRisk ? 'active-streak' : ''}`}>
              <div className={`stat-icon ${profile.streakAtRisk ? 'gray' : (profile.currentStreak >= 3 ? 'orange pulse' : 'gray')}`}>
                <Flame size={20} />
              </div>
              <div className="stat-value">{profile.currentStreak}</div>
              <div className="stat-label">{profile.streakAtRisk ? 'Bara Padam' : 'Day Streak'}</div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-icon blue"><Check size={20} /></div>
              <div className="stat-value">{completedQuestIds.size} / {quests.length}</div>
              <div className="stat-label">Selesai Hari Ini</div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-icon purple"><Sparkles size={20} /></div>
              <div className="stat-value">{profile.totalXp.toLocaleString()}</div>
              <div className="stat-label">Total XP</div>
            </div>
          </div>

          {/* XP Level Tier & Progress Bar Card */}
          <div className="xp-level-card glass-panel">
            <div className="xp-level-header">
              <div className="xp-level-info">
                <span className={`xp-tier-pill tier-${xpInfo.level}`}>
                  {xpInfo.icon} Lv.{xpInfo.level} {xpInfo.name}
                </span>
                <span className="xp-points-count">
                  <strong>{profile.totalXp.toLocaleString()}</strong> XP
                </span>
              </div>
              <div className="xp-next-target">
                {xpInfo.nextTier ? (
                  <span>{xpInfo.xpNeeded} XP lagi ke {xpInfo.nextTier.name} {xpInfo.nextTier.icon}</span>
                ) : (
                  <span>👑 Max Tier Level</span>
                )}
              </div>
            </div>
            <div className="xp-progress-bar-container">
              <div 
                className="xp-progress-bar-fill"
                style={{ width: `${xpInfo.progress}%` }}
              />
            </div>
            <div className="xp-progress-footer">
              <span>{xpInfo.minXp} XP (Lv.{xpInfo.level})</span>
              <span>{xpInfo.progress}% menuju level berikutnya</span>
              <span>{xpInfo.maxXp ? `${xpInfo.maxXp} XP (Lv.${xpInfo.level + 1})` : 'Max'}</span>
            </div>
          </div>

          <section className="quest-section">
            <div className="section-header-row">
              <h2>Daily Quests</h2>
            </div>
            
            <form onSubmit={handleAddQuest} className="add-quest-form" style={{flexWrap: 'wrap'}}>
              <input
                type="text"
                placeholder="Tambahkan quest baru..."
                value={newQuest}
                onChange={(e) => setNewQuest(e.target.value)}
                className="quest-input main-input"
                style={{flex: '1', minWidth: '200px'}}
              />
              <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                <input
                  type="number"
                  placeholder="Waktu"
                  value={newQuestMinutes}
                  onChange={(e) => setNewQuestMinutes(e.target.value)}
                  className="quest-input minutes-input"
                  min="1"
                  style={{width: '80px'}}
                />
                <select 
                  value={newQuestTimeUnit} 
                  onChange={(e) => setNewQuestTimeUnit(e.target.value)}
                  className="quest-category-select"
                  style={{width: 'auto'}}
                >
                  <option value="m">Menit</option>
                  <option value="h">Jam</option>
                </select>
              </div>
              
              <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                <select 
                  value={newQuestCategory}
                  onChange={(e) => setNewQuestCategory(e.target.value)}
                  className="quest-category-select"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                  <option value="custom">Lainnya...</option>
                </select>
                {newQuestCategory === 'custom' && (
                  <input
                    type="text"
                    placeholder="Kategori"
                    value={newCustomCategory}
                    onChange={(e) => setNewCustomCategory(e.target.value)}
                    className="quest-input"
                    style={{width: '100px'}}
                  />
                )}
              </div>
              <button type="submit" className="btn btn-primary add-quest-btn">
                <Plus size={18} /> Tambah
              </button>
            </form>

            <div className="quest-list">
              {quests.map(quest => {
                const isCompleted = completedQuestIds.has(quest.id);
                const isEditing = editingQuestId === quest.id;
                
                if (isEditing) {
                  return (
                    <div key={quest.id} className="quest-card glass-panel editing">
                      <div className="edit-quest-form" style={{display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap'}}>
                        <input
                          type="text"
                          value={editQuestName}
                          onChange={(e) => setEditQuestName(e.target.value)}
                          className="quest-input"
                          style={{flex: '1', minWidth: '150px'}}
                        />
                        <div style={{display: 'flex', gap: '4px'}}>
                          <input
                            type="number"
                            placeholder="Waktu"
                            value={editQuestMinutes}
                            onChange={(e) => setEditQuestMinutes(e.target.value)}
                            className="quest-input minutes-input"
                            min="1"
                            style={{width: '60px'}}
                          />
                          <select 
                            value={editQuestTimeUnit}
                            onChange={(e) => setEditQuestTimeUnit(e.target.value)}
                            className="quest-category-select"
                          >
                            <option value="m">m</option>
                            <option value="h">j</option>
                          </select>
                        </div>
                        <div style={{display: 'flex', gap: '4px'}}>
                          <select 
                            value={editQuestCategory}
                            onChange={(e) => setEditQuestCategory(e.target.value)}
                            className="quest-category-select"
                          >
                            {CATEGORIES.map(c => (
                              <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                            <option value="custom">Lainnya...</option>
                          </select>
                          {editQuestCategory === 'custom' && (
                            <input
                              type="text"
                              placeholder="Kategori"
                              value={editCustomCategory}
                              onChange={(e) => setEditCustomCategory(e.target.value)}
                              className="quest-input"
                              style={{width: '80px'}}
                            />
                          )}
                        </div>
                        <div style={{display: 'flex', gap: '4px'}}>
                          <button onClick={() => handleSaveEdit(quest.id)} className="btn btn-primary" style={{padding: '6px 12px'}}>Simpan</button>
                          <button onClick={() => setEditingQuestId(null)} className="btn btn-secondary" style={{padding: '6px 12px'}}>Batal</button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={quest.id} className={`quest-card glass-panel ${isCompleted ? 'completed animate-pop' : ''}`}>
                    <div className="quest-content">
                      <div className="quest-header-row">
                        <h3>{quest.name}</h3>
                        <span className="quest-category-badge">
                          {getCategoryIcon(quest.category)}
                          {getCategoryLabel(quest.category)}
                        </span>
                        {isCompleted && (
                          <span className="quest-category-badge" style={{background: 'var(--success-color)', color: '#fff', marginLeft: '8px'}}>
                            Selesai
                          </span>
                        )}
                        {quest.estimatedMinutes && (
                          <span className="quest-minutes-badge" style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '8px', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                            ⏳ {quest.estimatedMinutes >= 60 && quest.estimatedMinutes % 60 === 0 ? `${quest.estimatedMinutes / 60}j` : `${quest.estimatedMinutes}m`}
                          </span>
                        )}
                      </div>
                      <p className="xp-reward">+10 XP</p>
                    </div>
                    <div className="quest-actions">
                      <button 
                        className="quest-edit-btn"
                        onClick={() => handleEditClick(quest)}
                        title="Edit Quest"
                        style={{background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: 'var(--text-secondary)'}}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                      </button>
                      <button 
                        className="quest-edit-btn"
                        onClick={() => handleViewHistory(quest)}
                        title="History Quest"
                        style={{background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: 'var(--text-secondary)'}}
                      >
                        <History size={18} />
                      </button>
                      <button 
                        className="quest-delete-btn"
                        onClick={() => handleDeleteQuest(quest.id)}
                        title="Hapus Quest"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button 
                        className={`quest-check-btn ${isCompleted ? 'is-completed' : ''}`}
                        onClick={() => handleCheckQuest(quest.id)}
                      >
                        {isCompleted ? <Check size={20} /> : <Check size={20} style={{opacity: 0.3}} />}
                      </button>
                    </div>
                  </div>
                );
              })}
              {quests.length === 0 && (
                <div className="empty-state glass-panel">
                  <div className="empty-icon animate-float"><Target size={48} color="var(--primary-color)" /></div>
                  <h3>Mulai Petualanganmu!</h3>
                  <p>Buat quest pertamamu hari ini dan bangun kebiasaan produktif selama liburan.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Leaderboard */}
        <div className="dashboard-sidebar">
          {/* Leaderboard Card */}
          <div className="leaderboard-card glass-panel">
            <div className="leaderboard-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <h3 className="sidebar-title">LEADERBOARD</h3>
                <Trophy size={18} className="text-gradient" />
              </div>
              <button 
                className="btn btn-primary" 
                style={{padding: '4px 10px', fontSize: '12px'}}
                onClick={() => setShowFriendsModal(true)}
              >
                <UserPlus size={14} style={{marginRight: '4px', display: 'inline-block'}} /> Friends
                {friendRequests.length > 0 && <span style={{background: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', marginLeft: '4px'}}>{friendRequests.length}</span>}
              </button>
            </div>
            
            <div className="leaderboard-tabs">
              <button 
                className={`tab-btn ${activeTab === 'global' ? 'active' : ''}`}
                onClick={() => setActiveTab('global')}
              >
                Global
              </button>
              <button 
                className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
                onClick={() => setActiveTab('friends')}
              >
                Friends
              </button>
            </div>
            
            <div className="leaderboard-list">
              {(activeTab === 'global' ? leaderboard : friendsLeaderboard).map((leader, index) => {
                const leaderXp = getXpLevel(leader.totalXp);
                return (
                  <div key={leader.id} className={`leaderboard-item ${leader.id === user.id ? 'is-me' : ''}`}>
                    <div className="rank">#{index + 1}</div>
                    <div className="friend-avatar">
                      <User size={16} />
                    </div>
                    <div className="friend-info">
                      <h4>
                        {leader.name || 'User'}
                        <span className={`leaderboard-level-pill tier-${leaderXp.level}`} title={`${leaderXp.name} (Level ${leaderXp.level})`}>
                          {leaderXp.icon} Lv.{leaderXp.level}
                        </span>
                      </h4>
                      <span>@{leader.username || 'user'}</span>
                    </div>
                    <div className="leader-streak-info">
                      <div className="friend-streak">
                        <Flame size={14} className="text-gradient" />
                        <span>{leader.currentStreak}d</span>
                      </div>
                      <span className="leader-xp-subtext">{leader.totalXp.toLocaleString()} XP</span>
                    </div>
                  </div>
                );
              })}
              {activeTab === 'friends' && friendsLeaderboard.length === 1 && (
                <div className="empty-friends" style={{marginTop: '20px'}}>
                  <Users size={32} color="var(--text-muted)" style={{marginBottom: '1rem'}} />
                  <p>Kamu belum memiliki teman. Klik tombol Friends di atas untuk mencari teman!</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* Friends Modal */}
      {showFriendsModal && (
        <div className="modal-overlay" onClick={() => setShowFriendsModal(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Friends</h2>
              <button className="icon-btn" onClick={() => setShowFriendsModal(false)}><X size={24} /></button>
            </div>
            
            <div className="modal-body">
              {/* Friend Requests */}
              {friendRequests.length > 0 && (
                <div className="friend-requests-section">
                  <h3>Friend Requests ({friendRequests.length})</h3>
                  <div className="request-list">
                    {friendRequests.map((req: any) => (
                      <div key={req.requestId} className="request-item">
                        <div className="request-info">
                          <User size={32} style={{background: 'var(--bg-card)', padding: '6px', borderRadius: '50%'}}/>
                          <span><strong>{req.name}</strong> wants to be your friend</span>
                        </div>
                        <div className="request-actions">
                          <button className="btn btn-primary" style={{padding: '6px 12px', background: 'var(--success-color)'}} onClick={() => handleRespondRequest(req.requestId, 'accept')}>
                            Terima
                          </button>
                          <button className="btn" style={{padding: '6px 12px', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger-color)'}} onClick={() => handleRespondRequest(req.requestId, 'reject')}>
                            Tolak
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Friends */}
              <div className="search-friends-section" style={{marginTop: friendRequests.length > 0 ? '24px' : '0'}}>
                <h3>Cari Teman Baru</h3>
                <form onSubmit={handleSearchFriends} className="search-form">
                  <div className="search-input-wrapper" style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
                    <input 
                      type="text" 
                      placeholder="Cari berdasarkan username..." 
                      className="quest-input"
                      value={friendSearchQuery}
                      onChange={(e) => setFriendSearchQuery(e.target.value)}
                      style={{flex: 1}}
                    />
                    <button type="submit" className="btn btn-primary" style={{padding: '0 16px'}}><Search size={18} /></button>
                  </div>
                </form>
                
                <div className="search-results" style={{marginTop: '16px'}}>
                  {searchResults.map((result: any) => (
                    <div key={result.id} className="search-result-item" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', marginBottom: '8px'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <User size={20} />
                        <div>
                          <h4 style={{margin: 0}}>{result.name}</h4>
                          <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>@{result.username || 'user'} · {result.totalXp} XP</span>
                        </div>
                      </div>
                      <button className="btn btn-primary" style={{padding: '6px 12px', fontSize: '12px'}} onClick={() => handleSendRequest(result.id)}>
                        Add Friend
                      </button>
                    </div>
                  ))}
                  {searchResults.length === 0 && friendSearchQuery.length >= 3 && (
                     <p style={{textAlign: 'center', color: 'var(--text-muted)', marginTop: '16px'}}>Gunakan tombol cari setelah mengetik username minimal 3 karakter.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* History Modal */}
      {showHistoryModal && historyQuest && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>History: {historyQuest.name}</h2>
              <button className="icon-btn" onClick={() => setShowHistoryModal(false)}><X size={24} /></button>
            </div>
            <div className="modal-body" style={{maxHeight: '400px', overflowY: 'auto'}}>
              {loadingHistory ? (
                <div style={{textAlign: 'center', padding: '20px', color: 'var(--text-muted)'}}>Memuat history...</div>
              ) : questHistoryData.length === 0 ? (
                <div style={{textAlign: 'center', padding: '20px', color: 'var(--text-muted)'}}>
                  Quest ini belum pernah diselesaikan.
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px'}}>
                  {questHistoryData.map((record: any, idx: number) => (
                    <div key={record.id} style={{display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <Check size={16} color="var(--success-color)" />
                        <span>Selesai ke-{questHistoryData.length - idx}</span>
                      </div>
                      <span style={{color: 'var(--text-muted)', fontSize: '14px'}}>
                        {new Date(record.completedAt).toLocaleDateString()} {new Date(record.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
