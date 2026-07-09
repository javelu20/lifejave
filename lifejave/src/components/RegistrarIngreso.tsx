import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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

type RegistrarIngresoProps = {
  visible: boolean;
  onClose: () => void;
  /** Se invoca tras guardar con éxito (para refrescar el resumen). */
  onGuardado?: () => void;
};

/** Parsea a número positivo; '' o inválido → null. */
function aMonto(valor: string): number | null {
  const limpio = valor.trim().replace(',', '.');
  if (limpio === '') return null;
  const n = Number(limpio);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Modal para registrar un INGRESO.
 * Obligatorios: monto + fuente (texto). Opcionales: recurrente (toggle),
 * fecha (default hoy, editable) y nota. Guarda y cierra.
 */
export function RegistrarIngreso({ visible, onClose, onGuardado }: RegistrarIngresoProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [monto, setMonto] = useState('');
  const [fuente, setFuente] = useState('');
  const [recurrente, setRecurrente] = useState(false);
  const [fecha, setFecha] = useState(fechaLocalISO());
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Al abrir, reinicia el formulario a sus defaults.
  const [eraVisible, setEraVisible] = useState(visible);
  if (visible !== eraVisible) {
    setEraVisible(visible);
    if (visible) {
      setMonto('');
      setFuente('');
      setRecurrente(false);
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
    if (fuente.trim() === '') {
      Alert.alert('Falta la fuente', 'Indica de dónde viene el ingreso (sueldo, freelance…).');
      return;
    }

    setGuardando(true);
    try {
      await crearMovimiento({
        tipo: 'ingreso',
        monto: montoNum,
        fecha: /^\d{4}-\d{2}-\d{2}$/.test(fecha.trim()) ? fecha.trim() : undefined,
        categoria_id: null,
        fuente: fuente.trim(),
        metodo_pago: null,
        recurrente,
        nota: nota.trim() === '' ? null : nota.trim(),
      });
      onGuardado?.();
      onClose();
    } catch (error) {
      console.error('[RegistrarIngreso] guardar falló', error);
      Alert.alert('No se pudo guardar', 'Ocurrió un error al guardar el ingreso.');
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
              <ThemedText type="subtitle">Nuevo ingreso</ThemedText>
              <ThemedText style={{ color: theme.icon }}>¿Cuánto entró y de dónde?</ThemedText>
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
                <ThemedText type="defaultSemiBold">Fuente *</ThemedText>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                  value={fuente}
                  onChangeText={setFuente}
                  placeholder="sueldo, freelance, venta, regalo…"
                  placeholderTextColor={theme.icon}
                />
              </View>

              <View style={[styles.campo, styles.filaToggle]}>
                <View style={styles.flex}>
                  <ThemedText type="defaultSemiBold">¿Recurrente?</ThemedText>
                  <ThemedText style={{ color: theme.icon, fontSize: 13 }}>
                    Se repite cada mes (para proyectar).
                  </ThemedText>
                </View>
                <Switch
                  value={recurrente}
                  onValueChange={setRecurrente}
                  trackColor={{ true: theme.tint }}
                />
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
                  placeholder="opcional"
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
                  {guardando ? 'Guardando…' : 'Guardar ingreso'}
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
  filaToggle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputMonto: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  inputNota: { minHeight: 60, textAlignVertical: 'top' },
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
