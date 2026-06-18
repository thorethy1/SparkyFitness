import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useCSSVariable } from 'uniwind';
import Icon from './Icon';

interface ExerciseInstructionSheetProps {
  instructions: string[] | null;
  isExpanded: boolean;
  onToggle: () => void;
}

const ExerciseInstructionSheet: React.FC<ExerciseInstructionSheetProps> = ({
  instructions,
  isExpanded,
  onToggle,
}) => {
  const [accentPrimary] = useCSSVariable(['--color-accent-primary']) as [string];

  if (!instructions || instructions.length === 0) return null;

  return (
    <View className="mt-3">
      <TouchableOpacity
        onPress={onToggle}
        className="flex-row items-center justify-between py-2"
        activeOpacity={0.7}
      >
        <Text className="text-sm font-semibold text-text-primary">Instructions</Text>
        <Icon
          name={isExpanded ? 'chevron-forward' : 'chevron-down'}
          size={18}
          color={accentPrimary}
        />
      </TouchableOpacity>
      {isExpanded && (
        <View className="pb-2">
          {instructions.map((instruction, index) => (
            <View key={index} className="flex-row mt-1.5">
              <Text className="text-sm text-text-muted mr-2">{index + 1}.</Text>
              <Text className="text-sm text-text-secondary flex-1">{instruction}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default React.memo(ExerciseInstructionSheet);
