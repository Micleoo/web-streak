
import { Link } from 'react-router-dom';
import { Flame, Target, Trophy, Users } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './HomePage.css';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-container">
          <div className="hero-content">
            <div className="hero-badge glass-panel">
              <span className="badge-icon">🔥</span>
              <span className="text-gradient">Daily Quest Tracker</span>
            </div>
            <h1 className="hero-title">
              Ubah Hari Liburmu <br />
              <span className="text-gradient">Jadi Game.</span>
            </h1>
            <p className="hero-subtitle">
              Selesaikan quest harian, jaga streak-mu tetap menyala, dan bersaing dengan teman. Tetap produktif tanpa merasa boring atau tertekan.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                <Flame size={20} />
                Mulai Streak Kamu
              </Link>
              <a href="#how-it-works" className="btn btn-secondary btn-lg">
                Pelajari Lebih Lanjut
              </a>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="mockup-glass glass-panel animate-float">
              <div className="mockup-header">
                <Flame size={32} className="text-gradient" />
                <div className="mockup-streak-count">
                  <span className="count-number">14</span>
                  <span className="count-label">Days Streak</span>
                </div>
              </div>
              <div className="mockup-quests">
                <div className="quest-item completed">
                  <div className="quest-icon"><Target size={18} /></div>
                  <div className="quest-text">Belajar React 30 Menit</div>
                  <div className="quest-check">✓</div>
                </div>
                <div className="quest-item">
                  <div className="quest-icon"><Trophy size={18} /></div>
                  <div className="quest-text">Workout Pagi</div>
                  <div className="quest-circle"></div>
                </div>
              </div>
            </div>
            
            {/* Background Glows */}
            <div className="glow-blob blob-1"></div>
            <div className="glow-blob blob-2"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Kenapa Pakai <span className="text-gradient">Streak?</span></h2>
            <p className="section-subtitle">Lebih dari sekadar To-Do list. Ini adalah game produktivitas.</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card glass-panel">
              <div className="feature-icon-wrapper blue">
                <Target size={24} color="#3b82f6" />
              </div>
              <h3>Quest Tanpa Batas</h3>
              <p>Selesaikan quest sebanyak yang kamu mau. Tidak ada batasan harian, jadikan produktivitas sebagai kebiasaan yang menyenangkan.</p>
            </div>
            
            <div className="feature-card glass-panel">
              <div className="feature-icon-wrapper orange">
                <Flame size={24} color="#f97316" />
              </div>
              <h3>Grace Period 48 Jam</h3>
              <p>Miss 1 hari? Jangan panik. Streak-mu masih bisa dipulihkan dalam 48 jam sebelum hangus. Bebas dari perfectionism trap.</p>
            </div>
            
            <div className="feature-card glass-panel">
              <div className="feature-icon-wrapper green">
                <Users size={24} color="#10b981" />
              </div>
              <h3>Social Leaderboard</h3>
              <p>Lihat siapa temanmu yang punya streak tertinggi. Bandingkan XP dan pamerkan achievement badge-mu.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box glass-panel">
            <h2>Siap membangun habit baru?</h2>
            <p>Gabung dengan ribuan mahasiswa lainnya yang menjadikan liburan mereka lebih produktif.</p>
            <Link to="/register" className="btn btn-primary btn-lg">
              <Flame size={20} />
              Buat Akun Gratis
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
