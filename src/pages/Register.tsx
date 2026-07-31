import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import Navbar from '../components/Navbar';
import { Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import './Auth.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
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
    
    // Check username availability
    try {
      const checkRes = await fetch(`/api/users/check-username?username=${encodeURIComponent(username)}`);
      if (checkRes.ok) {
        const data = await checkRes.json();
        if (!data.available) {
           setError('Username is already taken');
           setLoading(false);
           return;
        }
      }
    } catch(e) {
      console.error("Failed checking username", e);
    }

    const { error: signUpError } = await authClient.signUp.email({
      email,
      password,
      name: name
    });

    if (signUpError) {
      setError(signUpError.message ?? 'Registration failed');
      setLoading(false);
    } else {
      // Now update username and categories
      try {
        await fetch('/api/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
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
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-container">
        <div className="auth-card glass-panel">
          <div className="auth-header">
            <Target size={48} className="auth-logo" style={{color: '#3b82f6'}} />
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
              <div className="categories-grid" style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px'}}>
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
