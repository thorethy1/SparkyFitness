import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import Icon from '../components/Icon';
import SafeImage from '../components/SafeImage';
import Button from '../components/ui/Button';
import RIRSelector from '../components/RIRSelector';
import ExerciseInstructionSheet from '../components/ExerciseInstructionSheet';
import { useActiveWorkoutExercise } from '../hooks/useActiveWorkoutExercise';
import { useActiveWorkoutStore } from '../stores/activeWorkoutStore';
import { usePreferences } from '../hooks/usePreferences';
import { useExerciseImageSource } from '../hooks/useExerciseImageSource';
import { weightFromKg } from '../utils/unitConversions';
import { CATEGORY_ICON_MAP } from '../utils/workoutSession';
import type { RootStackScreenProps } from '../types/navigation';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

type Props = RootStackScreenProps<'ActiveWorkoutExercise'>;

function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${ss.toString().padStart(2, '0')}`;
}

const ActiveWorkoutExerciseScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();
  const weightUnit = (preferences?.default_weight_unit ?? 'kg') as 'kg' | 'lbs';
  const { getImageSource } = useExerciseImageSource();

  const {
    exercise,
    exerciseIndex,
    totalExercises,
    sets,
    activeSet,
    activeSetIndex,
    completedSets,
    isLastExercise,
    isWorkoutComplete,
    stats,
    overrideData,
    setOverride,
    completeSet,
    isResting,
  } = useActiveWorkoutExercise();

  const restState = useActiveWorkoutStore((s) => s.rest.state);
  const restEndsAt = useActiveWorkoutStore((s) => s.rest.endsAt);
  const restPausedMs = useActiveWorkoutStore((s) => s.rest.pausedRemainingMs);
  const restDuration = useActiveWorkoutStore((s) => s.rest.durationSec);
  const pauseRest = useActiveWorkoutStore((s) => s.pauseRest);
  const resumeRest = useActiveWorkoutStore((s) => s.resumeRest);
  const dismissRest = useActiveWorkoutStore((s) => s.dismissRest);
  const clearWorkout = useActiveWorkoutStore((s) => s.clearWorkout);
  const session = useActiveWorkoutStore((s) => s.session);
  const startedAt = useActiveWorkoutStore((s) => s.startedAt);

  const [instructionsExpanded, setInstructionsExpanded] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [repsInput, setRepsInput] = useState('');
  const [rirInput, setRirInput] = useState<number | null>(null);

  const [accentPrimary, textPrimary, textSecondary, textMuted, bgChrome, borderSubtle] = useCSSVariable([
    '--color-accent-primary',
    '--color-text-primary',
    '--color-text-secondary',
    '--color-text-muted',
    '--color-chrome',
    '--color-border-subtle',
  ]) as [string, string, string, string, string, string];

  // Initialize input fields from preset or override data
  useEffect(() => {
    if (!activeSet) return;
    const override = overrideData;
    setWeightInput(override?.weight != null ? String(override.weight) : (activeSet.weight != null ? String(activeSet.weight) : ''));
    setRepsInput(override?.reps != null ? String(override.reps) : (activeSet.reps != null ? String(activeSet.reps) : ''));
    setRirInput(override?.rir ?? null);
  }, [activeSet?.id, overrideData]);

  // Rest timer countdown
  const [restCountdown, setRestCountdown] = useState(0);
  useEffect(() => {
    if (restState !== 'resting' || !restEndsAt) {
      setRestCountdown(0);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000));
      setRestCountdown(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [restState, restEndsAt]);

  const restPausedCountdown = restState === 'paused' && restPausedMs != null
    ? Math.ceil(restPausedMs / 1000)
    : 0;

  // Derived data
  const exerciseName = exercise?.exercise_snapshot?.name ?? 'Exercise';
  const exerciseImage = exercise?.exercise_snapshot?.images?.[0] ?? null;
  const exerciseCategory = exercise?.exercise_snapshot?.category;
  const exerciseInstructions = exercise?.exercise_snapshot?.instructions ?? null;
  const exerciseIcon = (exerciseCategory && CATEGORY_ICON_MAP[exerciseCategory]) || 'exercise-weights';

  const lastSet = stats?.lastSet;
  const lastSetDate = lastSet?.entryDate;
  const lastSetWeight = lastSet?.weight;
  const lastSetReps = lastSet?.reps;

  const displayWeight = overrideData?.weight != null
    ? parseFloat(weightFromKg(overrideData.weight, weightUnit).toFixed(1))
    : (activeSet?.weight != null ? parseFloat(weightFromKg(activeSet.weight, weightUnit).toFixed(1)) : null);
  const displayReps = overrideData?.reps ?? activeSet?.reps ?? null;

  const handleWeightChange = useCallback((text: string) => {
    setWeightInput(text);
    if (activeSet) {
      const num = parseFloat(text);
      setOverride(String(activeSet.id), { weight: isNaN(num) ? null : num });
    }
  }, [activeSet, setOverride]);

  const handleRepsChange = useCallback((text: string) => {
    setRepsInput(text);
    if (activeSet) {
      const num = parseInt(text, 10);
      setOverride(String(activeSet.id), { reps: isNaN(num) ? null : num });
    }
  }, [activeSet, setOverride]);

  const handleRirChange = useCallback((value: number | null) => {
    setRirInput(value);
    if (activeSet) {
      setOverride(String(activeSet.id), { rir: value });
    }
  }, [activeSet, setOverride]);

  const handleCompleteSet = useCallback(() => {
    completeSet();
  }, [completeSet]);

  const handleFinishWorkout = useCallback(() => {
    const durationMinutes = startedAt ? Math.round((Date.now() - startedAt) / 60000) : 0;
    const totalCalories = session?.exercises.reduce((sum, e) => sum + e.calories_burned, 0) ?? 0;
    clearWorkout();
    navigation.replace('WorkoutSummary', {
      sessionId: session?.id ?? '',
      sessionName: session?.name ?? 'Workout',
      entryDate: session?.entry_date ?? '',
      durationMinutes,
      totalCalories,
    });
  }, [startedAt, session, clearWorkout, navigation]);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleOpenVideo = useCallback(() => {
    const query = encodeURIComponent(`${exerciseName} exercise tutorial`);
    void Linking.openURL(`https://www.youtube.com/results?search_query=${query}`);
  }, [exerciseName]);

  // Workout complete state
  if (isWorkoutComplete || !exercise || !activeSet) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center px-6">
          <Icon name="checkmark-circle" size={64} color={accentPrimary} />
          <Text className="text-2xl font-bold text-text-primary mt-4">Workout Complete!</Text>
          <Text className="text-base text-text-secondary mt-2 text-center">
            Great job! You've completed all exercises.
          </Text>
          <Button variant="primary" onPress={handleFinishWorkout} className="mt-6 px-8 py-3">
            <Text className="text-white font-semibold">View Summary</Text>
          </Button>
        </View>
      </View>
    );
  }

  const restProgress = restDuration > 0
    ? Math.max(0, Math.min(1, (restState === 'paused' ? restPausedCountdown : restCountdown) / restDuration))
    : 0;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="close" size={24} color={textPrimary} />
        </Pressable>
        <View className="flex-1 items-center">
          <Text className="text-xs text-text-muted">
            Exercise {exerciseIndex + 1} of {totalExercises}
          </Text>
          <Text className="text-sm font-semibold text-text-primary mt-0.5">
            Set {activeSetIndex + 1} of {sets.length}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-6"
        keyboardShouldPersistTaps="handled"
      >
        {/* Exercise Image */}
        <View className="items-center mb-4">
          <View style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden' }}>
            <SafeImage
              source={exerciseImage ? getImageSource(exerciseImage) : null}
              style={{ width: '100%', height: '100%' }}
              fallback={
                <View className="flex-1 items-center justify-center bg-chrome">
                  <Icon name={exerciseIcon} size={48} color={accentPrimary} />
                </View>
              }
            />
          </View>
          {exerciseImage && (
            <TouchableOpacity
              onPress={handleOpenVideo}
              className="absolute bottom-2 right-2 bg-black/60 rounded-full p-2"
              activeOpacity={0.7}
            >
              <Icon name="play" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Exercise Name & Category */}
        <View className="items-center mb-4">
          <Text className="text-xl font-bold text-text-primary text-center">{exerciseName}</Text>
          {exerciseCategory && (
            <View className="mt-1 px-3 py-1 rounded-full" style={{ backgroundColor: `${accentPrimary}20` }}>
              <Text className="text-xs font-medium" style={{ color: accentPrimary }}>{exerciseCategory}</Text>
            </View>
          )}
        </View>

        {/* Last Session Card */}
        {lastSet && lastSetDate && (
          <View className="rounded-xl p-3 mb-4" style={{ backgroundColor: bgChrome, borderWidth: 1, borderColor: borderSubtle }}>
            <Text className="text-xs font-medium text-text-muted mb-1">Last Session — {lastSetDate}</Text>
            <View className="flex-row items-center gap-3">
              {lastSetWeight != null && (
                <Text className="text-sm text-text-secondary">
                  {parseFloat(weightFromKg(lastSetWeight, weightUnit).toFixed(1))} {weightUnit}
                </Text>
              )}
              {lastSetReps != null && (
                <Text className="text-sm text-text-secondary">{lastSetReps} reps</Text>
              )}
            </View>
          </View>
        )}

        {/* Current Set Input */}
        <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: bgChrome, borderWidth: 1, borderColor: borderSubtle }}>
          <Text className="text-sm font-semibold text-text-primary mb-3 text-center">Current Set</Text>

          {/* Weight & Reps Row */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-xs text-text-muted mb-1 text-center">Weight ({weightUnit})</Text>
              <View className="flex-row items-center justify-center gap-2">
                <Pressable
                  onPress={() => {
                    const current = parseFloat(weightInput) || 0;
                    const next = Math.max(0, current - 2.5);
                    handleWeightChange(String(next));
                  }}
                  className="w-10 h-10 rounded-lg items-center justify-center"
                  style={{ backgroundColor: `${accentPrimary}20` }}
                >
                  <Text className="text-lg font-bold" style={{ color: accentPrimary }}>−</Text>
                </Pressable>
                <View className="flex-1">
                  <Text
                    className="text-2xl font-bold text-text-primary text-center"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {displayWeight != null ? displayWeight : '—'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    const current = parseFloat(weightInput) || 0;
                    const next = current + 2.5;
                    handleWeightChange(String(next));
                  }}
                  className="w-10 h-10 rounded-lg items-center justify-center"
                  style={{ backgroundColor: `${accentPrimary}20` }}
                >
                  <Text className="text-lg font-bold" style={{ color: accentPrimary }}>+</Text>
                </Pressable>
              </View>
            </View>

            <View className="flex-1">
              <Text className="text-xs text-text-muted mb-1 text-center">Reps</Text>
              <View className="flex-row items-center justify-center gap-2">
                <Pressable
                  onPress={() => {
                    const current = parseInt(repsInput, 10) || 0;
                    const next = Math.max(0, current - 1);
                    handleRepsChange(String(next));
                  }}
                  className="w-10 h-10 rounded-lg items-center justify-center"
                  style={{ backgroundColor: `${accentPrimary}20` }}
                >
                  <Text className="text-lg font-bold" style={{ color: accentPrimary }}>−</Text>
                </Pressable>
                <View className="flex-1">
                  <Text
                    className="text-2xl font-bold text-text-primary text-center"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {displayReps != null ? displayReps : '—'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    const current = parseInt(repsInput, 10) || 0;
                    const next = current + 1;
                    handleRepsChange(String(next));
                  }}
                  className="w-10 h-10 rounded-lg items-center justify-center"
                  style={{ backgroundColor: `${accentPrimary}20` }}
                >
                  <Text className="text-lg font-bold" style={{ color: accentPrimary }}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* RIR Selector */}
          <RIRSelector value={rirInput} onChange={handleRirChange} />
        </View>

        {/* Sets List */}
        <View className="rounded-xl p-3 mb-4" style={{ backgroundColor: bgChrome, borderWidth: 1, borderColor: borderSubtle }}>
          <Text className="text-xs font-semibold text-text-muted mb-2">All Sets</Text>
          <View className="flex-row py-1 mb-1">
            <Text className="text-xs font-semibold text-text-muted w-8 text-center">#</Text>
            <Text className="text-xs font-semibold text-text-muted flex-1 text-center">Weight</Text>
            <Text className="text-xs font-semibold text-text-muted flex-1 text-center">Reps</Text>
            <Text className="text-xs font-semibold text-text-muted w-10 text-center">RIR</Text>
          </View>
          {sets.map((set, idx) => {
            const setIdStr = String(set.id);
            const isCompleted = useActiveWorkoutStore.getState().completedSetIds[setIdStr];
            const isActive = setIdStr === String(activeSet.id);
            const setOverride = useActiveWorkoutStore.getState().setOverrides[setIdStr];
            const w = setOverride?.weight ?? set.weight;
            const r = setOverride?.reps ?? set.reps;
            const rir = setOverride?.rir;
            const wDisplay = w != null ? parseFloat(weightFromKg(w, weightUnit).toFixed(1)) : null;

            return (
              <View
                key={set.id}
                className="flex-row items-center py-1.5"
                style={{
                  backgroundColor: isActive ? `${accentPrimary}10` : 'transparent',
                  borderRadius: 6,
                }}
              >
                <Text className="text-xs w-8 text-center" style={{ color: isActive ? accentPrimary : textMuted }}>
                  {isCompleted ? (
                    <Icon name="checkmark-circle" size={16} color={accentPrimary} />
                  ) : (
                    idx + 1
                  )}
                </Text>
                <Text className="text-xs flex-1 text-center" style={{ color: textPrimary }}>
                  {wDisplay != null ? `${wDisplay} ${weightUnit}` : '—'}
                </Text>
                <Text className="text-xs flex-1 text-center" style={{ color: textPrimary }}>
                  {r != null ? r : '—'}
                </Text>
                <Text className="text-xs w-10 text-center" style={{ color: textMuted }}>
                  {rir != null ? rir : '—'}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Instructions */}
        <ExerciseInstructionSheet
          instructions={exerciseInstructions ?? null}
          isExpanded={instructionsExpanded}
          onToggle={() => setInstructionsExpanded(!instructionsExpanded)}
        />

        {/* Bottom spacer for rest overlay */}
        <View style={{ height: isResting ? 120 : 20 }} />
      </KeyboardAwareScrollView>

      {/* Rest Timer Overlay */}
      {isResting && (
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
          className="absolute inset-x-0 bottom-0 z-50"
          style={{ paddingBottom: insets.bottom }}
        >
          <View className="bg-chrome border-t border-chrome-border px-4 py-4">
            {/* Progress bar */}
            <View className="h-1 bg-progress-track rounded-full mb-3">
              <View
                className="h-1 bg-accent-primary rounded-full"
                style={{ width: `${restProgress * 100}%` }}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-text-primary">
                {restState === 'paused' ? 'Paused' : 'Rest'}
              </Text>
              <Text
                className="text-3xl font-bold text-text-primary"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatCountdown(restState === 'paused' ? restPausedCountdown : restCountdown)}
              </Text>
              <View className="flex-row gap-2">
                {restState === 'resting' ? (
                  <Pressable onPress={pauseRest} className="p-2 rounded-full" style={{ backgroundColor: `${accentPrimary}20` }}>
                    <Icon name="pause" size={20} color={accentPrimary} />
                  </Pressable>
                ) : (
                  <Pressable onPress={resumeRest} className="p-2 rounded-full" style={{ backgroundColor: `${accentPrimary}20` }}>
                    <Icon name="play" size={20} color={accentPrimary} />
                  </Pressable>
                )}
                <Pressable onPress={dismissRest} className="p-2 rounded-full" style={{ backgroundColor: `${textMuted}20` }}>
                  <Icon name="close" size={20} color={textMuted} />
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Complete Set Button (when not resting) */}
      {!isResting && (
        <View
          className="px-4 py-3"
          style={{
            paddingBottom: Math.max(insets.bottom, 12),
            borderTopWidth: 1,
            borderTopColor: borderSubtle,
          }}
        >
          <Button
            variant="primary"
            onPress={handleCompleteSet}
            className="py-3"
          >
            <Text className="text-sm font-semibold text-center text-white">
              {activeSetIndex === sets.length - 1 && isLastExercise
                ? 'Finish Workout'
                : activeSetIndex === sets.length - 1
                  ? 'Next Exercise'
                  : 'Complete Set'}
            </Text>
          </Button>
        </View>
      )}
    </View>
  );
};

export default ActiveWorkoutExerciseScreen;
