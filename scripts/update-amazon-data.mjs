#!/usr/bin/env node
/**
 * update-amazon-data.mjs
 *
 * Fetches current product images from Amazon PA-API 5.0
 * and updates the frontmatter in all post markdown files.
 *
 * Usage: AMAZON_ACCESS_KEY=xxx AMAZON_SECRET_KEY=xxx node scripts/update-amazon-data.mjs
 *
 * Run before each deploy to keep Amazon data fresh.
 */

import { createHmac, createHash } from 'crypto';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import https from 'https';

// Config
const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG || '';
const ACCESS_KEY = process.env.AMAZON_ACCESS_KEY || '';
const SECRET_KEY = process.env.AMAZON_SECRET_KEY || '';
const HOST = 'webservices.amazon.com';
const REGION = 'us-east-1';
const SERVICE = 'ProductAdvertisingAPI';
const PATH = '/paapi5/getitems';

if (!ACCESS_KEY || !SECRET_KEY) {
  console.error('Missing AMAZON_ACCESS_KEY or AMAZON_SECRET_KEY env vars');
  process.exit(1);
}
if (!PARTNER_TAG) {
  console.error('Missing AMAZON_PARTNER_TAG env var (e.g., thewaternerd03-20)');
  process.exit(1);
}

// AWS Signature V4 helpers
function hmacSHA256(key, data) {
  return createHmac('sha256', key).update(data).digest();
}

function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

function getSignatureKey(key, dateStamp, region, service) {
  const kDate = hmacSHA256('AWS4' + key, dateStamp);
  const kRegion = hmacSHA256(kDate, region);
  const kService = hmacSHA256(kRegion, service);
  return hmacSHA256(kService, 'aws4_request');
}

function signRequest(payload) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substring(0, 8);

  const headers = {
    'content-encoding': 'amz-1.0',
    'content-type': 'application/json; charset=utf-8',
    'host': HOST,
    'x-amz-date': amzDate,
    'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems',
  };

  const signedHeaders = Object.keys(headers).sort().join(';');
  const canonicalHeaders = Object.keys(headers).sort()
    .map(k => `${k}:${headers[k]}\n`).join('');

  const payloadHash = sha256(payload);
  const canonicalRequest = `POST\n${PATH}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${sha256(canonicalRequest)}`;

  const signingKey = getSignatureKey(SECRET_KEY, dateStamp, REGION, SERVICE);
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');

  const authHeader = `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return { ...headers, 'authorization': authHeader };
}

function paapiFetch(asins) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      ItemIds: asins,
      Resources: [
        'Images.Primary.Large',
      ],
      PartnerTag: PARTNER_TAG,
      PartnerType: 'Associates',
      Marketplace: 'www.amazon.com',
    });

    const headers = signRequest(payload);

    const options = {
      hostname: HOST,
      path: PATH,
      method: 'POST',
      headers,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`PA-API returned ${res.statusCode}: ${data}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Extract ASINs from post frontmatter
function extractAsins(content) {
  const asins = new Set();
  // Match ctaUrl with Amazon dp links
  const dpPattern = /amazon\.com\/dp\/([A-Z0-9]{10})/g;
  let match;
  while ((match = dpPattern.exec(content)) !== null) {
    asins.add(match[1]);
  }
  return [...asins];
}

// Parse frontmatter products array to map ASINs to product indices
function parseProductAsins(content) {
  const products = [];
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return products;

  const fm = fmMatch[1];
  // Find products in frontmatter and extract ASIN from ctaUrl
  const productBlocks = fm.split(/\n  - name:/);
  for (let i = 1; i < productBlocks.length; i++) {
    const block = productBlocks[i];
    const nameMatch = block.match(/^\s*"(.+?)"/);
    const asinMatch = block.match(/amazon\.com\/dp\/([A-Z0-9]{10})/);
    const imageMatch = block.match(/image:\s*"(.+?)"/);
    if (nameMatch && asinMatch) {
      products.push({
        name: nameMatch[1],
        asin: asinMatch[1],
        currentImage: imageMatch ? imageMatch[1] : null,
        blockIndex: i,
      });
    }
  }
  return products;
}

