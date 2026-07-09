import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ComidaFijaCard } from '@/src/components/ComidaFijaCard';
import { ListaCompras } from '@/src/components/ListaCompras';
import { RecetaCard } from '@/src/components/RecetaCard';
import recetasData from '@/src/data/recetas.json';
import { getComidasDelDia } from '@/src/lib/recetas';
import type { RecetasData } from '@/src/models/receta';

const data = recetasData as RecetasData;

/** Meta diaria de proteína (RECETAS.md): a partir de aquí, marcamos ✅. */
const META_PROTEINA_G = 130;
const PROTEINA_OK_G = 120;

/** Chips de la semana; `idx` es el valor de Date.getDay() de ese día. */
const DIAS = [
  { label: 'Lun', idx: 1 },
  { label: 'Mar', idx: 2 },
  { label: 'Mié', idx: 3 },
  { label: 'Jue', idx: 4 },
  { label: 'Vie', idx: 5 },
  { label: 'Sáb', idx: 6 },
  { label: 'Dom', idx: 0 },
];

export default function RecetasScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const hoyIdx = new Date().getDay();
  const [selectedIdx, setSelectedIdx] = useState(hoyIdx);
  const [listaVisible, setListaVisible] = useState(false);

  // Fecha de esta misma semana cuyo día coincide con el chip seleccionado, para
  // reutilizar la función pura getComidasDelDia (que trabaja por Date).
  const comidas = useMemo(() => {
    const hoy = new Date();
    const fechaSel = new Date(hoy);
    fechaSel.setDate(hoy.getDate() + (selectedIdx - hoy.getDay()));
    return getComidasDelDia(data, fechaSel);
  }, [selectedIdx]);

  const proteinaOk = comidas ? comidas.proteinaTotal_g >= PROTEINA_OK_G : false;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="title" style={styles.titulo}>
          Recetas de la semana
        </ThemedText>

        <Pressable
          onPress={() => setListaVisible(true)}
          style={[styles.boton, { backgroundColor: theme.tint }]}
          accessibilityRole="button"
        >
          <ThemedText style={[styles.botonTexto, { color: theme.background }]}>
            🛒 Ver lista de compras
          </ThemedText>
        </Pressable>

        <View style={styles.chips}>
          {DIAS.map((dia) => {
            const seleccionado = dia.idx === selectedIdx;
            const esHoy = dia.idx === hoyIdx;
            return (
              <Pressable
                key={dia.idx}
                onPress={() => setSelectedIdx(dia.idx)}
                style={[
                  styles.chip,
                  { borderColor: esHoy ? theme.tint : theme.icon },
                  seleccionado && { backgroundColor: theme.tint, borderColor: theme.tint },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: seleccionado }}
              >
                <ThemedText
                  style={[
                    styles.chipTexto,
                    seleccionado && { color: theme.background },
                  ]}
                >
                  {dia.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {comidas ? (
            <>
              <View style={[styles.resumen, { borderColor: theme.tint }]}>
                <ThemedText type="defaultSemiBold">
                  ≈ {comidas.proteinaTotal_g} g de proteína {proteinaOk ? '✅' : ''}
                </ThemedText>
                <ThemedText style={{ color: theme.icon }}>meta ~{META_PROTEINA_G} g/día</ThemedText>
              </View>

              <ThemedText type="defaultSemiBold" style={styles.comidaTitulo}>
                🌅 Desayuno
              </ThemedText>
              <ComidaFijaCard comida={comidas.desayuno} />

              <ThemedText type="defaultSemiBold" style={styles.comidaTitulo}>
                ☀️ Almuerzo
              </ThemedText>
              <RecetaCard receta={comidas.almuerzo} />

              <ThemedText type="defaultSemiBold" style={styles.comidaTitulo}>
                🌙 Cena
              </ThemedText>
              <RecetaCard
                receta={comidas.cena}
                nota={`o cámbiala por: ${data.comidas_fijas.segunda_comida.nombre}`}
              />

              <ThemedText type="defaultSemiBold" style={styles.comidaTitulo}>
                🥤 Snack
              </ThemedText>
              <ComidaFijaCard comida={comidas.snack} />
            </>
          ) : (
            <ThemedText style={[styles.vacio, { color: theme.icon }]}>
              No hay receta para este día todavía.
            </ThemedText>
          )}
        </ScrollView>

        <ListaCompras
          visible={listaVisible}
          onClose={() => setListaVisible(false)}
          items={data.lista_compras}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  titulo: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 48,
    alignItems: 'center',
  },
  chipTexto: {
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 8,
  },
  resumen: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 2,
  },
  comidaTitulo: {
    marginTop: 12,
  },
  vacio: {
    textAlign: 'center',
    marginVertical: 24,
  },
  boton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 8,
  },
  botonTexto: {
    fontWeight: '600',
    fontSize: 16,
  },
});
