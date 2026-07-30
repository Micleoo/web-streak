import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Flame, Check, Loader2 } from 'lucide-react';
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
