export interface SubMenuItem {
  labelKey: string;
  href: string;
}

export interface MenuItem {
  labelKey: string;
  href?: string;
  submenu?: SubMenuItem[];
  disabled?: boolean;
}

export const MAIN_MENU: MenuItem[] = [
  {
    labelKey: 'navigation.home',
    href: '/',
  },
  {
    labelKey: 'navigation.festival.label',
    submenu: [
      { labelKey: 'navigation.festival.artists', href: '/artists' },
      { labelKey: 'navigation.festival.registration', href: '/registration' },
      { labelKey: 'navigation.festival.volunteer', href: '/registration/volunteer' },
      { labelKey: 'navigation.festival.codeOfConduct', href: '/code-of-conduct' },
    ],
  },
  {
    labelKey: 'navigation.whatIs.label',
    disabled: true,
    submenu: [
      { labelKey: 'navigation.whatIs.lindyHop', href: '/what-is/lindy-hop' },
      { labelKey: 'navigation.whatIs.exchange', href: '/what-is/exchange' },
      { labelKey: 'navigation.whatIs.queerness', href: '/what-is/queerness' },
      { labelKey: 'navigation.whatIs.vision', href: '/what-is/why-queer-exchange' },
    ],
  },
  {
    labelKey: 'navigation.practical.label',
    submenu: [
      { labelKey: 'navigation.practical.schedule', href: '/schedule' },
      { labelKey: 'navigation.practical.venue', href: '/practical/venue' },
      { labelKey: 'navigation.practical.accommodation', href: '/practical/accommodation' },
      { labelKey: 'navigation.practical.food', href: '/practical/food' },
      { labelKey: 'navigation.practical.transport', href: '/practical/transport' },
      { labelKey: 'navigation.practical.policies', href: '/practical/policies' },
    ],
  },
  {
    labelKey: 'navigation.contact',
    href: '/contact',
  },
];
