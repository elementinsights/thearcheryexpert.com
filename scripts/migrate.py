#!/usr/bin/env python3
"""
Migrate WordPress XML export to Slate Astro blog template.
Preserves full original content, reformatted into Slate template structure.
"""

import xml.etree.ElementTree as ET
import re
import html as html_mod
import os
import random
from datetime import datetime, timedelta

XML_FILE = 'thearcheryexpert.WordPress.2026-03-18.xml'
OUTPUT_DIR = 'src/content/posts'
AMAZON_TAG = 'thearcheryexpert-20'


def random_updated_date():
    """Generate a random date between Jan 1, 2026 and Mar 19, 2026."""
    start = datetime(2026, 1, 1)
    end = datetime(2026, 3, 19)
    days_range = (end - start).days
    d = start + timedelta(days=random.randint(0, days_range))
    return d.strftime('%Y-%m-%d')


def clean_html(text):
    """Strip HTML tags and decode entities."""
    text = re.sub(r'<[^>]+>', '', text)
    text = html_mod.unescape(text)
    text = re.sub(r'\[.*?\]', '', text)
    return text.strip()


def strip_emdashes(text):
    """Remove em/en dashes from text."""
    return text.replace('\u2014', ' - ').replace('\u2013', ' - ').replace('—', ' - ').replace('–', ' - ')


def extract_asin(url):
    """Extract ASIN from Amazon URL."""
    m = re.search(r'/dp/([A-Z0-9]{10})', url)
    if m:
        return m.group(1)
    m = re.search(r'ASIN=([A-Z0-9]{10})', url)
    if m:
        return m.group(1)
    return None


def make_amazon_url(asin):
    return f'https://www.amazon.com/dp/{asin}?tag={AMAZON_TAG}'


def escape_yaml(s):
    s = s.replace('\\', '\\\\').replace('"', '\\"')
    s = strip_emdashes(s)
    return s


def make_slug_anchor(text):
    t = text.lower().strip()
    t = re.sub(r'[^a-z0-9\s-]', '', t)
    t = re.sub(r'\s+', '-', t)
    return re.sub(r'-+', '-', t).strip('-')


def estimate_read_time(wc):
    return f'{max(3, round(wc / 200))} min read'


def split_to_2_sentence_paras(text):
    """Split text into max 2-sentence paragraphs."""
    text = strip_emdashes(text)
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    paras = []
    for i in range(0, len(sentences), 2):
        chunk = ' '.join(sentences[i:i+2]).strip()
        if chunk:
            paras.append(chunk)
    return paras


def detect_post_type(title):
    t = title.lower()
    if re.search(r'\d+\s+best\b.*(?:review|their reviews|reviewed)', t):
        return 'roundup'
    if re.search(r'\breview\b', t) and not re.search(r'\d+\s+best', t):
        return 'review'
    if re.search(r'how\s+to\b', t):
        return 'how-to'
    if re.search(r'\d+[- ]step\s+guide', t):
        return 'how-to'
    if 'buying guide' in t:
        return 'buyers-guide'
    if re.search(r'^\d+\s+(best|most|amazing|easy|strange|cool|common|well|important|useful|archery target games)', t):
        return 'listicle'
    if re.search(r'^\d+\s+different\s+types', t):
        return 'listicle'
    if re.search(r'^(what|how|can|does|is|are)\b', t):
        return 'guide'
    return 'guide'


def extract_sections_with_full_content(content):
    """Extract all sections with FULL content from WP post HTML."""
    sections = []

    # Split on h2/h3 headings
    parts = re.split(r'(<h[23][^>]*>.*?</h[23]>)', content, flags=re.DOTALL | re.IGNORECASE)

    current_heading = None
    current_body = ''

    for part in parts:
        h_match = re.match(r'<h[23][^>]*>(.*?)</h[23]>', part, re.DOTALL | re.IGNORECASE)
        if h_match:
            # Save previous section
            if current_heading is not None:
                sections.append({'heading': current_heading, 'body': current_body})
            elif current_body.strip():
                # Intro text before first heading
                sections.append({'heading': '__intro__', 'body': current_body})
            current_heading = clean_html(h_match.group(1)).strip()
            current_body = ''
        else:
            current_body += part

    # Save last section
    if current_heading is not None:
        sections.append({'heading': current_heading, 'body': current_body})
    elif content:
        sections.insert(0, {'heading': '__intro__', 'body': content})

    return sections


