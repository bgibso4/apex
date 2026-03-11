import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, BorderRadius, ComponentSize } from '../theme';
import type { SessionProtocol } from '../types';

export interface WarmupChecklistProps {
  protocols: SessionProtocol[];
  onToggle: (protocolId: number) => void;
  onContinue: () => void;
  timer?: string;
}

export function WarmupChecklist({
  protocols, onToggle, onContinue, timer,
}: WarmupChecklistProps) {
  const warmupProtocols = protocols.filter(p => p.type === 'warmup');

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Warm Up</Text>
        {timer && (
          <Text style={styles.timerDisplay}>{timer}</Text>
        )}
      </View>
      <View style={styles.items}>
        {warmupProtocols.map((protocol) => (
          <TouchableOpacity
            key={protocol.id}
            style={[
              styles.warmupItem,
              protocol.completed && styles.warmupItemChecked,
            ]}
            onPress={() => {
              onToggle(protocol.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <View style={[
              styles.warmupCheck,
              protocol.completed && styles.warmupCheckChecked,
            ]}>
              {protocol.completed && <Text style={styles.warmupCheckText}>{'\u2713'}</Text>}
            </View>
            <Text style={[
              styles.warmupLabel,
              protocol.completed && styles.warmupLabelChecked,
            ]}>{protocol.protocol_name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={onContinue}
        activeOpacity={0.8}
      >
        <Text style={styles.continueButtonText}>Continue to Exercises {'\u2192'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.xl,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.screenTitle,
    fontWeight: '800',
  },
  timerDisplay: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textDim,
    fontVariant: ['tabular-nums'],
  },
  items: {
    gap: Spacing.sm,
    flex: 1,
  },
  warmupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.xl - 2, // 18px
    paddingHorizontal: Spacing.cardPaddingCompact,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.cardInner,
  },
  warmupItemChecked: {
    borderColor: Colors.greenBorderFaint,
  },
  warmupCheck: {
    width: ComponentSize.warmupCheckSize,
    height: ComponentSize.warmupCheckSize,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  warmupCheckChecked: {
    backgroundColor: Colors.greenMuted,
    borderColor: Colors.green,
  },
  warmupCheckText: {
    color: Colors.green,
    fontSize: FontSize.body,
  },
  warmupLabel: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  warmupLabelChecked: {
    color: Colors.textSecondary,
  },
  continueButton: {
    marginTop: Spacing.xxl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.indigo,
    borderRadius: BorderRadius.cardInner,
    alignItems: 'center',
  },
  continueButtonText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});
