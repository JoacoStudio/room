# Guía de Instalación — Room

Room funciona como aplicación de escritorio (Electron) y como código fuente.

---

## Opción A: Instalar como aplicación de escritorio (Windows)

### Requisitos
- [Node.js](https://nodejs.org/) instalado (v18 o superior)

### Pasos

```bash
# 1. Entrar a la carpeta del proyecto
cd Room

# 2. Instalar dependencias de Electron
cd desktop
npm install

# 3. Ejecutar la app
npm start
```

Esto abrirá Room como una ventana de aplicación sin barra de direcciones.

### Crear instalador (`.exe`)

```bash
cd desktop
npm run dist
```

El instalador se generará en `desktop/dist/`.

---

## Opción B: Código fuente (desarrolladores)

1. Clona el repositorio:

```bash
git clone https://github.com/TU_USUARIO/Room.git
cd Room
```

2. Para ejecutar la versión de escritorio:

```bash
cd desktop
npm install
npm start
```

---

## Estructura de `desktop/`

```
desktop/
├── main.js          # Proceso principal de Electron
├── preload.js       # Puente seguro entre renderer y main
├── index.html       # Entrada principal de la app
├── style.css        # Estilos de la interfaz
├── script.js        # Lógica de notas, atajos, panel
├── Ic.ico           # Ícono de la app
├── Iconito.svg      # Logo de la animación de carga
└── package.json     # Configuración y dependencias de Electron
```

---

## Solución de problemas

| Problema | Solución |
|----------|----------|
| La ventana no abre con `Alt + Z` | Asegúrate de ejecutar la versión de Electron (`cd desktop && npm start`) |
| Las notas no se guardan | Verifica que el sistema permita escribir en `localStorage` |
| El atajo `Alt + Z` no funciona desde otra app | Es posible que otra aplicación esté usando ese atajo. Prueba cerrando otras apps |
