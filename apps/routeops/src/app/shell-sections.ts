import {
  lucideBuilding2,
  lucideBus,
  lucideCalendarDays,
  lucideChartColumn,
  lucideIdCard,
  lucideRoute,
} from '@ng-icons/lucide';

export const shellSections = [
  { path: 'operations', icon: lucideCalendarDays },
  { path: 'routes', icon: lucideRoute },
  { path: 'customers', icon: lucideBuilding2 },
  { path: 'vehicles', icon: lucideBus },
  { path: 'drivers', icon: lucideIdCard },
  { path: 'reports', icon: lucideChartColumn },
] as const;

export type ShellSection = (typeof shellSections)[number]['path'];
