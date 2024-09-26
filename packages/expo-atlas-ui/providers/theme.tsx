import '~/styles/global.css';
import '~/styles/expo-dark.css';

// Import the Expo-required radix styles from `@expo/style-guide/dist/expo-theme.css`
import '@radix-ui/colors/greenDark.css';
import '@radix-ui/colors/yellowDark.css';
import '@radix-ui/colors/redDark.css';
import '@radix-ui/colors/blueDark.css';
import '@radix-ui/colors/orangeDark.css';
import '@radix-ui/colors/purpleDark.css';
import '@radix-ui/colors/pinkDark.css';
import '@radix-ui/colors/slateDark.css';
import '@radix-ui/colors/grayDark.css'; // NOTE(cedric): this is required for syntax highlighting

import { useColorScheme } from 'nativewind';
import type { PropsWithChildren } from 'react';

export function ThemeProvider({ children }: PropsWithChildren) {
  const { setColorScheme } = useColorScheme();

  // Force Atlas into dark mode
  setColorScheme('dark');

  return children;
}
