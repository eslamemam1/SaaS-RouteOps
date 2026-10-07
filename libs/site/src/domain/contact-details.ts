// The operator's contact details shown on the contact page.
// These are placeholders until the real details are known.
export const contactDetails = {
  phone: '+20 100 000 0000',
  whatsapp: '+20 100 000 0000',
  email: 'hello@haraka.example',
} as const;

export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

// WhatsApp wants the number with its country code and digits only.
export function whatsappHref(phone: string, message: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}

export function emailHref(email: string, subject: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
