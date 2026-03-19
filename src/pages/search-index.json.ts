import { getCollection } from 'astro:content';

export const prerender = true;

export async function GET() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);

  const index = posts.map(post => ({
    title: post.data.title,
    description: post.data.description,
    category: post.data.category,
    slug: post.id,
    date: post.data.publishDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
  }));

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
}
