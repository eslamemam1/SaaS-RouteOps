import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import {
  lucideClock,
  lucideMail,
  lucideMapPin,
  lucideMessageCircle,
  lucidePhone,
} from '@ng-icons/lucide';
import { injectText } from '@routeops/shared/i18n';
import { Button, PageHeader, PublicLayout } from '@routeops/shared/ui';
import { contactDetails, emailHref, phoneHref, whatsappHref } from '../domain/contact-details';
import { siteText } from './site-text';

@Component({
  selector: 'app-contact',
  imports: [Button, NgIcon, PageHeader, PublicLayout, RouterLink],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact {
  protected readonly text = injectText(siteText);
  protected readonly hoursIcon = lucideClock;
  protected readonly addressIcon = lucideMapPin;
  protected readonly channels = computed(() => {
    const text = this.text().contact;
    return [
      {
        label: text.phone,
        hint: text.phoneHint,
        value: contactDetails.phone,
        href: phoneHref(contactDetails.phone),
        icon: lucidePhone,
        external: false,
      },
      {
        label: text.whatsapp,
        hint: text.whatsappHint,
        value: contactDetails.whatsapp,
        href: whatsappHref(contactDetails.whatsapp, text.whatsappMessage),
        icon: lucideMessageCircle,
        external: true,
      },
      {
        label: text.email,
        hint: text.emailHint,
        value: contactDetails.email,
        href: emailHref(contactDetails.email, text.emailSubject),
        icon: lucideMail,
        external: false,
      },
    ];
  });
}
