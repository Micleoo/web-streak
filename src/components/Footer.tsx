
import './Footer.css';
import { Flame } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <Flame size={20} color="var(--primary-color)" />
            <span>STREAK</span>
          </div>
          <p className="footer-desc">Ubah hari liburmu jadi game. Produktif tanpa tekanan.</p>
        </div>
        <div className="footer-links">
          <div className="footer-column">
            <h4>Product</h4>
            <a href="/#how-it-works">Features</a>
            <a href="/dashboard">Leaderboard</a>
            <a href="/dashboard">Quests</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 Streak App. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