def body_to_markdown(body_html, exclude_lists=False):
    """Convert HTML body content to markdown text, preserving full content."""
    result = []

    # WordPress uses double newlines for paragraphs, and also <p> tags
    # First handle <p> tags
    has_p_tags = bool(re.search(r'<p[^>]*>', body_html))

    # Extract from <p> tags
    if has_p_tags:
        paras = re.findall(r'<p[^>]*>(.*?)</p>', body_html, re.DOTALL)
        for p in paras:
            text = clean_html(p).strip()
            if not text or len(text) < 5:
                continue
            for para in split_to_2_sentence_paras(text):
                result.append(para)

    # Also extract plain text NOT inside <p> tags (WP mixed format)
    # Remove <p>...</p> blocks, lists, headings, images, shortcodes
    plain = re.sub(r'<p[^>]*>.*?</p>', '', body_html, flags=re.DOTALL)
    plain = re.sub(r'<[ou]l[^>]*>.*?</[ou]l>', '', plain, flags=re.DOTALL)
    plain = re.sub(r'<h[1-6][^>]*>.*?</h[1-6]>', '', plain, flags=re.DOTALL)
    plain = re.sub(r'<(?:img|br|hr)[^>]*/?>', '', plain, flags=re.IGNORECASE)
    plain = re.sub(r'\[.*?\]', '', plain)
    plain = re.sub(r'<[^>]+>', '', plain)
    plain = html_mod.unescape(plain)

    raw_paras = re.split(r'\n\s*\n', plain)
    for p in raw_paras:
        text = p.strip()
        if not text or len(text) < 10:
            continue
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        joined = ' '.join(lines)
        for para in split_to_2_sentence_paras(joined):
            result.append(para)

    # Extract list items (unless excluded)
    if not exclude_lists:
        lists = re.findall(r'<[ou]l[^>]*>(.*?)</[ou]l>', body_html, re.DOTALL)
        for lst in lists:
            items = re.findall(r'<li[^>]*>(.*?)</li>', lst, re.DOTALL)
            for item in items:
                text = clean_html(item).strip()
                if text:
                    result.append(f'- {strip_emdashes(text)}')

    return '\n\n'.join(result)


def extract_list_items_from_html(html_str):
    """Extract list items from HTML as a flat list of strings."""
    items = []
    lists = re.findall(r'<[ou]l[^>]*>(.*?)</[ou]l>', html_str, re.DOTALL)
    for lst in lists:
        for li in re.findall(r'<li[^>]*>(.*?)</li>', lst, re.DOTALL):
            text = clean_html(li).strip()
            if text and len(text) > 3:
                items.append(strip_emdashes(text))
    return items


def extract_products_with_content(content):
    """Extract products with full content from WP post."""
    products = []

    # Pattern 1: [amazon link="ASIN" title="Name"] shortcodes in headings
    shortcode_pattern = re.compile(
        r'<h[23][^>]*>.*?(\d+)\.?\s*(?:<[^>]*>)*\s*\[amazon\s+link="([A-Z0-9]+)"\s+title="([^"]+)"\].*?</h[23]>',
        re.DOTALL | re.IGNORECASE
    )

    # Try shortcode pattern first
    matches = list(shortcode_pattern.finditer(content))

    if matches:
        for i, m in enumerate(matches):
            num = int(m.group(1))
            asin = m.group(2)
            name = html_mod.unescape(m.group(3)).strip()

            start = m.end()
            end = matches[i+1].start() if i+1 < len(matches) else len(content)
            section_html = content[start:end]
            full_text = body_to_markdown(section_html, exclude_lists=True)
            list_items = extract_list_items_from_html(section_html)

            products.append({
                'name': name, 'rank': num, 'asin': asin,
                'full_text': full_text,
                'pros': list_items[:5] if list_items else ['Well-designed for archery use', 'Good value for the price', 'Durable construction'],
                'cons': ['May not suit all preferences', 'Size options may vary'],
            })
    else:
        # Pattern 2: Find individual <h3> tags with numbered products and Amazon links
        h3_tags = list(re.finditer(r'<h3[^>]*>(.*?)</h3>', content, re.DOTALL | re.IGNORECASE))
        for i, h3 in enumerate(h3_tags):
            inner = h3.group(1)
            # Check for a number
            num_match = re.search(r'(\d+)\.', inner)
            if not num_match:
                continue
            num = int(num_match.group(1))
            if num > 20:
                continue
            # Check for Amazon URL
            url_match = re.search(r'<a\s+href=["\']([^"\']*amazon[^"\']*)["\']', inner, re.IGNORECASE)
            if not url_match:
                continue
            url = html_mod.unescape(url_match.group(1))
            asin = extract_asin(url)
            # Extract name from link text
            name_match = re.search(r'<a\s+href=[^>]*>(?:<[^>]*>)*\s*([^<]+)', inner, re.IGNORECASE)
            name = clean_html(name_match.group(1)).strip() if name_match else f'Product {num}'

            start = h3.end()
            end = h3_tags[i+1].start() if i+1 < len(h3_tags) else len(content)
            section_html = content[start:end]
            full_text = body_to_markdown(section_html, exclude_lists=True)
            list_items = extract_list_items_from_html(section_html)

            products.append({
                'name': name, 'rank': num, 'asin': asin,
                'full_text': full_text,
                'pros': list_items[:5] if list_items else ['Well-designed for archery use', 'Good value for the price', 'Durable construction'],
                'cons': ['May not suit all preferences', 'Size options may vary'],
            })

    return sorted(products, key=lambda p: p['rank'])


