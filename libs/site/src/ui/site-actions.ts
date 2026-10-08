import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { lucideMessageCircle } from '@ng-icons/lucide';
import { injectText } from '@routeops/shared/i18n';
import { Button } from '@routeops/shared/ui';
import { contactDetails, whatsappHref } from '../domain/contact-details';
import { siteText } from './site-text';

// The two ways a visitor asks for an account, on a dark background.
@Component({
  selector: 'app-site-actions',
  imports: [Button, NgIcon, RouterLink],
  template: `
    <div class="site-actions">
      <a appButton class="site-button-accent" routerLink="/contact">{{ text().home.contact }}</a>
      <a
        appButton="secondary"
        class="site-button-ghost"
        [href]="whatsapp()"
        target="_blank"
        rel="noopener"
      >
        <ng-icon [svg]="whatsappIcon" aria-hidden="true" />
        {{ text().home.whatsapp }}
      </a>
    </div>
  `,
  styleUrl: './site-actions.css',
})
export class SiteActions {
  protected readonly text = injectText(siteText);
  protected readonly whatsappIcon = lucideMessageCircle;
  protected readonly whatsapp = computed(() =>
    whatsappHref(contactDetails.whatsapp, this.text().contact.whatsappMessage),
  );
}
