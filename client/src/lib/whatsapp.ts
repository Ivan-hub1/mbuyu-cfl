// WhatsApp number from environment (no +, no spaces)
export const WHATSAPP_NUMBER =
  import.meta.env.VITE_WHATSAPP_NUMBER || '256700000000';

/**
 * Build a WhatsApp URL that opens a chat with a pre-filled message.
 */
export function buildWhatsAppUrl(message: string, number?: string): string {
  const target = number || WHATSAPP_NUMBER;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${target}?text=${encoded}`;
}

/**
 * Open WhatsApp in a new tab with the given message.
 */
export function openWhatsApp(message: string, number?: string) {
  const url = buildWhatsAppUrl(message, number);
  window.open(url, '_blank', 'noopener,noreferrer');
}