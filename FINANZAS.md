# 💰 Módulo: Finanzas Personales

Control simple de mi economía en **Bolivianos (Bs)**. Objetivo: saber **cuánto entra, cuánto sale y en qué se me va el dinero**, con un resumen mensual claro.

---

## 🎯 Qué resuelve este módulo

- Registrar **ingresos** y **gastos** en segundos.
- Ver el **balance del mes** (¿ahorré o gasté de más?).
- Saber **en qué categorías** se va la plata (comida, transporte, ocio…).
- Controlar el **presupuesto de comida** (800 Bs/mes) contra lo real.

---

## 🧾 Cómo se registran ingresos y gastos

### Ingreso
Cada ingreso guarda:
- **Monto** (Bs)
- **Fecha**
- **Fuente** (sueldo, freelance, regalo, venta…)
- **¿Recurrente?** (sí/no) → para proyectar el mes
- **Nota** (opcional)

### Gasto
Cada gasto guarda:
- **Monto** (Bs)
- **Fecha**
- **Categoría** (obligatoria, de la lista de abajo)
- **Método de pago** (efectivo, QR/transferencia, tarjeta)
- **Nota** (opcional, ej. "almuerzo con amigos")

> 🔑 Regla de usabilidad: registrar un gasto no debe tomar más de 5 segundos. Monto + categoría y listo; lo demás es opcional. Si es difícil, dejas de anotar y el módulo muere.

---

## 🗂️ Categorías de gasto sugeridas

Pensadas para tu vida (Bolivia, estudiante/trabajador que entrena y cocina en casa):

| Categoría | Ejemplos |
|---|---|
| 🛒 **Comida / Supermercado** | Compra semanal de recetas, mercado, verduras |
| 🍔 Comer fuera / Delivery | Almuerzos fuera, salteñas, antojos |
| 🏋️ Gym / Suplementos | Mensualidad del gym, proteína, creatina |
| 🚌 Transporte | Micro, trufi, taxi, gasolina, mantenimiento |
| 🏠 Vivienda / Servicios | Alquiler, luz, agua, gas, internet |
| 📱 Telefonía / Datos | Recargas, plan de celular |
| 🎉 Ocio | Salidas, cine, juegos, streaming |
| 💊 Salud | Farmacia, médico, dentista |
| 📚 Educación | Cursos, libros, materiales |
| 👕 Ropa / Personal | Ropa, corte de pelo, higiene |
| 💸 Deudas / Préstamos | Pagos de deuda, cuotas |
| 💰 Ahorro / Inversión | Lo que aparto (cuenta como "gasto bueno") |
| 🔧 Otros | Lo que no encaja |

> Puedes empezar solo con las 6 que más uses y agregar el resto después. Menos categorías = registro más rápido.

---

## 📊 Reportes y resúmenes a mostrar

### 1. Resumen del mes (pantalla principal)
```
Julio 2026
─────────────────────────
Ingresos:      3.200 Bs
Gastos:        2.450 Bs
─────────────────────────
Balance:       + 750 Bs   ✅
```
Con color: verde si ahorraste, rojo si gastaste de más.

### 2. Gasto por categoría (gráfico de torta o barras)
Muestra el % de cada categoría. Responde directo a "¿en qué se me va el dinero?".
```
Comida/Super  ██████████  32%   784 Bs
Vivienda      ████████    26%   637 Bs
Transporte    ████        14%   343 Bs
Ocio          ███         11%   270 Bs
...
```

### 3. Presupuesto vs. real (por categoría)
Defines un tope por categoría (ej. **Comida = 800 Bs**) y ves cuánto llevas:
```
🛒 Comida:  620 / 800 Bs   ▓▓▓▓▓▓▓░░  78%   ✅ te quedan 180 Bs
🎉 Ocio:    310 / 250 Bs   ▓▓▓▓▓▓▓▓▓  124%  ⚠️ te pasaste 60 Bs
```
Con alerta cuando pasas el 90% o el 100%.

### 4. Tendencia mensual (gráfico de líneas)
Ingresos vs. gastos de los últimos 6 meses. Para ver si mejoras o empeoras.

### 5. Top 5 gastos del mes
Los movimientos más grandes, para detectar fugas puntuales.

---

## 🧮 Cálculos que hace el módulo

- **Balance** = Σ ingresos − Σ gastos (por mes).
- **% por categoría** = gasto categoría / gasto total.
- **Proyección de fin de mes** = usando ingresos recurrentes y ritmo de gasto actual.
- **Tasa de ahorro** = balance / ingresos × 100. Buena meta personal: **≥ 15%**.

---

## 💡 Buenas prácticas integradas (consejo financiero)

1. **Regístralo el mismo día.** La memoria del gasto dura horas, no días.
2. **Presupuesto por categoría, no global.** Es más fácil controlar "800 Bs de comida" que "no gastar mucho".
3. **El ahorro es un gasto fijo.** Aparta primero, gasta después (págate a ti primero).
4. **Revisa el resumen cada domingo.** 2 minutos para ajustar la semana.
5. Vincula con [`RECETAS.md`](RECETAS.md): cocinar la compra semanal es tu mayor palanca de ahorro en comida.

---

## 💾 Qué datos guardar

El modelo de datos completo (tablas `ingreso`, `gasto`, `presupuesto`, `categoria`) está en [`ARQUITECTURA.md`](ARQUITECTURA.md). Todo se guarda **localmente en el teléfono** (SQLite), sin nube.
