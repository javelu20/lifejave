import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Vibration, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type DescansoTimerProps = {
  /** Duración inicial en segundos (descanso_s del ejercicio). */
  descansoSegundos: number;
};

/** Formatea segundos → 'm:ss' (p. ej. 150 → '2:30'). */
function mmss(total: number): string {
  const min = Math.floor(total / 60);
  const seg = total % 60;
  return `${min}:${String(seg).padStart(2, '0')}`;
}

/**
 * Temporizador de descanso entre series. Cuenta regresiva mm:ss desde
 * `descansoSegundos`, ajustable con −30s / +30s (para llegar a 3–4 min en
 * básicos pesados). Iniciar / pausar / reiniciar. Al llegar a 0 vibra
 * (Vibration de react-native, funciona en Expo Go, sin dependencias nuevas) y
 * muestra "¡Listo, siguiente serie!".
 *
 * El setInterval vive en un efecto atado a `corriendo`: al pausar, terminar o
 * desmontar, el cleanup lo limpia. Sin fugas.
 */
export function DescansoTimer({ descansoSegundos }: DescansoTimerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // `duracion` es la base para reiniciar; `restante` es la cuenta atrás actual.
  const [duracion, setDuracion] = useState(descansoSegundos);
  const [restante, setRestante] = useState(descansoSegundos);
  const [corriendo, setCorriendo] = useState(false);
  const [terminado, setTerminado] = useState(false);

  // Si cambia el ejercicio (otro descanso_s), reajusta la base y el reloj.
  const baseRef = useRef(descansoSegundos);
  if (baseRef.current !== descansoSegundos) {
    baseRef.current = descansoSegundos;
    setDuracion(descansoSegundos);
    setRestante(descansoSegundos);
    setCorriendo(false);
    setTerminado(false);
  }

  // Tic de 1s mientras corre. El cleanup limpia el intervalo (sin fugas).
  useEffect(() => {
    if (!corriendo) return;
    const id = setInterval(() => {
      setRestante((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [corriendo]);

  // Al llegar a 0 corriendo: detiene, vibra y avisa (efecto, no dentro del tick).
  useEffect(() => {
    if (corriendo && restante === 0) {
      setCorriendo(false);
      setTerminado(true);
      Vibration.vibrate(600);
    }
  }, [corriendo, restante]);

  const ajustar = (delta: number) => {
    setDuracion((d) => Math.max(30, d + delta));
    setRestante((r) => Math.max(0, r + delta));
    if (delta > 0) setTerminado(false);
  };

  const alternar = () => {
    if (corriendo) {
      setCorriendo(false);
      return;
    }
    // Reanudar; si estaba en 0, reinicia desde la base antes de correr.
    if (restante === 0) {
      setRestante(duracion);
      setTerminado(false);
    }
    setCorriendo(true);
  };

  const reiniciar = () => {
    setCorriendo(false);
    setTerminado(false);
    setRestante(duracion);
  };

  return (
    <View style={[styles.contenedor, { borderColor: theme.tint }]}>
      <ThemedText style={[styles.reloj, terminado && { color: theme.tint }]}>
        {mmss(restante)}
      </ThemedText>

      {terminado ? (
        <ThemedText style={[styles.aviso, { color: theme.tint }]}>
          ¡Listo, siguiente serie! 💪
        </ThemedText>
      ) : null}

      <View style={styles.ajustes}>
        <Pressable
          onPress={() => ajustar(-30)}
          style={[styles.chip, { borderColor: theme.icon }]}
          accessibilityRole="button"
          accessibilityLabel="Quitar 30 segundos"
        >
          <ThemedText style={{ color: theme.text }}>−30s</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => ajustar(30)}
          style={[styles.chip, { borderColor: theme.icon }]}
          accessibilityRole="button"
          accessibilityLabel="Añadir 30 segundos"
        >
          <ThemedText style={{ color: theme.text }}>+30s</ThemedText>
        </Pressable>
      </View>

      <View style={styles.controles}>
        <Pressable
          onPress={alternar}
          style={[styles.boton, { backgroundColor: theme.tint }]}
          accessibilityRole="button"
        >
          <ThemedText style={{ color: theme.background, fontWeight: '600' }}>
            {corriendo ? 'Pausar' : restante === 0 ? 'Reanudar' : 'Iniciar'}
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={reiniciar}
          style={[styles.boton, styles.botonSecundario, { borderColor: theme.tint }]}
          accessibilityRole="button"
        >
          <ThemedText style={{ color: theme.tint, fontWeight: '600' }}>Reiniciar</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  reloj: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  aviso: { fontWeight: '600' },
  ajustes: { flexDirection: 'row', gap: 12 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  controles: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  boton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botonSecundario: { borderWidth: 1, backgroundColor: 'transparent' },
});