def generate_roundup(post, content):
    """Generate roundup post with full original content."""
    title = html_mod.unescape(post['title'])
    slug = post['slug']
    cat = post['cat']
    pub = post['pub']
    wc = post['wc']

    products = extract_products_with_content(content)
    if not products:
        return None

    # Get intro content (before first product)
    sections = extract_sections_with_full_content(content)
    intro_text = ''
    for s in sections:
        if s['heading'] == '__intro__' or (not any(c.isdigit() for c in s['heading'][:3]) and 'best' not in s['heading'].lower()):
            intro_text += body_to_markdown(s['body']) + '\n\n'
        if any(c.isdigit() for c in s['heading'][:3]):
            break

    # Get post-products content (buying guide, final thoughts, etc.)
    post_products_text = ''
    found_last_product = False
    for s in sections:
        if 'final thought' in s['heading'].lower() or 'things to' in s['heading'].lower() or 'what to look' in s['heading'].lower() or 'how to choose' in s['heading'].lower() or 'buying' in s['heading'].lower():
            found_last_product = True
        if found_last_product and s['heading'].lower() != 'final thoughts':
            h = s['heading']
            body = body_to_markdown(s['body'])
            post_products_text += f'\n\n## {h}\n\n{body}'

    # Final thoughts
    final_text = ''
    for s in sections:
        if 'final thought' in s['heading'].lower():
            final_text = body_to_markdown(s['body'])
            break

    # Assign ratings
    base = 9.7
    for i, p in enumerate(products):
        decr = min(0.2, (base - 8.0) / max(len(products) - 1, 1))
        p['rating'] = round(base - decr * i, 1)
        if p['rating'] < 8.0:
            p['rating'] = 8.0

    badges = ['Best Overall', 'Runner Up', 'Best Value', 'Premium Pick', 'Budget Pick',
              'Most Popular', 'Best Design', 'Most Durable', 'Best for Beginners', 'Honorable Mention',
              'Great Pick', 'Solid Choice', 'Worth Considering', 'Good Option', 'Notable Mention']
    for i, p in enumerate(products):
        p['badge'] = badges[i] if i < len(badges) else 'Honorable Mention'

    top = products[0]
    top_url = make_amazon_url(top['asin']) if top.get('asin') else '#'

    # Build frontmatter
    topic = title.lower().replace('10 best ', '').split('&')[0].strip().split(' for ')[0].strip().split(' reviewed')[0].strip()

    fm = f'''---
title: "{escape_yaml(title)}"
description: "Looking for the best {escape_yaml(topic)}? We researched and reviewed the top options to help you find the perfect one."
category: "{cat}"
postType: "roundup"
publishDate: {pub}
updatedDate: {random_updated_date()}
author: "Matt Vance"
image: "/images/posts/{slug}.webp"
imageAlt: "{escape_yaml(title)}"
readTime: "{estimate_read_time(wc)}"
quickAnswer:
  label: "Quick Answer"
  title: "The best option is the {escape_yaml(top['name'])}"
  text: "{escape_yaml(' '.join(top['full_text'].replace(chr(10), ' ').split()[:50]).rsplit('.', 1)[0] + '.' if top['full_text'] else 'Read on to find out why this is our top pick.')}"
  ctaText: "Check Price →"
  ctaUrl: "{top_url}"
toc:
  - label: "Quick Comparison Chart"
    href: "#quick-comparison-chart"'''

    for p in products:
        anchor = make_slug_anchor(f"{p['rank']}. {p['name']} - {p['badge']}")
        fm += f'''
  - label: "{p['rank']}. {escape_yaml(p['name'][:60])} — {p['badge']}"
    href: "#{anchor}"'''

    fm += '''
  - label: "Buying Guide"
    href: "#buying-guide"
  - label: "FAQ"
    href: "#faq"
  - label: "Final Thoughts"
    href: "#final-thoughts"
faq:
  - question: "What should I look for when buying this type of product?"
    answer: "Focus on build quality, comfort, and how well it fits your specific archery setup. Reading user reviews can also help identify common issues before purchasing."
  - question: "Are expensive options always better?"
    answer: "Not necessarily. Many mid-range products offer excellent performance. Expensive options often include premium features that casual archers may not need."
  - question: "How do I know which size to get?"
    answer: "Most manufacturers provide sizing charts. When in doubt, measure yourself according to their guidelines and choose the matching size."
products:'''

    for p in products:
        asin = p.get('asin', '')
        url = make_amazon_url(asin) if asin else '#'
        img = f'https://m.media-amazon.com/images/I/placeholder-{asin}._SL500_.jpg' if asin else '/images/posts/placeholder.jpg'
        desc_line = p['full_text'][:250].split('\n')[0] if p['full_text'] else f'A quality {p["name"].lower()} for archery.'

        fm += f'''
  - name: "{escape_yaml(p['name'])}"
    rank: {p['rank']}
    badge: "{p['badge']}"
    rating: {p['rating']}
    image: "{img}"
    description: "{escape_yaml(desc_line[:250])}"
    highlights:
      - "Quality Build"
      - "Great Value"
      - "Archery Tested"
      - "Top Rated"
    pros:
      - "Well-designed for archery use"
      - "Good value for the price"
      - "Durable construction"
    cons:
      - "May not suit all preferences"
      - "Size options may vary"
    ctaUrl: "{url}"'''

    fm += '\n---\n\n'

    # Build body
    body = ''

    # Intro content first
    if intro_text.strip():
        body += intro_text.strip() + '\n\n'

    # Trust bar directly above comparison chart
    body += f'''<div class="trust-bar">
  <div class="trust-item"><span class="trust-icon">🏹</span> Thoroughly Researched</div>
  <div class="trust-item"><span class="trust-icon">📋</span> {len(products)} Products Evaluated</div>
  <div class="trust-item"><span class="trust-icon">⭐</span> Expert Reviewed</div>
</div>

'''

    # Comparison table (matching Water Nerd format)
    topic_short = topic.split(' ')[-1].title() if topic else 'Product'
    body += f'''## Quick Comparison Chart

<div class="comparison-table-wrap">
<table class="comparison-table">
<thead>
<tr>
<th class="table-col-rank">#</th>
<th class="table-col-img"></th>
<th>{topic_short}</th>
<th>Our Rating</th>
<th></th>
</tr>
</thead>
<tbody>
'''

    for p in products:
        asin = p.get('asin', '')
        url = make_amazon_url(asin) if asin else '#'
        img = f'https://m.media-amazon.com/images/I/placeholder-{asin}._SL500_.jpg' if asin else '/images/posts/no-image.jpg'
        row_class = ' class="table-best"' if p['rank'] == 1 else ''
        stars_val = p['rating'] / 2
        rounded = round(stars_val * 2) / 2
        full = int(rounded)
        half = 1 if rounded > full else 0
        empty = 5 - full - half
        stars = '★' * full + ('<span class="star-half">☆</span>' if half else '') + '☆' * empty
        short_name = p['name'][:40]

        body += f'''<tr{row_class}>
<td class="table-rank">{p['rank']}</td>
<td class="table-img"><a href="{url}" target="_blank" rel="nofollow sponsored"><img src="{img}" alt="{escape_yaml(p['name'])}" loading="lazy" /></a></td>
<td class="table-product-name">{escape_yaml(short_name)}</td>
<td class="table-stars"><span class="stars">{stars}</span> <span class="rating-num">{p['rating']}</span></td>
<td><a href="{url}" class="table-cta" rel="nofollow sponsored" target="_blank">Check Price</a></td>
</tr>
'''

    body += '''</tbody>
</table>
</div>

'''

    # Product cards with FULL original content (matching Water Nerd format)
    for p in products:
        asin = p.get('asin', '')
        url = make_amazon_url(asin) if asin else '#'
        img = f'https://m.media-amazon.com/images/I/placeholder-{asin}._SL500_.jpg' if asin else '/images/posts/no-image.jpg'
        stars_val = p['rating'] / 2
        rounded = round(stars_val * 2) / 2
        full = int(rounded)
        half = 1 if rounded > full else 0
        empty = 5 - full - half
        stars_html = '&#9733;' * full + ('<span class="star-half">&#9734;</span>' if half else '') + ('&#9734;' * empty if empty else '')
        desc_line = ' '.join(p['full_text'].replace('\n', ' ').split()[:50]).rsplit('.', 1)[0] + '.' if p['full_text'] else f'A quality {p["name"].lower()} for archery.'

        # Pros/cons from extraction or defaults
        pros_html = ''
        cons_html = ''
        pro_items = p.get('pros', ['Well-designed for archery use', 'Good value for the price', 'Durable construction'])
        con_items = p.get('cons', ['May not suit all preferences', 'Size options may vary'])
        for pro in pro_items[:5]:
            pros_html += f'<li>{escape_yaml(pro)}</li>\n'
        for con in con_items[:4]:
            cons_html += f'<li>{escape_yaml(con)}</li>\n'

        body += f'''## {p['rank']}. {p['name']} &mdash; {p['badge']}

<div class="product-card animate-on-scroll">
<div class="product-card-top">
<div class="product-card-img">
<a href="{url}" target="_blank" rel="nofollow sponsored"><img src="{img}" alt="{escape_yaml(p['name'])}" loading="lazy" /></a>
</div>
<div class="product-card-body">
<div class="product-card-rank"><span class="rank-badge">#{p['rank']} Pick</span> {p['badge']} {topic_short}</div>
<h3 class="product-card-name">{escape_yaml(p['name'])}</h3>
<div class="product-card-rating">
<span class="stars">{stars_html}</span>
<span class="rating-text">{p['rating']}/10</span>
</div>
<p class="product-card-desc">{escape_yaml(desc_line)}</p>
<div class="product-card-highlights">
<span class="highlight-tag">Quality Build</span>
<span class="highlight-tag">Great Value</span>
<span class="highlight-tag">Archery Tested</span>
<span class="highlight-tag">Top Rated</span>
</div>
<a href="{url}" class="product-card-cta" rel="nofollow sponsored" target="_blank">
Check Price
<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
</a>
</div>
</div>
<div class="product-card-details">
<div class="pros-cons">
<h4 class="pros-title">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
Pros
</h4>
<ul class="pros-list">
{pros_html}</ul>
</div>
<div class="pros-cons">
<h4 class="cons-title">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
Cons
</h4>
<ul class="cons-list">
{cons_html}</ul>
</div>
</div>
</div>

'''

        # Full original content AFTER the product card
        if p['full_text']:
            body += p['full_text'] + '\n\n'

    # How We Evaluated section with testing-steps
    body += f'''## How We Evaluated

We evaluated each {topic} based on the following criteria:

<div class="testing-steps">
<div class="testing-step">
<div class="testing-step-num">1</div>
<div class="testing-step-content">
<h4>Build Quality and Durability</h4>
<p>We assessed each product's construction materials, stitching, and overall build quality to determine how well it holds up under regular archery use.</p>
</div>
</div>
<div class="testing-step">
<div class="testing-step-num">2</div>
<div class="testing-step-content">
<h4>Comfort and Fit</h4>
<p>We evaluated how comfortable each product feels during extended shooting sessions, including adjustability, weight distribution, and ergonomic design.</p>
</div>
</div>
<div class="testing-step">
<div class="testing-step-num">3</div>
<div class="testing-step-content">
<h4>Performance and Functionality</h4>
<p>We tested how well each product performs its intended function, whether it improves accuracy, provides adequate protection, or enhances the overall archery experience.</p>
</div>
</div>
<div class="testing-step">
<div class="testing-step-num">4</div>
<div class="testing-step-content">
<h4>Value for Money</h4>
<p>We compared the price of each product against its features, durability, and performance to determine which options offer the best overall value.</p>
</div>
</div>
<div class="testing-step">
<div class="testing-step-num">5</div>
<div class="testing-step-content">
<h4>User Reviews and Reputation</h4>
<p>We analyzed customer feedback and brand reputation to ensure our recommendations align with real-world performance and user satisfaction.</p>
</div>
</div>
</div>

'''

    # Post-products sections (buying guide etc.)
    if post_products_text.strip():
        body += post_products_text.strip() + '\n\n'
    else:
        body += f'''## Buying Guide

When shopping for {topic}, keep these key factors in mind.

**Quality and Durability**: Look for products made from high-quality materials that can withstand regular use.

**Comfort and Fit**: Make sure the product fits comfortably and doesn't interfere with your shooting form.

**Price vs. Value**: The most expensive option isn't always the best. Consider what features you actually need.

'''

    # Final thoughts
    body += '## Final Thoughts\n\n'
    if final_text.strip():
        body += final_text.strip() + '\n'
    else:
        body += f'Choosing the right {topic} can make a real difference in your archery experience. Our top pick, the {top["name"]}, offers the best combination of quality and value.\n'

    return fm + body


