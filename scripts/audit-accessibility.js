import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
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

assertButtonTypes(html, 'index.html');
dynamicTemplateFiles.forEach((filePath) => {
    assertButtonTypes(fs.readFileSync(filePath, 'utf8'), filePath);
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

function lineNumber(source, index) {
    return source.slice(0, index).split(/\r?\n/).length;
}
