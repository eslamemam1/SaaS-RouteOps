import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageSwitch } from '@routeops/shared/i18n';
@Component({
  imports: [LanguageSwitch, RouterOutlet],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {}
