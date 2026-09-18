// Device-local list of team events opened on this device. The board is an open
// read by share token, so a logged-out player who followed a link has no server
// list to come back to. Same shape and rules as `landing/device-rounds.ts`:
// injected storage, deduped by token, capped.

import { defaultStorage, deviceStore, jsonListCodec, type DeviceStorage } from '../device-store';

export interface DeviceSeries {
    token: string;
    name: string;
    lastSeenAt: string;
}

export const DEVICE_SERIES_CAP = 20;

function isDeviceSeries(v: unknown): v is DeviceSeries {
    if (typeof v !== 'object' || v === null) return false;
    const r = v as Record<string, unknown>;
    return (
        typeof r.token === 'string' && typeof r.name === 'string' && typeof r.lastSeenAt === 'string'
    );
}

const store = deviceStore<DeviceSeries[]>(
    'tapscore.device-series.v1',
    jsonListCodec(isDeviceSeries),
    DEVICE_SERIES_CAP,
);

export function getDeviceSeries(storage: DeviceStorage | null = defaultStorage()): DeviceSeries[] {
    return store.read(storage);
}

export function recordDeviceSeries(
    entry: DeviceSeries,
    storage: DeviceStorage | null = defaultStorage(),
): DeviceSeries[] {
    if (!storage) return [];
    const rest = getDeviceSeries(storage).filter((s) => s.token !== entry.token);
    return store.write([entry, ...rest], storage);
}

export function forgetDeviceSeries(
    token: string,
    storage: DeviceStorage | null = defaultStorage(),
): DeviceSeries[] {
    if (!storage) return [];
    return store.write(
        getDeviceSeries(storage).filter((s) => s.token !== token),
        storage,
    );
}
