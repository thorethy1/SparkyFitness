import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useActiveWorkoutStore, type SetOverrideData } from '../stores/activeWorkoutStore';
import { exerciseStatsQueryKey } from '../hooks/queryKeys';
import { fetchExerciseStats } from '../services/api/exerciseApi';
import type { ExerciseEntryResponse, ExerciseEntrySetResponse, ExerciseStatsResponse } from '@workspace/shared';

export interface ActiveExerciseData {
  exercise: ExerciseEntryResponse;
  exerciseIndex: number;
  totalExercises: number;
  sets: ExerciseEntrySetResponse[];
  activeSet: ExerciseEntrySetResponse | null;
  activeSetIndex: number;
  completedSets: ExerciseEntrySetResponse[];
  pendingSets: ExerciseEntrySetResponse[];
  isLastExercise: boolean;
  isWorkoutComplete: boolean;
  stats: ExerciseStatsResponse | undefined;
  overrideData: SetOverrideData | null;
}

export function useActiveWorkoutExercise(): ActiveExerciseData & {
  setOverride: (setId: string, data: Partial<SetOverrideData>) => void;
  completeSet: () => void;
  isResting: boolean;
} {
  const session = useActiveWorkoutStore((s) => s.session);
  const activeSetId = useActiveWorkoutStore((s) => s.activeSetId);
  const restState = useActiveWorkoutStore((s) => s.rest.state);
  const completedSetIds = useActiveWorkoutStore((s) => s.completedSetIds);
  const setSetOverride = useActiveWorkoutStore((s) => s.setSetOverride);
  const getSetOverride = useActiveWorkoutStore((s) => s.getSetOverride);
  const completeActiveSet = useActiveWorkoutStore((s) => s.completeActiveSet);

  const activeExercise = useMemo(() => {
    if (!session || !activeSetId) return null;
    for (const exercise of session.exercises) {
      if (exercise.sets.some((set) => String(set.id) === activeSetId)) {
        return exercise;
      }
    }
    return null;
  }, [session, activeSetId]);

  const exerciseIndex = useMemo(() => {
    if (!session || !activeExercise) return -1;
    return session.exercises.findIndex((ex) => ex.id === activeExercise.id);
  }, [session, activeExercise]);

  const activeSet = useMemo(() => {
    if (!activeExercise || !activeSetId) return null;
    return activeExercise.sets.find((set) => String(set.id) === activeSetId) ?? null;
  }, [activeExercise, activeSetId]);

  const activeSetIndex = useMemo(() => {
    if (!activeExercise || !activeSet) return -1;
    return activeExercise.sets.indexOf(activeSet);
  }, [activeExercise, activeSet]);

  const { completedSets, pendingSets } = useMemo(() => {
    if (!activeExercise) return { completedSets: [], pendingSets: [] };
    const completed: ExerciseEntrySetResponse[] = [];
    const pending: ExerciseEntrySetResponse[] = [];
    for (const set of activeExercise.sets) {
      if (completedSetIds[String(set.id)]) {
        completed.push(set);
      } else {
        pending.push(set);
      }
    }
    return { completedSets: completed, pendingSets: pending };
  }, [activeExercise, completedSetIds]);

  const isLastExercise = useMemo(() => {
    if (!session || exerciseIndex < 0) return false;
    return exerciseIndex === session.exercises.length - 1;
  }, [session, exerciseIndex]);

  const isWorkoutComplete = !activeSetId;

  // Fetch exercise stats for the last session card
  const exerciseId = activeExercise?.exercise_snapshot?.id;
  const { data: stats } = useQuery({
    queryKey: exerciseStatsQueryKey(exerciseId ?? ''),
    queryFn: () => fetchExerciseStats(exerciseId!),
    enabled: !!exerciseId,
    staleTime: 1000 * 60 * 5,
  });

  const overrideData = activeSetId ? getSetOverride(activeSetId) : null;

  const setOverride = useCallback(
    (setId: string, data: Partial<SetOverrideData>) => {
      setSetOverride(setId, data);
    },
    [setSetOverride],
  );

  const completeSet = useCallback(() => {
    completeActiveSet();
  }, [completeActiveSet]);

  const isResting = restState === 'resting' || restState === 'paused';

  return {
    exercise: activeExercise!,
    exerciseIndex,
    totalExercises: session?.exercises.length ?? 0,
    sets: activeExercise?.sets ?? [],
    activeSet,
    activeSetIndex,
    completedSets,
    pendingSets,
    isLastExercise,
    isWorkoutComplete,
    stats,
    overrideData,
    setOverride,
    completeSet,
    isResting,
  };
}
