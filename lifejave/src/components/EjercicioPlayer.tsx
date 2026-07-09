import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DescansoTimer } from '@/src/components/DescansoTimer';
import { slugify } from '@/src/lib/gym';
import { getImagenEjercicio } from '@/src/lib/imagenesEjercicios';
import type { ValoresSerie } from '@/src/hooks/useEntrenamiento';
import type { EjercicioPlantilla } from '@/src/models/gym';

type EjercicioPlayerProps = {
  /** Índice del ejercicio dentro de la sesión (identidad estable de sus series). */
  ejercicioIdx: number;
  ejercicio: EjercicioPlantilla;
  /** ¿Hay un ejercicio después de este? (para el botón Siguiente / Terminar). */
  haySiguiente: boolean;
  serieGuardada: (ejercicioIdx: number, numeroSerie: number) => boolean;
  guardarSerie: (
    ejercicioIdx: number,
    ejercicio: string,
    numeroSerie: number,
    valores: ValoresSerie,
  ) => Promise<void>;
  onVolver: () => void;
  onSiguiente: () => void;
};

/** Una fila del registro rápido mientras se teclea (todo string). */
type FilaSerie = { peso: string; reps: string };

/** Parsea a número; '' o inválido → null (campo opcional / no registrado). */
function aNumero(valor: string): number | null {
  const limpio = valor.trim().replace(',', '.');
  if (limpio === '') return null;
  const n = Number(limpio);
  return Number.isFinite(n) ? n : null;
}

/**
 * Player de un ejercicio: prescripción grande ("{series} series × {reps} reps",
 * RIR discreto), imagen de referencia (o placeholder si no hay), registro rápido
 * por serie (filas fijas 1..N con [peso][reps] y ✓) y temporizador de descanso.
 *
 * Se monta con `key={ejercicioIdx}` desde la pantalla, así el estado local (las
 * filas tecleadas y el temporizador) arranca limpio en cada ejercicio. El ✓ de
 * "ya guardada" vive en el hook (SQLite), no aquí, y por eso persiste al navegar.
 */
