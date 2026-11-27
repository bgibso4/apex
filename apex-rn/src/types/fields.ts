export type FieldType = 'weight' | 'reps' | 'distance' | 'duration' | 'time';

export interface InputField {
  type: FieldType;
  unit?: string; // 'lbs', 'kg', 'm', 'yd', 'sec', 'm:ss'
}

export type FieldProfile = 'weight_reps' | 'reps_only' | 'weight_distance' | 'distance_time' | 'duration';

export const FIELD_PROFILES: Record<FieldProfile, InputField[]> = {
  weight_reps: [
    { type: 'weight', unit: 'lbs' },
    { type: 'reps', unit: undefined },
  ],
  reps_only: [
    { type: 'reps', unit: undefined },
  ],
  weight_distance: [
    { type: 'weight', unit: 'lbs' },
    { type: 'distance', unit: 'm' },
  ],
  distance_time: [
    { type: 'distance', unit: 'm' },
    { type: 'time', unit: 'm:ss' },
  ],
  duration: [
    { type: 'duration', unit: 'sec' },
  ],
};

const DEFAULT_FIELDS = FIELD_PROFILES.weight_reps;

export function getFieldsForExercise(inputFields: string | InputField[] | null | undefined): InputField[] {
  if (inputFields == null) {
    return DEFAULT_FIELDS;
  }
  if (typeof inputFields === 'string') {
    try {
      return JSON.parse(inputFields) as InputField[];
    } catch {
      return DEFAULT_FIELDS;
    }
  }
  return inputFields;
}

export function getTargetColumn(fieldType: FieldType): string {
  return `target_${fieldType}`;
}

export function getActualColumn(fieldType: FieldType): string {
  return `actual_${fieldType}`;
}

export const FIELD_LABELS: Record<FieldType, string> = {
  weight: 'Weight',
  reps: 'Reps',
  distance: 'Distance',
  duration: 'Duration',
  time: 'Time',
};

export const FIELD_STEPS: Record<FieldType, number> = {
  weight: 5,
  reps: 1,
  distance: 5,
  duration: 5,
  time: 5,
};

export const FIELD_KEYBOARD: Record<FieldType, 'decimal-pad' | 'number-pad'> = {
  weight: 'decimal-pad',
  reps: 'number-pad',
  distance: 'decimal-pad',
  duration: 'number-pad',
  time: 'number-pad',
};

export function supportsE1RM(fields: InputField[]): boolean {
  const types = fields.map((f) => f.type);
  return types.includes('weight') && types.includes('reps');
}
