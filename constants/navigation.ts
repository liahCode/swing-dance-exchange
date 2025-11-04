export interface SubMenuItem {
  label: string;
  href: string;
}

export interface MenuItem {
  label: string;
  href?: string;
  submenu?: SubMenuItem[];
}

export const MAIN_MENU: MenuItem[] = [
  {
    label: 'Home',
    href: '/',
  },
  {
    label: 'Schedule',
    href: '/schedule',
  },
  {
    label: 'Artists',
    href: '/artists',
  },
  {
    label: 'Practical',
    submenu: [
      { label: 'Venue', href: '/practical/venue' },
      { label: 'Accommodation', href: '/practical/accommodation' },
      { label: 'Food', href: '/practical/food' },
      { label: 'Transport', href: '/practical/transport' },
      { label: 'Policies', href: '/practical/policies' },
    ],
  },
  {
    label: 'About the Festival',
    submenu: [
      { label: 'History', href: '/about/history' },
      { label: 'Mission', href: '/about/mission' },
      { label: 'Team', href: '/about/team' },
      { label: 'Community', href: '/about/community' },
    ],
  },
  {
    label: 'Registration',
    submenu: [
      { label: 'Ticket Types', href: '/registration/ticket-types' },
      { label: 'Payment', href: '/registration/payment' },
      { label: 'Volunteer', href: '/registration/volunteer' },
    ],
  },
  {
    label: 'Code of Conduct',
    href: '/code-of-conduct',
  },
  {
    label: 'Contact',
    href: '/contact',
  },
];
