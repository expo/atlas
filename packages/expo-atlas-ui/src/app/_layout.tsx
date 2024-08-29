import '~/styles-expo.css';
import '~/styles.css';

import { Slot } from 'expo-router';

import { BundleProvider } from '~/providers/bundle';
import { HmrProvider } from '~/providers/hmr';
import { QueryProvider } from '~/providers/query';
import { ThemeProvider } from '~/providers/theme';
import { ToastProvider } from '~/ui/Toast';
import { TooltipProvider } from '~/ui/Tooltip';

// Import the Expo-required radix styles
import '@radix-ui/colors/green.css';
import '@radix-ui/colors/greenDark.css';
import '@radix-ui/colors/yellow.css';
import '@radix-ui/colors/yellowDark.css';
import '@radix-ui/colors/red.css';
import '@radix-ui/colors/redDark.css';
import '@radix-ui/colors/blue.css';
import '@radix-ui/colors/blueDark.css';
import '@radix-ui/colors/orange.css';
import '@radix-ui/colors/orangeDark.css';
import '@radix-ui/colors/purple.css';
import '@radix-ui/colors/purpleDark.css';
import '@radix-ui/colors/pink.css';
import '@radix-ui/colors/pinkDark.css';
import '@radix-ui/colors/slate.css';
import '@radix-ui/colors/slateDark.css';
// NOTE(cedric): these are not imported by `@expo/styleguide/dist/expo-theme.css`, but they are required for the syntax highlighting
import '@radix-ui/colors/gray.css';
import '@radix-ui/colors/grayDark.css';

export default function RootLayout() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <TooltipProvider delayDuration={200}>
          <BundleProvider>
            <ToastProvider />
            <HmrProvider>
              <Slot />
            </HmrProvider>
          </BundleProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
