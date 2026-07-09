# src/db — reservado para SQLite (fase futura)

Carpeta placeholder. Aquí vivirá la conexión y las migraciones de **SQLite**
(`expo-sqlite`) cuando se implemente el **historial** que crece con el uso:

- **Gym:** sesiones y series entrenadas (ver `sesion` / `serie` en `ARQUITECTURA.md`).
- **Finanzas:** movimientos, categorías y presupuestos.

Por ahora **NO** se instala `expo-sqlite` (la app corre en Expo Go tal cual).
El contenido semilla que no cambia (frases, recetas, plantilla de rutina) vive
como JSON en `src/data/`, no en base de datos.
