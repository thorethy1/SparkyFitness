import React, { useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useCSSVariable } from 'uniwind';

interface RIRSelectorProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

const RIR_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: '0' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
  { value: 6, label: '6' },
  { value: 7, label: '7' },
  { value: 8, label: '8' },
  { value: 9, label: '9' },
  { value: 10, label: '10' },
];

const RIRSelector: React.FC<RIRSelectorProps> = ({ value, onChange }) => {
  const [accentPrimary, textMuted] = useCSSVariable([
    '--color-accent-primary',
    '--color-text-muted',
  ]) as [string, string];

  const scrollRef = useRef<ScrollView>(null);

  const handleSelect = useCallback(
    (rir: number) => {
      onChange(value === rir ? null : rir);
    },
    [value, onChange],
  );

  return (
    <View>
      <Text className="text-xs font-medium text-text-muted mb-2 text-center">
        RIR (Reps In Reserve)
      </Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4, gap: 6 }}
      >
        {RIR_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => handleSelect(option.value)}
              className="items-center justify-center rounded-lg px-3 py-2 min-w-[40px]"
              style={{
                backgroundColor: isSelected ? accentPrimary : 'transparent',
                borderWidth: 1,
                borderColor: isSelected ? accentPrimary : textMuted,
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: isSelected ? '#FFFFFF' : textMuted }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default React.memo(RIRSelector);
