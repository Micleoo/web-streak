import { LogIn, LogOut, Target, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navbar glass-panel">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
          <div className="logo-icon animate-pulse-glow">
            <Target size={24} strokeWidth={2.5} color="white" />
          </div>
          <span className="logo-text">STREAK</span>
        </Link>
        
        {/* Mobile Menu Toggle */}
        <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`navbar-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {session ? (
            <>
              <Link to="/dashboard" className="nav-link" onClick={closeMobileMenu}>Dashboard</Link>
              <div className="nav-profile-name">{profile?.username || 'User'}</div>
              <button onClick={handleLogout} className="btn nav-cta" style={{backgroundColor: 'rgba(255,255,255,0.1)', color: 'white'}}>
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <a href="/#how-it-works" className="nav-link" onClick={closeMobileMenu}>Features</a>
              <Link to="/login" className="nav-link" onClick={closeMobileMenu}>Login</Link>
              <Link to="/register" className="btn btn-primary nav-cta" onClick={closeMobileMenu}>
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
