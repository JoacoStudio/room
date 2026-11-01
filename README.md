# Room

Organizador de notas minimalista. Blanco y negro, sin botones en la nota: teclado en desktop y gestos en mobile.

## Estructura

```
Room/
├── src/                # Núcleo web compartido (única fuente de verdad)
│   ├── index.html      # Entrada principal
│   ├── style.css       # Estilos (B/N, minimalista)
│   ├── script.js       # Lógica de notas y atajos
│   └── Ic.ico          # Icono de la app
├── electron/           # Escritorio (Electron, solo lo específico)
│   ├── main.js
│   ├── preload.js
│   ├── package.json
│   └── src/Ic.ico      # Ícono de la app Electron
├── expo-app/           # Móvil (Expo SDK 58, React Native)
│   ├── App.js
│   ├── src/
│   ├── package.json
│   └── ...
├── package.json        # Scripts unificados (raíz)
├── Room.bat            # Acceso rápido Windows
├── Room.ps1            # Abre y posiciona la ventana
├── INSTALAR-DESKTOP.md # Instrucciones de instalación
├── SUPABASE_SETUP.md
├── .gitignore
└── README.md           # Este archivo
```

## Atajos de teclado

| Combinación | Acción |
|-------------|--------|
| Alt + N | Nueva nota |
| Alt + B | Eliminar nota actual |
| Alt + ← | Nota anterior |
| Alt + → | Siguiente nota |
| Alt + Q | Pantalla completa |
| Alt + D | Exportar nota actual (.txt) |
| Alt + E | Exportar todas las notas (.json) |
| Alt + I | Importar notas desde archivo |
| Alt + R | Modo lectura / escritura |
| Alt + O | Tema: claro / oscuro / sistema |
| Alt + 2 | Hub de estadísticas (pantalla completa) |
| Alt + X | Ayuda de atajos |

## Gestos en mobile

En pantallas táctiles Room cambia a un modo sin botones visibles. La nota ocupa la pantalla y la barra inferior muestra la posición (`2 / 5`) y un handle fino.

| Gesto | Acción |
|-------|--------|
| Deslizar ← sobre la nota o la barra | Siguiente nota |
| Deslizar → sobre la nota o la barra | Nota anterior |
| Deslizar ↓ desde el borde superior | Nueva nota |
| Deslizar ↑ desde la barra inferior | Abrir acciones |
| Tocar el handle de la barra | Abrir acciones |
| Deslizar la hoja hacia abajo | Cerrarla |

La hoja de acciones concentra lo destructivo o poco frecuente: **eliminar** (con deshacer durante 5 s), **exportar**, **importar**, **solo lectura** y **ayuda**. Los gestos solo se activan con el dedo; con mouse o teclado se mantienen los atajos de siempre. Si mantenés el dedo quieto antes de mover, el gesto se cancela para no interferir con la selección de texto.

> Las notas se guardan en el `localStorage` de cada navegador. No se sincronizan automáticamente entre desktop y mobile.

## Operaciones aritméticas

Room lee automáticamente las expresiones que escribís en la nota. Al terminar una línea con `=`, el resultado se calcula y se inserta en el texto.

| Escribís | Resultado |
|----------|-----------|
| `2 + 3 =` | `2 + 3 = 5` |
| `(10 + 5) / 3 =` | `(10 + 5) / 3 = 5` |
| `2 ^ 8 =` | `2 ^ 8 = 256` |
| `√ 16 =` | `√ 16 = 4` |
| `17 % 5 =` | `17 % 5 = 2` |

Operaciones soportadas: `+`, `-`, `*`, `/`, `%` (módulo), `^` (potencia) y `√` (raíz cuadrada), con paréntesis `()` para agrupar. Si lo que escribís antes de `=` no es una expresión válida, se deja tal cual.

## Hub de estadísticas

Presioná **Alt + 2** para abrir el Hub, una pantalla completa con información de tu uso de la app. Presioná `Alt + 2` otra vez o `Escape` para cerrar.

El Hub tiene dos pestañas:

- **Resumen**: notas totales, palabras escritas, caracteres escritos, ritmo aproximado (palabras/min), días activos, notas creadas y eliminadas.
- **Gráficos**: barras con las palabras escritas por día (últimos 14 días) y una cuadrícula con los días activos.

Las estadísticas se guardan en el almacenamiento local del navegador y se actualizan mientras escribís.

## Cómo usar

1. Abre `index.html` directamente en el navegador, o
2. Ejecuta `Room.bat` para abrir en modo aplicación (sin barra de direcciones), o
3. Usa el acceso directo `Room.lnk` en tu escritorio.

## Persistencia de datos

Las notas se guardan automáticamente en `localStorage` del navegador cada vez que dejas de escribir por 800 ms.

Para respaldar tus notas:
- **Alt + E** descarga un archivo `.json` con todas tus notas.
- **Alt + I** importa notas desde un archivo `.json` o `.txt` previamente exportado.

Recomendación: exporta tu respaldo periódicamente, especialmente antes de borrar el caché del navegador o cambiar de equipo.

## Sincronización entre dispositivos (E2E)

Room puede sincronizar tus notas entre web, escritorio (Electron) y móvil (Expo) de forma privada. El cifrado es de extremo a extremo: solo vos podés leer tus notas, nunca el servidor.

### Cómo activarlo

1. Crea un proyecto en [Supabase](https://supabase.com) y activa Auth (email/password).
2. Ejecuta el SQL de `supabase/schema.sql` en el editor SQL de Supabase para crear la tabla `notes` con RLS.
3. Copia `.env.example` a `.env` y completa `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (web/Electron) y `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Expo) con los valores de tu proyecto Supabase.
4. Inicia la app e ingresá tu correo y contraseña.

### Seguridad importante

- Tus notas se cifran en tu dispositivo con una clave derivada de tu contraseña (AES-GCM + PBKDF2).
- El servidor nunca recibe el texto plano de tus notas.
- **Si olvidás tu contraseña, no se podrán recuperar las notas.** No hay mecanismo de recuperación por diseño.

### Estado de sincronización

En la barra de estado aparece un indicador:
- **Sin sincronizar**: no hay sesión activa
- **Sincronizando...**: subiendo o descargando notas
- **Sincronizado**: todo al día
- **Error de sincronización**: fallo de red o de autenticación

## Accesibilidad

- El área de escritura tiene etiqueta ARIA para lectores de pantalla.
- Los mensajes de estado (guardado, importación, errores) se anuncian mediante región `aria-live`.
- El modo oscuro se activa automáticamente entre las 20:00 y las 08:00.
