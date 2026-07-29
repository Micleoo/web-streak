import { useState, useEffect, useMemo } from 'react';
import { Flame, Check, Plus, Trophy, User, Trash2, Code, Dumbbell, BookOpen, Gamepad2, Users, Home, Target } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import './Dashboard.css';

interface Quest {
  id: string;
  name: string;
  category?: string;
}

interface LeaderboardUser {
  id: string;
  username: string;
  current_streak: number;
  total_xp: number;
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
    
    // 1. Fetch user's quests
    const { data: questsData } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: true });
      
    if (questsData) {
      setQuests(questsData);
    }

    // 2. Fetch completions for today to mark them as completed in UI
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: completionsData } = await supabase
      .from('quest_completions')
      .select('quest_id')
      .eq('user_id', user!.id)
      .gte('completed_at', today.toISOString());
      
    if (completionsData) {
      const completedIds = new Set(completionsData.map(c => c.quest_id));
      setCompletedQuestIds(completedIds);
    }

    // 3. Fetch leaderboard (Top 10 users globally for now)
    const { data: leaderData } = await supabase
      .from('users')
      .select('id, username, current_streak, total_xp')
      .not('username', 'is', null)
      .order('current_streak', { ascending: false })
      .order('total_xp', { ascending: false })
      .limit(10);
      
    if (leaderData) {
      setLeaderboard(leaderData);
    }
    
    setLoading(false);
  };

  const handleAddQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuest.trim() || !user) return;
    
    const { data, error } = await supabase
      .from('quests')
      .insert({ name: newQuest, category: newQuestCategory, user_id: user.id })
      .select()
      .single();
      
    if (!error && data) {
      setQuests([...quests, data]);
      setNewQuest('');
    }
  };
  
  const handleDeleteQuest = async (questId: string) => {
    if (!confirm('Apakah kamu yakin ingin menghapus quest ini?')) return;
    
    // Optimistic UI update
    setQuests(quests.filter(q => q.id !== questId));
    
    const { error } = await supabase
      .from('quests')
      .delete()
      .eq('id', questId)
      .eq('user_id', user!.id);
      
    if (error) {
      console.error(error);
      fetchData(); // revert if error
    }
  };

  const handleCheckQuest = async (questId: string) => {
    if (completedQuestIds.has(questId) || !user || !profile) return;
    
    // Optimistic UI update
    const newCompleted = new Set(completedQuestIds);
    newCompleted.add(questId);
    setCompletedQuestIds(newCompleted);

    // 1. Insert completion log
    const { error } = await supabase
      .from('quest_completions')
      .insert({ quest_id: questId, user_id: user.id });
      
    if (error) {
      console.error(error);
      return;
    }

    // 2. Update user profile (XP and Streak)
    // We increment XP by 10
    let newXp = profile.total_xp + 10;
    let newStreak = profile.current_streak;
    
    // If it's the first quest of the day, increment streak
    // In a real robust app, this is better handled by a Postgres Trigger or Edge Function
    if (completedQuestIds.size === 0) {
      newStreak += 1;
    }
    
    await supabase
      .from('users')
      .update({ total_xp: newXp, current_streak: newStreak, last_quest_completed_at: new Date().toISOString() })
      .eq('id', user.id);
      
    // 3. Refresh profile and leaderboard
    await refreshProfile();
    fetchData(); // reload leaderboard
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
            <h1 className="dashboard-title">{greeting}, {profile.username}!</h1>
            <p className="dashboard-subtitle">{motivation} Kamu punya {quests.length - completedQuestIds.size} quest tersisa hari ini.</p>
          </header>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card glass-panel">
              <div className="stat-icon orange"><Flame size={20} /></div>
              <div className="stat-value">{profile.current_streak}</div>
              <div className="stat-label">Day Streak</div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-icon blue"><Check size={20} /></div>
              <div className="stat-value">{completedQuestIds.size} / {quests.length}</div>
              <div className="stat-label">Selesai Hari Ini</div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-icon yellow"><Trophy size={20} /></div>
              <div className="stat-value">{profile.total_xp}</div>
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
            <div className="leaderboard-header">
              <h3 className="sidebar-title">LEADERBOARD</h3>
              <Trophy size={18} className="text-gradient" />
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
              {activeTab === 'global' ? (
                leaderboard.map((leader, index) => (
                  <div key={leader.id} className={`leaderboard-item ${leader.id === user.id ? 'is-me' : ''}`}>
                    <div className="rank">#{index + 1}</div>
                    <div className="friend-avatar">
                      <User size={16} />
                    </div>
                    <div className="friend-info">
                      <h4>{leader.username}</h4>
                      <span>{leader.total_xp.toLocaleString()} XP</span>
                    </div>
                    <div className="friend-streak">
                      <Flame size={14} className="text-gradient" />
                      <span>{leader.current_streak}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-friends">
                  <Users size={32} color="var(--text-muted)" style={{marginBottom: '1rem'}} />
                  <p>Fitur Friends sedang dalam pengembangan. Segera hadir!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
