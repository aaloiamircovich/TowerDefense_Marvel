const STRINGS = {
    es: { settings: 'Ajustes', controls: 'Controles', saveData: 'Guardado', export: 'Exportar', import: 'Importar' },
    en: { settings: 'Settings', controls: 'Controls', saveData: 'Save data', export: 'Export', import: 'Import' }
};

export function translate(key, locale = 'es') {
    return STRINGS[locale]?.[key] || STRINGS.es[key] || key;
}

export function getSupportedLocales() {
    return Object.keys(STRINGS);
}
