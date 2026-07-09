import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { CategoriaCompra, ItemCompra } from '@/src/models/receta';

type ListaComprasProps = {
  visible: boolean;
  onClose: () => void;
  items: ItemCompra[];
};

/** Orden y etiqueta legible de cada categoría en la lista. */
const CATEGORIAS: { clave: CategoriaCompra; titulo: string }[] = [
  { clave: 'proteina', titulo: 'Proteína' },
  { clave: 'carbohidrato', titulo: 'Carbohidratos' },
  { clave: 'verdura', titulo: 'Verduras' },
  { clave: 'fruta', titulo: 'Fruta' },
  { clave: 'lacteo', titulo: 'Lácteos' },
  { clave: 'otros', titulo: 'Otros' },
];

/**
 * Modal "modo súper" de la lista de compras.
 * - Ítems agrupados por categoría (item · cantidad · precio Bs).
 * - Checkbox "en el carrito 🛒": al marcar, el ítem se tacha + atenúa y baja al
 *   final de su grupo, para que lo que FALTA quede siempre arriba.
 * - Contador X / N arriba; subtotal y desglose (en carrito / total) al pie.
 * Estado local en un Set; se mantiene mientras la app está abierta.
 * TODO (fuera de alcance): persistir el estado "en el carrito" entre cierres
 * de la app (SQLite/AsyncStorage).
 */
export function ListaCompras({ visible, onClose, items }: ListaComprasProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // Ítems marcados como "en el carrito", por nombre de ítem (único en la lista).
  const [enCarrito, setEnCarrito] = useState<Set<string>>(new Set());

  const toggle = (item: string) => {
    setEnCarrito((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(item)) {
        siguiente.delete(item);
      } else {
        siguiente.add(item);
      }
      return siguiente;
    });
  };

  const total = useMemo(
    () => items.reduce((suma, it) => suma + it.precio_bs, 0),
    [items],
  );
  const totalEnCarrito = useMemo(
    () => items.reduce((suma, it) => (enCarrito.has(it.item) ? suma + it.precio_bs : suma), 0),
    [items, enCarrito],
  );

  // Grupos por categoría; dentro de cada grupo, lo pendiente arriba y lo que ya
  // está en el carrito al final (orden original estable dentro de cada bloque).
  const grupos = useMemo(() => {
    return CATEGORIAS.map(({ clave, titulo }) => {
      const delGrupo = items.filter((it) => it.categoria === clave);
      const pendientes = delGrupo.filter((it) => !enCarrito.has(it.item));
      const comprados = delGrupo.filter((it) => enCarrito.has(it.item));
      return { titulo, items: [...pendientes, ...comprados] };
    }).filter((g) => g.items.length > 0);
  }, [items, enCarrito]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.encabezado}>
            <ThemedText type="subtitle">🛒 Lista de compras de la semana</ThemedText>
            <ThemedText style={{ color: theme.icon }}>1 persona · 7 días</ThemedText>
            <ThemedText style={{ color: theme.icon }}>
              {enCarrito.size} / {items.length} en el carrito
            </ThemedText>
          </View>

          <ScrollView contentContainerStyle={styles.scroll}>
            {grupos.map((grupo) => (
              <View key={grupo.titulo} style={styles.grupo}>
                <ThemedText type="defaultSemiBold" style={[styles.grupoTitulo, { color: theme.icon }]}>
                  {grupo.titulo}
                </ThemedText>
                {grupo.items.map((it) => {
                  const marcado = enCarrito.has(it.item);
                  return (
                    <Pressable
                      key={it.item}
                      onPress={() => toggle(it.item)}
                      style={[styles.fila, { borderColor: theme.icon }]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: marcado }}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          { borderColor: theme.tint },
                          marcado && { backgroundColor: theme.tint },
                        ]}
                      >
                        {marcado ? (
                          <ThemedText style={[styles.check, { color: theme.background }]}>✓</ThemedText>
                        ) : null}
                      </View>
                      <View style={styles.filaTexto}>
                        <ThemedText style={[marcado && styles.textoMarcado]}>{it.item}</ThemedText>
                        <ThemedText style={[styles.cantidad, { color: theme.icon }, marcado && styles.textoMarcado]}>
                          {it.cantidad} · {it.precio_bs} Bs
                        </ThemedText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          <View style={[styles.pie, { borderTopColor: theme.icon }]}>
            <ThemedText type="defaultSemiBold">Subtotal semana: {total} Bs</ThemedText>
            <ThemedText style={{ color: theme.icon }}>
              En carrito: {totalEnCarrito} Bs / total: {total} Bs
            </ThemedText>
            <Pressable
              onPress={onClose}
              style={[styles.cerrar, { backgroundColor: theme.tint }]}
              accessibilityRole="button"
            >
              <ThemedText style={[styles.cerrarTexto, { color: theme.background }]}>Cerrar</ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  encabezado: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 4,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
  },
  grupo: {
    gap: 8,
  },
  grupoTitulo: {
    textTransform: 'uppercase',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 18,
  },
  filaTexto: {
    flex: 1,
    gap: 2,
  },
  cantidad: {
    fontSize: 13,
  },
  textoMarcado: {
    textDecorationLine: 'line-through',
    opacity: 0.45,
  },
  pie: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  cerrar: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  cerrarTexto: {
    fontWeight: '600',
    fontSize: 16,
  },
});
