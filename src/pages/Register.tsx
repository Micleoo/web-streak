import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import Navbar from '../components/Navbar';
import { Flame, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import './Auth.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const CATEGORIES = [
    { id: 'coding', label: 'Coding' },
    { id: 'exercise', label: 'Exercise' },
    { id: 'learning', label: 'Learning' },
    { id: 'hobby', label: 'Hobby' },
    { id: 'social', label: 'Social' },
    { id: 'chore', label: 'Chore' }
  ];

  const toggleCategory = (id: string) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter(c => c !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long.');
      setLoading(false);
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      setLoading(false);
      return;
    }
    
    try {
      // Check username availability
      try {
        const checkRes = await fetch(`/api/check-username/${encodeURIComponent(username)}`);
        if (checkRes.ok) {
          const data = await checkRes.json();
          if (!data.available) {
             setError('Username sudah digunakan, pilih username lain.');
             setLoading(false);
             return;
          }
        }
      } catch (e) {
        console.error("Failed checking username", e);
      }

      const signUpRes = await authClient.signUp.email({
        email,
        password,
        name: name
      });

      if (signUpRes.error) {
        console.error("SignUp Error details:", signUpRes.error);
        const errMsg = signUpRes.error.message || (signUpRes.error as any).statusText || `Gagal registrasi (${(signUpRes.error as any).status || 'Unknown error'})`;
        setError(errMsg);
        setLoading(false);
        return;
      }

      // Now update username and categories
      try {
        await fetch('/api/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: name,
            username: username,
            favoriteCategories: JSON.stringify(selectedCategories)
          })
        });
        await refreshProfile();
      } catch (e) {
        console.error("Failed to update profile", e);
      }

      // Redirect to dashboard with full page load to ensure session cookie is active
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err?.message || 'Terjadi kesalahan saat registrasi. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-container">
        <div className="auth-card glass-panel">
          <div className="auth-header">
            <Flame size={48} className="auth-logo" style={{color: '#f97316'}} />
            <h2>Create Account</h2>
            <p>Start your productivity journey</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should we call you?"
              />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a unique username"
                minLength={3}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password (min 6 chars)"
                minLength={6}
              />
            </div>
            <div className="form-group" style={{marginTop: '1rem'}}>
              <label>Kategori Favorit</label>
              <div className="categories-frame glass-panel" style={{padding: '16px', borderRadius: '12px', marginTop: '8px'}}>
                <div className="categories-grid" style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                  {CATEGORIES.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1px solid var(--border-color)',
                        background: selectedCategories.includes(category.id) ? 'var(--primary-color)' : 'transparent',
                        color: selectedCategories.includes(category.id) ? 'white' : 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      {category.label}
                    </button>
                  ))}
                  {selectedCategories.filter(id => !CATEGORIES.some(c => c.id === id)).map(customId => (
                    <button
                      key={customId}
                      type="button"
                      onClick={() => toggleCategory(customId)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1px solid var(--primary-color)',
                        background: 'var(--primary-color)',
                        color: 'white',
                        cursor: 'pointer'
                      }}
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
            
            <button type="submit" className="btn btn-primary auth-btn" disabled={loading} style={{marginTop: '1.5rem'}}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Login</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
