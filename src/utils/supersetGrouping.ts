export type GroupedItem<T> = {
  type: 'standalone';
  item: T;
  index: number;
} | {
  type: 'superset';
  items: Array<{ item: T; index: number }>;
  groupId: string;
};

export function groupExercises<T extends { supersetGroup?: string }>(
  exercises: T[]
): GroupedItem<T>[] {
  const result: GroupedItem<T>[] = [];
  let i = 0;
  while (i < exercises.length) {
    const ex = exercises[i];
    if (ex.supersetGroup) {
      const groupId = ex.supersetGroup;
      const items: Array<{ item: T; index: number }> = [];
      while (i < exercises.length && exercises[i].supersetGroup === groupId) {
        items.push({ item: exercises[i], index: i });
        i++;
      }
      result.push({ type: 'superset', items, groupId });
    } else {
      result.push({ type: 'standalone', item: ex, index: i });
      i++;
    }
  }
  return result;
}
