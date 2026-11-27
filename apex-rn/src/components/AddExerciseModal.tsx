/**
 * APEX — Add Exercise Modal
 * Slide-up modal for creating a new user exercise.
 */

import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, ComponentSize } from '../theme';
import { MUSCLE_GROUPS } from '../data/exercise-library';
import { insertExercise } from '../db';
import { FIELD_PROFILES, type FieldProfile, type InputField } from '../types/fields';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: (id: string) => void;
}

const EXERCISE_TYPES = ['main', 'accessory', 'core', 'conditioning'] as const;

const FIELD_PROFILE_LABELS: Record<FieldProfile, string> = {
  weight_reps: 'Weight + Reps',
  reps_only: 'Reps Only',
  weight_distance: 'Weight + Distance',
  distance_time: 'Distance + Time',
  duration: 'Duration',
};

export default function AddExerciseModal({ visible, onClose, onSaved }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('accessory');
  const [muscleGroup, setMuscleGroup] = useState<string>('Chest');
  const [fieldProfile, setFieldProfile] = useState<FieldProfile>('weight_reps');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setName('');
    setType('accessory');
    setMuscleGroup('Chest');
    setFieldProfile('weight_reps');
  };

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const inputFields: InputField[] = FIELD_PROFILES[fieldProfile];
      const id = await insertExercise({
        name: name.trim(),
        type,
        muscleGroup,
        inputFields,
      });
      resetForm();
      onSaved(id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New Exercise</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Exercise name"
              placeholderTextColor={Colors.textMuted}
              autoFocus
              returnKeyType="done"
            />
          </View>

          {/* Type Chips */}
          <View style={styles.section}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.chipRow}>
              {EXERCISE_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, type === t && styles.chipSelected]}
                  onPress={() => setType(t)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, type === t && styles.chipTextSelected]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Muscle Group Chips */}
          <View style={styles.section}>
            <Text style={styles.label}>Muscle Group</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipScrollContent}
            >
              {MUSCLE_GROUPS.map((mg) => (
                <TouchableOpacity
                  key={mg}
                  style={[styles.chip, muscleGroup === mg && styles.chipSelected]}
                  onPress={() => setMuscleGroup(mg)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, muscleGroup === mg && styles.chipTextSelected]}>
                    {mg}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Input Fields Preset Chips */}
          <View style={styles.section}>
            <Text style={styles.label}>Input Fields</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipScrollContent}
            >
              {(Object.keys(FIELD_PROFILES) as FieldProfile[]).map((fp) => (
                <TouchableOpacity
                  key={fp}
                  style={[styles.chip, fieldProfile === fp && styles.chipSelected]}
                  onPress={() => setFieldProfile(fp)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, fieldProfile === fp && styles.chipTextSelected]}>
                    {FIELD_PROFILE_LABELS[fp]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, !name.trim() && styles.saveButtonDisabled]}
            onPress={handleSave}
            activeOpacity={0.7}
            disabled={!name.trim() || saving}
          >
            <Text style={[styles.saveButtonText, !name.trim() && styles.saveButtonTextDisabled]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.md,
  },
  cancelText: {
    color: Colors.indigo,
    fontSize: FontSize.lg,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 60, // Balance with Cancel button width
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.cardInner,
    color: Colors.text,
    fontSize: FontSize.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: ComponentSize.buttonLarge,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chipScrollContent: {
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: Colors.indigoMuted,
    borderColor: Colors.indigo,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: Colors.indigo,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.screenBottom,
    paddingTop: Spacing.md,
  },
  saveButton: {
    backgroundColor: Colors.indigo,
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    minHeight: ComponentSize.buttonLarge,
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.surface,
  },
  saveButtonText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  saveButtonTextDisabled: {
    color: Colors.textMuted,
  },
});
