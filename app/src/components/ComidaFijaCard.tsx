import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ComidaFija } from '@/src/models/receta';

type ComidaFijaCardProps = {
  comida: ComidaFija;
};

/**
 * Tarjeta simple para las comidas fijas (desayuno, snack): nombre + badge de
 * proteína. Sin receta detallada porque el doc no da pasos ni cantidades.
 * UI pura y temática (claro/oscuro vía Colors + useColorScheme).
 */
export function ComidaFijaCard({ comida }: ComidaFijaCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.tarjeta, { backgroundColor: theme.background, borderColor: theme.icon }]}>
      <ThemedText style={styles.nombre}>{comida.nombre}</ThemedText>
      <View style={[styles.badge, { backgroundColor: theme.tint }]}>
        <ThemedText style={[styles.badgeTexto, { color: theme.background }]}>
          {comida.proteina_g} g proteína
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    width: '100%',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  nombre: {
    flex: 1,
    lineHeight: 22,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeTexto: {
    fontSize: 13,
    fontWeight: '600',
  },
});
