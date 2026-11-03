# Room

Organizador de notas minimalista. Blanco y negro, sin botones en la nota: teclado en desktop y gestos en mobile.

**Versión 1.0.0** — Almacenamiento **100% local** en `localStorage`. Sin servidor, sin cuenta, sin sincronización en la nube.

---

## 📦 Instalación rápida

### Escritorio (Electron) — Windows
```bash
cd desktop
npm install
npm start
```

Más detalles: [`docs/INSTALL.md`](docs/INSTALL.md)

---

## ⌨️ Atajos principales

| Combinación | Acción |
|-------------|--------|
| `Alt + N` | Nueva nota |
| `Alt + B` | Eliminar nota |
| `Alt + ← / →` | Nota anterior / siguiente |
| `Alt + Q` | Pantalla completa |
| `Alt + D / E` | Exportar nota / todas |
| `Alt + I` | Importar notas |
| `Alt + R` | Solo lectura |
| `Alt + O` | Cambiar tema |
| `Alt + + / -` | Tamaño de letra |
| `Alt + V` | Ver notas y atajos |
| `Alt + Z` | Abrir Room desde cualquier lugar (Electron) |
| `Alt + Retroceso` | Cerrar (Electron) |

---

## 📁 Estructura

```
Room/
├── desktop/             # Escritorio (Electron, autocontenido)
│   ├── main.js          # Proceso principal
│   ├── preload.js       # Puente seguro renderer ↔ main
│   ├── index.html       # Entrada principal
│   ├── style.css        # Estilos
│   ├── script.js        # Lógica de notas, atajos, panel
│   ├── Ic.ico           # Ícono de la app
│   ├── Iconito.svg      # Logo de la animación de carga
│   └── package.json     # Configuración de Electron
├── expo-app/            # Móvil (Expo/React Native, base de código)
├── design/              # Diseños Figma (Screen1.png)
├── docs/                # Manuales y documentación
│   ├── USER_GUIDE.md
│   ├── INSTALL.md
│   ├── SECURITY.md
│   └── CHANGELOG.md
├── package.json         # Scripts raíz
├── README.md            # Este archivo
├── Room.bat             # Acceso rápido Windows
├── Room.ps1             # Abre y posiciona ventana (PowerShell)
└── .gitignore
```

---

## 📖 Documentación completa

| Documento | Contenido |
|-----------|-----------|
| [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) | Cómo usar la app: atajos, panel, exportar, temas |
| [`docs/INSTALL.md`](docs/INSTALL.md) | Instalación en escritorio |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Modelo de seguridad, almacenamiento local, límites |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | Cambios por versión (v1.0.0) |

---

## 🛡️ Seguridad

Room v1.0.0 guarda todo en tu equipo. No hay servidor ni nube. Para más detalles: [`docs/SECURITY.md`](docs/SECURITY.md).

---

## 🚀 Próximas versiones

- Sincronización opcional con cifrado de extremo a extremo
- Versión móvil completa (Expo)
- Etiquetas y búsqueda de notas

---

**Hecho con ❤️ para notas simples, rápidas y privadas.**
