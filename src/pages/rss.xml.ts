import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig } from '../../site.config';

export async function GET(context: any) {
  const posts = await getCollection('posts', ({ data }) => !data.draft);

  return rss({
    title: siteConfig.name,
    description: siteConfig.tagline,
    site: siteConfig.url,
    trailingSlash: true,
    items: posts
      .sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime())
      .map(post => ({
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.publishDate,
        link: `/${post.id}/`,
      })),
  });
}
