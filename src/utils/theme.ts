import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

export function createAppTheme(colorScheme: 'light' | 'dark'): MD3Theme {
  const base = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: '#0A84FF',
      secondary: '#34C759',
    },
    roundness: 16,
  };
}

