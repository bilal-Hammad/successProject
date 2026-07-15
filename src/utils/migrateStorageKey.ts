import AsyncStorage from '@react-native-async-storage/async-storage';

// One-time, idempotent migration from a legacy AsyncStorage key to its
// replacement. Safe to call on every launch: if the new key already has
// data, this is a single extra read and a no-op. The old key is left in
// place (not deleted) as a harmless fallback in case the write below
// never completes.
export async function migrateStorageKey(oldKey: string, newKey: string): Promise<string | null> {
  const existing = await AsyncStorage.getItem(newKey);
  if (existing !== null) return existing;

  const legacy = await AsyncStorage.getItem(oldKey).catch(() => null);
  if (legacy === null) return null;

  await AsyncStorage.setItem(newKey, legacy);
  return legacy;
}
