# Simulador Obras por Terceros

Simulador web estático del formulario de inspección de obras por terceros
(Datos de la obra + Acta de Inspección digital). Sirve para practicar y probar
casos antes de comunicar tareas. Las obras son ficticias y nada se envía a
ningún sistema: las actas quedan en el navegador y se pueden copiar o descargar.

## Archivos

- `index.html`: estructura de la app.
- `styles.css`: estilos (aspecto de celular).
- `app.js`: pantallas, validaciones, firma, fotos, audio y actas guardadas.
- `data.js`: **obras de ejemplo y listas de defectos**. Es el archivo a editar
  para cambiar opciones.

## Usarlo

- En la PC: abrir `index.html` con doble clic.
- En GitHub Pages: Settings → Pages → Source: "Deploy from a branch",
  rama `main`, carpeta `/ (root)`.

## Pendiente

- Sección **Acción**: solo está "Defecto solucionado en día".
- Sección **Orden de servicio**: sin campos reales (falta captura).
