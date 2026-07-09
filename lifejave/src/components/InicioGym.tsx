import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type InicioGymProps = {
  /** Hoy es día de descanso (domingo): INICIAR deshabilitado. */
  esDescanso: boolean;
  /** La BD aún se está abriendo. */
  cargandoDb: boolean;
  /** La BD falló al abrir. */
  errorDb: boolean;
  onIniciar: () => void;
  onHistorial: () => void;
};

/**
 * Pantalla de inicio del módulo Gym: un ÚNICO botón grande centrado "INICIAR" y,
 * debajo, un enlace pequeño y discreto "Historial" (para no perder el historial
 * de la Fase 1). Si hoy toca descansar, muestra el aviso y deshabilita INICIAR.
 */
export function InicioGym({
  esDescanso,
  cargandoDb,
  errorDb,
  onIniciar,
  onHistorial,
}: InicioGymProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const bdLista = !cargandoDb && !errorDb;
  const iniciarHabilitado = bdLista && !esDescanso;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ThemedText type="title" style={styles.titulo}>
        Gym
      </ThemedText>

      <View style={styles.centro}>
        {esDescanso ? (
          <ThemedText style={styles.descanso}>Hoy toca descansar 💤</ThemedText>
        ) : null}

        <Pressable
          onPress={onIniciar}
          disabled={!iniciarHabilitado}
          style={[
            styles.iniciar,
            { backgroundColor: theme.tint },
            !iniciarHabilitado && styles.deshabilitado,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !iniciarHabilitado }}
        >
          <ThemedText style={[styles.iniciarTexto, { color: theme.background }]}>
            INICIAR
          </ThemedText>
        </Pressable>

        {errorDb ? (
          <ThemedText style={[styles.estado, { color: theme.icon }]}>
            No se pudo abrir la base de datos.
          </ThemedText>
        ) : cargandoDb ? (
          <View style={styles.estadoCargando}>
            <ActivityIndicator color={theme.tint} />
            <ThemedText style={{ color: theme.icon }}>Preparando base de datos…</ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.pie}>
        <Pressable
          onPress={onHistorial}
          disabled={!bdLista}
          style={!bdLista && styles.deshabilitado}
          accessibilityRole="link"
        >
          <ThemedText style={[styles.historial, { color: theme.icon }]}>Historial</ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  titulo: { paddingHorizontal: 20, paddingTop: 8 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 20 },
  descanso: { fontSize: 18, textAlign: 'center' },
  iniciar: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iniciarTexto: { fontSize: 28, fontWeight: '800', letterSpacing: 2 },
  deshabilitado: { opacity: 0.5 },
  estado: { textAlign: 'center' },
  estadoCargando: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pie: { alignItems: 'center', paddingBottom: 24, paddingTop: 8 },
  historial: { fontSize: 14, textDecorationLine: 'underline' },
});
