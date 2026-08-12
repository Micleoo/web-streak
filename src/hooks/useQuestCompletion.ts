import { useState, useCallback } from 'react';
import { triggerConfetti, triggerBigConfetti } from '../utils/celebration';

interface CompleteQuestOptions {
  questId: string;
  questName?: string;
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

export function useQuestCompletion() {
  const [isLoading, setIsLoading] = useState(false);
  const [celebrationState, setCelebrationState] = useState({
    isVisible: false,
    xpGained: 0,
    isFirstQuest: false,
    questName: ''
  });

  const completeQuest = useCallback(async (options: CompleteQuestOptions) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/quests/${options.questId}/check`, { method: 'POST' });
      const data = await response.json();

      if (data.error) {
        if (options.onError) options.onError(data.error);
        return;
      }

      // Check if it's the first quest ever for the user
      // Since our API currently might not return `total_quests_completed`, 
      // we can infer it or we can just check if xp gained or rely on data from API.
      // For now, let's look at `data.xpGained` if returned, otherwise default to 10.
      const xpGained = data.xpGained || (data.gracePeriodRestored ? 30 : 10);
      const isFirstQuest = data.isFirstQuest || false; // Ideally backend returns this

      if (isFirstQuest) {
        triggerBigConfetti();
      } else {
        triggerConfetti();
      }

      setCelebrationState({
        isVisible: true,
        xpGained: xpGained,
        isFirstQuest,
        questName: options.questName || ''
      });

      if (options.onSuccess) {
        options.onSuccess();
      }

      // Optional: Backend could return badge info to trigger badge animations

    } catch (error) {
      console.error('[useQuestCompletion] Error:', error);
      if (options.onError) options.onError('Gagal menyelesaikan quest');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    completeQuest,
    isLoading,
    celebrationState
  };
}
