# Modelo de Seguridad — Room

Room está diseñado para ser una aplicación de notas **local y privada**. Aquí explicamos cómo protegemos tus datos y cuáles son los límites.

---

## 1. Almacenamiento 100% local

Todas tus notas se guardan en `localStorage` del navegador o de Electron:
- **Tu equipo es el único dueño de los datos.**
- No hay servidor, no hay base de datos remota, no hay cuenta de usuario.
- No se envía información a ningún lado.

---

## 2. Sin sincronización en la nube (versión 1.0.0)

Room v1.0.0 **no usa Supabase ni ningún servicio externo**. Las versiones anteriores tenían código de sincronización cifrada, pero ha sido removido para mantener la app simple, rápida y sin dependencias de red.

Si deseas mover tus notas entre dispositivos, usa la función de exportación:
- `Alt + E` descarga un archivo `.json` con todas tus notas.
- `Alt + I` importa notas desde un respaldo previo.

---

## 3. Medidas de seguridad implementadas

| Medida | Descripción |
|--------|-------------|
| **CSP (Content Security Policy)** | Restringe scripts, estilos, fuentes y conexiones solo a orígenes confiables. Evita inyección de código externo. |
| **Validación de IPC (Electron)** | Los mensajes entre la ventana y el proceso principal se validan para asegurar que solo la ventana de Room pueda controlar la app. |
| **contextIsolation: true** | Aísla el contexto de Electron del renderer web. |
| **nodeIntegration: false** | El renderer no tiene acceso directo a las APIs de Node.js. |
| **frame-ancestors: 'none'** | Evita que la app se cargue dentro de un `<iframe>` (protege contra clickjacking). |

---

## 4. Responsabilidad del usuario

- Room no tiene contraseña ni cifrado en la versión 1.0.0. Cualquiera con acceso a tu equipo puede leer tus notas en `localStorage`.
- Si compartes tu equipo, considera usar una cuenta de usuario protegida con contraseña a nivel de sistema operativo.
- Exporta respaldos regularmente (`Alt + E`) y guárdalos en un lugar seguro.

---

## 5. Limitaciones conocidas

| Limitación | Detalle |
|------------|---------|
| Sin cifrado | Las notas están en texto plano en `localStorage`. |
| Sin sincronización | No hay forma automática de pasar notas de un equipo a otro. |
| Sin recuperación | Si borras el caché del navegador sin haber exportado, las notas se pierden. |
