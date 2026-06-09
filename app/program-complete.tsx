import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { buildProgramSummary, type ProgramSummary } from '../src/db/programSummary';
import { markCompletionSeen } from '../src/db/programs';
import { ProgramCompletionCelebration } from '../src/components/ProgramCompletionCelebration';
import { ProgramSummaryView } from '../src/components/ProgramSummaryView';
import { Colors } from '../src/theme';

export default function ProgramCompleteScreen() {
  const { programId, celebrate } = useLocalSearchParams<{ programId: string; celebrate?: string }>();
  const [summary, setSummary] = useState<ProgramSummary | null>(null);
  const [showCelebration, setShowCelebration] = useState(celebrate === '1');

  useEffect(() => {
    if (!programId) return;
    buildProgramSummary(programId).then(setSummary).catch(() => {});
    markCompletionSeen(programId).catch(() => {});
  }, [programId]);

  if (!summary) return <View style={{ flex: 1, backgroundColor: Colors.bg }} />;

  if (showCelebration) {
    return (
      <ProgramCompletionCelebration
        programName={summary.programName}
        weeks={summary.weeks}
        sessions={summary.sessionsCompleted}
        prs={summary.prs.length}
        onContinue={() => setShowCelebration(false)}
      />
    );
  }
  return (
    <ProgramSummaryView
      summary={summary}
      onPrimary={() => router.replace('/library')}
      onSecondary={() => router.replace('/(tabs)')}
    />
  );
}
