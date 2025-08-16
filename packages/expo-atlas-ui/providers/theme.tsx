import '~/styles/global.css';
import '~/styles/expo-dark.css';

import type { PropsWithChildren } from 'react';

export function ThemeProvider({ children }: PropsWithChildren) {
  return children;
}
