import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Receta } from '@/src/models/receta';

type RecetaCardProps = {
  receta: Receta;
  /** Nota discreta al pie (p. ej. la alternativa de cena). */
  nota?: string;
};

/**
 * Tarjeta de detalle de un plato principal: nombre, día, badges de kcal y
 * proteína, lista de ingredientes (item · cantidad) y pasos numerados.
 * UI pura y temática (claro/oscuro vía Colors + useColorScheme).
 */
export function RecetaCard({ receta, nota }: RecetaCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.tarjeta, { backgroundColor: theme.background, borderColor: theme.icon }]}>
      <ThemedText type="subtitle">{receta.nombre}</ThemedText>
      <ThemedText style={[styles.dia, { color: theme.icon }]}>{receta.dia}</ThemedText>

      <View style={styles.badges}>
        <View style={[styles.badge, { backgroundColor: theme.tint }]}>
          <ThemedText style={[styles.badgeTexto, { color: theme.background }]}>
            {receta.kcal} kcal
          </ThemedText>
        </View>
        <View style={[styles.badge, { backgroundColor: theme.tint }]}>
          <ThemedText style={[styles.badgeTexto, { color: theme.background }]}>
            {receta.proteina_g} g proteína
          </ThemedText>
        </View>
      </View>

      <ThemedText type="defaultSemiBold" style={styles.seccionTitulo}>
        Ingredientes
      </ThemedText>
      {receta.ingredientes.map((ing, i) => (
        <ThemedText key={`${ing.item}-${i}`} style={styles.linea}>
          • {ing.item}
          {ing.cantidad ? ` · ${ing.cantidad}` : ''}
        </ThemedText>
      ))}

      <ThemedText type="defaultSemiBold" style={styles.seccionTitulo}>
        Pasos
      </ThemedText>
      {receta.pasos.map((paso, i) => (
        <ThemedText key={`paso-${i}`} style={styles.linea}>
          {i + 1}. {paso}
        </ThemedText>
      ))}

      {nota ? (
        <ThemedText style={[styles.nota, { color: theme.icon }]}>{nota}</ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    width: '100%',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 4,
  },
  dia: {
    textTransform: 'capitalize',
    fontSize: 14,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
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
  seccionTitulo: {
    marginTop: 8,
  },
  linea: {
    lineHeight: 22,
  },
  nota: {
    marginTop: 12,
    fontStyle: 'italic',
    fontSize: 14,
  },
});
