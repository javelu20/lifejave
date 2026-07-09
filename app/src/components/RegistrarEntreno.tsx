import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { agregarSerie, crearSesion } from '@/src/db';
import { labelSesion } from '@/src/lib/gym';
import type { EjercicioPlantilla, TipoSesion } from '@/src/models/gym';

type RegistrarEntrenoProps = {
  visible: boolean;
  onClose: () => void;
  tipo: TipoSesion;
  ejercicios: EjercicioPlantilla[];
  /** Se invoca tras guardar con éxito (para que el historial se refresque). */
  onGuardado?: () => void;
};

/** Una serie que el usuario va tecleando (todo string mientras edita). */
type SerieEntrada = { peso: string; reps: string; rir: string };

const serieVacia = (): SerieEntrada => ({ peso: '', reps: '', rir: '' });

/** Parsea a número; '' o inválido → null (campo opcional / no registrado). */
function aNumero(valor: string): number | null {
  const limpio = valor.trim().replace(',', '.');
  if (limpio === '') return null;
  const n = Number(limpio);
  return Number.isFinite(n) ? n : null;
}

/** Una serie "vacía" (sin peso, reps ni rir) no se persiste: es ruido. */
function tieneAlgo(s: SerieEntrada): boolean {
  return s.peso.trim() !== '' || s.reps.trim() !== '' || s.rir.trim() !== '';
}

/**
 * Modal para registrar el entreno de HOY.
 * Por cada ejercicio de la plantilla se pueden añadir 1..N series (peso/reps/rir,
 * rir opcional). Al guardar crea la sesión y todas sus series en SQLite, con
 * numero_serie autoincremental POR ejercicio, y cierra.
 *
 * Nota: las funciones de db hacen `await initDB()` internamente, así que este
 * modal no puede escribir contra una BD sin migrar aunque se abriera antes de
 * tiempo (defensa complementaria a la de la pantalla).
 */
