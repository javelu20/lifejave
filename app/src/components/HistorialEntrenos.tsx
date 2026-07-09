import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getSeries, listarSesiones } from '@/src/db';
import { labelSesion } from '@/src/lib/gym';
import type { Serie, Sesion } from '@/src/models/gym';

type HistorialEntrenosProps = {
  visible: boolean;
  onClose: () => void;
};

/** Formatea un valor numérico opcional; null/undefined → '—'. */
function num(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? '—' : String(valor);
}

/**
 * Modal de historial. Lista las sesiones (fecha + etiqueta); al tocar una,
 * carga y muestra sus series. Estado de carga y vacío explícitos.
 *
 * Las lecturas pasan por la capa de datos, que hace `await initDB()` antes de
 * consultar: seguro aunque el modal se abra apenas arranca la app.
 */
export function HistorialEntrenos({ visible, onClose }: HistorialEntrenosProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [cargando, setCargando] = useState(true);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [seleccionada, setSeleccionada] = useState<Sesion | null>(null);
  const [series, setSeries] = useState<Serie[]>([]);
  const [cargandoSeries, setCargandoSeries] = useState(false);

  // Cada vez que se abre el modal, recarga la lista desde cero.
  useEffect(() => {
    if (!visible) return;
    let vivo = true;
    setCargando(true);
    setSeleccionada(null);
    setSeries([]);
    listarSesiones().then((filas) => {
      if (vivo) {
        setSesiones(filas);
        setCargando(false);
      }
    });
    return () => {
      vivo = false;
    };
  }, [visible]);

  const abrirDetalle = async (sesion: Sesion) => {
    setSeleccionada(sesion);
    setCargandoSeries(true);
    const filas = await getSeries(sesion.id);
    setSeries(filas);
    setCargandoSeries(false);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.encabezado}>
            <ThemedText type="subtitle">
              {seleccionada ? labelSesion(seleccionada.tipo) : 'Historial de entrenos'}
            </ThemedText>
            {seleccionada ? (
              <ThemedText style={{ color: theme.icon }}>{seleccionada.fecha}</ThemedText>
            ) : (
              <ThemedText style={{ color: theme.icon }}>
                {sesiones.length} {sesiones.length === 1 ? 'sesión' : 'sesiones'} registradas
              </ThemedText>
            )}
          </View>

          <ScrollView contentContainerStyle={styles.scroll}>
            {cargando ? (
              <ActivityIndicator color={theme.tint} style={styles.spinner} />
            ) : seleccionada ? (
              // --- Detalle de una sesión: sus series ---
              cargandoSeries ? (
                <ActivityIndicator color={theme.tint} style={styles.spinner} />
              ) : series.length === 0 ? (
                <ThemedText style={[styles.vacio, { color: theme.icon }]}>
                  Esta sesión no tiene series registradas.
                </ThemedText>
              ) : (
                agruparPorEjercicio(series).map((grupo) => (
                  <View key={grupo.ejercicio} style={[styles.tarjeta, { borderColor: theme.icon }]}>
                    <ThemedText type="defaultSemiBold">{grupo.ejercicio}</ThemedText>
                    {grupo.series.map((s) => (
                      <ThemedText key={s.id} style={styles.linea}>
                        Serie {s.numero_serie}: {num(s.peso_kg)} kg × {num(s.reps)} reps
                        {s.rir !== null && s.rir !== undefined ? ` · RIR ${s.rir}` : ''}
                      </ThemedText>
                    ))}
                  </View>
                ))
              )
            ) : sesiones.length === 0 ? (
              // --- Estado vacío: aún no hay entrenos ---
              <ThemedText style={[styles.vacio, { color: theme.icon }]}>
                Todavía no has registrado ningún entreno. Cuando guardes uno,
                aparecerá aquí.
              </ThemedText>
            ) : (
              // --- Lista de sesiones ---
              sesiones.map((sesion) => (
                <Pressable
                  key={sesion.id}
                  onPress={() => abrirDetalle(sesion)}
                  style={[styles.fila, { borderColor: theme.icon }]}
                  accessibilityRole="button"
                >
                  <View style={styles.filaTexto}>
                    <ThemedText type="defaultSemiBold">{labelSesion(sesion.tipo)}</ThemedText>
                    <ThemedText style={{ color: theme.icon }}>
                      {sesion.fecha}
                      {sesion.duracion_min ? ` · ${sesion.duracion_min} min` : ''}
                    </ThemedText>
                    {sesion.nota ? (
                      <ThemedText style={[styles.nota, { color: theme.icon }]}>{sesion.nota}</ThemedText>
                    ) : null}
                  </View>
                  <ThemedText style={{ color: theme.icon }}>›</ThemedText>
                </Pressable>
              ))
            )}
          </ScrollView>

          <View style={[styles.pie, { borderTopColor: theme.icon }]}>
            {seleccionada ? (
              <Pressable
                onPress={() => setSeleccionada(null)}
                style={[styles.boton, styles.botonSecundario, { borderColor: theme.icon }]}
                accessibilityRole="button"
              >
                <ThemedText style={{ color: theme.text, fontWeight: '600' }}>← Volver</ThemedText>
              </Pressable>
            ) : null}
            <Pressable
              onPress={onClose}
              style={[styles.boton, { backgroundColor: theme.tint }]}
              accessibilityRole="button"
            >
              <ThemedText style={{ color: theme.background, fontWeight: '600', fontSize: 16 }}>
                Cerrar
              </ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

/** Agrupa series consecutivas por ejercicio conservando el orden de inserción. */
function agruparPorEjercicio(series: Serie[]): { ejercicio: string; series: Serie[] }[] {
  const grupos: { ejercicio: string; series: Serie[] }[] = [];
  for (const s of series) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.ejercicio === s.ejercicio) {
      ultimo.series.push(s);
    } else {
      grupos.push({ ejercicio: s.ejercicio, series: [s] });
    }
  }
  return grupos;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  encabezado: { paddingHorizontal: 20, paddingVertical: 12, gap: 4 },
  scroll: { paddingHorizontal: 20, paddingBottom: 24, gap: 10 },
  spinner: { marginTop: 32 },
  vacio: { textAlign: 'center', marginVertical: 32, lineHeight: 22 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 14,
  },
  filaTexto: { gap: 2, flex: 1 },
  nota: { fontSize: 13, fontStyle: 'italic' },
  tarjeta: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  linea: { lineHeight: 22 },
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
