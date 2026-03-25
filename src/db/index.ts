export { getDatabase, generateId, clearAllData, clearSampleData, closeDatabase } from './database';
export { exportDatabase, importDatabase, getLastExportTimestamp, shouldShowBackupReminder } from './backup';
export { getActiveProgram, getAllPrograms, importProgram, refreshBundledProgram, activateProgram, stopProgram } from './programs';
export {
  createSession, updateReadiness,
  insertSessionProtocols, getSessionProtocols, updateProtocolCompletion,
  logSet, updateSet, deleteSet, completeSession, updateSessionNotes,
  getSessionsForWeek, getSessionsForDateRange, getSetLogsForSession, getLastSessionForExercise,
  getSessionById, getCompletedSessionForDay, getExerciseNames, getExerciseInfo, ensureExerciseExists,
  deleteSession, getInProgressSession, getRecentCompletedSessions, getAllSessionsForDateRange, getAllCompletedSessions,
  getFullSessionState
} from './sessions';
export { calculateEpley, getEstimated1RM, get1RMHistory, get1RMHistoryWithBlocks, getWeeklyVolume, calculateTargetWeight, getExerciseSetHistory, getExerciseSetHistoryWithBlocks, getExerciseSessionCount, getTrainingConsistency, getAllTimeConsistency, getProtocolConsistency, getPlannedWeeklyVolume, getLoggedExercises, getProgramBoundaries, getExercisePrimaryMetric, getMetricHistory, getGenericExerciseSetHistory } from './metrics';
export type { E1RMHistoryPoint, SessionSetHistory, WeekConsistency, ProgramConsistency, ProtocolItem, PlannedWeekVolume, LoggedExercise, ProgramBoundary, ExercisePrimaryMetric, MetricHistoryPoint, GenericSessionSetHistory } from './metrics';
export type { Estimated1RM } from '../types/training';
export { logRun, getRunLogs, getPainTrend, getRunStats, updateRunPain24h, getPendingPainFollowUp, deleteRun, updateRun } from './runs';
export { saveExerciseNote, getExerciseNotesForSession, deleteExerciseNote } from './notes';
export { detectPRs, getPRsForSession, deletePRsForSession, PR_REP_COUNTS } from './personal-records';
export type { PRRecord } from './personal-records';
export { seedRunLogs, seedWorkoutSessions, seedHistoricalProgram } from './seed';
export {
  upsertDailyHealth,
  getDailyHealth,
  getDailyHealthRange,
  getMissingDates,
} from './health';
export { getAllExercises, insertExercise } from './exercises';
export type { ExerciseListItem } from './exercises';
export { getExerciseResources, addExerciseResource, deleteExerciseResource } from './exerciseResources';
export type { ExerciseResource } from './exerciseResources';
