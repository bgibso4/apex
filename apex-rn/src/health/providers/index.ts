import { HealthProvider } from '../../types/health';
import { WhoopProvider } from './whoop';
import { WHOOP_WORKER_URL } from '../config';

const providers: Record<string, HealthProvider> = {
  whoop: new WhoopProvider(WHOOP_WORKER_URL),
};

export function getProvider(id: string): HealthProvider | undefined {
  return providers[id];
}

export function getWhoopProvider(): WhoopProvider {
  return providers.whoop as WhoopProvider;
}
