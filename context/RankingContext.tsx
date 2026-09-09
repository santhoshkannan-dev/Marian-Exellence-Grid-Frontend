'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Champion } from '@/data/initialData';
import { apiClient } from '@/services/apiClient';

export interface ClassIndexEntry {
  rank: number | null;
  class_name: string;
  department: string;
  department_code: string;
  N: number;
  S: number;
  P: number;
  n: number;
  moderation_mark?: number;
  total_score?: number;
  academic_score?: number;
  co_curricular_score?: number;
  extra_curricular_score?: number;
  scoring_version?: string;
  M: number | null;
}

export interface RankingContextType {
  classIndexData: ClassIndexEntry[] | null;
  smallestClassSize: number;
  championsData: Record<string, Champion[]>;
  fetchClassIndex: (year?: string) => Promise<void>;
  updateClassModeration: (classId: number, numStudents: number, negativePoints: number) => Promise<void>;
  updateSmallestClassSize: (n: number) => Promise<void>;
  fetchChampions: () => Promise<void>;
}

const RankingContext = createContext<RankingContextType | undefined>(undefined);

export const RankingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [classIndexData, setClassIndexData] = useState<ClassIndexEntry[] | null>(null);
  const [smallestClassSize, setSmallestClassSize] = useState<number>(0);
  const [championsData, setChampionsData] = useState<Record<string, Champion[]>>({});

  const fetchClassIndex = useCallback(async (year?: string) => {
    try {
      const endpoint = year ? `/class-index/?year=${encodeURIComponent(year)}` : '/class-index/';
      const data = await apiClient.get(endpoint);
      if (Array.isArray(data)) {
        setClassIndexData(data);
      }
    } catch (e: any) {
      console.warn('Failed to fetch class index:', e.message);
    }
  }, []);

  const fetchChampions = useCallback(async () => {
    try {
      const data: Champion[] = await apiClient.get('/champions/');
      if (Array.isArray(data)) {
        const grouped: Record<string, Champion[]> = {};
        data.forEach((champ) => {
          if (!grouped[champ.year]) grouped[champ.year] = [];
          grouped[champ.year].push(champ);
        });
        setChampionsData(grouped);
      }
    } catch (e: any) {
      console.warn('Failed to fetch champions:', e.message);
    }
  }, []);

  const updateClassModeration = useCallback(
    async (classId: number, numStudents: number, negativePoints: number) => {
      const positivePenalty = Math.max(0, Math.abs(Number(negativePoints) || 0));
      try {
        await apiClient.patch(`/auth/classes/${classId}/`, {
          num_students: numStudents,
          negative_points: positivePenalty,
        });
        // Refresh authoritative class index after moderation change
        await fetchClassIndex();
      } catch (e: any) {
        console.error('Failed to update class moderation fields:', e.message);
      }
    },
    [fetchClassIndex]
  );

  const updateSmallestClassSize = useCallback(async (n: number) => {
    setSmallestClassSize(n);
    try {
      await apiClient.post('/settings/', { smallest_class_size: n });
    } catch (e: any) {
      console.error('Failed to save smallest_class_size:', e.message);
    }
  }, []);

  // Fetch initial champions & settings on mount
  useEffect(() => {
    fetchChampions();
    apiClient
      .get('/settings/')
      .then((settings) => {
        if (settings && settings.smallest_class_size !== undefined) {
          const val = parseFloat(settings.smallest_class_size);
          if (!isNaN(val)) setSmallestClassSize(val);
        }
      })
      .catch(() => {});
  }, [fetchChampions]);

  return (
    <RankingContext.Provider
      value={{
        classIndexData,
        smallestClassSize,
        championsData,
        fetchClassIndex,
        updateClassModeration,
        updateSmallestClassSize,
        fetchChampions,
      }}
    >
      {children}
    </RankingContext.Provider>
  );
};

export const useRankings = (): RankingContextType => {
  const context = useContext(RankingContext);
  if (!context) {
    throw new Error('useRankings must be used within a RankingProvider');
  }
  return context;
};