// Update frontmatter with new Amazon data (images only — ratings are editorial)
function updateFrontmatter(content, updates) {
  let updated = content;
  for (const { asin, newImage } of updates) {
    if (newImage) {
      // Find the product block containing this ASIN and update its image
      // Look for image field near the ASIN
      const blocks = updated.split(/\n  - name:/);
      for (let i = 1; i < blocks.length; i++) {
        if (blocks[i].includes(asin)) {
          const oldImage = blocks[i].match(/image:\s*"(.+?)"/);
          if (oldImage && oldImage[1].includes('media-amazon.com')) {
            blocks[i] = blocks[i].replace(
              `image: "${oldImage[1]}"`,
              `image: "${newImage}"`,
            );
          }
          break;
        }
      }
      updated = blocks.join('\n  - name:');
    }
  }
  return updated;
}

async function main() {
  const postsDir = join(process.cwd(), 'src', 'content', 'posts');
  let files;
  try {
    files = readdirSync(postsDir).filter(f => f.endsWith('.md'));
  } catch (e) {
    console.error(`Cannot read posts directory: ${postsDir}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} posts`);

  // Collect all ASINs across all posts
  const asinToFiles = new Map(); // ASIN -> [{ file, products }]
  const allAsins = new Set();

  for (const file of files) {
    const filepath = join(postsDir, file);
    const content = readFileSync(filepath, 'utf-8');
    const products = parseProductAsins(content);
    for (const p of products) {
      allAsins.add(p.asin);
      if (!asinToFiles.has(p.asin)) asinToFiles.set(p.asin, []);
      asinToFiles.get(p.asin).push({ file, filepath });
    }
  }

  const asinList = [...allAsins];
  console.log(`Found ${asinList.length} unique ASINs`);

  if (asinList.length === 0) {
    console.log('No ASINs found, nothing to update.');
    return;
  }

  // Batch PA-API requests (max 10 per request)
  const asinData = new Map();
  for (let i = 0; i < asinList.length; i += 10) {
    const batch = asinList.slice(i, i + 10);
    console.log(`Fetching batch ${Math.floor(i / 10) + 1}: ${batch.join(', ')}`);
    try {
      const response = await paapiFetch(batch);
      if (response.ItemsResult && response.ItemsResult.Items) {
        for (const item of response.ItemsResult.Items) {
          const data = {
            asin: item.ASIN,
            image: item.Images?.Primary?.Large?.URL || null,
          };
          asinData.set(item.ASIN, data);
          console.log(`  ${item.ASIN}: image=${data.image ? 'yes' : 'no'}`);
        }
      }
      if (response.Errors) {
        for (const err of response.Errors) {
          console.warn(`  Error: ${err.Code} - ${err.Message}`);
        }
      }
    } catch (e) {
      console.error(`  Batch failed: ${e.message}`);
    }

    // PA-API rate limit: 1 request per second
    if (i + 10 < asinList.length) {
      await new Promise(r => setTimeout(r, 1100));
    }
  }

  // Update each post file
  let totalUpdated = 0;
  for (const file of files) {
    const filepath = join(postsDir, file);
    let content = readFileSync(filepath, 'utf-8');
    const products = parseProductAsins(content);

    if (products.length === 0) continue;

    const updates = [];
    for (const p of products) {
      const data = asinData.get(p.asin);
      if (!data) continue;

      const update = { asin: p.asin, newImage: null };

      if (data.image && data.image !== p.currentImage && p.currentImage?.includes('media-amazon.com')) {
        update.newImage = data.image;
        console.log(`  ${file}: ${p.name} image updated`);
        updates.push(update);
      }
    }

    if (updates.length > 0) {
      content = updateFrontmatter(content, updates);
      writeFileSync(filepath, content, 'utf-8');
      totalUpdated += updates.length;
    }
  }

  console.log(`\nDone. Updated ${totalUpdated} product(s) across ${files.length} posts.`);
  console.log('Images will be rendered from updated frontmatter at build time.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