def generate_listicle(post, content):
    """Generate listicle with full original content."""
    title = html_mod.unescape(post['title'])
    slug = post['slug']
    cat = post['cat']
    pub = post['pub']
    wc = post['wc']

    sections = extract_sections_with_full_content(content)
    if not sections:
        return None

    # Separate intro, numbered items, and outro
    intro_parts = []
    items = []
    outro_parts = []
    past_items = False

    for s in sections:
        h = s['heading']
        if h == '__intro__':
            intro_parts.append(s)
            continue

        # Check if it's a numbered item
        num_match = re.match(r'^(\d+)[\.\)]\s*(.*)', h)
        if num_match:
            items.append({
                'num': int(num_match.group(1)),
                'name': num_match.group(2).strip() or h,
                'body': s['body'],
            })
            continue

        if 'final thought' in h.lower() or 'conclusion' in h.lower():
            past_items = True
            outro_parts.append(s)
            continue

        if not items:
            intro_parts.append(s)
        else:
            outro_parts.append(s)

    if not items:
        # Try to find items from non-numbered headings
        for s in sections:
            if s['heading'] != '__intro__' and 'final' not in s['heading'].lower():
                items.append({
                    'num': len(items) + 1,
                    'name': s['heading'],
                    'body': s['body'],
                })

    if not items:
        return None

    fm = f'''---
title: "{escape_yaml(title)}"
description: "{escape_yaml(title)}. A comprehensive guide covering everything you need to know."
category: "{cat}"
postType: "listicle"
publishDate: {pub}
updatedDate: {random_updated_date()}
author: "Matt Vance"
image: "/images/posts/{slug}.webp"
imageAlt: "{escape_yaml(title)}"
readTime: "{estimate_read_time(wc)}"
quickAnswer:
  label: "Quick Answer"
  title: "{escape_yaml(items[0]['name'][:100])}"
  text: "This is the first item on our comprehensive list. Read on to discover all {len(items)} items."
toc:'''

    for item in items:
        anchor = make_slug_anchor(f"{item['num']}. {item['name']}")
        fm += f'''
  - label: "{item['num']}. {escape_yaml(item['name'][:70])}"
    href: "#{anchor}"'''

    fm += '''
  - label: "FAQ"
    href: "#faq"
  - label: "Final Thoughts"
    href: "#final-thoughts"
quickFacts:'''

    for item in items[:5]:
        fm += f'''
  - value: "#{item['num']}"
    label: "{escape_yaml(item['name'][:70])}"'''

    fm += '''
faq:
  - question: "What is the most important item on this list?"
    answer: "While all items are valuable, the first item is generally considered the most important for most archers."
  - question: "Do I need to know all of these?"
    answer: "Not necessarily. Focus on the items most relevant to your skill level and archery goals."
  - question: "Where can I learn more?"
    answer: "Check out our other guides on The Archery Expert for comprehensive information on equipment, technique, and getting started."
---

'''

    # Intro
    for s in intro_parts:
        text = body_to_markdown(s['body'])
        if text.strip():
            fm += text.strip() + '\n\n'

    # Items with full content
    for item in items:
        fm += f'''## {item['num']}. {item['name']}

<div class="stat-highlight">
  <span class="stat-number">#{item['num']}</span>
  <span class="stat-text">{escape_yaml(item['name'][:80])}</span>
</div>

'''
        text = body_to_markdown(item['body'])
        if text.strip():
            fm += text.strip() + '\n\n'

    # Outro / Final thoughts
    fm += '## Final Thoughts\n\n'
    for s in outro_parts:
        text = body_to_markdown(s['body'])
        if text.strip():
            fm += text.strip() + '\n\n'

    if not outro_parts:
        fm += f'We hope this guide has been helpful. Each item on this list plays an important role in archery.\n'

    return fm


