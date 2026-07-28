import { useState } from 'react';
import { Flame, Check, Plus, Trophy, User } from 'lucide-react';
import Navbar from '../components/Navbar';
import './Dashboard.css';

interface Quest {
  id: string;
  title: string;
  completed: boolean;
}

const Dashboard = () => {
  const [quests, setQuests] = useState<Quest[]>([
    { id: '1', title: 'Belajar React 30 Menit', completed: false },
    { id: '2', title: 'Workout Pagi', completed: false },
  ]);
  const [newQuest, setNewQuest] = useState('');
  
  const [streak, setStreak] = useState(14);
  const [xp, setXp] = useState(84320);

  const handleAddQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuest.trim()) return;
    setQuests([...quests, { id: Date.now().toString(), title: newQuest, completed: false }]);
    setNewQuest('');
  };

  const handleCheckQuest = (id: string) => {
    // Simple logic to increment streak if it's the first quest of the day
    const hasCompletedQuest = quests.some(q => q.completed);
    
    setQuests(quests.map(q => q.id === id ? { ...q, completed: true } : q));
    setXp(prev => prev + 10);
    
    if (!hasCompletedQuest) {
      setStreak(prev => prev + 1);
    }
  };

  // Mock Friends Leaderboard
  const friends = [
    { id: '2', name: 'Sophia Chen', streak: 16, xp: 85500, isMe: false },
    { id: '1', name: 'Kamu (Alex)', streak: streak, xp: xp, isMe: true },
    { id: '3', name: 'Marcus Lee', streak: 12, xp: 72100, isMe: false },
  ].sort((a, b) => b.streak - a.streak);

  return (
    <div className="dashboard-page">
      <Navbar />
      
      <main className="dashboard-container container">
        {/* Left Column: Quests */}
        <div className="dashboard-main">
          <header className="dashboard-header">
            <h1 className="dashboard-title">Good Morning, Alex!</h1>
            <p className="dashboard-subtitle">Kamu punya {quests.filter(q => !q.completed).length} quest tersisa hari ini.</p>
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
              {quests.map(quest => (
                <div key={quest.id} className={`quest-card glass-panel ${quest.completed ? 'completed' : ''}`}>
                  <div className="quest-content">
                    <h3>{quest.title}</h3>
                    <p className="xp-reward">+10 XP</p>
                  </div>
                  <button 
                    className={`quest-check-btn ${quest.completed ? 'is-completed' : ''}`}
                    onClick={() => handleCheckQuest(quest.id)}
                    disabled={quest.completed}
                  >
                    {quest.completed ? <Check size={20} /> : null}
                  </button>
                </div>
              ))}
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
                <span className="streak-number">{streak}</span>
              </div>
              <p className="streak-label">{streak}-Day Streak!</p>
            </div>
          </div>

          {/* Friends Leaderboard Card */}
          <div className="leaderboard-card glass-panel">
            <div className="leaderboard-header">
              <h3 className="sidebar-title">FRIENDS LEADERBOARD</h3>
              <Trophy size={18} className="text-gradient" />
            </div>
            
            <div className="leaderboard-list">
              {friends.map((friend, index) => (
                <div key={friend.id} className={`leaderboard-item ${friend.isMe ? 'is-me' : ''}`}>
                  <div className="rank">#{index + 1}</div>
                  <div className="friend-avatar">
                    <User size={16} />
                  </div>
                  <div className="friend-info">
                    <h4>{friend.name}</h4>
                    <span>{friend.xp.toLocaleString()} XP</span>
                  </div>
                  <div className="friend-streak">
                    <Flame size={14} className="text-gradient" />
                    <span>{friend.streak}</span>
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
