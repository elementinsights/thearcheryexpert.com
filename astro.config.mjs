// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

/** Rehype plugin: add loading="lazy" to all images in markdown content */
function rehypeLazyImages() {
  return (tree) => {
    const visit = (node) => {
      if (node.type === 'element' && node.tagName === 'img') {
        node.properties = node.properties || {};
        node.properties.loading = 'lazy';
      }
      if (node.children) node.children.forEach(visit);
    };
    visit(tree);
  };
}

export default defineConfig({
  site: 'https://www.thearcheryexpert.com',

  trailingSlash: 'always',

  build: {
    inlineStylesheets: 'auto',
  },

  vite: {
    build: {
      rollupOptions: {
        output: {
          // Sanitize @ from asset filenames — Cloudflare 307-redirects URLs with @ to %40
          assetFileNames: (assetInfo) => {
            const name = (assetInfo.names?.[0] || assetInfo.name || 'asset').replace(/@/g, '_').replace(/\.[^.]+$/, '');
            return `_astro/${name}.[hash][extname]`;
          },
        },
      },
    },
  },

  markdown: {
    rehypePlugins: [rehypeLazyImages],
  },

  integrations: [sitemap()],

  adapter: cloudflare(),
});
