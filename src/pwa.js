export function registerServiceWorker() {
  if (!import.meta.env.PROD) {
    return
  }

  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // falha de registro não interrompe a execução do app
    })
  })
}
