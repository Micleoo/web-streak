import { useState, useEffect } from 'react';
import { Flame, Check, Plus, Trophy, User } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import './Dashboard.css';

interface Quest {
  id: string;
  name: string;
}

interface LeaderboardUser {
  id: string;
  username: string;
  current_streak: number;
  total_xp: number;
}

const Dashboard = () => {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  
  const [quests, setQuests] = useState<Quest[]>([]);
  const [completedQuestIds, setCompletedQuestIds] = useState<Set<string>>(new Set());
  const [newQuest, setNewQuest] = useState('');
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

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
      .insert({ name: newQuest, user_id: user.id })
      .select()
      .single();
      
    if (!error && data) {
      setQuests([...quests, data]);
      setNewQuest('');
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
            <h1 className="dashboard-title">Good Morning, {profile.username}!</h1>
            <p className="dashboard-subtitle">Kamu punya {quests.length - completedQuestIds.size} quest tersisa hari ini.</p>
          </header>

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
              <button type="submit" className="btn btn-primary add-quest-btn">
                <Plus size={18} /> Tambah
              </button>
            </form>

            <div className="quest-list">
              {quests.map(quest => {
                const isCompleted = completedQuestIds.has(quest.id);
                return (
                  <div key={quest.id} className={`quest-card glass-panel ${isCompleted ? 'completed' : ''}`}>
                    <div className="quest-content">
                      <h3>{quest.name}</h3>
                      <p className="xp-reward">+10 XP</p>
                    </div>
                    <button 
                      className={`quest-check-btn ${isCompleted ? 'is-completed' : ''}`}
                      onClick={() => handleCheckQuest(quest.id)}
                      disabled={isCompleted}
                    >
                      {isCompleted ? <Check size={20} /> : null}
                    </button>
                  </div>
                );
              })}
              {quests.length === 0 && (
                <div className="empty-state">Belum ada quest. Tambahkan sekarang!</div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: API System & Leaderboard */}
        <div className="dashboard-sidebar">
          {/* API System Card */}
          <div className="api-card glass-panel">
            <h3 className="sidebar-title">MY STREAK</h3>
            <div className="streak-display">
              <div className="fire-icon-wrapper animate-pulse-glow">
                <Flame size={64} className="fire-icon" />
                <span className="streak-number">{profile.current_streak}</span>
              </div>
              <p className="streak-label">{profile.current_streak}-Day Streak!</p>
            </div>
            <div style={{color: 'var(--text-secondary)'}}>
              Total XP: <strong style={{color: 'var(--primary-color)'}}>{profile.total_xp}</strong>
            </div>
          </div>

          {/* Friends Leaderboard Card */}
          <div className="leaderboard-card glass-panel">
            <div className="leaderboard-header">
              <h3 className="sidebar-title">GLOBAL LEADERBOARD</h3>
              <Trophy size={18} className="text-gradient" />
            </div>
            
            <div className="leaderboard-list">
              {leaderboard.map((leader, index) => (
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
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
