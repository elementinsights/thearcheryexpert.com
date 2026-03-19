#!/usr/bin/env node

/**
 * WordPress XML to Astro Markdown Import Script
 *
 * Usage: node scripts/import-wp.mjs path/to/export.xml
 *
 * Converts published WordPress posts into .md files with Astro-compatible
 * frontmatter. Outputs to src/content/posts/.
 *
 * Zero external dependencies — uses only Node.js built-in modules.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..");
const OUTPUT_DIR = resolve(PROJECT_ROOT, "src/content/posts");

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const xmlPath = process.argv[2];
if (!xmlPath) {
  console.error("Usage: node scripts/import-wp.mjs <wordpress-export.xml>");
  process.exit(1);
}

const resolvedXmlPath = resolve(xmlPath);
if (!existsSync(resolvedXmlPath)) {
  console.error(`File not found: ${resolvedXmlPath}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// XML helpers (no dependencies)
// ---------------------------------------------------------------------------

/**
 * Strip CDATA wrappers: <![CDATA[...]]>  →  ...
 */
function stripCDATA(str) {
  return str.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1");
}

/**
 * Get the text content of a tag. Handles CDATA and returns empty string if
 * the tag is not found. `tag` can include a namespace prefix like
 * "content:encoded" — we escape the colon for the regex.
 */
function getTagContent(xml, tag) {
  // Escape special regex chars in tag name (the colon in namespaced tags)
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)</${escaped}>`, "i");
  const m = xml.match(re);
  if (!m) return "";
  return stripCDATA(m[1]).trim();
}

/**
 * Get ALL matches for a tag (useful for <category>).
 * Returns an array of the inner text values.
 */
function getAllTagContents(xml, tag, attrFilter) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let pattern;
  if (attrFilter) {
    // e.g. domain="category"
    pattern = `<${escaped}[^>]*${attrFilter}[^>]*>([\\s\\S]*?)</${escaped}>`;
  } else {
    pattern = `<${escaped}[^>]*>([\\s\\S]*?)</${escaped}>`;
  }
  const re = new RegExp(pattern, "gi");
  const results = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    results.push(stripCDATA(m[1]).trim());
  }
  return results;
}

/**
 * Extract all <item>...</item> blocks from the XML.
 */
function extractItems(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    items.push(m[1]);
  }
  return items;
}

// ---------------------------------------------------------------------------
// HTML → Markdown converter
// ---------------------------------------------------------------------------

function htmlToMarkdown(html) {
  if (!html) return "";

  let md = html;

  // Normalize line endings
  md = md.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // ----- Block-level elements -----

  // Headings h1-h6
  for (let level = 6; level >= 1; level--) {
    const hashes = "#".repeat(level);
    const re = new RegExp(
      `<h${level}[^>]*>([\\s\\S]*?)<\\/h${level}>`,
      "gi"
    );
    md = md.replace(re, (_match, inner) => {
      return `\n\n${hashes} ${cleanInline(inner).trim()}\n\n`;
    });
  }

  // Blockquote — handle before paragraphs
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, inner) => {
    // Strip inner <p> tags so the content stays inside the blockquote
    const stripped = inner
      .replace(/<p[^>]*>/gi, "")
      .replace(/<\/p>/gi, "\n");
    const lines = cleanInline(stripped)
      .trim()
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .map((l) => `> ${l}`);
    return "\n\n" + lines.join("\n") + "\n\n";
  });

  // Ordered lists — must come before unordered to handle nested
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_m, inner) => {
    let idx = 0;
    const items = [];
    const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let liM;
    while ((liM = liRe.exec(inner)) !== null) {
      idx++;
      items.push(`${idx}. ${cleanInline(liM[1]).trim()}`);
    }
    return "\n\n" + items.join("\n") + "\n\n";
  });

  // Unordered lists
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_m, inner) => {
    const items = [];
    const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let liM;
    while ((liM = liRe.exec(inner)) !== null) {
      items.push(`- ${cleanInline(liM[1]).trim()}`);
    }
    return "\n\n" + items.join("\n") + "\n\n";
  });

  // Preformatted / code blocks
  md = md.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_m, inner) => {
    const code = inner.replace(/<code[^>]*>/gi, "").replace(/<\/code>/gi, "");
    return "\n\n```\n" + decodeEntities(code).trim() + "\n```\n\n";
  });

  // Figures (often wrap images in WordPress)
  md = md.replace(/<figure[^>]*>([\s\S]*?)<\/figure>/gi, (_m, inner) => {
    // Try to find the image inside
    const imgMatch = inner.match(/<img[^>]*>/i);
    if (imgMatch) {
      return "\n\n" + convertImg(imgMatch[0]) + "\n\n";
    }
    return "\n\n" + cleanInline(inner).trim() + "\n\n";
  });

  // Paragraphs
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, inner) => {
    return "\n\n" + cleanInline(inner).trim() + "\n\n";
  });

  // Divs — just unwrap
  md = md.replace(/<\/?div[^>]*>/gi, "\n\n");

  // Horizontal rules
  md = md.replace(/<hr[^>]*\/?>/gi, "\n\n---\n\n");

  // Line breaks
  md = md.replace(/<br\s*\/?>/gi, "  \n");

  // ----- Inline conversions that may still remain outside <p> -----
  md = cleanInline(md);

  // ----- Strip any remaining HTML tags -----
  md = md.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  md = decodeEntities(md);

  // Collapse excessive blank lines to max 2
  md = md.replace(/\n{3,}/g, "\n\n");

  return md.trim() + "\n";
}

/**
 * Convert inline HTML elements to Markdown equivalents.
 */
function cleanInline(html) {
  let s = html;

  // Images (self-closing or not)
  s = s.replace(/<img[^>]*>/gi, (tag) => convertImg(tag));

  // Links
  s = s.replace(
    /<a\s[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_m, href, text) => {
      const clean = text.replace(/<[^>]+>/g, "").trim();
      return `[${clean}](${href})`;
    }
  );

  // Bold
  s = s.replace(/<(strong|b)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi, (_m, _t, _a, inner) => `**${inner.trim()}**`);

  // Italic
  s = s.replace(/<(em|i)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi, (_m, _t, _a, inner) => `*${inner.trim()}*`);

  // Inline code
  s = s.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m, inner) => `\`${inner.trim()}\``);

  // Strikethrough
  s = s.replace(/<(del|s|strike)[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, inner) => `~~${inner.trim()}~~`);

  return s;
}