export function RegistrarEntreno({
  visible,
  onClose,
  tipo,
  ejercicios,
  onGuardado,
}: RegistrarEntrenoProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // Series tecleadas por ejercicio (índice = posición en `ejercicios`).
  // Cada ejercicio arranca con una fila lista para llenar.
  const [seriesPorEjercicio, setSeriesPorEjercicio] = useState<SerieEntrada[][]>(() =>
    ejercicios.map(() => [serieVacia()]),
  );
  const [nota, setNota] = useState('');
  const [duracion, setDuracion] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Si cambia el tipo de sesión (p. ej. otro día), reinicia el formulario.
  const claveReset = useMemo(() => tipo + ejercicios.length, [tipo, ejercicios.length]);
  const [claveActual, setClaveActual] = useState(claveReset);
  if (claveActual !== claveReset) {
    setClaveActual(claveReset);
    setSeriesPorEjercicio(ejercicios.map(() => [serieVacia()]));
    setNota('');
    setDuracion('');
  }

  const actualizarSerie = (
    ejIdx: number,
    serieIdx: number,
    campo: keyof SerieEntrada,
    valor: string,
  ) => {
    setSeriesPorEjercicio((prev) =>
      prev.map((series, i) =>
        i !== ejIdx
          ? series
          : series.map((s, j) => (j === serieIdx ? { ...s, [campo]: valor } : s)),
      ),
    );
  };

  const anadirSerie = (ejIdx: number) => {
    setSeriesPorEjercicio((prev) =>
      prev.map((series, i) => (i === ejIdx ? [...series, serieVacia()] : series)),
    );
  };

  const quitarSerie = (ejIdx: number, serieIdx: number) => {
    setSeriesPorEjercicio((prev) =>
      prev.map((series, i) =>
        i !== ejIdx ? series : series.filter((_, j) => j !== serieIdx),
      ),
    );
  };

  const guardar = async () => {
    if (guardando) return;

    // Aplana a las series realmente registradas, numeradas por ejercicio.
    const aInsertar: {
      ejercicio: string;
      numero_serie: number;
      peso_kg: number | null;
      reps: number | null;
      rir: number | null;
    }[] = [];

    ejercicios.forEach((ej, ejIdx) => {
      let numero = 0;
      for (const s of seriesPorEjercicio[ejIdx] ?? []) {
        if (!tieneAlgo(s)) continue;
        numero += 1;
        aInsertar.push({
          ejercicio: ej.ejercicio,
          numero_serie: numero,
          peso_kg: aNumero(s.peso),
          reps: aNumero(s.reps),
          rir: aNumero(s.rir),
        });
      }
    });

    if (aInsertar.length === 0) {
      Alert.alert('Nada que guardar', 'Añade al menos una serie con peso o reps.');
      return;
    }

    setGuardando(true);
    try {
      const sesionId = await crearSesion({
        tipo,
        duracion_min: aNumero(duracion),
        nota: nota.trim() === '' ? null : nota.trim(),
      });

      for (const serie of aInsertar) {
        await agregarSerie({ sesion_id: sesionId, ...serie });
      }

      onGuardado?.();
      onClose();
    } catch (error) {
      console.error('[RegistrarEntreno] guardar falló', error);
      Alert.alert('No se pudo guardar', 'Ocurrió un error al guardar el entreno.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.encabezado}>
              <ThemedText type="subtitle">Registrar {labelSesion(tipo)}</ThemedText>
              <ThemedText style={{ color: theme.icon }}>
                Añade las series que hiciste hoy.
              </ThemedText>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
              {ejercicios.map((ej, ejIdx) => (
                <View
                  key={ej.ejercicio}
                  style={[styles.tarjeta, { borderColor: theme.icon }]}
                >
                  <ThemedText type="defaultSemiBold">{ej.ejercicio}</ThemedText>
                  <ThemedText style={[styles.plan, { color: theme.icon }]}>
                    {ej.series}×{ej.reps} · {ej.descanso_s}s · RIR {ej.rir}
                  </ThemedText>

                  <View style={styles.cabeceraFila}>
                    <ThemedText style={[styles.colNum, styles.colHeader, { color: theme.icon }]}>
                      #
                    </ThemedText>
                    <ThemedText style={[styles.colInput, styles.colHeader, { color: theme.icon }]}>
                      Peso kg
                    </ThemedText>
                    <ThemedText style={[styles.colInput, styles.colHeader, { color: theme.icon }]}>
                      Reps
                    </ThemedText>
                    <ThemedText style={[styles.colInput, styles.colHeader, { color: theme.icon }]}>
                      RIR
                    </ThemedText>
                    <View style={styles.colQuitar} />
                  </View>

                  {(seriesPorEjercicio[ejIdx] ?? []).map((serie, serieIdx) => (
                    <View key={serieIdx} style={styles.filaSerie}>
                      <ThemedText style={[styles.colNum, { color: theme.text }]}>
                        {serieIdx + 1}
                      </ThemedText>
                      <TextInput
                        style={[styles.input, styles.colInput, { color: theme.text, borderColor: theme.icon }]}
                        value={serie.peso}
                        onChangeText={(v) => actualizarSerie(ejIdx, serieIdx, 'peso', v)}
                        keyboardType="decimal-pad"
                        placeholder="—"
                        placeholderTextColor={theme.icon}
                      />
                      <TextInput
                        style={[styles.input, styles.colInput, { color: theme.text, borderColor: theme.icon }]}
                        value={serie.reps}
                        onChangeText={(v) => actualizarSerie(ejIdx, serieIdx, 'reps', v)}
                        keyboardType="number-pad"
                        placeholder="—"
                        placeholderTextColor={theme.icon}
                      />
                      <TextInput
                        style={[styles.input, styles.colInput, { color: theme.text, borderColor: theme.icon }]}
                        value={serie.rir}
                        onChangeText={(v) => actualizarSerie(ejIdx, serieIdx, 'rir', v)}
                        keyboardType="number-pad"
                        placeholder="opc."
                        placeholderTextColor={theme.icon}
                      />
                      <Pressable
                        onPress={() => quitarSerie(ejIdx, serieIdx)}
                        style={styles.colQuitar}
                        accessibilityRole="button"
                        accessibilityLabel={`Quitar serie ${serieIdx + 1}`}
                      >
                        <ThemedText style={{ color: theme.icon }}>✕</ThemedText>
                      </Pressable>
                    </View>
                  ))}

                  <Pressable
                    onPress={() => anadirSerie(ejIdx)}
                    style={[styles.anadir, { borderColor: theme.tint }]}
                    accessibilityRole="button"
                  >
                    <ThemedText style={{ color: theme.tint, fontWeight: '600' }}>
                      + Añadir serie
                    </ThemedText>
                  </Pressable>
                </View>
              ))}

              <View style={styles.campoSesion}>
                <ThemedText type="defaultSemiBold">Duración (min)</ThemedText>
                <TextInput
                  style={[styles.input, styles.inputAncho, { color: theme.text, borderColor: theme.icon }]}
                  value={duracion}
                  onChangeText={setDuracion}
                  keyboardType="number-pad"
                  placeholder="opcional"
                  placeholderTextColor={theme.icon}
                />
              </View>

              <View style={styles.campoSesion}>
                <ThemedText type="defaultSemiBold">Nota</ThemedText>
                <TextInput
                  style={[styles.input, styles.inputAncho, styles.inputNota, { color: theme.text, borderColor: theme.icon }]}
                  value={nota}
                  onChangeText={setNota}
                  placeholder="ánimo, energía, dolores… (opcional)"
                  placeholderTextColor={theme.icon}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={[styles.pie, { borderTopColor: theme.icon }]}>
              <Pressable
                onPress={onClose}
                style={[styles.boton, styles.botonSecundario, { borderColor: theme.icon }]}
                accessibilityRole="button"
                disabled={guardando}
              >
                <ThemedText style={{ color: theme.text, fontWeight: '600' }}>Cancelar</ThemedText>
              </Pressable>
              <Pressable
                onPress={guardar}
                style={[styles.boton, { backgroundColor: theme.tint }, guardando && styles.botonDeshabilitado]}
                accessibilityRole="button"
                disabled={guardando}
              >
                <ThemedText style={{ color: theme.background, fontWeight: '600', fontSize: 16 }}>
                  {guardando ? 'Guardando…' : 'Guardar entreno'}
                </ThemedText>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  encabezado: { paddingHorizontal: 20, paddingVertical: 12, gap: 4 },
  scroll: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  tarjeta: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  plan: { fontSize: 13 },
  cabeceraFila: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  colHeader: { fontSize: 12, textAlign: 'center' },
  filaSerie: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colNum: { width: 20, textAlign: 'center' },
  colInput: { flex: 1 },
  colQuitar: { width: 28, alignItems: 'center' },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlign: 'center',
  },
  inputAncho: { textAlign: 'left' },
  inputNota: { minHeight: 60, textAlignVertical: 'top' },
  anadir: {
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  campoSesion: { gap: 6, marginTop: 4 },
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
  botonDeshabilitado: { opacity: 0.6 },
});
