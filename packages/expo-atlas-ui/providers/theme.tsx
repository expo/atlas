import { useColorScheme } from 'nativewind';
import { useEffect, type PropsWithChildren } from 'react';

export function ThemeProvider({ children }: PropsWithChildren) {
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    // Keep the prefered color scheme synced with the `body` class name
    if (document.body && colorScheme) {
      document.body.classList.remove('light-theme', 'dark-theme');
      document.body.className = `${colorScheme}-theme`;
    }
  }, [colorScheme]);

  return children;
}
