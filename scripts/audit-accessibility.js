import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const mainSource = fs.readFileSync('src/main.js', 'utf8');
const errors = [];
const dynamicTemplateFiles = [
    ...listSourceFiles('src/ui'),
    ...listSourceFiles('src/systems')
];

if (!/<html[^>]+lang="es"/i.test(html)) errors.push('El documento debe declarar idioma');
if (!/aria-live="polite"/i.test(html)) errors.push('Falta una region de anuncios');
if (!/role="dialog"[^>]+aria-modal="true"/i.test(html)) errors.push('El panel principal debe ser modal accesible');
if (!/\.high-contrast\b/.test(css)) errors.push('Falta modo de alto contraste');
if (!/\.reduce-motion\b/.test(css)) errors.push('Falta preferencia de movimiento reducido');
if (!/body\[data-app-state="loading"\]\s*#game-ui/i.test(html)) errors.push('Falta estilo critico para ocultar UI durante la carga inicial');

const criticalStyle = html.match(/<style>([\s\S]*?)<\/style>/i)?.[1] || '';
const bodyTag = html.match(/<body\b[^>]*>/i)?.[0] || '';
if (!/@font-face[\s\S]*Avengeance[\s\S]*avengeance-heroic-avenger-bd\.ttf/i.test(criticalStyle)) errors.push('La pantalla inicial debe declarar la fuente critica inline');
if (!/start-screen-cover-final-clean-20260809\.png/i.test(criticalStyle)) errors.push('La pantalla inicial debe declarar el fondo critico inline');
if (!/start-assets-ready/i.test(criticalStyle) || !/#start-screen::before/i.test(criticalStyle)) errors.push('La pantalla inicial debe esperar assets criticos antes de mostrar fondo/titulo');
if (!/body:not\(\.start-assets-ready\)\s*#start-screen::before[\s\S]*opacity:\s*0/i.test(criticalStyle)) errors.push('El fondo inicial debe permanecer oculto hasta que carguen los assets criticos');
if (!/body:not\(\.start-assets-ready\)\s*\.start-screen::before[\s\S]*opacity:\s*0/i.test(css)) errors.push('El CSS principal debe conservar la proteccion anti-flash del fondo inicial');
if (!/prepareStartScreenAssets/i.test(mainSource) || !/document\.fonts\.load/i.test(mainSource)) errors.push('La carga inicial debe precargar fondo, logo y fuente antes de mostrar el menu');
if (!/body\.title-screen-active\s*#top-bar[\s\S]*body\.title-screen-active\s*#main-content/i.test(criticalStyle)) errors.push('Falta estilo critico para ocultar el HUD durante la pantalla inicial');
if (!/body\[data-app-state="loading"\]\s*\.start-screen__panel/i.test(criticalStyle)) errors.push('Falta estilo critico para ocultar botones de inicio durante carga');
if (!/\bdata-app-state="loading"/i.test(bodyTag) || !/\bclass="[^"]*\btitle-screen-active\b/i.test(bodyTag)) errors.push('El body debe iniciar ocultando el HUD hasta que el jugador entre al juego');

[
    'start-play-btn',
    'start-options-btn',
    'start-continue-btn',
    'start-new-game-btn'
].forEach((id) => {
    if (!new RegExp(`<button[^>]+id="${id}"[^>]+data-tooltip=`, 'i').test(html)) {
        errors.push(`${id} debe declarar data-tooltip en pantalla inicial`);
    }
});
if (!/<button[^>]+data-start-back[^>]+data-tooltip=/i.test(html)) errors.push('El boton volver de inicio debe declarar data-tooltip');
[
    'suggested-placement-action',
    'next-wave-btn'
].forEach((id) => {
    if (!new RegExp(`<button[^>]+id="${id}"[^>]+data-tooltip=`, 'i').test(html)) {
        errors.push(`${id} debe declarar data-tooltip inicial`);
    }
});
if (!/<button[^>]+id="close-panel-btn"[^>]+data-tooltip=/i.test(html)) errors.push('El boton cerrar panel debe declarar data-tooltip');

assertButtonTypes(html, 'index.html');
assertButtonTooltips(html, 'index.html');
assertRoleButtonTooltips(html, 'index.html');
dynamicTemplateFiles.forEach((filePath) => {
    const source = fs.readFileSync(filePath, 'utf8');
    assertButtonTypes(source, filePath);
    assertButtonTooltips(source, filePath);
    assertRoleButtonTooltips(source, filePath);
});

for (const match of html.matchAll(/<button([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const visibleText = match[2].replace(/<[^>]+>/g, '').trim();
    if (!visibleText && !/aria-label=|title=/i.test(match[1])) errors.push('Hay un boton de icono sin nombre accesible');
}

errors.forEach((error) => console.error(`ERROR: ${error}`));
console.log(`Auditoria de accesibilidad: ${errors.length} errores.`);
if (errors.length) process.exitCode = 1;

function listSourceFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const filePath = path.join(dir, entry.name);
        if (entry.isDirectory()) return listSourceFiles(filePath);
        return entry.isFile() && filePath.endsWith('.js') ? [filePath] : [];
    });
}

function assertButtonTypes(source, label) {
    for (const match of source.matchAll(/<button\b([^>]*)>/gi)) {
        if (/\btype\s*=/i.test(match[1])) continue;
        errors.push(`${label}:${lineNumber(source, match.index)} boton sin atributo type`);
    }
}

function assertButtonTooltips(source, label) {
    for (const match of source.matchAll(/<button\b([^>]*)>/gi)) {
        if (/\bdata-tooltip\s*=/i.test(match[1])) continue;
        errors.push(`${label}:${lineNumber(source, match.index)} boton sin data-tooltip`);
    }
}

function assertRoleButtonTooltips(source, label) {
    for (const match of source.matchAll(/<[^>]+\brole=["']button["'][^>]*>/gi)) {
        if (/\btitle\s*=/i.test(match[0]) && /\bdata-tooltip\s*=/i.test(match[0])) continue;
        errors.push(`${label}:${lineNumber(source, match.index)} elemento role=button sin title/data-tooltip`);
    }
}

function lineNumber(source, index) {
    return source.slice(0, index).split(/\r?\n/).length;
}
