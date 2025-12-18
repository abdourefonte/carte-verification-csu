// src/polyfills.ts
import 'zone.js/dist/zone';

// Polyfill pour Clipboard API
if (!navigator.clipboard) {
  (navigator as any).clipboard = {
    writeText: (text: string) => {
      return new Promise<void>((resolve, reject) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          resolve();
        } catch (err) {
          reject(err);
        }
        document.body.removeChild(textArea);
      });
    }
  };
}