/**
 * Convert an <img> tag string to Markdown image syntax.
 */
function convertImg(imgTag) {
  const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
  const altMatch = imgTag.match(/alt=["']([^"']*?)["']/i);
  const src = srcMatch ? srcMatch[1] : "";
  const alt = altMatch ? altMatch[1] : "";
  return `![${alt}](${src})`;
}

/**
 * Decode common HTML entities.
 */
function decodeEntities(str) {
  const entities = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
    "&mdash;": "\u2014",
    "&ndash;": "\u2013",
    "&lsquo;": "\u2018",
    "&rsquo;": "\u2019",
    "&ldquo;": "\u201C",
    "&rdquo;": "\u201D",
    "&hellip;": "\u2026",
    "&copy;": "\u00A9",
    "&reg;": "\u00AE",
    "&trade;": "\u2122",
    "&bull;": "\u2022",
    "&middot;": "\u00B7",
    "&frac12;": "\u00BD",
    "&frac14;": "\u00BC",
    "&frac34;": "\u00BE",
    "&times;": "\u00D7",
    "&divide;": "\u00F7",
  };
  let result = str;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.split(entity).join(char);
  }
  // Numeric entities: &#123; or &#x1F;
  result = result.replace(/&#(\d+);/g, (_m, code) =>
    String.fromCharCode(parseInt(code, 10))
  );
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_m, code) =>
    String.fromCharCode(parseInt(code, 16))
  );
  return result;
}

// ---------------------------------------------------------------------------
// Read-time calculation
// ---------------------------------------------------------------------------