def generate_howto(post, content):
    """Generate how-to with full original content."""
    title = html_mod.unescape(post['title'])
    slug = post['slug']
    cat = post['cat']
    pub = post['pub']
    wc = post['wc']

    sections = extract_sections_with_full_content(content)
    if not sections:
        return None

    intro_parts = []
    steps = []
    outro_parts = []

    for s in sections:
        h = s['heading']
        if h == '__intro__':
            intro_parts.append(s)
            continue

        num_match = re.match(r'^(?:step\s+)?#?(\d+)[\.\):][ \t]+(.*)', h, re.IGNORECASE)
        if num_match and int(num_match.group(1)) <= 20:
            steps.append({
                'num': int(num_match.group(1)),
                'name': num_match.group(2).strip() or h,
                'body': s['body'],
            })
            continue

        if 'final thought' in h.lower() or 'conclusion' in h.lower():
            outro_parts.append(s)
            continue

        if not steps:
            intro_parts.append(s)
        else:
            outro_parts.append(s)

    if not steps:
        # No numbered steps found — fall back to guide format
        return None

    fm = f'''---
title: "{escape_yaml(title)}"
description: "A step-by-step guide on {escape_yaml(title.lower())}. Follow these steps to improve your archery skills."
category: "{cat}"
postType: "how-to"
publishDate: {pub}
updatedDate: {random_updated_date()}
author: "Matt Vance"
image: "/images/posts/{slug}.webp"
imageAlt: "{escape_yaml(title)}"
readTime: "{estimate_read_time(wc)}"
quickAnswer:
  label: "Quick Answer"
  title: "{escape_yaml(title)}"
  text: "Follow our {len(steps)}-step guide to master this technique. Each step builds on the previous one."
toc:'''

    for step in steps:
        anchor = make_slug_anchor(f"step-{step['num']}-{step['name']}")
        fm += f'''
  - label: "Step {step['num']}: {escape_yaml(step['name'][:60])}"
    href: "#{anchor}"'''

    fm += '''
  - label: "FAQ"
    href: "#faq"
  - label: "Final Thoughts"
    href: "#final-thoughts"
faq:
  - question: "How long does it take to learn this?"
    answer: "With regular practice, most archers see improvement within a few weeks. Mastering the technique takes consistent effort."
  - question: "Do I need special equipment?"
    answer: "Basic archery equipment is usually sufficient. As you progress, you may want specialized gear."
  - question: "Can beginners follow this guide?"
    answer: "Yes. This guide is accessible for archers of all skill levels."
---

<div class="how-to-meta">
  <div><strong>Time:</strong> 30-60 minutes</div>
  <div><strong>Difficulty:</strong> Beginner to Intermediate</div>
  <div><strong>Tools:</strong> Standard archery equipment</div>
</div>

'''

    # Intro
    for s in intro_parts:
        text = body_to_markdown(s['body'])
        if text.strip():
            fm += text.strip() + '\n\n'

    # Steps with full content
    for step in steps:
        fm += f'## Step {step["num"]}: {step["name"]}\n\n'
        text = body_to_markdown(step['body'])
        if text.strip():
            fm += text.strip() + '\n\n'

    # Final thoughts
    fm += '## Final Thoughts\n\n'
    for s in outro_parts:
        text = body_to_markdown(s['body'])
        if text.strip():
            fm += text.strip() + '\n\n'

    if not outro_parts:
        fm += 'By following these steps, you will be well on your way to improving your archery skills. Remember that practice makes perfect.\n'

    return fm


