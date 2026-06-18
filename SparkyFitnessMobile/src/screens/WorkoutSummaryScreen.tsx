import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import Icon from '../components/Icon';
import Button from '../components/ui/Button';
import { useActiveWorkoutStore } from '../stores/activeWorkoutStore';
import { usePreferences } from '../hooks/usePreferences';
import { weightFromKg } from '../utils/unitConversions';
import { useCreateWorkout } from '../hooks/useExerciseMutations';
import type { RootStackScreenProps } from '../types/navigation';
import type { CreatePresetSessionRequest } from '@workspace/shared';
import Toast from 'react-native-toast-message';

type Props = RootStackScreenProps<'WorkoutSummary'>;

const WorkoutSummaryScreen: React.FC<Props> = ({ navigation, route }) => {
  const { sessionName, entryDate, durationMinutes, totalCalories } = route.params;
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();
  const weightUnit = (preferences?.default_weight_unit ?? 'kg') as 'kg' | 'lbs';

  const session = useActiveWorkoutStore((s) => s.session);
  const setOverrides = useActiveWorkoutStore((s) => s.setOverrides);
  const completedSetIds = useActiveWorkoutStore((s) => s.completedSetIds);
  const clearWorkout = useActiveWorkoutStore((s) => s.clearWorkout);

  const { createSession, isPending: isSaving, invalidateCache } = useCreateWorkout();

  const [accentPrimary, , , , bgChrome, borderSubtle] = useCSSVariable([
    '--color-accent-primary',
    '--color-text-primary',
    '--color-text-secondary',
    '--color-text-muted',
    '--color-chrome',
    '--color-border-subtle',
  ]) as [string, string, string, string, string, string];

  // Build summary data from session + overrides
  const exerciseSummaries = useMemo(() => {
    if (!session) return [];
    return session.exercises.map((exercise) => {
      const completedSets = exercise.sets.filter((set) => completedSetIds[String(set.id)]);
      const totalVolume = exercise.sets.reduce((sum, set) => {
        const override = setOverrides[String(set.id)];
        const w = override?.weight ?? set.weight ?? 0;
        const r = override?.reps ?? set.reps ?? 0;
        return sum + w * r;
      }, 0);

      let bestSet: { weight: number; reps: number } | null = null;
      let bestVolume = 0;
      for (const set of exercise.sets) {
        const override = setOverrides[String(set.id)];
        const w = override?.weight ?? set.weight ?? 0;
        const r = override?.reps ?? set.reps ?? 0;
        if (w * r > bestVolume) {
          bestVolume = w * r;
          bestSet = { weight: w, reps: r };
        }
      }

      return {
        name: exercise.exercise_snapshot?.name ?? 'Exercise',
        totalSets: exercise.sets.length,
        completedSets: completedSets.length,
        volume: totalVolume,
        bestSet,
        calories: exercise.calories_burned,
      };
    });
  }, [session, setOverrides, completedSetIds]);

  const totalVolumeKg = exerciseSummaries.reduce((sum, ex) => sum + ex.volume, 0);
  const totalSets = exerciseSummaries.reduce((sum, ex) => sum + ex.totalSets, 0);
  const totalCompletedSets = exerciseSummaries.reduce((sum, ex) => sum + ex.completedSets, 0);

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  const handleSave = useCallback(async () => {
    if (!session) return;

    try {
      const exercises = session.exercises.map((exercise, exIndex) => ({
        exercise_id: exercise.exercise_id,
        sort_order: exIndex,
        duration_minutes: 0,
        sets: exercise.sets.map((set, setIndex) => {
          const override = setOverrides[String(set.id)];
          return {
            set_number: setIndex + 1,
            set_type: set.set_type ?? 'normal',
            weight: override?.weight ?? set.weight ?? null,
            reps: override?.reps ?? set.reps ?? null,
            duration: set.duration ?? null,
            rest_time: set.rest_time ?? null,
            notes: set.notes ?? null,
            rpe: override?.rir ?? null,
          };
        }),
      }));

      const payload: CreatePresetSessionRequest = {
        entry_date: entryDate,
        name: sessionName,
        source: 'sparky',
        exercises,
      };

      await createSession(payload);
      invalidateCache(entryDate);
      clearWorkout();
      Toast.show({ type: 'success', text1: 'Workout saved!' });
      navigation.popToTop();
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to save workout', text2: 'Please try again.' });
    }
  }, [session, sessionName, entryDate, setOverrides, createSession, invalidateCache, clearWorkout, navigation]);

  const handleDiscard = useCallback(() => {
    clearWorkout();
    navigation.popToTop();
  }, [clearWorkout, navigation]);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-lg font-bold text-text-primary">Workout Summary</Text>
        <Icon name="checkmark-circle" size={24} color={accentPrimary} />
      </View>

      <ScrollView className="flex-1 px-4" contentContainerClassName="pb-6">
        {/* Main Stats */}
        <View className="items-center py-6">
          <Text className="text-2xl font-bold text-text-primary">{sessionName}</Text>
          <Text className="text-sm text-text-secondary mt-1">{entryDate}</Text>

          <View className="flex-row gap-6 mt-4">
            <View className="items-center">
              <Text className="text-xs text-text-muted">Duration</Text>
              <Text className="text-lg font-bold text-text-primary">{formatDuration(durationMinutes)}</Text>
            </View>
            <View className="items-center">
              <Text className="text-xs text-text-muted">Volume</Text>
              <Text className="text-lg font-bold text-text-primary">
                {Math.round(weightFromKg(totalVolumeKg, weightUnit)).toLocaleString()} {weightUnit}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-xs text-text-muted">Calories</Text>
              <Text className="text-lg font-bold text-text-primary">{Math.round(totalCalories)}</Text>
            </View>
          </View>

          <Text className="text-xs text-text-muted mt-3">
            {totalCompletedSets} of {totalSets} sets completed
          </Text>
        </View>

        {/* Exercise Breakdown */}
        <View className="rounded-xl p-3" style={{ backgroundColor: bgChrome, borderWidth: 1, borderColor: borderSubtle }}>
          <Text className="text-sm font-semibold text-text-primary mb-3">Exercise Breakdown</Text>
          {exerciseSummaries.map((summary, index) => (
            <View key={index}>
              {index > 0 && <View className="border-t border-border-subtle my-2" />}
              <View className="flex-row items-center justify-between py-1">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-text-primary">{summary.name}</Text>
                  <Text className="text-xs text-text-muted">
                    {summary.completedSets}/{summary.totalSets} sets · {Math.round(weightFromKg(summary.volume, weightUnit))} {weightUnit}
                  </Text>
                </View>
                {summary.bestSet && summary.bestSet.weight > 0 && (
                  <View className="items-end">
                    <Text className="text-xs text-text-muted">Best</Text>
                    <Text className="text-sm font-medium text-text-secondary">
                      {parseFloat(weightFromKg(summary.bestSet.weight, weightUnit).toFixed(1))} {weightUnit} × {summary.bestSet.reps}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View
        className="px-4 py-3 flex-row gap-3"
        style={{
          paddingBottom: Math.max(insets.bottom, 12),
          borderTopWidth: 1,
          borderTopColor: borderSubtle,
        }}
      >
        <Button
          variant="secondary"
          onPress={handleDiscard}
          className="flex-1 py-3"
        >
          <Text className="text-sm font-semibold text-center text-text-secondary">Discard</Text>
        </Button>
        <Button
          variant="primary"
          onPress={handleSave}
          disabled={isSaving}
          className="flex-1 py-3"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-sm font-semibold text-center text-white">Save Workout</Text>
          )}
        </Button>
      </View>
    </View>
  );
};

export default WorkoutSummaryScreen;
