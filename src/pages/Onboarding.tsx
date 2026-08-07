import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Flame, Check, Loader2, Plus, Trash2, ArrowRight, ArrowLeft, 
  Sparkles, ShieldCheck, Zap, BookOpen, Dumbbell, Code2, Heart, Users, Home
} from 'lucide-react';
import './Onboarding.css';

interface StarterHabit {
  id: string;
  name: string;
  category: string;
  estimatedMinutes: number;
}

const CATEGORIES = [
  { id: 'coding', label: 'Coding', icon: Code2, color: '#3b82f6' },
  { id: 'exercise', label: 'Exercise', icon: Dumbbell, color: '#10b981' },
  { id: 'learning', label: 'Learning', icon: BookOpen, color: '#f59e0b' },
  { id: 'hobby', label: 'Hobby', icon: Heart, color: '#ec4899' },
  { id: 'social', label: 'Social', icon: Users, color: '#8b5cf6' },
  { id: 'chore', label: 'Chore', icon: Home, color: '#06b6d4' }
];

const HABIT_SUGGESTIONS: Record<string, { name: string; minutes: number }[]> = {
  coding: [
    { name: 'Belajar Coding / React 30m', minutes: 30 },
    { name: 'Selesaikan 1 Soal Logic / LeetCode', minutes: 20 },
    { name: 'Review Project / Git Commit', minutes: 15 }
  ],
  exercise: [
    { name: 'Workout / Push-up & Sit-up 15m', minutes: 15 },
    { name: 'Jogging / Jalan Pagi 20m', minutes: 20 },
    { name: 'Stretching & Minum 2L Air', minutes: 10 }
  ],
  learning: [
    { name: 'Membaca Buku Edukasi 15 Halaman', minutes: 20 },
    { name: 'Belajar Bahasa Asing / Duolingo', minutes: 15 },
    { name: 'Menonton Video Tutorial Tech', minutes: 25 }
  ],
  hobby: [
    { name: 'Latihan Musik / Gitar 20m', minutes: 20 },
    { name: 'Menggambar / Desain Kreatif', minutes: 30 },
    { name: 'Menulis Jurnal / Blog Harian', minutes: 15 }
  ],
  social: [
    { name: 'Sapa & Ngobrol dengan Teman', minutes: 15 },
    { name: 'Diskusi di Komunitas Belajar', minutes: 20 },
    { name: 'Family Time / Telepon Orang Tua', minutes: 15 }
  ],
  chore: [
    { name: 'Rapikan Kamar & Meja Kerja', minutes: 15 },
    { name: 'Bantu Cuci Piring & Bersih Rumah', minutes: 20 },
    { name: 'Rencanakan To-Do List Besok', minutes: 10 }
  ]
};

