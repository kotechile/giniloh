// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

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
    '/tutorials/coffee-beans/': '/calculators/coffee-arbitrage'
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client']
    }
  }
});
