import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, ComponentSize } from '../theme';

export interface AdjustModalProps {
  visible: boolean;
  weight: number;
  reps: number;
  blockColor: string;
  onWeightChange: (weight: number) => void;
  onRepsChange: (reps: number) => void;
  onSave: () => void;
  onClose: () => void;
}

export function AdjustModal({
  visible, weight, reps, blockColor,
  onWeightChange, onRepsChange, onSave, onClose,
}: AdjustModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.content} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>Adjust Set</Text>

          <Text style={styles.label}>Weight (lbs)</Text>
          <View style={styles.adjustRow}>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => onWeightChange(Math.max(0, weight - 5))}
            >
              <Text style={styles.adjustButtonText}>-5</Text>
            </TouchableOpacity>
            <Text style={styles.adjustValue}>{weight}</Text>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => onWeightChange(weight + 5)}
            >
              <Text style={styles.adjustButtonText}>+5</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Reps</Text>
          <View style={styles.adjustRow}>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => onRepsChange(Math.max(0, reps - 1))}
            >
              <Text style={styles.adjustButtonText}>-1</Text>
            </TouchableOpacity>
            <Text style={styles.adjustValue}>{reps}</Text>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => onRepsChange(reps + 1)}
            >
              <Text style={styles.adjustButtonText}>+1</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: blockColor }]}
            onPress={onSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.modal,
    padding: Spacing.xxl,
    width: ComponentSize.modalWidth,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  adjustButton: {
    width: ComponentSize.buttonLarge,
    height: ComponentSize.buttonLarge,
    borderRadius: ComponentSize.buttonLarge / 2,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButtonText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  adjustValue: {
    color: Colors.text,
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.cardInner,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  saveButtonText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});
