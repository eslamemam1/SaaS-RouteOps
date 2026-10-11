import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  formatDay,
  formatDayWithWeekday,
  formatMonth,
  formatMonthName,
  formatWeekdayShort,
  formatTime,
  formatWeekdayAndDay,
  LanguageService,
} from './language';

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

describe('formatDay', () => {
  it('writes a day with the month name and Latin digits', () => {
    expect(formatDay('2026-10-11', 'ar')).toBe('11 أكتوبر 2026');
    expect(formatDay('2026-10-11', 'en')).toBe('11 October 2026');
  });

  it('leaves an empty or unknown day as it is', () => {
    expect(formatDay('', 'ar')).toBe('');
  });
});

describe('formatDayWithWeekday', () => {
  it('leads the day with its weekday', () => {
    expect(formatDayWithWeekday('2026-10-11', 'ar')).toBe(
      'الأحد، 11 أكتوبر 2026',
    );
    expect(formatDayWithWeekday('2026-10-11', 'en')).toBe(
      'Sunday, 11 October 2026',
    );
  });
});

describe('formatWeekdayAndDay', () => {
  it('writes the weekday and the day of the month only', () => {
    expect(formatWeekdayAndDay('2026-10-11', 'ar')).toBe('الأحد، 11');
    expect(formatWeekdayAndDay('2026-10-11', 'en')).toBe('Sunday 11');
  });
});

describe('formatMonth', () => {
  it('writes a month with its name and year', () => {
    expect(formatMonth('2026-10', 'ar')).toBe('أكتوبر 2026');
    expect(formatMonth('2026-10', 'en')).toBe('October 2026');
  });

  it('leaves an unknown month as it is', () => {
    expect(formatMonth('2026-13-01', 'ar')).toBe('2026-13-01');
  });
});

describe('formatMonthName', () => {
  it('writes only the name of a month', () => {
    expect(formatMonthName('2026-10', 'ar')).toBe('أكتوبر');
    expect(formatMonthName('2026-01', 'en')).toBe('January');
  });
});

describe('formatWeekdayShort', () => {
  it('writes a weekday short enough to head a calendar column', () => {
    expect(formatWeekdayShort('2026-10-10', 'ar')).toBe('س');
    expect(formatWeekdayShort('2026-10-10', 'en')).toBe('Sat');
  });
});

describe('formatTime', () => {
  it('writes a time on a 12-hour clock', () => {
    expect(formatTime('07:30', 'ar')).toBe('7:30 ص');
    expect(formatTime('13:05:00', 'ar')).toBe('1:05 م');
    expect(formatTime('00:15', 'en')).toBe('12:15 AM');
    expect(formatTime('12:00', 'en')).toBe('12:00 PM');
    expect(formatTime('23:59', 'en')).toBe('11:59 PM');
  });

  it('leaves an empty or unknown time as it is', () => {
    expect(formatTime('', 'ar')).toBe('');
    expect(formatTime('7am', 'en')).toBe('7am');
  });
});
