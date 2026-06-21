export function registerPwa() {
    if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) {
        document.documentElement.dataset.pwaStatus = 'unsupported';
        return;
    }

    const register = () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(() => {
                document.documentElement.dataset.pwaStatus = 'registered';
            })
            .catch((error) => {
                document.documentElement.dataset.pwaStatus = 'error';
                console.warn('PWA no disponible:', error.message);
            });
    };

    if (document.readyState === 'complete') {
        register();
    } else {
        window.addEventListener('load', register, { once: true });
    }
}