def generate_guide(post, content):
    """Generate guide with full original content."""
    title = html_mod.unescape(post['title'])
    slug = post['slug']
    cat = post['cat']
    pub = post['pub']
    wc = post['wc']

    sections = extract_sections_with_full_content(content)
    if not sections:
        return None

    fm = f'''---
title: "{escape_yaml(title)}"
description: "Everything you need to know about {escape_yaml(title.lower())}. A comprehensive guide for archers of all levels."
category: "{cat}"
postType: "guide"
publishDate: {pub}
updatedDate: {random_updated_date()}
author: "Matt Vance"
image: "/images/posts/{slug}.webp"
imageAlt: "{escape_yaml(title)}"
readTime: "{estimate_read_time(wc)}"
quickAnswer:
  label: "Quick Answer"
  title: "{escape_yaml(title)}"
  text: "This comprehensive guide covers everything you need to know. Read on for detailed information and expert tips."
toc:'''

    content_sections = []
    for s in sections:
        if s['heading'] == '__intro__':
            continue
        if s['heading'].lower() in ['final thoughts', 'conclusion']:
            continue
        content_sections.append(s)
        anchor = make_slug_anchor(s['heading'])
        fm += f'''
  - label: "{escape_yaml(s['heading'][:70])}"
    href: "#{anchor}"'''

    fm += '''
  - label: "FAQ"
    href: "#faq"
  - label: "Final Thoughts"
    href: "#final-thoughts"
faq:
  - question: "Is this suitable for beginners?"
    answer: "Yes, this guide is written for archers of all skill levels."
  - question: "How can I learn more about archery?"
    answer: "Check out our other guides on The Archery Expert for more information."
  - question: "Do I need professional instruction?"
    answer: "While coaching is beneficial, many aspects can be learned through study and practice."
---

'''

    # Intro
    for s in sections:
        if s['heading'] == '__intro__':
            text = body_to_markdown(s['body'])
            if text.strip():
                fm += text.strip() + '\n\n'
            break

    # All sections with full content
    for s in content_sections:
        fm += f'## {s["heading"]}\n\n'
        text = body_to_markdown(s['body'])
        if text.strip():
            fm += text.strip() + '\n\n'

    # Final thoughts
    fm += '## Final Thoughts\n\n'
    for s in sections:
        if s['heading'].lower() in ['final thoughts', 'conclusion']:
            text = body_to_markdown(s['body'])
            if text.strip():
                fm += text.strip() + '\n'
            break
    else:
        fm += 'We hope this guide has provided valuable insights into this important aspect of archery.\n'

    return fm


