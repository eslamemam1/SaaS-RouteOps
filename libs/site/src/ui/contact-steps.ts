import { Component } from '@angular/core';
import { injectText } from '@routeops/shared/i18n';
import { siteText } from './site-text';

@Component({
  selector: 'app-contact-steps',
  template: `
    <div class="contact-titles">
      <h2 id="contact-account">{{ text().contact.accountTitle }}</h2>
      <p class="hint">{{ text().contact.accountHint }}</p>
    </div>
    <ol class="contact-steps">
      @for (step of text().contact.accountSteps; track step; let index = $index) {
        <li>
          <span class="contact-stop" aria-hidden="true">{{ index + 1 }}</span>
          <p class="contact-step-text">{{ step }}</p>
        </li>
      }
    </ol>
  `,
  styleUrl: './contact-steps.css',
  host: { role: 'region', 'aria-labelledby': 'contact-account' },
})
export class ContactSteps {
  protected readonly text = injectText(siteText);
}
