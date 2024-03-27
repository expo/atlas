import { useColorScheme } from 'nativewind';
import { useEffect, type PropsWithChildren } from 'react';

export function ThemeProvider({ children }: PropsWithChildren) {
  useWorkaroundForThemeClass();

  return children;
}

function useWorkaroundForThemeClass() {
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    if (document.body) {
      document.body.classList.remove('light-theme', 'dark-theme');
      if (colorScheme) {
        document.body.className = `${colorScheme}-theme`;
      }
    }
  }, [colorScheme]);
}
