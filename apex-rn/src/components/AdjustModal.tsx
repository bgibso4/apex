import { View, Text, TextInput, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, ComponentSize } from '../theme';
import { InputField, FIELD_LABELS, FIELD_STEPS, FIELD_KEYBOARD, FIELD_PROFILES } from '../types/fields';

export interface AdjustModalProps {
  visible: boolean;
  values: Record<string, number>;
  inputFields?: InputField[];
  blockColor: string;
  onValueChange: (fieldType: string, value: number) => void;
  onSave: () => void;
  onClose: () => void;
  onApplyToAll?: () => void;
}

export function AdjustModal({
  visible, values, inputFields, blockColor,
  onValueChange, onSave, onClose, onApplyToAll,
}: AdjustModalProps) {
  const fields = inputFields ?? FIELD_PROFILES.weight_reps;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.content} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>Adjust Set</Text>

          {fields.map((field) => (
            <View key={field.type}>
              <Text style={styles.label}>
                {FIELD_LABELS[field.type]}{field.unit ? ` (${field.unit})` : ''}
              </Text>
              <View style={styles.adjustRow}>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => onValueChange(field.type, Math.max(0, (values[field.type] ?? 0) - FIELD_STEPS[field.type]))}
                >
                  <Text style={styles.adjustButtonText}>-{FIELD_STEPS[field.type]}</Text>
                </TouchableOpacity>
                <TextInput
                  testID={`${field.type}-input`}
                  style={styles.adjustValue}
                  value={String(values[field.type] ?? 0)}
                  keyboardType={FIELD_KEYBOARD[field.type]}
                  selectTextOnFocus
                  onChangeText={(text) => {
                    const parsed = parseFloat(text);
                    if (!isNaN(parsed)) onValueChange(field.type, Math.max(0, parsed));
                  }}
                />
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => onValueChange(field.type, (values[field.type] ?? 0) + FIELD_STEPS[field.type])}
                >
                  <Text style={styles.adjustButtonText}>+{FIELD_STEPS[field.type]}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: blockColor }]}
            onPress={onSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>

          {onApplyToAll && (
            <TouchableOpacity
              style={styles.applyAllButton}
              onPress={onApplyToAll}
              activeOpacity={0.7}
            >
              <Text style={styles.applyAllText}>Apply to all sets</Text>
            </TouchableOpacity>
          )}
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
  applyAllButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  applyAllText: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
});
