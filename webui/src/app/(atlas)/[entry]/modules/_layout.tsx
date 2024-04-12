import { Slot } from 'expo-router';

import { HighlightProvider } from '~/components/code/HighlightProvider';

export default function ModuleLayout() {
  return (
    <HighlightProvider>
      <Slot />
    </HighlightProvider>
  );
}
