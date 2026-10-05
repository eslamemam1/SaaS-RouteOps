import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language';

describe('LanguageService', () => {
  beforeEach(() => localStorage.clear());

  it('starts in Arabic, right to left', () => {
    TestBed.inject(LanguageService);
    const root = TestBed.inject(DOCUMENT).documentElement;

    expect(root.lang).toBe('ar');
    expect(root.dir).toBe('rtl');
    expect(TestBed.inject(DOCUMENT).title).toBe('حركة');
  });

  it('switches the page to English, left to right, and remembers the choice', () => {
    TestBed.inject(LanguageService).setLanguage('en');
    const root = TestBed.inject(DOCUMENT).documentElement;

    expect(root.lang).toBe('en');
    expect(root.dir).toBe('ltr');
    expect(TestBed.inject(DOCUMENT).title).toBe('Haraka');
    expect(localStorage.getItem('routeops.language')).toBe('en');
  });

  it('restores the remembered language', () => {
    localStorage.setItem('routeops.language', 'en');

    expect(TestBed.inject(LanguageService).language()).toBe('en');
  });

  it('ignores an unknown remembered value', () => {
    localStorage.setItem('routeops.language', 'fr');

    expect(TestBed.inject(LanguageService).language()).toBe('ar');
  });
});