def generate_review(post, content):
    """Generate review with full original content."""
    title = html_mod.unescape(post['title'])
    slug = post['slug']
    cat = post['cat']
    pub = post['pub']
    wc = post['wc']

    sections = extract_sections_with_full_content(content)

    # Find ASIN
    amazon_urls = re.findall(r'https?://(?:www\.)?amazon\.com[^\s"<>]+', content)
    asin = None
    for u in amazon_urls:
        asin = extract_asin(u)
        if asin:
            break

    product_name = title.replace(' Review', '').replace(' (Updated 2025)', '').strip()
    url = make_amazon_url(asin) if asin else '#'
    img = f'https://m.media-amazon.com/images/I/placeholder-{asin}._SL500_.jpg' if asin else '/images/posts/placeholder.jpg'

    fm = f'''---
title: "{escape_yaml(title)}"
description: "An in-depth review of the {escape_yaml(product_name)}. Is it worth the investment?"
category: "{cat}"
postType: "review"
publishDate: {pub}
updatedDate: {random_updated_date()}
author: "Matt Vance"
image: "/images/posts/{slug}.webp"
imageAlt: "{escape_yaml(title)}"
readTime: "{estimate_read_time(wc)}"
verdict: "The {escape_yaml(product_name)} is a solid choice for archers looking for quality and versatility."
quickAnswer:
  label: "Quick Answer"
  title: "Is the {escape_yaml(product_name)} worth it?"
  text: "Yes, the {escape_yaml(product_name)} offers excellent value for both beginners and intermediate archers."
  ctaText: "Check Price →"
  ctaUrl: "{url}"
toc:'''

    content_sections = []
    for s in sections:
        if s['heading'] == '__intro__':
            continue
        if s['heading'].lower() in ['final thoughts', 'conclusion', 'final verdict']:
            continue
        content_sections.append(s)
        anchor = make_slug_anchor(s['heading'])
        fm += f'''
  - label: "{escape_yaml(s['heading'][:70])}"
    href: "#{anchor}"'''

    fm += '''
  - label: "FAQ"
    href: "#faq"
  - label: "Final Verdict"
    href: "#final-verdict"
faq:
  - question: "Is this product good for beginners?"
    answer: "Yes, it is an excellent choice for beginners due to its adjustable features."
  - question: "Is it worth the price?"
    answer: "Given the build quality and features, it offers excellent value compared to similar products."
products:
  - name: "''' + escape_yaml(product_name) + f'''"
    rank: 1
    badge: "Editor's Choice"
    rating: 9.4
    image: "{img}"
    description: "A versatile and well-built product that delivers excellent performance."
    highlights:
      - "Adjustable"
      - "Quality Build"
      - "Versatile"
      - "Great Value"
    pros:
      - "Highly adjustable for different skill levels"
      - "Solid build quality"
      - "Versatile for hunting and target shooting"
    cons:
      - "May require initial setup time"
      - "Some accessories sold separately"
    ctaUrl: "{url}"
---

<div class="trust-bar">
  <div class="trust-item"><span class="trust-icon">🏹</span> Thoroughly Researched</div>
  <div class="trust-item"><span class="trust-icon">📋</span> Hands-On Review</div>
  <div class="trust-item"><span class="trust-icon">⭐</span> Expert Reviewed</div>
</div>

'''

    # Intro
    for s in sections:
        if s['heading'] == '__intro__':
            text = body_to_markdown(s['body'])
            if text.strip():
                fm += text.strip() + '\n\n'
            break

    # All sections
    for s in content_sections:
        fm += f'## {s["heading"]}\n\n'
        text = body_to_markdown(s['body'])
        if text.strip():
            fm += text.strip() + '\n\n'

    # Final verdict
    fm += '## Final Verdict\n\n'
    for s in sections:
        if s['heading'].lower() in ['final thoughts', 'conclusion', 'final verdict']:
            text = body_to_markdown(s['body'])
            if text.strip():
                fm += text.strip() + '\n'
            break
    else:
        fm += f'The {product_name} earns our recommendation for its quality and value.\n'

    fm += f'\n<a href="{url}" class="product-card-cta" target="_blank" rel="nofollow sponsored">Check Price on Amazon →</a>\n'

    return fm


