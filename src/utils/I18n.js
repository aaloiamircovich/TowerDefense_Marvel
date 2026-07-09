const STRINGS = {
    es: {
        settings: 'Ajustes',
        gameplayAccessibility: 'Juego y accesibilidad',
        controls: 'Controles',
        controllerHint: 'Mando: A inicia oleada, B cancela, Start pausa y LB/RB cambia de heroe.',
        language: 'Idioma',
        saveData: 'Guardado',
        audioMix: 'Mezcla de audio',
        uiSize: 'Tamano de interfaz',
        export: 'Exportar',
        import: 'Importar',
        replay: 'Replay',
        cancelPlacement: 'Cancelar colocacion',
        restartLevel: 'Reiniciar nivel',
        compact: 'Compacta',
        normal: 'Normal',
        large: 'Grande',
        showRanges: 'Mostrar rangos de heroes',
        showGrid: 'Mostrar cuadricula tactica',
        combatText: 'Texto flotante de combate',
        gameAudio: 'Audio del juego',
        highContrast: 'Modo de alto contraste',
        reduceMotion: 'Reducir movimiento',
        masterVolume: 'Volumen general',
        musicVolume: 'Musica ambiental',
        sfxVolume: 'Efectos y combate',
        pause: 'Pausa',
        speed: 'Velocidad',
        nextWave: 'Iniciar oleada',
        cancel: 'Cancelar',
        targeting: 'Cambiar objetivo',
        upgrade: 'Mejorar seleccionado'
    },
    en: {
        settings: 'Settings',
        gameplayAccessibility: 'Game and accessibility',
        controls: 'Controls',
        controllerHint: 'Gamepad: A starts wave, B cancels, Start pauses, and LB/RB changes hero.',
        language: 'Language',
        saveData: 'Save data',
        audioMix: 'Audio mix',
        uiSize: 'Interface size',
        export: 'Export',
        import: 'Import',
        replay: 'Replay',
        cancelPlacement: 'Cancel placement',
        restartLevel: 'Restart level',
        compact: 'Compact',
        normal: 'Normal',
        large: 'Large',
        showRanges: 'Show hero ranges',
        showGrid: 'Show tactical grid',
        combatText: 'Floating combat text',
        gameAudio: 'Game audio',
        highContrast: 'High contrast mode',
        reduceMotion: 'Reduce motion',
        masterVolume: 'Master volume',
        musicVolume: 'Ambient music',
        sfxVolume: 'Effects and combat',
        pause: 'Pause',
        speed: 'Speed',
        nextWave: 'Start wave',
        cancel: 'Cancel',
        targeting: 'Change target',
        upgrade: 'Upgrade selected'
    }
};

export function translate(key, locale = 'es') {
    return STRINGS[locale]?.[key] || STRINGS.es[key] || key;
}

export function getSupportedLocales() {
    return Object.keys(STRINGS);
}
