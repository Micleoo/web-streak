import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Flame, Check, Plus, Trophy, User, Trash2, Code, Dumbbell, BookOpen, 
  Gamepad2, Users, Home, Target, Search, X, UserPlus, AlertTriangle, 
  History, Clock, ArrowDown, Sparkles, SlidersHorizontal, ChevronDown, ChevronUp, Share2
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { getXpLevel } from '../lib/xpUtils';
import { QuestCelebration } from '../components/QuestCelebration';
import { useQuestCompletion } from '../hooks/useQuestCompletion';
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
  
  // Quick Add State
  const [newQuest, setNewQuest] = useState('');
  const [showAddDetails, setShowAddDetails] = useState(false);
  const [newQuestCategory, setNewQuestCategory] = useState('coding');
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [newQuestMinutes, setNewQuestMinutes] = useState('15');
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
    setTimeout(() => setToastMessage(null), 3500);
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
  
  const { completeQuest, isLoading: isCompletingQuest, celebrationState } = useQuestCompletion();
  
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

  // User rank in Global & Friends leaderboard
  const userGlobalRank = useMemo(() => {
    if (!user?.id || leaderboard.length === 0) return null;
    const idx = leaderboard.findIndex(l => l.id === user.id);
    return idx !== -1 ? idx + 1 : null;
  }, [leaderboard, user?.id]);

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
      const [leaderboardRes, friendsRes, requestsRes] = await Promise.all([
        fetch('/api/leaderboard').then(r => r.json()),
        fetch('/api/leaderboard?tab=friends').then(r => r.json()),
        fetch('/api/friends/requests').then(r => r.json())
      ]);
      setLeaderboard(parseLeaderboardData(leaderboardRes));
      setFriendsLeaderboard(parseLeaderboardData(friendsRes));
      if (Array.isArray(requestsRes)) setFriendRequests(requestsRes);
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
      showToast(action === 'accept' ? 'Teman berhasil ditambahkan!' : 'Permintaan ditolak.', 'success');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuest.trim() || !user) return;
    
    let totalMinutes = newQuestMinutes ? parseInt(newQuestMinutes, 10) : 15;
    if (totalMinutes && newQuestTimeUnit === 'h') totalMinutes *= 60;
    
    const categoryToSave = newQuestCategory === 'custom' && newCustomCategory.trim() ? newCustomCategory.trim() : newQuestCategory;

    try {
      const res = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newQuest.trim(), 
          category: categoryToSave,
          estimatedMinutes: totalMinutes 
        })
      });
      const data = await res.json();
      if (data && !data.error) {
        setQuests([...quests, data]);
        setNewQuest('');
        setNewQuestMinutes('15');
        setNewCustomCategory('');
        showToast('Quest baru berhasil ditambahkan! 🎯', 'success');
      }
    } catch(e) { console.error(e) }
  };
  
  const handleDeleteQuest = async (questId: string) => {
    if (!confirm('Apakah kamu yakin ingin menghapus quest ini?')) return;
    
    setQuests(quests.filter(q => q.id !== questId));
    
    try {
      const res = await fetch(`/api/quests/${questId}`, { method: 'DELETE' });
      if (!res.ok) fetchData();
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
      if (!res.ok) setQuests(originalQuests);
    } catch (e) {
      console.error(e);
      setQuests(originalQuests);
    }
  };

  const handleCheckQuest = async (questId: string) => {
    if (!user || !profile || isCompletingQuest) return;

    const quest = quests.find(q => q.id === questId);
    
    await completeQuest({
      questId,
      questName: quest?.name,
      onSuccess: async () => {
        await refreshProfile();
        fetchData();
      },
      onError: (msg) => {
        showToast(msg, 'error');
        fetchData();
      }
    });
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
        <div style={{padding: '100px', textAlign: 'center'}}>Loading Dashboard...</div>
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

  const isBaraActive = profile.currentStreak >= 3 && !profile.streakAtRisk;
  const isGraceActive = profile.streakAtRisk;
  const hasCompletedQuestToday = completedQuestIds.size > 0;

  return (
    <div className="dashboard-page">
      <Navbar />
      <QuestCelebration {...celebrationState} />
      
      <main className="dashboard-container container">
        {/* Toast Notification */}
        {toastMessage && (
          <div className={`dashboard-toast ${toastMessage.type}`}>
            {toastMessage.text}
          </div>
        )}

        {/* Left Column: Main Dashboard Content */}
        <div className="dashboard-main">
          
          <header className="dashboard-header">
            <h1 className="dashboard-title">{greeting}, {profile.name || 'User'}!</h1>
            <p className="dashboard-subtitle">{motivation} Kamu punya {quests.length - completedQuestIds.size} quest tersisa hari ini.</p>
          </header>

          {/* Grace Period Alert Banner */}
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

          {/* PRIMARY METRIC: STREAK HERO CARD */}
          <div className={`streak-hero-card glass-panel ${isGraceActive ? 'hero-at-risk' : isBaraActive ? 'hero-active' : 'hero-building'}`}>
            <div className="hero-streak-left">
              <div className="hero-flame-container">
                <Flame 
                  size={54} 
                  className={`hero-flame-icon ${isGraceActive ? 'flame-risk' : isBaraActive ? 'flame-active' : 'flame-building'}`} 
                />
              </div>
              <div className="hero-streak-digits">
                <span className="hero-streak-number">{profile.currentStreak}</span>
                <span className="hero-streak-label">
                  {isGraceActive ? 'BARA PADAM' : isBaraActive ? 'HARI BARA MENYALA' : 'DAY STREAK'}
                </span>
              </div>
            </div>

            <div className="hero-streak-right">
              <div className="hero-status-pill">
                {isGraceActive ? (
                  <span className="status-badge risk">
                    <AlertTriangle size={13} /> Butuh Dipulihkan (48 Jam)
                  </span>
                ) : isBaraActive ? (
                  <span className="status-badge active">
                    🔥 Bara Menyala Kuat
                  </span>
                ) : (
                  <span className="status-badge building">
                    🌱 {profile.currentStreak}/3 Hari Menuju Bara
                  </span>
                )}
              </div>

              <div className="hero-streak-message">
                {hasCompletedQuestToday ? (
                  <p className="status-text-green">
                    <Check size={16} /> <strong>Bara Aman Hari Ini!</strong> Kamu sudah menyelesaikan quest harian.
                  </p>
                ) : (
                  <p className="status-text-muted">
                    ⚡ Selesaikan minimal 1 quest sebelum 23:59 untuk menjaga streak-mu.
                  </p>
                )}
              </div>

              <div className="hero-meta-chips">
                <span className="meta-chip">
                  <Trophy size={13} color="#f59e0b" /> Rekor: {profile.maxStreak || profile.currentStreak} Hari
                </span>
                <span className="meta-chip">
                  <Sparkles size={13} color="#a855f7" /> Tier: {xpInfo.name}
                </span>
                {userGlobalRank && (
                  <span className="meta-chip">
                    🏆 Rank #{userGlobalRank} Global
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Stats Grid */}
          <div className="stats-grid">
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
            <div className="stat-card glass-panel">
              <div className="stat-icon orange"><Trophy size={20} /></div>
              <div className="stat-value">Lv.{xpInfo.level}</div>
              <div className="stat-label">{xpInfo.name}</div>
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

          {/* Quests Section */}
          <section className="quest-section">
            <div className="section-header-row">
              <h2>Daily Quests</h2>
              <button 
                type="button" 
                className="toggle-details-btn"
                onClick={() => setShowAddDetails(!showAddDetails)}
                title="Pengaturan detail quest (waktu & kategori)"
              >
                <SlidersHorizontal size={14} />
                <span>{showAddDetails ? 'Sembunyikan Opsi' : '+ Opsi Detail'}</span>
                {showAddDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
            
            {/* Quick-Add / Full Add Quest Form */}
            <form onSubmit={handleAddQuest} className="add-quest-form">
              <div className="quick-add-row">
                <input
                  type="text"
                  placeholder="Ketik nama habit / quest baru..."
                  value={newQuest}
                  onChange={(e) => setNewQuest(e.target.value)}
                  className="quest-input main-input"
                />
                <button type="submit" className="btn btn-primary add-quest-btn">
                  <Plus size={18} /> Tambah
                </button>
              </div>

              {/* Collapsible Details Row */}
              {showAddDetails && (
                <div className="quest-options-row animate-fade">
                  <div className="option-group">
                    <label>Waktu Estimasi:</label>
                    <div className="time-input-wrap">
                      <input
                        type="number"
                        placeholder="15"
                        value={newQuestMinutes}
                        onChange={(e) => setNewQuestMinutes(e.target.value)}
                        className="quest-input minutes-input"
                        min="1"
                      />
                      <select 
                        value={newQuestTimeUnit} 
                        onChange={(e) => setNewQuestTimeUnit(e.target.value)}
                        className="quest-category-select"
                      >
                        <option value="m">Menit</option>
                        <option value="h">Jam</option>
                      </select>
                    </div>
                  </div>

                  <div className="option-group">
                    <label>Kategori:</label>
                    <div className="cat-input-wrap">
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
                          placeholder="Nama Kategori"
                          value={newCustomCategory}
                          onChange={(e) => setNewCustomCategory(e.target.value)}
                          className="quest-input"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Quest Cards List */}
            <div className="quest-list">
              {quests.length === 0 ? (
                <div className="empty-quests-box glass-panel">
                  <Target size={36} color="var(--text-muted)" />
                  <p>Belum ada quest hari ini. Buat quest pertamamu di atas untuk mulai membangun Bara! 🔥</p>
                </div>
              ) : (
                quests.map(quest => {
                  const isCompleted = completedQuestIds.has(quest.id);
                  const isEditing = editingQuestId === quest.id;
                  
                  if (isEditing) {
                    return (
                      <div key={quest.id} className="quest-card glass-panel editing">
                        <div className="edit-quest-form">
                          <input
                            type="text"
                            value={editQuestName}
                            onChange={(e) => setEditQuestName(e.target.value)}
                            className="quest-input edit-name-input"
                            autoFocus
                          />
                          <div className="edit-options-flex">
                            <input
                              type="number"
                              value={editQuestMinutes}
                              onChange={(e) => setEditQuestMinutes(e.target.value)}
                              className="quest-input minutes-input"
                              min="1"
                              placeholder="Waktu"
                            />
                            <select 
                              value={editQuestTimeUnit} 
                              onChange={(e) => setEditQuestTimeUnit(e.target.value)}
                              className="quest-category-select"
                            >
                              <option value="m">Menit</option>
                              <option value="h">Jam</option>
                            </select>
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
                              />
                            )}
                          </div>
                          <div className="edit-actions">
                            <button className="btn btn-primary" onClick={() => handleSaveEdit(quest.id)}>
                              Simpan
                            </button>
                            <button className="btn btn-secondary" onClick={() => setEditingQuestId(null)}>
                              Batal
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={quest.id} 
                      className={`quest-card glass-panel ${isCompleted ? 'completed' : ''}`}
                    >
                      <button 
                        className={`quest-check-btn ${isCompleted ? 'checked' : ''}`}
                        onClick={() => handleCheckQuest(quest.id)}
                        title={isCompleted ? "Sudah diselesaikan hari ini" : "Ceklis quest ini"}
                      >
                        {isCompleted && <Check size={16} />}
                      </button>

                      <div className="quest-content" onClick={() => handleEditClick(quest)}>
                        <h3 className="quest-name">{quest.name}</h3>
                        <div className="quest-meta">
                          <span className="quest-category-badge">
                            {getCategoryIcon(quest.category)}
                            {getCategoryLabel(quest.category)}
                          </span>
                          {quest.estimatedMinutes && (
                            <span className="quest-time-badge">
                              ⏳ {quest.estimatedMinutes}m
                            </span>
                          )}
                          <span className="quest-xp-badge">+10 XP</span>
                        </div>
                      </div>

                      <div className="quest-actions">
                        <button 
                          className="icon-action-btn"
                          onClick={() => handleViewHistory(quest)}
                          title="Lihat riwayat penyelesaian"
                        >
                          <History size={16} />
                        </button>
                        <button 
                          className="icon-action-btn delete"
                          onClick={() => handleDeleteQuest(quest.id)}
                          title="Hapus quest"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Leaderboard & Social Sidebar */}
        <div className="dashboard-sidebar">
          
          {/* Social Prompt / Friends Banner */}
          <div className="social-promo-card glass-panel">
            <div className="social-promo-header">
              <div className="social-icon-box">
                <Users size={20} color="#38bdf8" />
              </div>
              <div>
                <h4>Social & Friends</h4>
                <p>
                  {userGlobalRank ? `Peringkat #${userGlobalRank} dari ${leaderboard.length} user` : 'Pantau streak temanmu'}
                </p>
              </div>
            </div>
            <button 
              type="button" 
              className="btn btn-secondary social-action-btn"
              onClick={() => setShowFriendsModal(true)}
            >
              <UserPlus size={15} /> Cari & Kelola Teman
              {friendRequests.length > 0 && (
                <span className="requests-bubble">{friendRequests.length}</span>
              )}
            </button>
          </div>

          {/* Leaderboard Card */}
          <div className="leaderboard-card glass-panel">
            <div className="leaderboard-header">
              <div className="leaderboard-header-title">
                <h3 className="sidebar-title">LEADERBOARD</h3>
                <Trophy size={18} className="text-gradient" />
              </div>
              <button 
                className="btn btn-primary btn-friends-shortcut" 
                onClick={() => setShowFriendsModal(true)}
              >
                <UserPlus size={13} /> Friends
                {friendRequests.length > 0 && (
                  <span className="requests-bubble">{friendRequests.length}</span>
                )}
              </button>
            </div>
            
            <div className="leaderboard-tabs">
              <button 
                className={`tab-btn ${activeTab === 'global' ? 'active' : ''}`}
                onClick={() => setActiveTab('global')}
              >
                Global ({leaderboard.length})
              </button>
              <button 
                className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
                onClick={() => setActiveTab('friends')}
              >
                Friends ({friendsLeaderboard.length})
              </button>
            </div>
            
            <div className="leaderboard-list">
              {(activeTab === 'global' ? leaderboard : friendsLeaderboard).map((leader, index) => {
                const leaderXp = getXpLevel(leader.totalXp);
                return (
                  <div key={leader.id} className={`leaderboard-item ${leader.id === user.id ? 'is-me' : ''}`}>
                    <div className={`rank ${index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : ''}`}>
                      #{index + 1}
                    </div>
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

              {activeTab === 'friends' && friendsLeaderboard.length <= 1 && (
                <div className="empty-friends">
                  <Users size={32} color="var(--text-muted)" style={{marginBottom: '0.75rem'}} />
                  <p>Kamu belum memiliki teman di leaderboard.</p>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    style={{marginTop: '10px', fontSize: '13px'}}
                    onClick={() => setShowFriendsModal(true)}
                  >
                    <UserPlus size={14} /> Cari Teman Sekarang
                  </button>
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
              <h2>Kelola Teman & Permintaan</h2>
              <button className="icon-btn" onClick={() => setShowFriendsModal(false)}><X size={24} /></button>
            </div>
            
            <div className="modal-body">
              {/* Friend Requests Section */}
              {friendRequests.length > 0 && (
                <div className="friend-requests-section">
                  <h3>Permintaan Pertemanan Masuk ({friendRequests.length})</h3>
                  <div className="request-list">
                    {friendRequests.map((req: any) => (
                      <div key={req.requestId} className="request-item">
                        <div className="request-info">
                          <User size={30} className="request-user-icon" />
                          <div>
                            <div className="req-name"><strong>{req.name}</strong></div>
                            <div className="req-sub">@{req.username || 'user'}</div>
                          </div>
                        </div>
                        <div className="request-actions">
                          <button 
                            className="btn btn-primary" 
                            style={{padding: '6px 12px', background: 'var(--success-color)'}} 
                            onClick={() => handleRespondRequest(req.requestId, 'accept')}
                          >
                            Terima
                          </button>
                          <button 
                            className="btn" 
                            style={{padding: '6px 12px', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger-color)'}} 
                            onClick={() => handleRespondRequest(req.requestId, 'reject')}
                          >
                            Tolak
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Friends Section */}
              <div className="search-friends-section">
                <h3>Cari Teman Berdasarkan Username</h3>
                <form onSubmit={handleSearchFriends} className="search-form">
                  <div className="search-input-wrapper">
                    <input 
                      type="text" 
                      placeholder="Ketik username teman (min. 3 karakter)..." 
                      className="quest-input"
                      value={friendSearchQuery}
                      onChange={(e) => setFriendSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary search-btn">
                      <Search size={18} />
                    </button>
                  </div>
                </form>
                
                <div className="search-results">
                  {searchResults.map((result: any) => (
                    <div key={result.id} className="search-result-item">
                      <div className="search-result-user">
                        <User size={20} />
                        <div>
                          <h4>{result.name}</h4>
                          <span>@{result.username || 'user'} · {result.totalXp} XP</span>
                        </div>
                      </div>
                      <button 
                        className="btn btn-primary btn-add-friend" 
                        onClick={() => handleSendRequest(result.id)}
                      >
                        <UserPlus size={14} /> Add Friend
                      </button>
                    </div>
                  ))}
                  {searchResults.length === 0 && friendSearchQuery.length >= 3 && (
                     <p className="search-empty-text">Tidak ada user ditemukan atau gunakan tombol cari.</p>
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
              <h2>Riwayat: {historyQuest.name}</h2>
              <button className="icon-btn" onClick={() => setShowHistoryModal(false)}><X size={24} /></button>
            </div>
            <div className="modal-body" style={{maxHeight: '400px', overflowY: 'auto'}}>
              {loadingHistory ? (
                <div style={{textAlign: 'center', padding: '20px', color: 'var(--text-muted)'}}>Memuat riwayat...</div>
              ) : questHistoryData.length === 0 ? (
                <div style={{textAlign: 'center', padding: '20px', color: 'var(--text-muted)'}}>
                  Quest ini belum pernah diselesaikan sebelumnya.
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px'}}>
                  {questHistoryData.map((record: any, idx: number) => (
                    <div key={record.id} className="history-item-row">
                      <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <Check size={16} color="var(--success-color)" />
                        <span>Selesai ke-{questHistoryData.length - idx}</span>
                      </div>
                      <span style={{color: 'var(--text-muted)', fontSize: '13px'}}>
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
