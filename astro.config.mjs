// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? 'https://giniloh.com',
  redirects: {
    '/home/about-us': '/about',
    '/home/about-us/': '/about',
    '/home/career': '/calculators/career-ai-resilience',
    '/home/career/': '/calculators/career-ai-resilience',
    '/tutorials/espresso-dial-in': '/calculators/coffee-arbitrage',
    '/tutorials/espresso-dial-in/': '/calculators/coffee-arbitrage',
    '/tutorials/coffee-beans': '/calculators/coffee-arbitrage',
    '/tutorials/coffee-beans/': '/calculators/coffee-arbitrage',
    '/apps': 'https://apps.giniloh.com/showcase',
    '/apps/': 'https://apps.giniloh.com/showcase',
    '/showcase': 'https://apps.giniloh.com/showcase',
    '/showcase/': 'https://apps.giniloh.com/showcase',
    '/pro-apps': 'https://apps.giniloh.com/showcase',
    '/pro-apps/': 'https://apps.giniloh.com/showcase'
  },
  integrations: [
    react(),
    sitemap({
      // Lowercase product paths only: the capitalised ones this list used to carry answered 404
      // (Next routes are case-sensitive), and the bare origin 307s to giniloh.com.
      customPages: [
        'https://apps.giniloh.com/showcase',
        'https://apps.giniloh.com/ledgerlink',
        'https://apps.giniloh.com/facturgate',
        'https://apps.giniloh.com/parcelproof',
        'https://apps.giniloh.com/caseproof',
        'https://apps.giniloh.com/spendproof'
      ]
    })
  ],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client']
    }
  }
});
