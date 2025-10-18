/// <reference types="vite/client" />

declare global {
  interface Window {
    notificationInterval?: NodeJS.Timeout
  }
}
