import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface QuestCelebrationProps {
  isVisible: boolean;
  xpGained: number;
  isFirstQuest?: boolean;
  questName?: string;
}

export function QuestCelebration({
  isVisible,
  xpGained,
  isFirstQuest,
  questName
}: QuestCelebrationProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isAnimating) return null;

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[100]">
      {/* Main celebration emoji */}
      <div className="animate-bounce text-8xl mb-20 drop-shadow-2xl">
        {isFirstQuest ? '🎉' : '✨'}
      </div>

      {/* XP text animation - floats up */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative animate-float">
          {/* Particle effects */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute opacity-75"
              style={{
                width: `${60 + i * 40}px`,
                height: `${60 + i * 40}px`,
                border: '2px solid var(--primary-color)',
                borderRadius: '50%',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                animation: `pulseGlow ${1 + i * 0.3}s infinite`
              }}
            />
          ))}

          {/* XP text */}
          <div className="relative">
            <div className="text-5xl font-extrabold text-gradient drop-shadow-lg">
              +{xpGained} XP
            </div>
            {isFirstQuest && (
              <div className="text-sm text-[#fbbf24] font-bold text-center mt-2 flex items-center justify-center gap-1 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                <Sparkles className="w-4 h-4" />
                Quest Pertama!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quest name (if available) */}
      {questName && (
        <div className="absolute bottom-[20%] text-center animate-fade-in">
          <p className="text-white font-semibold text-xl drop-shadow-md">{questName}</p>
          <p className="text-[#f97316] font-bold text-sm uppercase tracking-wider mt-1 drop-shadow-sm">Terselesaikan!</p>
        </div>
      )}
      
      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
