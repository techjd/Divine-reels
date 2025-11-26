import { RankingEntry } from './ranking.types';

// Service placeholder for ranking computations.
export const rankingService = {
  getDailyRanking: async (): Promise<RankingEntry[]> => {
    return [
      { userId: 'mock-user-id', score: 100, position: 1 },
      { userId: 'user-2', score: 80, position: 2 }
    ];
  }
};
