import { emailHref, phoneHref, whatsappHref } from './contact-details';

describe('contact links', () => {
  it('dials the number without spaces', () => {
    expect(phoneHref('+20 100 000 0000')).toBe('tel:+201000000000');
  });

  it('opens WhatsApp with digits only and a ready message', () => {
    expect(whatsappHref('+20 100 000 0000', 'أريد حسابًا')).toBe(
      `https://wa.me/201000000000?text=${encodeURIComponent('أريد حسابًا')}`,
    );
  });

  it('opens an email with its subject', () => {
    expect(emailHref('hello@haraka.example', 'طلب حساب')).toBe(
      `mailto:hello@haraka.example?subject=${encodeURIComponent('طلب حساب')}`,
    );
  });
});
