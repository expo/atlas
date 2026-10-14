import '~/styles/global.css';

import { useColorScheme } from 'nativewind';
import type { PropsWithChildren } from 'react';

export function ThemeProvider({ children }: PropsWithChildren) {
  const { setColorScheme } = useColorScheme();

  // Force Atlas into dark mode
  setColorScheme('dark');

  return children;
}