export function EjercicioPlayer({
  ejercicioIdx,
  ejercicio,
  haySiguiente,
  serieGuardada,
  guardarSerie,
  onVolver,
  onSiguiente,
}: EjercicioPlayerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [filas, setFilas] = useState<FilaSerie[]>(() =>
    Array.from({ length: ejercicio.series }, () => ({ peso: '', reps: '' })),
  );
  const [mostrarDescanso, setMostrarDescanso] = useState(false);

  const imagen = getImagenEjercicio(slugify(ejercicio.ejercicio));

  const actualizar = (idx: number, campo: keyof FilaSerie, valor: string) => {
    setFilas((prev) => prev.map((f, i) => (i === idx ? { ...f, [campo]: valor } : f)));
  };

  const confirmar = (idx: number) => {
    const fila = filas[idx];
    void guardarSerie(ejercicioIdx, ejercicio.ejercicio, idx + 1, {
      peso_kg: aNumero(fila.peso),
      reps: aNumero(fila.reps),
      rir: null, // el registro rápido no captura RIR (fuera de alcance); la prescripción lo muestra.
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Prescripción: responde a "cuántas veces hacerlo". */}
          <ThemedText type="title">{ejercicio.ejercicio}</ThemedText>
          <ThemedText style={styles.prescripcion}>
            {ejercicio.series} series × {ejercicio.reps} reps
          </ThemedText>
          <ThemedText style={[styles.rir, { color: theme.icon }]}>
            RIR {ejercicio.rir} · descanso {ejercicio.descanso_s}s
          </ThemedText>

          {/* Imagen de referencia o placeholder temático. */}
          {imagen ? (
            <Image source={imagen} style={styles.imagen} resizeMode="contain" />
          ) : (
            <View style={[styles.placeholder, { borderColor: theme.icon }]}>
              <ThemedText style={styles.placeholderIcono}>🏋️</ThemedText>
              <ThemedText style={{ color: theme.icon }}>Imagen próximamente</ThemedText>
            </View>
          )}

          {/* Descanso: abre el temporizador bajo la imagen. */}
          <Pressable
            onPress={() => setMostrarDescanso((v) => !v)}
            style={[styles.descansoBtn, { borderColor: theme.tint }]}
            accessibilityRole="button"
          >
            <ThemedText style={{ color: theme.tint, fontWeight: '600' }}>
              {mostrarDescanso ? 'Ocultar descanso' : '⏱️ Descanso'}
            </ThemedText>
          </Pressable>
          {mostrarDescanso ? <DescansoTimer descansoSegundos={ejercicio.descanso_s} /> : null}

          {/* Registro rápido por serie (filas fijas 1..N). */}
          <View style={styles.registro}>
            <View style={styles.cabecera}>
              <ThemedText style={[styles.colNum, styles.colHeader, { color: theme.icon }]}>
                Serie
              </ThemedText>
              <ThemedText style={[styles.colInput, styles.colHeader, { color: theme.icon }]}>
                Peso kg
              </ThemedText>
              <ThemedText style={[styles.colInput, styles.colHeader, { color: theme.icon }]}>
                Reps
              </ThemedText>
              <View style={styles.colCheck} />
            </View>

            {filas.map((fila, idx) => {
              const guardada = serieGuardada(ejercicioIdx, idx + 1);
              return (
                <View key={idx} style={styles.fila}>
                  <ThemedText style={[styles.colNum, { color: theme.text }]}>{idx + 1}</ThemedText>
                  <TextInput
                    style={[styles.input, styles.colInput, { color: theme.text, borderColor: theme.icon }]}
                    value={fila.peso}
                    onChangeText={(v) => actualizar(idx, 'peso', v)}
                    keyboardType="decimal-pad"
                    placeholder="—"
                    placeholderTextColor={theme.icon}
                  />
                  <TextInput
                    style={[styles.input, styles.colInput, { color: theme.text, borderColor: theme.icon }]}
                    value={fila.reps}
                    onChangeText={(v) => actualizar(idx, 'reps', v)}
                    keyboardType="number-pad"
                    placeholder="—"
                    placeholderTextColor={theme.icon}
                  />
                  <Pressable
                    onPress={() => confirmar(idx)}
                    style={[
                      styles.check,
                      { borderColor: guardada ? theme.tint : theme.icon },
                      guardada && { backgroundColor: theme.tint },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Guardar serie ${idx + 1}`}
                    accessibilityState={{ checked: guardada }}
                  >
                    <ThemedText style={{ color: guardada ? theme.background : theme.icon, fontWeight: '700' }}>
                      ✓
                    </ThemedText>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={[styles.pie, { borderTopColor: theme.icon }]}>
          <Pressable
            onPress={onVolver}
            style={[styles.boton, styles.botonSecundario, { borderColor: theme.icon }]}
            accessibilityRole="button"
          >
            <ThemedText style={{ color: theme.text, fontWeight: '600' }}>← Lista</ThemedText>
          </Pressable>
          <Pressable
            onPress={onSiguiente}
            style={[styles.boton, { backgroundColor: theme.tint }]}
            accessibilityRole="button"
          >
            <ThemedText style={{ color: theme.background, fontWeight: '600', fontSize: 16 }}>
              {haySiguiente ? 'Siguiente →' : 'Terminar'}
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  prescripcion: { fontSize: 22, fontWeight: '700' },
  rir: { fontSize: 13 },
  imagen: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginTop: 8,
  },
  placeholder: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  placeholderIcono: { fontSize: 40 },
  descansoBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  registro: { gap: 8, marginTop: 8 },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colHeader: { fontSize: 12, textAlign: 'center' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colNum: { width: 40, textAlign: 'center' },
  colInput: { flex: 1 },
  colCheck: { width: 44 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlign: 'center',
  },
  check: {
    width: 44,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pie: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  boton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botonSecundario: { borderWidth: 1 },
});
