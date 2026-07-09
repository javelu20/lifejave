# 🏗️ Arquitectura de LifeJave

Decisiones técnicas, estructura de datos y cómo se guarda todo. Pensado para una **app móvil personal, offline y simple de mantener**.

---

## 🧭 Principios de diseño

1. **Local-first:** todos los datos viven en el teléfono. Sin nube, sin cuentas, sin login.
2. **Offline total:** la app funciona sin internet en cualquier momento.
3. **Simple sobre elegante:** menos dependencias = menos que mantener.
4. **Datos que cambian vs. datos fijos:**
   - **Historial** (entrenamientos, gastos) → base de datos **SQLite** (crece con el uso).
   - **Contenido semilla** (recetas, frases, plantilla de rutina) → archivos **JSON** (casi no cambian, fáciles de editar a mano).

---

## 🛠️ Stack técnico

| Componente | Tecnología |
|---|---|
| Framework | React Native + **Expo** (TypeScript) |
| Navegación | `expo-router` (pestañas) |
| Base de datos | **SQLite** vía `expo-sqlite` |
| Datos semilla | Archivos `.json` importados |
| Gráficos | `react-native-svg` / `victory-native` |
| Notificaciones | `expo-notifications` (frase diaria) |

> Alternativas: Flutter (Dart) o una PWA web. La estructura de datos de abajo es válida para cualquiera de las tres.

---

## 📁 Estructura de carpetas (propuesta)

```
lifejave/
├── app/                      ← pantallas (expo-router)
│   ├── (tabs)/
│   │   ├── gym.tsx
│   │   ├── finanzas.tsx
│   │   ├── recetas.tsx
│   │   └── frase.tsx
│   └── _layout.tsx
├── src/
│   ├── db/                   ← conexión y migraciones SQLite
│   ├── data/                 ← datos semilla (JSON)
│   │   ├── rutina.json
│   │   ├── recetas.json
│   │   └── frases.json
│   ├── models/               ← tipos TypeScript
│   └── components/           ← UI reutilizable
└── assets/
```

---

## 🗄️ Modelo de datos

### 🏋️ Módulo Gym (SQLite — historial)

```sql
-- Una fila por sesión entrenada
CREATE TABLE sesion (
  id            INTEGER PRIMARY KEY,
  fecha         TEXT NOT NULL,          -- ISO: 2026-07-09
  tipo          TEXT NOT NULL,          -- 'Push A', 'Pull B', 'Legs A'...
  duracion_min  INTEGER,
  nota          TEXT
);

-- Una fila por cada serie realizada
CREATE TABLE serie (
  id            INTEGER PRIMARY KEY,
  sesion_id     INTEGER NOT NULL REFERENCES sesion(id),
  ejercicio     TEXT NOT NULL,          -- 'Press banca con barra'
  numero_serie  INTEGER NOT NULL,       -- 1, 2, 3, 4
  peso_kg       REAL,
  reps          INTEGER,
  rir           INTEGER                 -- reps en reserva (opcional)
);
```

**Plantilla de rutina** (JSON semilla, no cambia con el uso):
```json
{
  "PushA": [
    { "ejercicio": "Press banca con barra", "series": 4, "reps": "6-8", "descanso_s": 150, "rir": "1-2" },
    { "ejercicio": "Press inclinado con mancuernas", "series": 3, "reps": "8-12", "descanso_s": 90, "rir": "1-2" }
  ]
}
```

**Métricas calculadas (en código, no se guardan):** volumen semanal por músculo, e1RM = `peso × (1 + reps/30)` (Epley), PRs.

---

### 💰 Módulo Finanzas (SQLite — historial)

```sql
CREATE TABLE categoria (
  id      INTEGER PRIMARY KEY,
  nombre  TEXT NOT NULL,        -- 'Comida', 'Transporte'...
  icono   TEXT,
  tipo    TEXT NOT NULL         -- 'gasto' | 'ingreso'
);

CREATE TABLE movimiento (
  id             INTEGER PRIMARY KEY,
  tipo           TEXT NOT NULL,       -- 'ingreso' | 'gasto'
  monto          REAL NOT NULL,       -- en Bs
  fecha          TEXT NOT NULL,       -- ISO
  categoria_id   INTEGER REFERENCES categoria(id),
  fuente         TEXT,                -- para ingresos: 'sueldo'...
  metodo_pago    TEXT,                -- 'efectivo' | 'qr' | 'tarjeta'
  recurrente     INTEGER DEFAULT 0,   -- 0/1
  nota           TEXT
);

CREATE TABLE presupuesto (
  id             INTEGER PRIMARY KEY,
  categoria_id   INTEGER REFERENCES categoria(id),
  monto_mensual  REAL NOT NULL        -- ej. Comida = 800
);
```

**Cálculos:** balance = Σ ingresos − Σ gastos; % por categoría; presupuesto vs real; tasa de ahorro.

---

### 🍽️ Módulo Recetas (JSON semilla)

```json
{
  "recetas": [
    {
      "dia": "lunes",
      "nombre": "Pollo salteado con arroz y ensalada",
      "ingredientes": [
        { "item": "Pollo", "cantidad": "180 g" },
        { "item": "Arroz", "cantidad": "1 taza cocida" }
      ],
      "pasos": ["Saltear el pollo con cebolla", "Servir con arroz y ensalada"],
      "kcal": 600,
      "proteina_g": 45
    }
  ],
  "lista_compras": [
    { "item": "Pollo", "cantidad": "1.8 kg", "precio_bs": 45, "categoria": "proteina" }
  ]
}
```

> La lista de compras se puede **generar automáticamente** sumando los ingredientes de las 7 recetas, o mantenerse como lista fija revisada a mano.

**Estado que sí se guarda (SQLite, opcional):** ingredientes ya comprados (checkbox de la lista de compras).

---

### 💬 Módulo Frases (JSON semilla)

```json
{
  "frases": [
    "La disciplina pesa gramos; el arrepentimiento pesa toneladas.",
    "No tienes que ser el mejor, solo mejor que ayer."
  ]
}
```

**Lógica de selección (código):**
```ts
const diaDelAnio = /* 1..366 */;
const fraseHoy = frases[diaDelAnio % frases.length];
```

**Estado guardado (SQLite, opcional):** frases favoritas.

---

## 💾 Respaldo de datos (recomendado a futuro)

Como todo es local, si se pierde el teléfono se pierden los datos. Solución simple:
- Función **"Exportar respaldo"** → genera un archivo `.json` con todo el historial (sesiones, movimientos).
- Función **"Importar respaldo"** → lo restaura.
- Guardar ese archivo en Google Drive / correo manualmente.

No necesita servidor. Es la forma más barata de no perder tu historial.

---

## 🧱 Resumen de decisiones

| Decisión | Elección | Motivo |
|---|---|---|
| ¿Nube o local? | **Local** | App personal, sin usuarios; menos costo y complejidad. |
| ¿Base de datos? | **SQLite** | Historial estructurado que crece (gym, finanzas). |
| ¿Recetas/frases? | **JSON** | Contenido fijo, editable a mano, sin BD. |
| ¿Login? | **No** | Un solo usuario en su propio teléfono. |
| ¿Respaldo? | **Exportar/Importar JSON** | Simple y suficiente para no perder datos. |
