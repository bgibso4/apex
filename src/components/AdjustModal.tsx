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
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <Text style={styles.modalTitle}>Adjust Set</Text>

          <Text style={styles.modalLabel}>Weight (lbs)</Text>
          <View style={styles.adjustRow}>
            <TouchableOpacity style={styles.adjustButton}
              onPress={() => onWeightChange(Math.max(0, weight - 5))}>
              <Text style={styles.adjustButtonText}>-5</Text>
            </TouchableOpacity>
            <Text style={styles.adjustValue}>{weight}</Text>
            <TouchableOpacity style={styles.adjustButton}
              onPress={() => onWeightChange(weight + 5)}>
              <Text style={styles.adjustButtonText}>+5</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modalLabel}>Reps</Text>
          <View style={styles.adjustRow}>
            <TouchableOpacity style={styles.adjustButton}
              onPress={() => onRepsChange(Math.max(0, reps - 1))}>
              <Text style={styles.adjustButtonText}>-1</Text>
            </TouchableOpacity>
            <Text style={styles.adjustValue}>{reps}</Text>
            <TouchableOpacity style={styles.adjustButton}
              onPress={() => onRepsChange(reps + 1)}>
              <Text style={styles.adjustButtonText}>+1</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.bigButton, { backgroundColor: blockColor, marginTop: Spacing.lg }]}
            onPress={onSave}
          >
            <Text style={styles.bigButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    padding: Spacing.xxl, width: ComponentSize.modalWidth,
  },
  modalTitle: {
    color: Colors.text, fontSize: FontSize.xl, fontWeight: '700',
    marginBottom: Spacing.xl, textAlign: 'center',
  },
  modalLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.sm },
  adjustRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.xl, marginBottom: Spacing.xl,
  },
  adjustButton: {
    width: ComponentSize.buttonLarge, height: ComponentSize.buttonLarge,
    borderRadius: ComponentSize.buttonLarge / 2,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  adjustButtonText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  adjustValue: {
    color: Colors.text, fontSize: FontSize.xxxl, fontWeight: '700',
    minWidth: ComponentSize.chartHeightSmall, textAlign: 'center',
  },
  bigButton: {
    paddingVertical: Spacing.md, borderRadius: BorderRadius.md,
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  bigButtonText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
});
