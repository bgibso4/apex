interface PRForFormat {
  record_type: string;
  value: number;
  previous_value: number | null;
  rep_count: number | null;
  exercise_name?: string;
  exercise_id: string;
}

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}

export function formatPRDescription(pr: PRForFormat): string {
  switch (pr.record_type) {
    case 'e1rm': {
      const diff = pr.previous_value != null ? ` (+${Math.round(pr.value - pr.previous_value)} lbs)` : '';
      return `New est. 1RM: ${Math.round(pr.value)} lbs${diff}`;
    }
    case 'rep_best':
      return `${Math.round(pr.value)} lbs \u00D7 ${pr.rep_count} (best at ${pr.rep_count} reps)`;
    case 'best_reps':
      return `${Math.round(pr.value)} reps (new best)`;
    case 'best_duration':
      return `${formatDuration(pr.value)} (new best)`;
    case 'best_time':
      return `${formatDuration(pr.value)} (new fastest)`;
    default:
      return `${Math.round(pr.value)} (new PR)`;
  }
}

export function formatPRName(pr: PRForFormat): string {
  return pr.exercise_name ?? pr.exercise_id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
