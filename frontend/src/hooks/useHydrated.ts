import { useSyncExternalStore } from 'react';

/**
 * Returns true once React has hydrated on the client (no more mismatches).
 * Pattern avoids setState-in-effect lint by using useSyncExternalStore.
 */
export function useHydrated() {
    return useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );
}
