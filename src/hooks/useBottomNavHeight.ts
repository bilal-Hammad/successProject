import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Keep in sync with BottomNav constants
const PILL_H = 64;
const FLOAT_GAP = 10;

export function useBottomNavHeight(): number {
  const { bottom } = useSafeAreaInsets();
  return PILL_H + FLOAT_GAP + Math.max(bottom, 8);
}
