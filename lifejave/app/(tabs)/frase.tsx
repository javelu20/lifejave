import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FraseCard } from '@/src/components/FraseCard';
import frasesData from '@/src/data/frases.json';
import { getFraseDelDia } from '@/src/lib/frase';
import type { FrasesData } from '@/src/models/frase';

const { frases } = frasesData as FrasesData;

export default function FraseScreen() {
  // Se calcula al renderizar: determinista para el día en curso (hora local).
  const fraseHoy = getFraseDelDia(frases);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.encabezado}>
          Frase del día
        </ThemedText>

        <FraseCard frase={fraseHoy} />
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  encabezado: {
    textAlign: 'center',
    opacity: 0.7,
  },
});
