import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type FraseCardProps = {
  frase: string;
};

/**
 * Tarjeta que muestra una frase centrada, grande y legible.
 * UI pura (sin lógica de selección): recibe la frase ya calculada.
 * Respeta modo claro/oscuro vía Colors + useColorScheme.
 */
export function FraseCard({ frase }: FraseCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.tarjeta, { backgroundColor: theme.background, borderColor: theme.icon }]}>
      <ThemedText type="title" style={styles.frase}>
        {frase}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    width: '100%',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  frase: {
    textAlign: 'center',
    lineHeight: 40,
  },
});
