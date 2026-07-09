import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { HistorialEntrenos } from '@/src/components/HistorialEntrenos';
import { RegistrarEntreno } from '@/src/components/RegistrarEntreno';
import rutinaData from '@/src/data/rutina.json';
import { initDB } from '@/src/db';
import { getTipoSesionDelDia, labelSesion } from '@/src/lib/gym';
import type { Rutina } from '@/src/models/gym';

const rutina = rutinaData as Rutina;

/** Reglas de oro para la pantalla de inicio (RUTINA_GYM.md). */
const REGLAS_DE_ORO = [
  'Técnica antes que peso, siempre.',
  'Anota cada serie: lo que no se mide, no progresa.',
  'Acércate al fallo (RIR 0-2) en los aislados; deja 1-2 en los básicos.',
  'Come proteína y duerme. El músculo crece descansando.',
  'Sé constante 8 semanas antes de juzgar resultados.',
];

export default function GymScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // Estado de carga de la BD: la pantalla NO deja registrar ni listar hasta que
  // initDB() haya resuelto. Es la primera de las dos defensas (la otra vive en
  // la propia capa de datos, que hace await initDB() en cada función).
  const [dbLista, setDbLista] = useState(false);
  const [dbError, setDbError] = useState(false);

  const [registrarVisible, setRegistrarVisible] = useState(false);
  const [historialVisible, setHistorialVisible] = useState(false);

  useEffect(() => {
    let vivo = true;
    initDB()
      .then(() => {
        if (vivo) setDbLista(true);
      })
      .catch((error) => {
        console.error('[GymScreen] initDB falló', error);
        if (vivo) setDbError(true);
      });
    return () => {
      vivo = false;
    };
  }, []);

  const tipo = getTipoSesionDelDia();
  const esDescanso = tipo === 'descanso';
  const ejercicios = esDescanso ? [] : rutina[tipo];

  const puedeInteractuar = dbLista && !dbError;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="title" style={styles.titulo}>
          Gym
        </ThemedText>

        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Sesión de hoy */}
          <View style={[styles.tarjetaHoy, { borderColor: theme.tint }]}>
            <ThemedText style={[styles.etiquetaHoy, { color: theme.icon }]}>HOY</ThemedText>
            <ThemedText type="subtitle">
              {esDescanso ? 'Descanso 🛌' : labelSesion(tipo)}
            </ThemedText>

            {esDescanso ? (
              <ThemedText style={[styles.descansoTexto, { color: theme.icon }]}>
                Recuperación / caminar. El músculo crece descansando.
              </ThemedText>
            ) : (
              ejercicios.map((ej) => (
                <View key={ej.ejercicio} style={styles.ejercicio}>
                  <ThemedText type="defaultSemiBold">{ej.ejercicio}</ThemedText>
                  <ThemedText style={[styles.ejercicioDetalle, { color: theme.icon }]}>
                    {ej.series}×{ej.reps} · {ej.descanso_s}s · RIR {ej.rir}
                  </ThemedText>
                </View>
              ))
            )}
          </View>

          {/* Reglas de oro */}
          <View style={styles.seccion}>
            <ThemedText type="defaultSemiBold" style={styles.seccionTitulo}>
              🏅 Reglas de oro
            </ThemedText>
            {REGLAS_DE_ORO.map((regla, i) => (
              <ThemedText key={i} style={styles.regla}>
                {i + 1}. {regla}
              </ThemedText>
            ))}
          </View>
        </ScrollView>

        {/* Acciones (bloqueadas hasta que la BD esté lista) */}
        <View style={styles.acciones}>
          {dbError ? (
            <ThemedText style={[styles.estado, { color: theme.icon }]}>
              No se pudo abrir la base de datos.
            </ThemedText>
          ) : !dbLista ? (
            <View style={styles.estado}>
              <ActivityIndicator color={theme.tint} />
              <ThemedText style={{ color: theme.icon }}>Preparando base de datos…</ThemedText>
            </View>
          ) : null}

          {!esDescanso ? (
            <Pressable
              onPress={() => setRegistrarVisible(true)}
              disabled={!puedeInteractuar}
              style={[
                styles.boton,
                { backgroundColor: theme.tint },
                !puedeInteractuar && styles.botonDeshabilitado,
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled: !puedeInteractuar }}
            >
              <ThemedText style={[styles.botonTexto, { color: theme.background }]}>
                🏋️ Registrar entreno de hoy
              </ThemedText>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => setHistorialVisible(true)}
            disabled={!puedeInteractuar}
            style={[
              styles.boton,
              styles.botonSecundario,
              { borderColor: theme.tint },
              !puedeInteractuar && styles.botonDeshabilitado,
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !puedeInteractuar }}
          >
            <ThemedText style={[styles.botonTexto, { color: theme.tint }]}>
              📖 Ver historial
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Modales: solo se montan cuando la BD ya está lista */}
      {puedeInteractuar && !esDescanso ? (
        <RegistrarEntreno
          visible={registrarVisible}
          onClose={() => setRegistrarVisible(false)}
          tipo={tipo}
          ejercicios={ejercicios}
        />
      ) : null}

      {puedeInteractuar ? (
        <HistorialEntrenos
          visible={historialVisible}
          onClose={() => setHistorialVisible(false)}
        />
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  titulo: { paddingHorizontal: 20, paddingTop: 8 },
  scroll: { paddingHorizontal: 20, paddingBottom: 16, gap: 16, paddingTop: 8 },
  tarjetaHoy: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  etiquetaHoy: {
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: '700',
  },
  descansoTexto: { marginTop: 4, lineHeight: 22 },
  ejercicio: { marginTop: 8 },
  ejercicioDetalle: { fontSize: 13 },
  seccion: { gap: 4 },
  seccionTitulo: { marginBottom: 4 },
  regla: { lineHeight: 24 },
  acciones: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 4,
  },
  boton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botonSecundario: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  botonDeshabilitado: { opacity: 0.5 },
  botonTexto: { fontWeight: '600', fontSize: 16 },
});
