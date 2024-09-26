import '~/styles/global.css';
import '~/styles/expo-dark.css';

// Import the Expo-required radix styles
import '@radix-ui/colors/greenDark.css';
import '@radix-ui/colors/yellowDark.css';
import '@radix-ui/colors/redDark.css';
import '@radix-ui/colors/blueDark.css';
import '@radix-ui/colors/orangeDark.css';
import '@radix-ui/colors/purpleDark.css';
import '@radix-ui/colors/pinkDark.css';
import '@radix-ui/colors/slateDark.css';
// NOTE(cedric): these are not imported by `@expo/styleguide/dist/expo-theme.css`, but they are required for the syntax highlighting
import '@radix-ui/colors/grayDark.css';

import type { PropsWithChildren } from 'react';

export function ThemeProvider({ children }: PropsWithChildren) {
  // This provider only imports styling, doesn't need to interact with the React tree
  return children;
}