export default function Onboarding() {
  const { session, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  // Multi-step State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Username State
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  
  // Step 2: Categories & 3 Starter Habits
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['coding', 'exercise']);
  const [selectedHabits, setSelectedHabits] = useState<StarterHabit[]>([
    { id: '1', name: 'Belajar Coding / React 30m', category: 'coding', estimatedMinutes: 30 },
    { id: '2', name: 'Workout / Push-up 15m', category: 'exercise', estimatedMinutes: 15 },
    { id: '3', name: 'Membaca Buku Edukasi 15 Halaman', category: 'learning', estimatedMinutes: 20 }
  ]);
  const [customHabitName, setCustomHabitName] = useState('');
  const [customHabitCategory, setCustomHabitCategory] = useState('coding');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!session) {
      navigate('/login');
    }
    if (profile && profile.username) {
      navigate('/dashboard');
    }
  }, [session, profile, navigate]);

  // Username validation
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

  const addSuggestedHabit = (suggestion: { name: string; minutes: number }, categoryId: string) => {
    if (selectedHabits.some(h => h.name.toLowerCase() === suggestion.name.toLowerCase())) {
      return;
    }
    if (selectedHabits.length >= 5) {
      return;
    }
    setSelectedHabits(prev => [
      ...prev,
      {
        id: Date.now().toString() + Math.random().toString().slice(2, 5),
        name: suggestion.name,
        category: categoryId,
        estimatedMinutes: suggestion.minutes
      }
    ]);
  };

  const removeHabit = (id: string) => {
    setSelectedHabits(prev => prev.filter(h => h.id !== id));
  };

  const addCustomHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customHabitName.trim()) return;
    if (selectedHabits.length >= 5) return;

    setSelectedHabits(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: customHabitName.trim(),
        category: customHabitCategory,
        estimatedMinutes: 20
      }
    ]);
    setCustomHabitName('');
  };

  const handleFinishOnboarding = async () => {
    if (!usernameAvailable || submitting) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      // 1. Save onboarding username & favorite categories
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
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan data onboarding");
      }

      // 2. Batch create starter quests
      for (const habit of selectedHabits) {
        try {
          await fetch('/api/quests', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              name: habit.name,
              category: habit.category,
              estimatedMinutes: habit.estimatedMinutes
            })
          });
        } catch (questErr) {
          console.warn('Failed to auto-create habit during onboarding:', questErr);
        }
      }

      // 3. Refresh profile and enter dashboard
      await refreshProfile();
    } catch (e: any) {
      console.error(e);
      setSubmitError(e.message || "Terjadi kesalahan saat menyelesaikan onboarding");
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile) return <div className="loading-screen"><Loader2 className="spin" /></div>;

  return (
    <div className="onboarding-page">
      <div className="onboarding-container glass-panel">
        
        {/* Step Indicator */}
        <div className="onboarding-progress-bar">
          <div className="steps-header">
            <div className={`step-dot ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              {currentStep > 1 ? <Check size={14} /> : '1'}
            </div>
            <div className={`step-line ${currentStep >= 2 ? 'active' : ''}`} />
            <div className={`step-dot ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
              {currentStep > 2 ? <Check size={14} /> : '2'}
            </div>
            <div className={`step-line ${currentStep >= 3 ? 'active' : ''}`} />
            <div className={`step-dot ${currentStep >= 3 ? 'active' : ''}`}>
              3
            </div>
          </div>
          <div className="step-title-label">
            {currentStep === 1 && 'Langkah 1: Tentukan Identitas'}
            {currentStep === 2 && 'Langkah 2: Pilih 3 Habit Pertama (1-Menit Setup)'}
            {currentStep === 3 && 'Langkah 3: Pahami Cara Kerja Bara Api 🔥'}
          </div>
        </div>

        {/* STEP 1: USERNAME */}
        {currentStep === 1 && (
          <div className="onboarding-step-content animate-fade">
            <div className="onboarding-header">
              <Flame size={48} className="logo-icon orange pulse" />
              <h1>Selamat Datang di STREAK!</h1>
              <p>Pilih username unik untuk profil dan leaderboard kamu.</p>
            </div>
            
            <div className="onboarding-form">
              <div className="form-group">
                <label htmlFor="username">Username Kamu</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="Contoh: alex_coder99"
                    className={usernameError ? 'input-error' : usernameAvailable ? 'input-success' : ''}
                    maxLength={20}
                    autoFocus
                  />
                  {checkingUsername && <Loader2 className="input-icon spin" size={18} />}
                  {!checkingUsername && usernameAvailable && <Check className="input-icon success" size={18} />}
                </div>
                {usernameError && <span className="error-text">{usernameError}</span>}
                {usernameAvailable && <span className="success-text">Username tersedia! 👍</span>}
              </div>

              <button 
                type="button" 
                className="btn-primary full-width next-step-btn"
                disabled={!usernameAvailable || checkingUsername}
                onClick={() => setCurrentStep(2)}
              >
                Lanjut ke Pemilihan Habit <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CATEGORIES & 3 STARTER HABITS */}
        {currentStep === 2 && (
          <div className="onboarding-step-content animate-fade">
            <div className="onboarding-header compact">
              <h2>Pilih Kategori & 3 Habit Pertama 🎯</h2>
              <p>Mulai dengan 3 kebiasaan kecil agar konsistensi hari pertamamu langsung terbangun!</p>
            </div>

            {/* Category Selector */}
            <div className="onboarding-section">
              <label className="section-label">Pilih Kategori Favoritmu:</label>
              <div className="categories-grid-v2">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`category-pill ${isSelected ? 'selected' : ''}`}
                    >
                      <Icon size={16} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Habit Suggestions based on active categories */}
            <div className="onboarding-section">
              <div className="section-header-flex">
                <label className="section-label">Rekomendasi Habit Cepat (Klik untuk tambah):</label>
                <span className="habit-count-badge">
                  {selectedHabits.length}/3 Rekomendasi ({selectedHabits.length} dipilih)
                </span>
              </div>
              
              <div className="suggestions-list">
                {selectedCategories.flatMap(catId => 
                  (HABIT_SUGGESTIONS[catId] || []).map(sugg => {
                    const isAdded = selectedHabits.some(h => h.name.toLowerCase() === sugg.name.toLowerCase());
                    return (
                      <button
                        key={catId + sugg.name}
                        type="button"
                        onClick={() => !isAdded && addSuggestedHabit(sugg, catId)}
                        className={`suggestion-chip ${isAdded ? 'added' : ''}`}
                        disabled={isAdded || selectedHabits.length >= 5}
                      >
                        {isAdded ? <Check size={14} color="#10b981" /> : <Plus size={14} />}
                        <span>{sugg.name}</span>
                        <span className="suggestion-time">⏳ {sugg.minutes}m</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selected Habits List */}
            <div className="onboarding-section selected-habits-box">
              <label className="section-label">Daftar Habit Siap Diceklis di Dashboard:</label>
              {selectedHabits.length === 0 ? (
                <div className="empty-habits-prompt">
                  Pilih minimal 1–3 habit dari rekomendasi di atas atau tambah kustom di bawah.
                </div>
              ) : (
                <div className="selected-habits-list">
                  {selectedHabits.map((habit, index) => (
                    <div key={habit.id} className="selected-habit-card">
                      <div className="habit-card-left">
                        <span className="habit-number">{index + 1}</span>
                        <div>
                          <div className="habit-name">{habit.name}</div>
                          <div className="habit-meta">
                            <span className="category-tag">{habit.category}</span>
                            <span className="time-tag">⏳ {habit.estimatedMinutes} menit</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        className="remove-habit-btn"
                        onClick={() => removeHabit(habit.id)}
                        title="Hapus habit"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Habit Input Toggle */}
            <form onSubmit={addCustomHabit} className="custom-habit-form">
              <input
                type="text"
                placeholder="+ Tambah habit kustom sendiri..."
                value={customHabitName}
                onChange={(e) => setCustomHabitName(e.target.value)}
                className="custom-habit-input"
              />
              <select
                value={customHabitCategory}
                onChange={(e) => setCustomHabitCategory(e.target.value)}
                className="custom-cat-select"
              >
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                <option value="other">Lainnya</option>
              </select>
              <button 
                type="submit" 
                className="btn-add-custom"
                disabled={!customHabitName.trim() || selectedHabits.length >= 5}
              >
                <Plus size={16} /> Tambah
              </button>
            </form>

            {/* Navigation Buttons */}
            <div className="wizard-nav-buttons">
              <button 
                type="button" 
                className="btn-secondary back-btn"
                onClick={() => setCurrentStep(1)}
              >
                <ArrowLeft size={18} /> Kembali
              </button>
              <button 
                type="button" 
                className="btn-primary next-step-btn"
                disabled={selectedHabits.length === 0}
                onClick={() => setCurrentStep(3)}
              >
                Lanjut ke Tutorial <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: MINI TUTORIAL BARA API */}
        {currentStep === 3 && (
          <div className="onboarding-step-content animate-fade">
            <div className="onboarding-header compact">
              <div className="bara-fire-badge animate-pulse">
                <Flame size={36} color="#f97316" />
              </div>
              <h2>Mekanisme Bara Api STREAK 🔥</h2>
              <p>Pelajari 3 aturan emas agar streak produktivitasmu tidak pernah padam!</p>
            </div>

            <div className="tutorial-cards-grid">
              <div className="tutorial-card glass-panel">
                <div className="tut-icon-wrap orange">
                  <Zap size={24} />
                </div>
                <div className="tut-body">
                  <h4>1. Selesaikan 1 Quest Setiap Hari</h4>
                  <p>Cukup selesaikan minimal 1 quest sebelum pukul 23:59 untuk menjaga hari aktif dan raih +10 XP per quest.</p>
                </div>
              </div>

              <div className="tutorial-card glass-panel">
                <div className="tut-icon-wrap red">
                  <Flame size={24} />
                </div>
                <div className="tut-body">
                  <h4>2. Nyalakan Ikon Bara di Hari ke-3</h4>
                  <p>Konsisten 3 hari berturut-turut untuk menyalakan Bara Api 🔥. Raih bonus +50 XP ekstra di milestone hari ke-7!</p>
                </div>
              </div>

              <div className="tutorial-card glass-panel">
                <div className="tut-icon-wrap green">
                  <ShieldCheck size={24} />
                </div>
                <div className="tut-body">
                  <h4>3. Grace Period 48 Jam (Anti-Reset)</h4>
                  <p>Lupa ceklis kemarin? Tenang! Selesaikan 1 quest dalam 48 jam untuk pulihkan Bara (+20 XP bonus restore).</p>
                </div>
              </div>
            </div>

            {submitError && <div className="error-banner">{submitError}</div>}

            {/* Finish Button */}
            <div className="wizard-nav-buttons">
              <button 
                type="button" 
                className="btn-secondary back-btn"
                onClick={() => setCurrentStep(2)}
                disabled={submitting}
              >
                <ArrowLeft size={18} /> Ubah Habit
              </button>
              <button 
                type="button" 
                className="btn-primary start-adventure-btn"
                onClick={handleFinishOnboarding}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="spin" /> Menyiapkan Dashboard...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Mulai Petualangan!
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
