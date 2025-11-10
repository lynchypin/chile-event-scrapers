import { CategoryNode } from '../types';

export const initialCategories: CategoryNode[] = [
  {
    name: 'Music',
    color: 'purple',
    subCategories: [
      {
        name: 'Concert',
        color: 'purple',
        subCategories: [
          { name: 'Rock', color: 'purple' },
          { name: 'Pop', color: 'purple' },
          { name: 'Indie', color: 'purple' },
          { name: 'Electronic', color: 'purple' },
        ],
      },
    ],
  },
  {
    name: 'Festivals',
    color: 'green',
    subCategories: [
      {
        name: 'Music Festival',
        color: 'green',
        subCategories: [
          { name: 'Indie', color: 'green' },
          { name: 'Electronic', color: 'green' },
        ],
      },
      { name: 'Cultural Festival', color: 'green' },
    ],
  },
  {
    name: 'Performing Arts',
    color: 'pink',
    subCategories: [
      { name: 'Theater', color: 'pink' },
      { name: 'Comedy', color: 'pink' },
    ],
  },
  {
    name: 'Visual Arts',
    color: 'yellow',
    subCategories: [
      { name: 'Art Exhibit', color: 'yellow' },
    ],
  },
  {
    name: 'Education',
    color: 'blue',
    subCategories: [
      { name: 'Workshop', color: 'blue' },
    ],
  },
  {
    name: 'Family/Kids',
    color: 'orange',
    subCategories: [
      { name: 'Children\'s Theater', color: 'orange' },
      { name: 'Outdoor', color: 'orange' },
      { name: 'Workshop', color: 'orange' },
    ],
  },
];
