
import { Flame, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon animate-pulse-glow">
            <Flame size={24} strokeWidth={2.5} color="white" />
          </div>
          <span className="logo-text">STREAK</span>
        </Link>
        
        <div className="navbar-links">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <a href="/#features" className="nav-link">Features</a>
          <a href="/#how-it-works" className="nav-link">How it Works</a>
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/register" className="btn btn-primary nav-cta">
            <LogIn size={18} />
            <span>Get Started</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
