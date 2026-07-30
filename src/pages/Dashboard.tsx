import { useState, useEffect, useMemo } from 'react';
import { Flame, Check, Plus, Trophy, User, Trash2, Code, Dumbbell, BookOpen, Gamepad2, Users, Home, Target, Search, X, UserPlus } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

interface Quest {
  id: string;
  name: string;
  category?: string;
}

interface LeaderboardUser {
  id: string;
  name: string;
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
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');
  
  // Friends State
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardUser[]>([]);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);

  
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

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [questsRes, leaderboardRes, friendsRes, requestsRes] = await Promise.all([
        fetch('/api/quests').then(r => r.json()),
        fetch('/api/leaderboard').then(r => r.json()),
        fetch('/api/leaderboard?tab=friends').then(r => r.json()),
        fetch('/api/friends/requests').then(r => r.json())
      ]);
      
      if (questsRes.quests) setQuests(questsRes.quests);
      if (questsRes.completedIds) setCompletedQuestIds(new Set(questsRes.completedIds));
      if (Array.isArray(leaderboardRes)) setLeaderboard(leaderboardRes);
      if (Array.isArray(friendsRes)) setFriendsLeaderboard(friendsRes);
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
      setSearchResults(Array.isArray(data) ? data : []);
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
      alert('Permintaan pertemanan terkirim!');
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
    
    try {
      const res = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newQuest, category: newQuestCategory })
      });
      const data = await res.json();
      if (data && !data.error) {
        setQuests([...quests, data]);
        setNewQuest('');
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

  const handleCheckQuest = async (questId: string) => {
    if (completedQuestIds.has(questId) || !user || !profile) return;
    
    // Optimistic UI update
    const newCompleted = new Set(completedQuestIds);
    newCompleted.add(questId);
    setCompletedQuestIds(newCompleted);

    try {
      const res = await fetch(`/api/quests/${questId}/check`, { method: 'POST' });
      const data = await res.json();
      if (data.error) {
         fetchData();
         return;
      }
      await refreshProfile();
      fetchData(); // reload leaderboard
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
    const cat = CATEGORIES.find(c => c.id === catId);
    return cat ? cat.label : 'General';
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
        <div className="dashboard-main">
          <header className="dashboard-header">
            <h1 className="dashboard-title">{greeting}, {profile.name || 'User'}!</h1>
            <p className="dashboard-subtitle">{motivation} Kamu punya {quests.length - completedQuestIds.size} quest tersisa hari ini.</p>
          </header>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card glass-panel">
              <div className="stat-icon orange"><Flame size={20} /></div>
              <div className="stat-value">{profile.currentStreak}</div>
              <div className="stat-label">Day Streak</div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-icon blue"><Check size={20} /></div>
              <div className="stat-value">{completedQuestIds.size} / {quests.length}</div>
              <div className="stat-label">Selesai Hari Ini</div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-icon yellow"><Trophy size={20} /></div>
              <div className="stat-value">{profile.totalXp}</div>
              <div className="stat-label">Total XP</div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-icon green"><Target size={20} /></div>
              <div className="stat-value">{quests.length}</div>
              <div className="stat-label">Total Quests</div>
            </div>
          </div>

          <section className="quest-section">
            <div className="section-header-row">
              <h2>Daily Quests</h2>
            </div>
            
            <form onSubmit={handleAddQuest} className="add-quest-form">
              <input
                type="text"
                placeholder="Tambahkan quest baru..."
                value={newQuest}
                onChange={(e) => setNewQuest(e.target.value)}
                className="quest-input"
              />
              <select 
                value={newQuestCategory}
                onChange={(e) => setNewQuestCategory(e.target.value)}
                className="quest-category-select"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <button type="submit" className="btn btn-primary add-quest-btn">
                <Plus size={18} /> Tambah
              </button>
            </form>

            <div className="quest-list">
              {quests.map(quest => {
                const isCompleted = completedQuestIds.has(quest.id);
                return (
                  <div key={quest.id} className={`quest-card glass-panel ${isCompleted ? 'completed animate-pop' : ''}`}>
                    <div className="quest-content">
                      <div className="quest-header-row">
                        <h3>{quest.name}</h3>
                        <span className="quest-category-badge">
                          {getCategoryIcon(quest.category)}
                          {getCategoryLabel(quest.category)}
                        </span>
                      </div>
                      <p className="xp-reward">+10 XP</p>
                    </div>
                    <div className="quest-actions">
                      <button 
                        className="quest-delete-btn"
                        onClick={() => handleDeleteQuest(quest.id)}
                        disabled={isCompleted}
                        title="Hapus Quest"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button 
                        className={`quest-check-btn ${isCompleted ? 'is-completed' : ''}`}
                        onClick={() => handleCheckQuest(quest.id)}
                        disabled={isCompleted}
                      >
                        {isCompleted ? <Check size={20} /> : null}
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
              {(activeTab === 'global' ? leaderboard : friendsLeaderboard).map((leader, index) => (
                <div key={leader.id} className={`leaderboard-item ${leader.id === user.id ? 'is-me' : ''}`}>
                  <div className="rank">#{index + 1}</div>
                  <div className="friend-avatar">
                    <User size={16} />
                  </div>
                  <div className="friend-info">
                    <h4>{leader.name || 'User'}</h4>
                    <span>{leader.totalXp.toLocaleString()} XP</span>
                  </div>
                  <div className="friend-streak">
                    <Flame size={14} className="text-gradient" />
                    <span>{leader.currentStreak}</span>
                  </div>
                </div>
              ))}
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
                          <button className="btn" style={{padding: '6px 12px', background: 'var(--bg-card)'}} onClick={() => handleRespondRequest(req.requestId, 'reject')}>
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
                          <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>{result.totalXp} XP</span>
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
    </div>
  );
};

export default Dashboard;
