import { LogIn, LogOut, Target } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="navbar glass-panel">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon animate-pulse-glow">
            <Target size={24} strokeWidth={2.5} color="white" />
          </div>
          <span className="logo-text">STREAK</span>
        </Link>
        
        <div className="navbar-links">
          {session ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <div className="nav-profile-name">{profile?.username || 'User'}</div>
              <button onClick={handleLogout} className="btn nav-cta" style={{backgroundColor: 'rgba(255,255,255,0.1)', color: 'white'}}>
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <a href="/#features" className="nav-link">Features</a>
              <a href="/#how-it-works" className="nav-link">How it Works</a>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="btn btn-primary nav-cta">
                <LogIn size={18} />
                <span>Get Started</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
