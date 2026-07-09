import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { labelSesion } from '@/src/lib/gym';
import type { EjercicioPlantilla, TipoSesion } from '@/src/models/gym';

type SesionDelDiaProps = {
  tipo: TipoSesion;
  ejercicios: EjercicioPlantilla[];
  onAbrirEjercicio: (idx: number) => void;
  onVolver: () => void;
};

/**
 * Lista los ejercicios de la sesión de hoy como "nombre · {series}×{reps}".
 * Tocar un ejercicio lo abre en el player (EjercicioPlayer).
 */
export function SesionDelDia({ tipo, ejercicios, onAbrirEjercicio, onVolver }: SesionDelDiaProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.encabezado}>
        <ThemedText type="title">{labelSesion(tipo)}</ThemedText>
        <ThemedText style={{ color: theme.icon }}>Elige un ejercicio para empezar.</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {ejercicios.map((ej, idx) => (
          <Pressable
            key={ej.ejercicio}
            onPress={() => onAbrirEjercicio(idx)}
            style={[styles.fila, { borderColor: theme.icon }]}
            accessibilityRole="button"
          >
            <View style={styles.filaTexto}>
              <ThemedText type="defaultSemiBold">{ej.ejercicio}</ThemedText>
              <ThemedText style={[styles.detalle, { color: theme.icon }]}>
                {ej.series}×{ej.reps}
              </ThemedText>
            </View>
            <ThemedText style={{ color: theme.icon }}>›</ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      <View style={[styles.pie, { borderTopColor: theme.icon }]}>
        <Pressable
          onPress={onVolver}
          style={[styles.boton, styles.botonSecundario, { borderColor: theme.icon }]}
          accessibilityRole="button"
        >
          <ThemedText style={{ color: theme.text, fontWeight: '600' }}>← Salir</ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  encabezado: { paddingHorizontal: 20, paddingVertical: 12, gap: 4 },
  scroll: { paddingHorizontal: 20, paddingBottom: 24, gap: 10 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 16,
  },
  filaTexto: { gap: 2, flex: 1 },
  detalle: { fontSize: 14 },
  pie: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  boton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botonSecundario: { borderWidth: 1 },
});
