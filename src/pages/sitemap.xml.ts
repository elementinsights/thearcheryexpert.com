import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { siteConfig } from '../../site.config';

export const prerender = true;

export const GET: APIRoute = async () => {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const site = siteConfig.url;

  const today = new Date().toISOString().split('T')[0];

  // Static pages
  const staticPages = [
    { path: '', lastmod: today },
    { path: '/about/', lastmod: today },
    { path: '/contact/', lastmod: today },
    { path: '/start-here/', lastmod: today },
    { path: '/privacy-policy/', lastmod: today },
    { path: '/disclosure/', lastmod: today },
    { path: '/terms/', lastmod: today },
  ];

  // Category pages
  const categoryPages = siteConfig.categories.map(
    (cat: { slug: string }) => ({ path: `/category/${cat.slug}/`, lastmod: today })
  );

  // Post pages with actual lastmod dates
  const postPages = posts.map((post) => ({
    path: `/${post.id}/`,
    lastmod: (post.data.updatedDate || post.data.publishDate).toISOString().split('T')[0],
  }));

  const allPages = [...staticPages, ...categoryPages, ...postPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${site}${page.path}</loc>
    <lastmod>${page.lastmod}</lastmod>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
