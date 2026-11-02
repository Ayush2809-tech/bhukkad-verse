import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BhukkadVerse - Your Cravings, Your Universe',
    short_name: 'BhukkadVerse',
    description: 'Hyperlocal food discovery marketplace with fair 4-way economics and cinematic culinary storytelling.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090B',
    theme_color: '#FF5200',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/maskable-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

