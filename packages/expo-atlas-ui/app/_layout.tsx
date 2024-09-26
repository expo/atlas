import { Slot } from 'expo-router';

import { BundleProvider } from '~/providers/bundle';
import { HmrProvider } from '~/providers/hmr';
import { QueryProvider } from '~/providers/query';
import { ThemeProvider } from '~/providers/theme';
import { ToastProvider } from '~/ui/Toast';
import { TooltipProvider } from '~/ui/Tooltip';

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
