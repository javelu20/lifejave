# 💬 Módulo: Frases Motivacionales

Una **frase distinta cada día** para mantenerme enfocado. Simple, automática y sin repetir dos días seguidos.

---

## ⚙️ Cómo se muestra una frase distinta cada día

La regla es **determinista**: el mismo día siempre muestra la misma frase, y cambia al día siguiente. Nada de aleatorio puro (que podría repetir).

**Lógica:**
1. Se calcula el **día del año** (1 a 366).
2. Se toma el índice: `indice = (díaDelAño) % (total de frases)`.
3. Se muestra `frases[indice]`.

Ejemplo: con 15 frases, el día 1 muestra la frase 1, el día 16 vuelve a la frase 1, etc. Al agregar más frases, tarda más en repetirse.

```
frase_de_hoy = frases[ dia_del_año % frases.length ]
```

**Ventajas:**
- No necesita internet ni base de datos: se calcula al abrir la app.
- Es la misma durante todo el día (si abres 3 veces, ves la misma).
- Cambia sola a medianoche.

**Extras opcionales:**
- Botón "otra frase" (muestra una aleatoria sin romper la del día).
- Marcar frases como **favoritas**.
- Notificación diaria a una hora fija (ej. 7:00 am) con la frase del día.

---

## 📋 Lista inicial de 15 frases

1. "La disciplina pesa gramos; el arrepentimiento pesa toneladas."
2. "No tienes que ser el mejor, solo mejor que ayer."
3. "El cuerpo logra lo que la mente cree."
4. "Cada serie cuenta. Cada comida cuenta. Cada día cuenta."
5. "La motivación te enciende; el hábito te mantiene."
6. "Un año de constancia vale más que un mes de intensidad."
7. "Hazlo cansado, hazlo con miedo, pero hazlo."
8. "El progreso no siempre se ve, pero siempre se construye."
9. "Invertir en ti nunca es un gasto."
10. "Come para tus metas, no para tu antojo."
11. "El descanso también es parte del entrenamiento."
12. "Pequeños pasos todos los días te llevan lejos."
13. "No abandones lo que quieres por lo que quieres ahora."
14. "Tu única competencia eres tú mismo."
15. "Empieza donde estás, usa lo que tienes, haz lo que puedas."

> Estas frases mezclan gym, disciplina, nutrición y finanzas, alineadas con los 4 módulos de LifeJave. Puedes seguir agregando: mientras más tengas, menos se repiten.

---

## 💾 Cómo se guarda

Las frases son **datos semilla** en un archivo JSON (`frases.json`), un array de strings. No requieren base de datos. Las favoritas sí se guardan localmente. Detalle en [`ARQUITECTURA.md`](ARQUITECTURA.md).
