import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Flame, Target, Trophy, Users, Zap, ShieldCheck, Check, X, 
  ArrowRight, Sparkles, Clock, Compass, Award, PlayCircle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './HomePage.css';

const HomePage: React.FC = () => {
  // State for interactive Bara Explainer demo
  const [activeBaraState, setActiveBaraState] = useState<'active' | 'at_risk' | 'restored'>('active');

  return (
    <div className="home-page">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-container">
          <div className="hero-content">
            <div className="hero-badge glass-panel">
              <span className="badge-icon">🔥</span>
              <span className="text-gradient">Gamified Habit & Quest Tracker</span>
            </div>
            <h1 className="hero-title">
              Ubah Hari Liburmu <br />
              <span className="text-gradient">Jadi Game Seru.</span>
            </h1>
            <p className="hero-subtitle">
              Selesaikan quest harian, nyalakan Bara api konsistensi, dan bersaing di leaderboard teman. Produktif tanpa tekanan atau rasa bosan.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                <Flame size={20} />
                Mulai Streak 1-Menit
              </Link>
              <a href="#how-it-works" className="btn btn-secondary btn-lg">
                Lihat Cara Kerja
              </a>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="mockup-glass glass-panel animate-float">
              <div className="mockup-header">
                <Flame size={40} className="text-gradient pulse" />
                <div className="mockup-streak-count">
                  <span className="count-number">7</span>
                  <span className="count-label">🔥 Bara Menyala (Week Warrior)</span>
                </div>
              </div>
              <div className="mockup-quests">
                <div className="quest-item completed">
                  <div className="quest-icon"><Target size={18} /></div>
                  <div className="quest-text">Belajar React & Vibe Coding</div>
                  <div className="quest-check">✓</div>
                </div>
                <div className="quest-item completed">
                  <div className="quest-icon"><Trophy size={18} /></div>
                  <div className="quest-text">Push-up 20x & Minum 2L Air</div>
                  <div className="quest-check">✓</div>
                </div>
                <div className="quest-item">
                  <div className="quest-icon"><Sparkles size={18} /></div>
                  <div className="quest-text">Baca Buku 15 Halaman</div>
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

      {/* SECTION 1: HOW IT WORKS (3 Simple Steps) */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">CARA KERJA SEDERHANA</span>
            <h2 className="section-title">Bangun Habit dalam <span className="text-gradient">3 Langkah Cepat</span></h2>
            <p className="section-subtitle">Langsung jalan tanpa ribet konfigurasi RPG yang rumit.</p>
          </div>

          <div className="steps-grid">
            <div className="step-card glass-panel">
              <div className="step-number-badge">1</div>
              <div className="step-icon-wrap blue">
                <Compass size={28} />
              </div>
              <h3>Pilih 3 Habit Utama</h3>
              <p>Pilih kategori yang kamu suka (Coding, Olahraga, Belajar, dll) atau buat habit kustom dalam 1 menit setup.</p>
            </div>

            <div className="step-card glass-panel">
              <div className="step-number-badge">2</div>
              <div className="step-icon-wrap orange">
                <Flame size={28} />
              </div>
              <h3>Nyalakan Bara Api 🔥</h3>
              <p>Cukup selesaikan minimal 1 quest per hari. Konsisten 3 hari berturut-turut untuk menyalakan Bara Api!</p>
            </div>

            <div className="step-card glass-panel">
              <div className="step-number-badge">3</div>
              <div className="step-icon-wrap purple">
                <Award size={28} />
              </div>
              <h3>Raih XP & Naik Rank</h3>
              <p>Dapatkan XP tiap quest selesai, naik ke Tier Grand Master 👑, dan pamerkan pencapaianmu di leaderboard teman.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: INTERACTIVE BARA API EXPLAINER */}
      <section className="bara-explainer-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">CORE GAME MECHANIC</span>
            <h2 className="section-title">Mekanisme <span className="text-gradient">Bara Api & Grace Period</span></h2>
            <p className="section-subtitle">Anti-perfectionism trap! Lupa 1 hari bukan berarti progresmu langsung hangus.</p>
          </div>

          <div className="bara-demo-container glass-panel">
            {/* Demo Controls / Tabs */}
            <div className="bara-state-tabs">
              <button 
                type="button" 
                className={`state-tab-btn ${activeBaraState === 'active' ? 'active green' : ''}`}
                onClick={() => setActiveBaraState('active')}
              >
                🔥 1. Bara Menyala (Aktif)
              </button>
              <button 
                type="button" 
                className={`state-tab-btn ${activeBaraState === 'at_risk' ? 'active red' : ''}`}
                onClick={() => setActiveBaraState('at_risk')}
              >
                ⚠️ 2. Bara Padam (Grace Period)
              </button>
              <button 
                type="button" 
                className={`state-tab-btn ${activeBaraState === 'restored' ? 'active blue' : ''}`}
                onClick={() => setActiveBaraState('restored')}
              >
                ✨ 3. Bara Dipulihkan (+20 XP)
              </button>
            </div>

            {/* Interactive Demo Preview Card */}
            <div className="bara-demo-display">
              {activeBaraState === 'active' && (
                <div className="demo-state-view active-state animate-fade">
                  <div className="demo-flame-wrapper active-flame">
                    <Flame size={72} className="fire-icon-active" />
                  </div>
                  <div className="demo-info">
                    <div className="demo-badge state-active">Bara Menyala (Streak 7 Hari)</div>
                    <h3>Semua Quest Berjalan Konsisten</h3>
                    <p>Selesaikan minimal 1 quest setiap hari sebelum pukul 23:59. Angka streak bertambah tiap hari aktif dan XP terakumulasi!</p>
                    <div className="demo-perks">
                      <span>⚡ +10 XP per quest</span>
                      <span>🎁 +50 XP bonus tiap milestone 7 hari</span>
                    </div>
                  </div>
                </div>
              )}

              {activeBaraState === 'at_risk' && (
                <div className="demo-state-view at-risk-state animate-fade">
                  <div className="demo-flame-wrapper at-risk-flame">
                    <Flame size={72} className="fire-icon-risk" />
                  </div>
                  <div className="demo-info">
                    <div className="demo-badge state-risk">
                      <Clock size={14} /> Grace Period 48 Jam Aktif
                    </div>
                    <h3>Bara Padam Karena Terlewat 1 Hari</h3>
                    <p>Jangan patah semangat! Sistem memberi kamu waktu <strong>48 jam</strong> untuk menyelamatkan streak-mu sebelum dihapus permanen.</p>
                    <div className="demo-perks danger">
                      <span>⏳ Countdown timer real-time</span>
                      <span>🛡️ Streak belum di-reset ke 0</span>
                    </div>
                  </div>
                </div>
              )}

              {activeBaraState === 'restored' && (
                <div className="demo-state-view restored-state animate-fade">
                  <div className="demo-flame-wrapper restored-flame">
                    <Flame size={72} className="fire-icon-restored" />
                  </div>
                  <div className="demo-info">
                    <div className="demo-badge state-restored">
                      <ShieldCheck size={14} /> Bara Berhasil Dipulihkan!
                    </div>
                    <h3>Selesaikan 1 Quest & Nyalakan Kembali</h3>
                    <p>Begitu kamu menyelesaikan 1 quest dalam masa 48 jam, Bara otomatis kembali menyala dengan angka streak penuh!</p>
                    <div className="demo-perks success">
                      <span>✨ +20 XP Instant Restore Bonus</span>
                      <span>🔥 Streak 7 Hari Terselamatkan</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: COMPARISON MATRIX (Why Choose STREAK?) */}
      <section className="comparison-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">VALUE PROPOSITION</span>
            <h2 className="section-title">Kenapa Harus Memilih <span className="text-gradient">STREAK?</span></h2>
            <p className="section-subtitle">Bandingkan bagaimana STREAK dirancang khusus untuk mahasiswa dan pelajar produktif.</p>
          </div>

          <div className="comparison-table-wrapper glass-panel">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th className="feature-col">Fitur & Kemudahan</th>
                  <th className="highlight-col">
                    <div className="streak-th-content">
                      <Flame size={20} color="#f97316" />
                      <span>STREAK</span>
                    </div>
                  </th>
                  <th>Habitica</th>
                  <th>To-Do Biasa (Todoist/G-Tasks)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="feature-title">
                    <strong>100% Gratis & Tanpa Iklan</strong>
                    <span>Semua fitur leaderboard & streak terbuka penuh</span>
                  </td>
                  <td className="highlight-col"><Check size={20} className="check-icon" /> Gratis Penuh</td>
                  <td><span className="text-warn">⚠️ Freemium (Gem Paywall)</span></td>
                  <td><span className="text-warn">⚠️ Fitur Pro Terkunci</span></td>
                </tr>
                <tr>
                  <td className="feature-title">
                    <strong>Grace Period 48 Jam (Anti-Stress)</strong>
                    <span>Bisa pulihkan streak jika miss 1 hari</span>
                  </td>
                  <td className="highlight-col"><Check size={20} className="check-icon" /> Ya (48 Jam)</td>
                  <td><X size={18} className="cross-icon" /> Darah Berkurang / Mati</td>
                  <td><X size={18} className="cross-icon" /> Reset Langsung ke 0</td>
                </tr>
                <tr>
                  <td className="feature-title">
                    <strong>1-Minute Instant Onboarding</strong>
                    <span>Pilih username & 3 habit langsung jalan</span>
                  </td>
                  <td className="highlight-col"><Check size={20} className="check-icon" /> Sangat Cepat</td>
                  <td><X size={18} className="cross-icon" /> Rumit (Setup RPG Karakter)</td>
                  <td><Check size={20} className="check-icon" /> Cepat</td>
                </tr>
                <tr>
                  <td className="feature-title">
                    <strong>Social Leaderboard Teman & Global</strong>
                    <span>Saling add teman & pantau streak satu sama lain</span>
                  </td>
                  <td className="highlight-col"><Check size={20} className="check-icon" /> Dual Mode (Friends & Global)</td>
                  <td><span className="text-warn">⚠️ Party Only</span></td>
                  <td><X size={18} className="cross-icon" /> Tidak Ada Gamifikasi</td>
                </tr>
                <tr>
                  <td className="feature-title">
                    <strong>XP Level Tier (Rookie → Grand Master)</strong>
                    <span>Visual tiering & progress bar yang memotivasi</span>
                  </td>
                  <td className="highlight-col"><Check size={20} className="check-icon" /> 5 Tier Leveling</td>
                  <td><Check size={20} className="check-icon" /> Leveling RPG</td>
                  <td><X size={18} className="cross-icon" /> Tidak Ada</td>
                </tr>
                <tr>
                  <td className="feature-title">
                    <strong>Bahasa & Konsep Ramah Mahasiswa</strong>
                    <span>Dirancang untuk mengisi liburan secara konsisten</span>
                  </td>
                  <td className="highlight-col"><Check size={20} className="check-icon" /> Bahasa Indonesia</td>
                  <td><span className="text-warn">⚠️ Bahasa Inggris</span></td>
                  <td><span className="text-warn">⚠️ Sebagian</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 4: FEATURES GRID */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">FITUR UNGGULAN</span>
            <h2 className="section-title">Segala Hal yang Kamu Butuhkan untuk <span className="text-gradient">Konsisten</span></h2>
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
              <h3>Mekanisme Bara & Tier XP</h3>
              <p>Dapatkan XP di setiap quest, naik tier dari Rookie hingga Grand Master 👑, dan rayakan pencapaian barumu.</p>
            </div>
            
            <div className="feature-card glass-panel">
              <div className="feature-icon-wrapper green">
                <Users size={24} color="#10b981" />
              </div>
              <h3>Social Friends & Leaderboard</h3>
              <p>Ajak temanmu bersaing sehat. Lihat siapa yang punya Bara terpanjang dan bandingkan XP secara real-time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box glass-panel">
            <div className="cta-flame-icon pulse">
              <Flame size={44} color="#f97316" />
            </div>
            <h2>Siap Menyalakan Bara Produktivitasmu?</h2>
            <p>Gabung sekarang, atur 3 habit pertamamu dalam 1 menit, dan buktikan konsistensimu!</p>
            <Link to="/register" className="btn btn-primary btn-lg">
              <Flame size={20} />
              Daftar Gratis Sekarang
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
