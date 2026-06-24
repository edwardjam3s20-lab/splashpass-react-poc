import type { SubPlan } from '../types/database'

export const SUB_PLANS: SubPlan[] = [
  {
    id: 'mini',
    name: 'Mini',
    price: 199,
    billing: 'week',
    car_limit: 1,
    icon: '🚿',
    tagline: 'Get started — 1 car',
    popular: false,
  },
  {
    id: 'individual',
    name: 'Individual',
    price: 499,
    billing: 'month',
    car_limit: 1,
    icon: '👤',
    tagline: 'Perfect for personal use',
    popular: false,
  },
  {
    id: 'duo',
    name: 'Duo',
    price: 999,
    billing: 'month',
    car_limit: 2,
    icon: '👫',
    tagline: 'Great for couples or two cars',
    popular: true,
  },
  {
    id: 'family',
    name: 'Family',
    price: 1999,
    billing: 'month',
    car_limit: 5,
    icon: '👨‍👩‍👧‍👦',
    tagline: 'Covers the whole household',
    popular: false,
  },
]