function calcReadTime(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

// ---------------------------------------------------------------------------
// Generate description from content
// ---------------------------------------------------------------------------

function makeDescription(text) {
  // Take the first meaningful paragraph text, strip markdown formatting
  const plain = text
    .replace(/^#+\s.*/gm, "") // remove headings
    .replace(/!\[.*?\]\(.*?\)/g, "") // remove images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → text
    .replace(/[*_~`]/g, "") // remove emphasis markers
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plain) return "";
  if (plain.length <= 160) return plain;
  // Cut at last word boundary before 160 chars
  const cut = plain.slice(0, 160);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim();
}

// ---------------------------------------------------------------------------
// Escape YAML string
// ---------------------------------------------------------------------------

function yamlString(str) {
  // Always double-quote and escape inner double quotes and backslashes
  const escaped = str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

// ---------------------------------------------------------------------------
// Slugify fallback (in case wp:post_name is empty)
// ---------------------------------------------------------------------------

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// Format date as YYYY-MM-DD
// ---------------------------------------------------------------------------

function formatDate(dateStr) {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const xml = readFileSync(resolvedXmlPath, "utf-8");
  const items = extractItems(xml);

  console.log(`Found ${items.length} total items in XML export.\n`);

  // Ensure output directory exists
  mkdirSync(OUTPUT_DIR, { recursive: true });

  let imported = 0;
  let skipped = 0;
  const skippedReasons = [];

  for (const item of items) {
    const title = decodeEntities(getTagContent(item, "title"));
    const postType = getTagContent(item, "wp:post_type");
    const status = getTagContent(item, "wp:status");

    // Skip non-posts
    if (postType !== "post") {
      skipped++;
      skippedReasons.push(
        `  SKIP: "${title || "(no title)"}" — type "${postType || "unknown"}"`
      );
      continue;
    }

    // Skip non-published
    if (status !== "publish") {
      skipped++;
      skippedReasons.push(
        `  SKIP: "${title || "(no title)"}" — status "${status || "unknown"}"`
      );
      continue;
    }

    // Extract fields
    let slug = getTagContent(item, "wp:post_name");
    if (!slug) slug = slugify(title);
    if (!slug) slug = `post-${imported + 1}`;

    const pubDate = getTagContent(item, "pubDate") || getTagContent(item, "wp:post_date");
    const dateFormatted = formatDate(pubDate);

    const htmlContent = getTagContent(item, "content:encoded");
    const excerpt = getTagContent(item, "excerpt:encoded");

    // Categories (domain="category")
    const categories = getAllTagContents(item, "category", 'domain="category"')
      .map((c) => decodeEntities(c));
    const primaryCategory = categories.length > 0 ? categories[0] : "Uncategorized";

    // Convert content
    const markdownBody = htmlToMarkdown(htmlContent);

    // Description: use excerpt if available, otherwise derive from content
    let description = "";
    if (excerpt) {
      const plainExcerpt = decodeEntities(
        excerpt.replace(/<[^>]+>/g, "")
      )
        .replace(/\s+/g, " ")
        .trim();
      description =
        plainExcerpt.length <= 160
          ? plainExcerpt
          : plainExcerpt.slice(0, 157).trim() + "...";
    } else {
      description = makeDescription(markdownBody);
    }

    // Read time
    const readTime = calcReadTime(markdownBody);

    // Build frontmatter
    const frontmatter = [
      "---",
      `title: ${yamlString(title)}`,
      `description: ${yamlString(description)}`,
      `category: ${yamlString(primaryCategory)}`,
      `postType: "guide"`,
      `publishDate: ${dateFormatted}`,
      `image: ""`,
      `imageAlt: ""`,
      `readTime: ${yamlString(readTime)}`,
      "---",
    ].join("\n");

    const fileContent = frontmatter + "\n\n" + markdownBody;
    const filename = `${slug}.md`;
    const filepath = resolve(OUTPUT_DIR, filename);

    writeFileSync(filepath, fileContent, "utf-8");
    imported++;
    console.log(`  OK: ${filename}  (${readTime})`);
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log(`Import complete.`);
  console.log(`  Imported: ${imported} posts`);
  console.log(`  Skipped:  ${skipped} items`);
  console.log(`  Output:   ${OUTPUT_DIR}/`);

  if (skippedReasons.length > 0) {
    console.log("\nSkipped items:");
    for (const reason of skippedReasons) {
      console.log(reason);
    }
  }
}

main();
