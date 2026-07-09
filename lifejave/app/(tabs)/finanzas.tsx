import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Presupuestos } from '@/src/components/Presupuestos';
import { RegistrarGasto } from '@/src/components/RegistrarGasto';
import { RegistrarIngreso } from '@/src/components/RegistrarIngreso';
import { initDB } from '@/src/db';
import {
  getPresupuestos,
  listarCategorias,
  listarMovimientosDelMes,
} from '@/src/db/finanzas';
import {
  formatBs,
  gastoPorCategoria,
  mesActual,
  presupuestoVsReal,
  resumenMes,
  topGastos,
} from '@/src/lib/finanzas';
import type {
  Categoria,
  EstadoPresupuesto,
  GastoCategoria,
  Movimiento,
  Presupuesto,
  PresupuestoReal,
  ResumenMes,
} from '@/src/models/finanzas';

const NOMBRES_MES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/** Meta personal de tasa de ahorro (FINANZAS.md). */
const META_AHORRO = 15;

export default function FinanzasScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // Estado de carga de la BD (misma defensa que Gym: no se interactúa hasta que
  // initDB() resuelve; las funciones de datos vuelven a await initDB() por dentro).
  const [dbLista, setDbLista] = useState(false);
  const [dbError, setDbError] = useState(false);

  // Mes visible (por defecto el actual). Las flechas ‹ › lo mueven.
  const [{ year, month }, setMes] = useState(mesActual());

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

  const [gastoVisible, setGastoVisible] = useState(false);
  const [ingresoVisible, setIngresoVisible] = useState(false);
  const [presupuestosVisible, setPresupuestosVisible] = useState(false);

  useEffect(() => {
    let vivo = true;
    initDB()
      .then(() => {
        if (vivo) setDbLista(true);
      })
      .catch((error) => {
        console.error('[FinanzasScreen] initDB falló', error);
        if (vivo) setDbError(true);
      });
    return () => {
      vivo = false;
    };
  }, []);

  const recargar = useCallback(async () => {
    const [cats, presus, movs] = await Promise.all([
      listarCategorias(),
      getPresupuestos(),
      listarMovimientosDelMes(year, month),
    ]);
    setCategorias(cats);
    setPresupuestos(presus);
    setMovimientos(movs);
  }, [year, month]);

  // Recarga cuando la BD esté lista o cambie el mes visible.
  useEffect(() => {
    if (!dbLista) return;
    let vivo = true;
    recargar().catch((error) => {
      if (vivo) console.error('[FinanzasScreen] recargar falló', error);
    });
    return () => {
      vivo = false;
    };
  }, [dbLista, recargar]);

  const cambiarMes = (delta: number) => {
    setMes((prev) => {
      const total = (prev.year * 12 + (prev.month - 1)) + delta;
      return { year: Math.floor(total / 12), month: (total % 12) + 1 };
    });
  };

  // Reportes derivados (lógica pura). movimientos ya viene filtrado por mes.
  const resumen: ResumenMes = resumenMes(movimientos);
  const porCategoria: GastoCategoria[] = gastoPorCategoria(movimientos, categorias);
  const vsReal: PresupuestoReal[] = presupuestoVsReal(movimientos, presupuestos, categorias);
  const top: Movimiento[] = topGastos(movimientos, 5);

  const catsPorId = new Map(categorias.map((c) => [c.id, c]));
  const balancePositivo = resumen.balance >= 0;
  const colorBalance = balancePositivo ? theme.success : theme.danger;
  const cumpleMeta = resumen.tasaAhorro >= META_AHORRO;

  const colorEstado = (estado: EstadoPresupuesto): string =>
    estado === 'excedido' ? theme.danger : estado === 'alerta' ? theme.warning : theme.success;
  const iconoEstado = (estado: EstadoPresupuesto): string =>
    estado === 'excedido' ? '❌' : estado === 'alerta' ? '⚠️' : '✅';

  const puedeInteractuar = dbLista && !dbError;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="title" style={styles.titulo}>
          Finanzas
        </ThemedText>

        {/* Selector de mes */}
        <View style={styles.selectorMes}>
          <Pressable
            onPress={() => cambiarMes(-1)}
            style={styles.flecha}
            accessibilityRole="button"
            accessibilityLabel="Mes anterior"
          >
            <ThemedText style={[styles.flechaTexto, { color: theme.tint }]}>‹</ThemedText>
          </Pressable>
          <ThemedText type="subtitle">
            {NOMBRES_MES[month - 1]} {year}
          </ThemedText>
          <Pressable
            onPress={() => cambiarMes(1)}
            style={styles.flecha}
            accessibilityRole="button"
            accessibilityLabel="Mes siguiente"
          >
            <ThemedText style={[styles.flechaTexto, { color: theme.tint }]}>›</ThemedText>
          </Pressable>
        </View>

        {dbError ? (
          <View style={styles.estadoCentro}>
            <ThemedText style={{ color: theme.icon }}>
              No se pudo abrir la base de datos.
            </ThemedText>
          </View>
        ) : !dbLista ? (
          <View style={styles.estadoCentro}>
            <ActivityIndicator color={theme.tint} />
            <ThemedText style={{ color: theme.icon }}>Preparando base de datos…</ThemedText>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            {/* RESUMEN */}
            <View style={[styles.tarjeta, { borderColor: theme.icon }]}>
              <View style={styles.filaResumen}>
                <ThemedText style={{ color: theme.icon }}>Ingresos</ThemedText>
                <ThemedText type="defaultSemiBold">{formatBs(resumen.ingresos)}</ThemedText>
              </View>
              <View style={styles.filaResumen}>
                <ThemedText style={{ color: theme.icon }}>Gastos</ThemedText>
                <ThemedText type="defaultSemiBold">{formatBs(resumen.gastos)}</ThemedText>
              </View>
              <View style={[styles.separador, { backgroundColor: theme.icon }]} />
              <View style={styles.filaResumen}>
                <ThemedText type="defaultSemiBold">Balance</ThemedText>
                <ThemedText type="defaultSemiBold" style={{ color: colorBalance, fontSize: 18 }}>
                  {balancePositivo ? '+' : ''}
                  {formatBs(resumen.balance)} {balancePositivo ? '✅' : '❌'}
                </ThemedText>
              </View>
              <View style={styles.filaResumen}>
                <ThemedText style={{ color: theme.icon }}>Tasa de ahorro</ThemedText>
                <ThemedText style={{ color: cumpleMeta ? theme.success : theme.warning }}>
                  {resumen.tasaAhorro.toFixed(0)}% {cumpleMeta ? '👍' : `(meta ≥ ${META_AHORRO}%)`}
                </ThemedText>
              </View>
            </View>

            {/* GASTO POR CATEGORÍA */}
            <View style={styles.seccion}>
              <ThemedText type="defaultSemiBold" style={styles.seccionTitulo}>
                📊 Gasto por categoría
              </ThemedText>
              {porCategoria.length === 0 ? (
                <ThemedText style={{ color: theme.icon }}>Sin gastos este mes.</ThemedText>
              ) : (
                porCategoria.map((g) => (
                  <View key={g.categoria.id} style={styles.barraFila}>
                    <View style={styles.barraCabecera}>
                      <ThemedText style={styles.barraNombre}>
                        {g.categoria.icono} {g.categoria.nombre}
                      </ThemedText>
                      <ThemedText style={{ color: theme.icon, fontSize: 13 }}>
                        {g.porcentaje.toFixed(0)}% · {formatBs(g.total)}
                      </ThemedText>
                    </View>
                    <View style={[styles.barraFondo, { backgroundColor: theme.icon }]}>
                      <View
                        style={[
                          styles.barraRelleno,
                          { backgroundColor: theme.tint, width: `${Math.min(g.porcentaje, 100)}%` },
                        ]}
                      />
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* PRESUPUESTO VS REAL */}
            <View style={styles.seccion}>
              <View style={styles.seccionCabecera}>
                <ThemedText type="defaultSemiBold" style={styles.seccionTitulo}>
                  🎯 Presupuesto vs. real
                </ThemedText>
                <Pressable
                  onPress={() => setPresupuestosVisible(true)}
                  disabled={!puedeInteractuar}
                  accessibilityRole="button"
                >
                  <ThemedText style={{ color: theme.tint, fontWeight: '600' }}>Editar topes</ThemedText>
                </Pressable>
              </View>
              {vsReal.length === 0 ? (
                <ThemedText style={{ color: theme.icon }}>
                  Aún no definiste topes. Toca “Editar topes”.
                </ThemedText>
              ) : (
                vsReal.map((p) => (
                  <View key={p.categoria.id} style={styles.barraFila}>
                    <View style={styles.barraCabecera}>
                      <ThemedText style={styles.barraNombre}>
                        {p.categoria.icono} {p.categoria.nombre}
                      </ThemedText>
                      <ThemedText style={{ color: colorEstado(p.estado), fontSize: 13 }}>
                        {iconoEstado(p.estado)} {p.porcentaje.toFixed(0)}%
                      </ThemedText>
                    </View>
                    <View style={[styles.barraFondo, { backgroundColor: theme.icon }]}>
                      <View
                        style={[
                          styles.barraRelleno,
                          {
                            backgroundColor: colorEstado(p.estado),
                            width: `${Math.min(p.porcentaje, 100)}%`,
                          },
                        ]}
                      />
                    </View>
                    <ThemedText style={{ color: theme.icon, fontSize: 12 }}>
                      {formatBs(p.gastado)} / {formatBs(p.tope)}
                    </ThemedText>
                  </View>
                ))
              )}
            </View>

            {/* TOP 5 GASTOS */}
            <View style={styles.seccion}>
              <ThemedText type="defaultSemiBold" style={styles.seccionTitulo}>
                🔎 Top 5 gastos del mes
              </ThemedText>
              {top.length === 0 ? (
                <ThemedText style={{ color: theme.icon }}>Sin gastos este mes.</ThemedText>
              ) : (
                top.map((m) => {
                  const cat = m.categoria_id != null ? catsPorId.get(m.categoria_id) : undefined;
                  return (
                    <View key={m.id} style={styles.filaTop}>
                      <View style={styles.flex}>
                        <ThemedText>
                          {cat ? `${cat.icono} ${cat.nombre}` : 'Sin categoría'}
                        </ThemedText>
                        {m.nota ? (
                          <ThemedText style={{ color: theme.icon, fontSize: 12 }}>{m.nota}</ThemedText>
                        ) : null}
                      </View>
                      <ThemedText type="defaultSemiBold">{formatBs(m.monto)}</ThemedText>
                    </View>
                  );
                })
              )}
            </View>

            {/* TODO FASE 2: tendencia mensual (6 meses) y proyección de fin de mes
                (requieren librería de gráficos). */}
          </ScrollView>
        )}

        {/* Botones rápidos */}
        <View style={styles.acciones}>
          <Pressable
            onPress={() => setGastoVisible(true)}
            disabled={!puedeInteractuar}
            style={[styles.boton, { backgroundColor: theme.tint }, !puedeInteractuar && styles.botonDeshabilitado]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !puedeInteractuar }}
          >
            <ThemedText style={[styles.botonTexto, { color: theme.background }]}>+ Gasto</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setIngresoVisible(true)}
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
            <ThemedText style={[styles.botonTexto, { color: theme.tint }]}>+ Ingreso</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Modales: solo se montan cuando la BD ya está lista */}
      {puedeInteractuar ? (
        <>
          <RegistrarGasto
            visible={gastoVisible}
            onClose={() => setGastoVisible(false)}
            categorias={categorias}
            onGuardado={recargar}
          />
          <RegistrarIngreso
            visible={ingresoVisible}
            onClose={() => setIngresoVisible(false)}
            onGuardado={recargar}
          />
          <Presupuestos
            visible={presupuestosVisible}
            onClose={() => setPresupuestosVisible(false)}
            categorias={categorias}
            presupuestos={presupuestos}
            onGuardado={recargar}
          />
        </>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  titulo: { paddingHorizontal: 20, paddingTop: 8 },
  selectorMes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 8,
  },
  flecha: { paddingHorizontal: 12, paddingVertical: 4 },
  flechaTexto: { fontSize: 28, fontWeight: '700', lineHeight: 32 },
  estadoCentro: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 16, gap: 20, paddingTop: 8 },
  tarjeta: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  filaResumen: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  separador: { height: StyleSheet.hairlineWidth, opacity: 0.5, marginVertical: 2 },
  seccion: { gap: 10 },
  seccionCabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seccionTitulo: { marginBottom: 2 },
  barraFila: { gap: 4 },
  barraCabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barraNombre: { flex: 1, fontSize: 14 },
  barraFondo: { height: 10, borderRadius: 5, overflow: 'hidden', opacity: 0.9 },
  barraRelleno: { height: 10, borderRadius: 5 },
  filaTop: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  acciones: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  boton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botonSecundario: { borderWidth: 1, backgroundColor: 'transparent' },
  botonDeshabilitado: { opacity: 0.5 },
  botonTexto: { fontWeight: '600', fontSize: 16 },
});
