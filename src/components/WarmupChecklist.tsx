import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, BorderRadius, ComponentSize } from '../theme';
import type { SessionProtocol } from '../types';

export interface WarmupChecklistProps {
  protocols: SessionProtocol[];
  onToggle: (protocolId: number) => void;
  onContinue: () => void;
  timer?: string;
  sessionName?: string;
  onMenu?: () => void;
}

export function WarmupChecklist({
  protocols, onToggle, onContinue, timer, sessionName, onMenu,
}: WarmupChecklistProps) {
  const warmupProtocols = protocols.filter(p => p.type === 'warmup');

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Warm Up</Text>
          {sessionName && (
            <Text style={styles.subtitle}>{sessionName}</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          {timer && (
            <Text style={styles.timerDisplay}>{timer}</Text>
          )}
          {onMenu && (
            <TouchableOpacity
              onPress={onMenu}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.menuButton}
            >
              <Ionicons name="ellipsis-horizontal" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.items}>
        {warmupProtocols.map((protocol) => (
          <TouchableOpacity
            key={protocol.id}
            style={[
              styles.warmupItem,
              !!protocol.completed && styles.warmupItemChecked,
            ]}
            onPress={() => {
              onToggle(protocol.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <View style={[
              styles.warmupCheck,
              !!protocol.completed && styles.warmupCheckChecked,
            ]}>
              {!!protocol.completed && <Text style={styles.warmupCheckText}>{'\u2713'}</Text>}
            </View>
            <Text style={[
              styles.warmupLabel,
              !!protocol.completed && styles.warmupLabelChecked,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexShrink: 0,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.screenTitle,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
  },
  timerDisplay: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textDim,
    fontVariant: ['tabular-nums'],
  },
  menuButton: {
    padding: Spacing.xs,
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