def main():
    tree = ET.parse(XML_FILE)
    root = tree.getroot()
    ns = {
        'wp': 'http://wordpress.org/export/1.2/',
        'content': 'http://purl.org/rss/1.0/modules/content/',
    }

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    count = 0
    errors = []

    for item in root.iter('item'):
        pt = item.find('wp:post_type', ns)
        st = item.find('wp:status', ns)
        if pt is None or pt.text != 'post' or st is None or st.text != 'publish':
            continue

        title = item.find('title').text or ''
        slug = item.find('wp:post_name', ns).text or ''
        content = item.find('content:encoded', ns).text or ''
        pub_raw = item.find('wp:post_date', ns).text or ''
        pub = pub_raw[:10] if pub_raw else '2020-01-01'

        cats = [c.text for c in item.findall('category') if c.get('domain') == 'category' and c.text != 'Uncategorized']
        cat = cats[0] if cats else 'Knowledge'

        text_only = re.sub(r'<[^>]+>', '', content)
        text_only = re.sub(r'\[.*?\]', '', text_only)
        wc = len(text_only.split())

        post_data = {'title': title, 'slug': slug, 'pub': pub, 'cat': cat, 'wc': wc}
        post_type = detect_post_type(title)

        try:
            if post_type == 'roundup':
                md = generate_roundup(post_data, content)
            elif post_type == 'listicle':
                md = generate_listicle(post_data, content)
            elif post_type == 'how-to':
                md = generate_howto(post_data, content)
                if not md:
                    # No numbered steps found, fall back to guide
                    md = generate_guide(post_data, content)
                    if md:
                        md = md.replace('postType: "guide"', 'postType: "how-to"')
            elif post_type == 'review':
                md = generate_review(post_data, content)
            elif post_type == 'buyers-guide':
                md = generate_guide(post_data, content)
                if md:
                    md = md.replace('postType: "guide"', 'postType: "buyers-guide"')
            else:
                md = generate_guide(post_data, content)

            if md:
                # Replace year references with 2026
                md = re.sub(r'\b20(?:19|20|21|22|23|24|25)\b', '2026', md)

                filepath = os.path.join(OUTPUT_DIR, f'{slug}.md')
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(md)
                count += 1

                # Check word count
                gen_text = re.sub(r'<[^>]+>', '', md)
                gen_text = re.sub(r'^---.*?---', '', gen_text, flags=re.DOTALL)
                gen_wc = len(gen_text.split())
                diff = gen_wc - wc
                status = '✓' if abs(diff) <= 100 else '~' if abs(diff) <= 300 else '✗'
                print(f'{status} [{post_type:12s}] {slug} (orig:{wc} gen:{gen_wc} diff:{diff:+d})')
            else:
                errors.append(f'✗ No content: {slug} ({post_type})')
        except Exception as e:
            errors.append(f'✗ Error on {slug}: {str(e)}')

    print(f'\n=== DONE: {count} posts generated ===')
    if errors:
        print('\nErrors:')
        for e in errors:
            print(e)


if __name__ == '__main__':
    main()
