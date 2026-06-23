import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const errors = [];

if (!/<html[^>]+lang="es"/i.test(html)) errors.push('El documento debe declarar idioma');
if (!/aria-live="polite"/i.test(html)) errors.push('Falta una region de anuncios');
if (!/role="dialog"[^>]+aria-modal="true"/i.test(html)) errors.push('El panel principal debe ser modal accesible');
if (!/\.high-contrast\b/.test(css)) errors.push('Falta modo de alto contraste');
if (!/\.reduce-motion\b/.test(css)) errors.push('Falta preferencia de movimiento reducido');

for (const match of html.matchAll(/<button([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const visibleText = match[2].replace(/<[^>]+>/g, '').trim();
    if (!visibleText && !/aria-label=|title=/i.test(match[1])) errors.push('Hay un boton de icono sin nombre accesible');
}

errors.forEach((error) => console.error(`ERROR: ${error}`));
console.log(`Auditoria de accesibilidad: ${errors.length} errores.`);
if (errors.length) process.exitCode = 1;
