import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Flame, Check, Loader2, Plus } from 'lucide-react';
import './Onboarding.css';

const CATEGORIES = [
  { id: 'coding', label: 'Coding' },
  { id: 'exercise', label: 'Exercise' },
  { id: 'learning', label: 'Learning' },
  { id: 'hobby', label: 'Hobby' },
  { id: 'social', label: 'Social' },
  { id: 'chore', label: 'Chore' }
];

export default function Onboarding() {
  const { session, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // If not logged in, go to login
    if (!session) {
      navigate('/login');
    }
    // If user already has a username, skip onboarding
    if (profile && profile.username) {
      navigate('/dashboard');
    }
  }, [session, profile, navigate]);

  // Username validation regex
  const validateUsername = (val: string) => {
    if (val.length < 3 || val.length > 20) {
      return "Username harus 3-20 karakter";
    }
    if (!/^[a-zA-Z]/.test(val)) {
      return "Username tidak boleh diawali dengan angka atau simbol";
    }
    if (!/^[a-zA-Z0-9_]+$/.test(val)) {
      return "Username hanya boleh huruf, angka, dan underscore";
    }
    return "";
  };

  useEffect(() => {
    const checkAvailability = async () => {
      const error = validateUsername(username);
      setUsernameError(error);
      setUsernameAvailable(false);
      
      if (error || username.length < 3) return;
      
      setCheckingUsername(true);
      try {
        const res = await fetch(`/api/check-username/${username}`);
        const data = await res.json();
        if (data.available) {
          setUsernameAvailable(true);
        } else {
          setUsernameError("Username sudah digunakan, coba yang lain");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [username]);

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameAvailable || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username,
          favoriteCategories: selectedCategories
        })
      });
      
      if (res.ok) {
        await refreshProfile();
        // refreshProfile handles navigation
      } else {
        const data = await res.json();
        setUsernameError(data.error || "Gagal menyimpan data");
      }
    } catch (e) {
      console.error(e);
      setUsernameError("Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile) return <div className="loading-screen"><Loader2 className="spin" /></div>;

  return (
    <div className="onboarding-page">
      <div className="onboarding-container glass-panel">
        <div className="onboarding-header">
          <Flame size={48} className="logo-icon orange pulse" />
          <h1>Selamat Datang di Streak!</h1>
          <p>Tinggal selangkah lagi sebelum kamu bisa mulai membangun habit barumu.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="form-group">
            <label htmlFor="username">Pilih Username</label>
            <div className="input-wrapper">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="Misal: alex_coder99"
                className={usernameError ? 'input-error' : usernameAvailable ? 'input-success' : ''}
                maxLength={20}
              />
              {checkingUsername && <Loader2 className="input-icon spin" size={18} />}
              {!checkingUsername && usernameAvailable && <Check className="input-icon success" size={18} />}
            </div>
            {usernameError && <span className="error-text">{usernameError}</span>}
          </div>

          <div className="form-group">
            <label>Pilih Kategori Favoritmu (Opsional)</label>
            <div className="categories-frame glass-panel" style={{padding: '16px', borderRadius: '12px', marginTop: '8px'}}>
              <div className="categories-grid">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`category-btn ${selectedCategories.includes(cat.id) ? 'selected' : ''}`}
                  >
                    {cat.label}
                  </button>
                ))}
                {selectedCategories.filter(id => !CATEGORIES.some(c => c.id === id)).map(customId => (
                  <button
                    key={customId}
                    type="button"
                    onClick={() => toggleCategory(customId)}
                    className="category-btn selected"
                  >
                    {customId}
                  </button>
                ))}
              </div>
              
              <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
                <input
                  type="text"
                  placeholder="Tambah kategori lainnya..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (customCategory.trim() && !selectedCategories.includes(customCategory.trim())) {
                        setSelectedCategories([...selectedCategories, customCategory.trim()]);
                        setCustomCategory('');
                      }
                    }
                  }}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                    background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', outline: 'none'
                  }}
                />
                <button 
                  type="button"
                  onClick={() => {
                    if (customCategory.trim() && !selectedCategories.includes(customCategory.trim())) {
                      setSelectedCategories([...selectedCategories, customCategory.trim()]);
                      setCustomCategory('');
                    }
                  }}
                  style={{
                    padding: '8px 12px', borderRadius: '8px', border: 'none',
                    background: 'var(--primary-color)', color: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <Plus size={16} /> Tambah
                </button>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary full-width"
            disabled={!usernameAvailable || submitting}
          >
            {submitting ? 'Menyimpan...' : 'Mulai Petualangan!'}
          </button>
        </form>
      </div>
    </div>
  );
}
