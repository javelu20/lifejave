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
import { crearMovimiento } from '@/src/db/finanzas';
import { fechaLocalISO } from '@/src/lib/gym';
import type { Categoria, MetodoPago } from '@/src/models/finanzas';

type RegistrarGastoProps = {
  visible: boolean;
  onClose: () => void;
  categorias: Categoria[];
  /** Se invoca tras guardar con éxito (para refrescar el resumen). */
  onGuardado?: () => void;
};

const METODOS: { valor: MetodoPago; etiqueta: string }[] = [
  { valor: 'efectivo', etiqueta: '💵 Efectivo' },
  { valor: 'qr', etiqueta: '📲 QR' },
  { valor: 'tarjeta', etiqueta: '💳 Tarjeta' },
];

/** Parsea a número positivo; '' o inválido → null. */
function aMonto(valor: string): number | null {
  const limpio = valor.trim().replace(',', '.');
  if (limpio === '') return null;
  const n = Number(limpio);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Modal para registrar un GASTO (regla de oro: < 5 s).
 * Obligatorios: monto (autofocus) + categoría. Opcionales: método de pago
 * (default efectivo), fecha (default hoy, editable) y nota. Guarda y cierra.
 */
export function RegistrarGasto({ visible, onClose, categorias, onGuardado }: RegistrarGastoProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [monto, setMonto] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo');
  const [fecha, setFecha] = useState(fechaLocalISO());
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Al abrir, reinicia el formulario (monto/categoría; el resto a sus defaults).
  const [eraVisible, setEraVisible] = useState(visible);
  if (visible !== eraVisible) {
    setEraVisible(visible);
    if (visible) {
      setMonto('');
      setCategoriaId(null);
      setMetodo('efectivo');
      setFecha(fechaLocalISO());
      setNota('');
    }
  }

  const guardar = async () => {
    if (guardando) return;

    const montoNum = aMonto(monto);
    if (montoNum === null) {
      Alert.alert('Falta el monto', 'Ingresa un monto mayor a 0.');
      return;
    }
    if (categoriaId === null) {
      Alert.alert('Falta la categoría', 'Elige una categoría para el gasto.');
      return;
    }

    setGuardando(true);
    try {
      await crearMovimiento({
        tipo: 'gasto',
        monto: montoNum,
        fecha: /^\d{4}-\d{2}-\d{2}$/.test(fecha.trim()) ? fecha.trim() : undefined,
        categoria_id: categoriaId,
        fuente: null,
        metodo_pago: metodo,
        recurrente: false,
        nota: nota.trim() === '' ? null : nota.trim(),
      });
      onGuardado?.();
      onClose();
    } catch (error) {
      console.error('[RegistrarGasto] guardar falló', error);
      Alert.alert('No se pudo guardar', 'Ocurrió un error al guardar el gasto.');
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
              <ThemedText type="subtitle">Nuevo gasto</ThemedText>
              <ThemedText style={{ color: theme.icon }}>Monto y categoría, y listo.</ThemedText>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
              <View style={styles.campo}>
                <ThemedText type="defaultSemiBold">Monto (Bs) *</ThemedText>
                <TextInput
                  style={[styles.input, styles.inputMonto, { color: theme.text, borderColor: theme.icon }]}
                  value={monto}
                  onChangeText={setMonto}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={theme.icon}
                  autoFocus
                />
              </View>

              <View style={styles.campo}>
                <ThemedText type="defaultSemiBold">Categoría *</ThemedText>
                <View style={styles.categorias}>
                  {categorias.map((cat) => {
                    const activa = cat.id === categoriaId;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => setCategoriaId(cat.id)}
                        style={[
                          styles.chipCategoria,
                          { borderColor: activa ? theme.tint : theme.icon },
                          activa && { backgroundColor: theme.tint },
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: activa }}
                      >
                        <ThemedText
                          style={{ color: activa ? theme.background : theme.text, fontSize: 13 }}
                        >
                          {cat.icono} {cat.nombre}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.campo}>
                <ThemedText type="defaultSemiBold">Método de pago</ThemedText>
                <View style={styles.chips}>
                  {METODOS.map((m) => {
                    const activo = m.valor === metodo;
                    return (
                      <Pressable
                        key={m.valor}
                        onPress={() => setMetodo(m.valor)}
                        style={[
                          styles.chip,
                          { borderColor: activo ? theme.tint : theme.icon },
                          activo && { backgroundColor: theme.tint },
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: activo }}
                      >
                        <ThemedText style={{ color: activo ? theme.background : theme.text }}>
                          {m.etiqueta}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.campo}>
                <ThemedText type="defaultSemiBold">Fecha</ThemedText>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                  value={fecha}
                  onChangeText={setFecha}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.icon}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.campo}>
                <ThemedText type="defaultSemiBold">Nota</ThemedText>
                <TextInput
                  style={[styles.input, styles.inputNota, { color: theme.text, borderColor: theme.icon }]}
                  value={nota}
                  onChangeText={setNota}
                  placeholder="ej. almuerzo con amigos (opcional)"
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
                  {guardando ? 'Guardando…' : 'Guardar gasto'}
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
  scroll: { paddingHorizontal: 20, paddingBottom: 24, gap: 16 },
  campo: { gap: 8 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputMonto: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  inputNota: { minHeight: 60, textAlignVertical: 'top' },
  categorias: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipCategoria: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
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
