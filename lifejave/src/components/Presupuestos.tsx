import { useState } from 'react';
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
import { upsertPresupuesto } from '@/src/db/finanzas';
import type { Categoria, Presupuesto } from '@/src/models/finanzas';

type PresupuestosProps = {
  visible: boolean;
  onClose: () => void;
  categorias: Categoria[];
  presupuestos: Presupuesto[];
  /** Se invoca tras guardar con éxito (para refrescar el resumen). */
  onGuardado?: () => void;
};

/** Parsea a número >= 0; '' → null (sin tope). */
function aTope(valor: string): number | null {
  const limpio = valor.trim().replace(',', '.');
  if (limpio === '') return null;
  const n = Number(limpio);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Modal para definir/editar el tope mensual (monto_mensual) por categoría.
 * Cada categoría muestra su tope actual (si existe) y se puede editar; al
 * guardar hace upsert de los que tengan un número válido. Deja vacío = sin cambio.
 */
export function Presupuestos({
  visible,
  onClose,
  categorias,
  presupuestos,
  onGuardado,
}: PresupuestosProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // Valor tecleado por categoría (string mientras edita). Se hidrata al abrir
  // con los topes existentes.
  const hidratar = () => {
    const porCat = new Map(presupuestos.map((p) => [p.categoria_id, p.monto_mensual]));
    const inicial: Record<number, string> = {};
    for (const c of categorias) {
      const tope = porCat.get(c.id);
      inicial[c.id] = tope != null ? String(tope) : '';
    }
    return inicial;
  };

  const [valores, setValores] = useState<Record<number, string>>(hidratar);
  const [guardando, setGuardando] = useState(false);

  const [eraVisible, setEraVisible] = useState(visible);
  if (visible !== eraVisible) {
    setEraVisible(visible);
    if (visible) setValores(hidratar());
  }

  const setValor = (catId: number, valor: string) => {
    setValores((prev) => ({ ...prev, [catId]: valor }));
  };

  const guardar = async () => {
    if (guardando) return;
    setGuardando(true);
    try {
      const porCatActual = new Map(presupuestos.map((p) => [p.categoria_id, p.monto_mensual]));
      for (const c of categorias) {
        const tope = aTope(valores[c.id] ?? '');
        if (tope === null) continue; // vacío/ inválido: no tocar
        if (porCatActual.get(c.id) === tope) continue; // sin cambios
        await upsertPresupuesto(c.id, tope);
      }
      onGuardado?.();
      onClose();
    } catch (error) {
      console.error('[Presupuestos] guardar falló', error);
      Alert.alert('No se pudo guardar', 'Ocurrió un error al guardar los presupuestos.');
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
              <ThemedText type="subtitle">Presupuestos</ThemedText>
              <ThemedText style={{ color: theme.icon }}>
                Tope mensual por categoría (en Bs).
              </ThemedText>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
              {categorias.map((c) => (
                <View key={c.id} style={styles.fila}>
                  <ThemedText style={styles.nombre}>
                    {c.icono} {c.nombre}
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                    value={valores[c.id] ?? ''}
                    onChangeText={(v) => setValor(c.id, v)}
                    keyboardType="decimal-pad"
                    placeholder="—"
                    placeholderTextColor={theme.icon}
                  />
                </View>
              ))}
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
                  {guardando ? 'Guardando…' : 'Guardar topes'}
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
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nombre: { flex: 1, fontSize: 14 },
  input: {
    width: 100,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: 'right',
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
  botonDeshabilitado: { opacity: 0.6 },
});
