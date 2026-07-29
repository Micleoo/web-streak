import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { Flame, Check, Plus, Trophy, User, Trash2, Code, Dumbbell, BookOpen, Gamepad2, Users, Home, Target } from 'lucide-react';",
    "import { Flame, Check, Plus, Trophy, User, Trash2, Code, Dumbbell, BookOpen, Gamepad2, Users, Home, Target, Search, X, UserPlus } from 'lucide-react';"
)

# 2. Add state
state_code = """
  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');
  
  // Friends State
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardUser[]>([]);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
"""
content = content.replace("  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');", state_code)

# 3. Update fetchData
fetch_data_old = """  const fetchData = async () => {
    setLoading(true);
    try {
      const [questsRes, leaderboardRes] = await Promise.all([
        fetch('/api/quests').then(r => r.json()),
        fetch('/api/leaderboard').then(r => r.json())
      ]);
      
      if (questsRes.quests) setQuests(questsRes.quests);
      if (questsRes.completedIds) setCompletedQuestIds(new Set(questsRes.completedIds));
      if (Array.isArray(leaderboardRes)) setLeaderboard(leaderboardRes);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };"""

fetch_data_new = """  const fetchData = async () => {
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
"""
content = content.replace(fetch_data_old, fetch_data_new)

# 4. Update the Leaderboard Header to include Manage Friends button
leaderboard_header_old = """            <div className="leaderboard-header">
              <h3 className="sidebar-title">LEADERBOARD</h3>
              <Trophy size={18} className="text-gradient" />
            </div>"""

leaderboard_header_new = """            <div className="leaderboard-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
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
            </div>"""
content = content.replace(leaderboard_header_old, leaderboard_header_new)

# 5. Update Leaderboard List for friends
friends_list_old = """              {activeTab === 'global' ? (
                leaderboard.map((leader, index) => (
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
                ))
              ) : (
                <div className="empty-friends">
                  <Users size={32} color="var(--text-muted)" style={{marginBottom: '1rem'}} />
                  <p>Fitur Friends sedang dalam pengembangan. Segera hadir!</p>
                </div>
              )}"""

friends_list_new = """              {(activeTab === 'global' ? leaderboard : friendsLeaderboard).map((leader, index) => (
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
              )}"""
content = content.replace(friends_list_old, friends_list_new)

# 6. Add Modal at the end of the return statement
modal_code = """
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
"""
content = content.replace("      </main>\n    </div>\n  );\n};\n", modal_code)

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)

