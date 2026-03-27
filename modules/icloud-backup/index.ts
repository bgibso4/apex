import { requireNativeModule } from 'expo-modules-core';

const ICloudBackupModule = requireNativeModule('ICloudBackup');

export function copyToICloud(sourcePath: string, filename: string): Promise<boolean> {
  return ICloudBackupModule.copyToICloud(sourcePath, filename);
}
