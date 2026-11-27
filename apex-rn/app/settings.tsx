/**
 * APEX -- Settings Screen
 * Training preferences, integrations, and data management.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../src/theme';
import { seedRunLogs, seedWorkoutSessions, seedHistoricalProgram, getActiveProgram, clearAllData, clearSampleData, stopProgram } from '../src/db';
import { exportDatabase, importDatabase, getLastExportTimestamp } from '../src/db';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { getWhoopProvider } from '../src/health/providers';
import { initialHealthBackfill } from '../src/hooks/useHealthData';
import { WHOOP_WORKER_URL } from '../src/health/config';

WebBrowser.maybeCompleteAuthSession();

const WHOOP_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://api.prod.whoop.com/oauth/oauth2/auth',
  tokenEndpoint: `${WHOOP_WORKER_URL}/oauth/token`,
};

const WHOOP_CLIENT_ID = 'bd642103-b2cd-4fa9-a570-f09608b32be4';

type WeightUnit = 'lbs' | 'kg';

export default function SettingsScreen() {
  const router = useRouter();
  const [unit, setUnit] = useState<WeightUnit>('lbs');
  const [lastExport, setLastExport] = useState<string | null>(null);
  const [activeProgram, setActiveProgram] = useState<{ id: string; name: string } | null>(null);
  const [whoopConnected, setWhoopConnected] = useState(false);
  const [whoopLoading, setWhoopLoading] = useState(false);

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'apex', path: 'oauth/callback' });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: WHOOP_CLIENT_ID,
      scopes: ['read:recovery', 'read:sleep', 'read:workout', 'read:cycles', 'read:profile', 'offline'],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
    },
    WHOOP_DISCOVERY
  );

  useFocusEffect(
    useCallback(() => {
      getLastExportTimestamp().then(setLastExport);
      getActiveProgram().then((p) => setActiveProgram(p ? { id: p.id, name: p.name } : null));
      getWhoopProvider().isConnected().then(setWhoopConnected);
    }, [])
  );

  useEffect(() => {
    if (response?.type === 'success' && response.params.code) {
      (async () => {
        setWhoopLoading(true);
        try {
          await getWhoopProvider().authorizeWithCode(response.params.code, redirectUri);
          setWhoopConnected(true);
          initialHealthBackfill();
        } catch (e) {
          Alert.alert('Connection Failed', 'Could not connect to WHOOP. Please try again.');
        } finally {
          setWhoopLoading(false);
        }
      })();
    }
  }, [response]);

  const handleWhoopConnect = async () => {
    setWhoopLoading(true);
    try {
      await promptAsync();
    } catch {
      setWhoopLoading(false);
    }
  };

  const handleWhoopDisconnect = () => {
    Alert.alert(
      'Disconnect WHOOP',
      'This will stop syncing health data. Your existing data will be kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await getWhoopProvider().disconnect();
            setWhoopConnected(false);
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      await exportDatabase();
      const timestamp = await getLastExportTimestamp();
      setLastExport(timestamp);
    } catch (err: any) {
      Alert.alert('Export Failed', err.message ?? 'Could not export database');
    }
  };

  const handleImportData = () => {
    Alert.alert(
      'Import Backup',
      'This will replace ALL current data with the backup. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await importDatabase();
              if (success) {
                Alert.alert('Import Complete', 'Your data has been restored from the backup.');
              }
            } catch (err: any) {
              Alert.alert('Import Failed', err.message ?? 'Could not import database');
            }
          },
        },
      ],
    );
  };

  const handleSeedData = async () => {
    try {
      const runCount = await seedRunLogs();
      const historicalCount = await seedHistoricalProgram();
      const program = await getActiveProgram();
      let sessionCount = 0;
      if (program) {
        sessionCount = await seedWorkoutSessions(program.id);
      }
      const total = runCount + historicalCount + sessionCount;
      if (total === 0) {
        Alert.alert('Sample Data', 'Sample data already loaded.');
      } else {
        Alert.alert('Sample Data Loaded', `Added ${runCount} runs, ${historicalCount + sessionCount} workout sessions.`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to load sample data');
    }
  };

  const handleClearSampleData = async () => {
    Alert.alert(
      'Clear Sample Data',
      'This removes only test data. Your real workouts and runs are safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Sample Data',
          onPress: async () => {
            await clearSampleData();
            Alert.alert('Done', 'Sample data cleared.');
          },
        },
      ]
    );
  };

  const handleStopProgram = () => {
    if (!activeProgram) return;
    Alert.alert(
      'Stop Program',
      `Stop "${activeProgram.name}"? You can keep your workout history or delete all data from this program.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Keep Data',
          onPress: async () => {
            try {
              await stopProgram(activeProgram.id, false);
              setActiveProgram(null);
              Alert.alert('Program Stopped', 'Your workout history has been preserved.');
            } catch (err: any) {
              Alert.alert('Error', err.message ?? 'Failed to stop program');
            }
          },
        },
        {
          text: 'Delete Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await stopProgram(activeProgram.id, true);
              setActiveProgram(null);
              Alert.alert('Program Stopped', 'All program data has been deleted.');
            } catch (err: any) {
              Alert.alert('Error', err.message ?? 'Failed to stop program');
            }
          },
        },
      ],
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all sessions, programs, and history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert('Data Cleared', 'All data has been deleted.');
            } catch (err: any) {
              Alert.alert('Error', err.message ?? 'Failed to clear data');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={Colors.textDim} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Training Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TRAINING</Text>
          <View style={styles.group}>
            {/* Units */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>Units</Text>
              </View>
              <View style={styles.segmentControl}>
                <TouchableOpacity
                  style={[
                    styles.segmentOption,
                    unit === 'lbs' && styles.segmentOptionActive,
                  ]}
                  onPress={() => setUnit('lbs')}
                >
                  <Text
                    style={[
                      styles.segmentOptionText,
                      unit === 'lbs' && styles.segmentOptionTextActive,
                    ]}
                  >
                    lbs
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segmentOption,
                    unit === 'kg' && styles.segmentOptionActive,
                  ]}
                  onPress={() => setUnit('kg')}
                >
                  <Text
                    style={[
                      styles.segmentOptionText,
                      unit === 'kg' && styles.segmentOptionTextActive,
                    ]}
                  >
                    kg
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.rowDivider} />

            {/* Edit 1RMs */}
            <TouchableOpacity style={styles.row} activeOpacity={0.7}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>Edit Current 1RMs</Text>
                <Text style={styles.rowHint}>
                  Update your working maxes mid-program
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Program Section */}
        {activeProgram && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PROGRAM</Text>
            <View style={styles.group}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowLabel}>{activeProgram.name}</Text>
                  <Text style={styles.rowHint}>Currently active program</Text>
                </View>
                <TouchableOpacity
                  style={styles.dangerButton}
                  onPress={handleStopProgram}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dangerButtonText}>Stop</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Supplementary Goals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SUPPLEMENTARY GOALS</Text>
          <View style={styles.group}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>Pinned to Nav Bar</Text>
                <Text style={styles.rowHint}>
                  Shows as a bottom tab for quick access
                </Text>
              </View>
              <TouchableOpacity style={styles.selectorValue} activeOpacity={0.7}>
                <Text style={styles.selectorValueText}>Running</Text>
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Integrations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>INTEGRATIONS</Text>
          <View style={styles.group}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>WHOOP</Text>
                <Text style={styles.rowHint}>
                  {whoopConnected ? 'Syncing recovery & sleep data' : 'Recovery, sleep, and strain data'}
                </Text>
              </View>
              {whoopLoading ? (
                <View style={styles.connectingBadge}>
                  <Text style={styles.connectingText}>Connecting...</Text>
                </View>
              ) : whoopConnected ? (
                <View style={styles.connectedBadge}>
                  <Text style={styles.connectedText}>✓ Connected</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.connectButton}
                  onPress={handleWhoopConnect}
                  activeOpacity={0.7}
                >
                  <Text style={styles.connectButtonText}>Connect</Text>
                </TouchableOpacity>
              )}
            </View>
            {whoopConnected && (
              <>
                <View style={styles.rowDivider} />
                <TouchableOpacity style={styles.row} onPress={handleWhoopDisconnect} activeOpacity={0.7}>
                  <View style={styles.rowLeft}>
                    <Text style={[styles.rowLabel, { fontWeight: '500' }]}>Disconnect</Text>
                    <Text style={styles.rowHint}>Stop syncing. Your data will be kept.</Text>
                  </View>
                  <Text style={styles.disconnectText}>Disconnect</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Backup & Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BACKUP & DATA</Text>
          <View style={styles.group}>
            {/* Export Backup */}
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={handleExportData}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>Export Backup</Text>
                <Text style={styles.rowHint}>
                  {lastExport
                    ? `Last: ${new Date(lastExport).toLocaleDateString()}`
                    : 'Save your data to Files, AirDrop, etc.'}
                </Text>
              </View>
              <Ionicons name="share-outline" size={18} color={Colors.indigo} />
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            {/* Import Backup */}
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={handleImportData}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>Import Backup</Text>
                <Text style={styles.rowHint}>
                  Restore from a previously exported .db file
                </Text>
              </View>
              <Ionicons name="download-outline" size={18} color={Colors.indigo} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dev Tools Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DEV TOOLS</Text>
          <View style={styles.group}>
            {/* Seed Data */}
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={handleSeedData}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>Load Sample Data</Text>
                <Text style={styles.rowHint}>
                  Pre-populate runs and sessions for testing
                </Text>
              </View>
              <Ionicons name="flask-outline" size={18} color={Colors.cyan} />
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            {/* Clear Sample Data */}
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={handleClearSampleData}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>Clear Sample Data</Text>
                <Text style={styles.rowHint}>
                  Remove test data only — your real data is safe
                </Text>
              </View>
              <Ionicons name="flask-outline" size={18} color={Colors.cyan} />
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            {/* Clear Data */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>Clear All Data</Text>
                <Text style={styles.rowHint}>
                  Delete all sessions, programs, and history
                </Text>
              </View>
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={handleClearData}
                activeOpacity={0.7}
              >
                <Text style={styles.dangerButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Version */}
        <Text style={styles.versionText}>APEX v0.1.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Spacing.screenTop,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.screenBottom,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  backButton: {
    width: Spacing.xxxl,
    height: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.button,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.screenTitle,
    fontWeight: '800',
  },

  // Sections
  section: {
    marginBottom: Spacing.xxl + Spacing.xs, // 28px to match mockup gap
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md - 2, // 10px
  },

  // Group card
  group: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.surface,
    marginHorizontal: 0,
  },
  rowLeft: {
    flexDirection: 'column',
    gap: 2,
    flex: 1,
    marginRight: Spacing.md,
  },
  rowLabel: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  rowHint: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },

  // Segmented control
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  segmentOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  segmentOptionActive: {
    backgroundColor: Colors.indigo,
    borderRadius: BorderRadius.button - 1,
  },
  segmentOptionText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  segmentOptionTextActive: {
    color: Colors.text,
  },

  // Selector (dropdown-style)
  selectorValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  selectorValueText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },

  // Coming soon badge
  comingSoonBadge: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  comingSoonText: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
    fontWeight: '600',
  },

  // Connect button (indigo)
  connectButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.button,
    backgroundColor: Colors.indigo,
  },
  connectButtonText: {
    color: Colors.text,
    fontSize: FontSize.body,
    fontWeight: '600',
  },

  // Connected badge (green)
  connectedBadge: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.button,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  connectedText: {
    color: Colors.green,
    fontSize: FontSize.body,
    fontWeight: '600',
  },

  // Connecting badge
  connectingBadge: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.button,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  connectingText: {
    color: Colors.indigo,
    fontSize: FontSize.body,
    fontWeight: '600',
  },

  // Disconnect
  disconnectText: {
    color: Colors.red,
    fontSize: FontSize.body,
    fontWeight: '500',
    opacity: 0.8,
  },

  // Danger button
  dangerButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${Colors.red}30`,
  },
  dangerButtonText: {
    color: Colors.red,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },

  // Version
  versionText: {
    textAlign: 'center',
    paddingVertical: Spacing.xl,
    color: Colors.border,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
