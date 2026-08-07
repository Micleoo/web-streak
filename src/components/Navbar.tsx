import { LogIn, LogOut, Flame, Menu, X, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    if (!session) {
      setPendingRequestsCount(0);
      return;
    }

    const fetchRequests = async () => {
      try {
        const res = await fetch('/api/friends/requests', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setPendingRequestsCount(data.requests?.length || 0);
        }
      } catch (err) {
        // Silently fail if offline or not logged in
      }
    };

    fetchRequests();
    const interval = setInterval(fetchRequests, 60000); // Polling every 1 min
    return () => clearInterval(interval);
  }, [session]);

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

  const handleLogoClick = () => {
    if (window.location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    closeMobileMenu();
  };

  return (
    <nav className="navbar glass-panel">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo" onClick={handleLogoClick}>
          <div className="logo-icon animate-pulse-glow">
            <Flame size={24} strokeWidth={2.5} color="white" />
          </div>
          <span className="logo-text">STREAK</span>
        </Link>
        
        {/* Mobile Menu Toggle */}
        <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <X size={24} /> : (
            <div style={{ position: 'relative' }}>
              <Menu size={24} />
              {pendingRequestsCount > 0 && <span className="nav-notification-dot" />}
            </div>
          )}
        </button>

        <div className={`navbar-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {session ? (
            <>
              <Link to="/dashboard" className="nav-link" onClick={closeMobileMenu}>
                Dashboard
                {pendingRequestsCount > 0 && (
                  <span className="nav-request-pill" title={`${pendingRequestsCount} permintaan teman baru`}>
                    <Users size={12} /> {pendingRequestsCount}
                  </span>
                )}
              </Link>
              <Link to="/profile" className="nav-profile-name" onClick={closeMobileMenu}>
                {profile?.name || 'User'}
              </Link>
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
