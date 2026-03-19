import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    postType: z.enum([
      'roundup', 'listicle', 'review', 'guide',
      'how-to', 'comparison', 'buyers-guide'
    ]).default('guide'),
    author: z.string().optional(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    readTime: z.string().optional(),
    draft: z.boolean().default(false),

    // Quick answer box
    quickAnswer: z.object({
      label: z.string().optional(),
      title: z.string(),
      text: z.string(),
      ctaText: z.string().optional(),
      ctaUrl: z.string().optional(),
    }).optional(),

    // FAQ
    faq: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional(),

    // Table of contents
    toc: z.array(z.object({
      label: z.string(),
      href: z.string(),
    })).optional(),

    // Quick facts (for listicle sidebar)
    quickFacts: z.array(z.object({
      value: z.string(),
      label: z.string(),
    })).optional(),

    // Final Thoughts (rendered after FAQ, no JS needed)
    finalThoughts: z.string().optional(),

    // Checklist (for how-to sidebar)
    checklist: z.array(z.object({
      heading: z.string(),
      items: z.array(z.string()),
    })).optional(),

    // Chapters (for guide sidebar)
    chapters: z.array(z.object({
      label: z.string(),
      href: z.string(),
      readTime: z.string().optional(),
    })).optional(),

    // Verdict summary (for comparison sidebar — optional, auto-generated if omitted)
    verdict: z.string().optional(),

    // Alternatives (for review sidebar)
    alternatives: z.array(z.object({
      name: z.string(),
      image: z.string(),
      rating: z.string(),
      vsUrl: z.string().optional(),
    })).optional(),

    // Products (for roundup/review)
    products: z.array(z.object({
      name: z.string(),
      rank: z.number().optional(),
      image: z.string().optional(),
      rating: z.number().optional(),
      description: z.string().optional(),
      highlights: z.array(z.string()).optional(),
      pros: z.array(z.string()).optional(),
      cons: z.array(z.string()).optional(),
      ctaText: z.string().optional(),
      ctaUrl: z.string().optional(),
      badge: z.string().optional(),
      reviewCount: z.number().optional(),
    })).optional(),
  }),
});

export const collections = { posts };
