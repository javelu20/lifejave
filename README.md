# 🌟 LifeJave

**App personal para mejorar mi vida.** Un solo lugar para entrenar, comer bien, cuidar mi dinero y mantenerme motivado.

> Proyecto personal · Bolivia 🇧🇴 · Moneda: Bolivianos (Bs) · Plataforma: Móvil

---

## 🎯 Objetivo

Centralizar en una sola app las 4 áreas que quiero mejorar de forma constante, sin depender de internet ni de varias apps distintas. Todo simple, offline y hecho a mi medida.

**Meta física actual:** recomposición corporal (ganar músculo y bajar algo de grasa) retomando el gym con fuerza tras un año parado.

---

## 👤 Mi perfil (base del plan)

| Dato | Valor |
|---|---|
| Peso actual | 60 kg |
| Estatura | 168 cm |
| IMC | ~21.3 (peso normal, tirando a delgado) |
| Nivel gym | Intermedio en **readaptación** (6 meses de experiencia + 1 año parado) |
| Frecuencia | 6 días/semana |
| Split | Push / Pull / Legs ×2 |
| Equipo | Gym completo |
| Objetivo | Recomposición (prioriza músculo) |
| Calorías mantenimiento (est.) | ~2.300 kcal |
| Proteína objetivo | ~130 g/día (~2.1 g/kg) |
| Restricciones alimenticias | Ninguna |
| Presupuesto comida | 800 Bs/mes (~185–200 Bs/semana) |

---

## 🧩 Los 4 módulos

### 1. 🏋️ Rutina de Gym
Rutina organizada por días de la semana con ejercicios, series, repeticiones y descansos. Enfoque en **ganar masa muscular**. Registro de cada entrenamiento para aplicar **sobrecarga progresiva**.
👉 Detalle en [`RUTINA_GYM.md`](RUTINA_GYM.md)

### 2. 💰 Finanzas Personales
Control de mi economía: ingresos, gastos, categorías, resumen mensual y "en qué se me va el dinero".
👉 Detalle en [`FINANZAS.md`](FINANZAS.md)

### 3. 🍽️ Recetas Semanales
7 recetas (una por día) **altas en proteína, económicas y saludables**, con **ingredientes compartidos** para hacer **una sola compra semanal** y evitar desperdicio. Incluye **lista de compras única**.
👉 Detalle en [`RECETAS.md`](RECETAS.md)

### 4. 💬 Frases Motivacionales
Una frase distinta cada día para mantenerme enfocado. Rotación automática.
👉 Detalle en [`FRASES.md`](FRASES.md)

---

## 🛠️ Stack tecnológico sugerido (simple de mantener)

Como es una app **móvil personal, offline y sin usuarios externos**, la prioridad es: poca infraestructura, cero servidores y datos en el propio teléfono.

| Capa | Elección | Por qué |
|---|---|---|
| Framework | **React Native + Expo** (TypeScript) | Un solo código, corre en Android (y web como bonus). Expo evita configurar Android Studio a mano. |
| Almacenamiento | **SQLite** (`expo-sqlite`) | Base de datos local en el teléfono. Ideal para historial de entrenamientos y gastos. Sin internet. |
| Datos "semilla" | Archivos **JSON** (recetas, frases, plantilla de rutina) | Contenido fijo que casi no cambia; fácil de editar a mano. |
| Estado UI | Estado nativo de React + Context | Suficiente para una app personal; sin librerías pesadas. |
| Gráficos (finanzas) | `victory-native` o `react-native-svg` | Para el resumen mensual por categoría. |
| Navegación | `expo-router` | Navegación por pestañas: Gym · Finanzas · Recetas · Frase del día. |

**Alternativas válidas:** Flutter (si prefieres Dart) o incluso una **PWA** (web instalable) si quieres empezar aún más rápido sin publicar en tiendas.

> 🔑 Principio de diseño: **local-first**. Todo vive en tu teléfono. Nada de cuentas, logins ni nube. Más adelante se puede agregar exportar/importar un archivo de respaldo.

---

## 🗺️ Estructura del proyecto (propuesta)

```
lifejave/
├── README.md            ← este archivo
├── RUTINA_GYM.md
├── FINANZAS.md
├── RECETAS.md
├── FRASES.md
├── ARQUITECTURA.md      ← modelos de datos y decisiones técnicas
└── (más adelante) /app  ← código de la app Expo
```

---

## 🚦 Estado actual

**Fase 1: Documentación** ✅ (estás aquí)
Definir visión, decisiones de entrenamiento/nutrición y arquitectura antes de escribir código.

**Siguiente fase:** ver la sección final de este README y de [`ARQUITECTURA.md`](ARQUITECTURA.md).
