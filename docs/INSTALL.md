# Guía de Instalación — Room

Room funciona en tres formas: directamente en el navegador, como aplicación de escritorio (Electron) y como código fuente.

---

## Opción A: Usar directamente en el navegador (Web)

1. Abre la carpeta del proyecto.
2. Haz doble clic en `src/index.html`.
3. La app se abrirá en tu navegador predeterminado.

> En el navegador, algunas funciones de escritorio (como el atajo global `Alt + Z`) no están disponibles.

---

## Opción B: Instalar como aplicación de escritorio (Windows)

### Requisitos
- [Node.js](https://nodejs.org/) instalado (v18 o superior)

### Pasos

```bash
# 1. Entrar a la carpeta del proyecto
cd Room

# 2. Instalar dependencias de Electron
cd electron
npm install

# 3. Volver a la raíz y ejecutar
cd ..
npm run start:electron
```

Esto abrirá Room como una ventana de aplicación sin barra de direcciones.

### Crear instalador (`.exe`)

```bash
cd electron
npm run dist
```

El instalador se generará en `electron/dist/`.

---

## Opción C: Código fuente (desarrolladores)

1. Clona el repositorio:

```bash
git clone https://github.com/TU_USUARIO/Room.git
cd Room
```

2. Abre `src/index.html` en cualquier navegador para probar la versión web.

3. Para escritorio, sigue los pasos de la Opción B.

---

## Estructura del proyecto

```
Room/
├── src/                 # Núcleo web compartido (HTML, CSS, JS)
│   ├── index.html       # Entrada principal
│   ├── style.css        # Estilos
│   ├── script.js        # Lógica de notas, atajos, panel
│   ├── Ic.ico           # Ícono de la app
│   └── Iconito.svg      # Logo de la animación de carga
├── electron/            # Versión de escritorio (Electron)
│   ├── main.js          # Proceso principal
│   ├── preload.js       # Puente seguro entre renderer y main
│   ├── package.json     # Configuración de Electron
│   └── src/Ic.ico       # Ícono Electron
├── expo-app/            # Versión móvil (Expo/React Native) — código base
├── design/              # Diseños Figma exportados
│   └── Screen1.png
├── docs/                # Documentación y manuales
│   ├── README.md
│   ├── USER_GUIDE.md
│   ├── INSTALL.md
│   ├── SECURITY.md
│   └── CHANGELOG.md
├── package.json         # Scripts y dependencias raíz
├── README.md            # Este archivo
├── Room.bat             # Acceso rápido Windows
├── Room.ps1             # Abre y posiciona ventana (PowerShell)
└── .gitignore
```

---

## Solución de problemas

| Problema | Solución |
|----------|----------|
| La ventana no abre con `Alt + Z` | Asegúrate de ejecutar la versión de Electron, no el HTML directo en el navegador |
| Las notas no se guardan | Verifica que el navegador permita `localStorage` (modo privado puede limitarlo) |
| El atajo `Alt + flecha` no funciona en web | Es atajo nativo del navegador. Usa Electron o prueba `Alt + N` / `Alt + B` |
| No se puede exportar | Algunos navegadores bloquean descargas automáticas. Revisa la barra de descargas |
