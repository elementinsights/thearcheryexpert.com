export const siteConfig = {
  // ============================================================
  //  BRAND — Change these for each blog
  // ============================================================
  name: "The Archery Expert",
  nameHighlight: "Expert",        // Part that gets accent color in logo
  logo: "/images/logo.webp",       // Image logo (set to "" for text logo)
  tagline: "Archery Information, Tips and Product Reviews",
  domain: "thearcheryexpert.com",
  url: "https://www.thearcheryexpert.com",

  // ============================================================
  //  THEME COLORS — Change accent to re-skin the entire site
  // ============================================================
  theme: {
    accent: "#EB1B25",
    accentHover: "#c9161f",
    accentLight: "#fef2f2",
    accentRgb: "235, 27, 37",
  },

  // ============================================================
  //  NAVIGATION CATEGORIES
  // ============================================================
  categories: [
    { name: "Accessories", slug: "accessories", image: "/images/category/accessories.webp" },
    { name: "Arrows", slug: "arrows", image: "/images/category/arrows.webp" },
    { name: "Bows", slug: "bows", image: "/images/category/bows.webp" },
    { name: "Knowledge", slug: "knowledge", image: "/images/category/knowledge.webp" },
    { name: "Targets", slug: "targets", image: "/images/category/targets.webp" },
  ],

  // ============================================================
  //  SOCIAL LINKS (leave empty string to hide)
  // ============================================================
  social: {
    facebook: "https://www.facebook.com/thearcheryexpert/",
    pinterest: "https://www.pinterest.com/thearcheryexpert/",
    twitter: "https://www.twitter.com/archery_expert/",
    youtube: "",
  },

  // ============================================================
  //  FOOTER
  // ============================================================
  footerDescription: "Your trusted source for archery information, tips, tutorials, and honest product reviews. From bows to arrows to accessories, we cover it all.",
  footerPopularLinks: [
    { name: "Best Compound Bows", href: "/", desc: "Our top-rated picks for compound bows." },
    { name: "Best Arrows", href: "/", desc: "Top arrow picks for every skill level." },
    { name: "Archery Tips", href: "/", desc: "Improve your accuracy and technique." },
  ],
  amazonDisclaimer: "The Archery Expert is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com.",

  // ============================================================
  //  AUTHOR (default)
  // ============================================================
  author: {
    name: "Matt Vance",
    initial: "M",
    image: "/images/author.webp",
    role: "Founder",
    bio: "I've been shooting bows since I was eleven years old. From backyard targets to tournament ranges, archery has been my lifelong passion. I share tips, gear reviews, and everything I've learned to help fellow archers improve their game.",
  },

  // ============================================================
  //  CONTACT
  // ============================================================
  contactEmail: "elementinsightsolutions@gmail.com",
  contactSubjectPrefix: "The Archery Expert",

  // ============================================================
  //  AFFILIATE REDIRECT (Google Sheet CSV URL)
  // ============================================================
  affiliateSheetUrl: "",

  // ============================================================
  //  START HERE (homepage sidebar widget — set to empty array to hide)
  // ============================================================
  startHere: [],

  // ============================================================
  //  FEATURED IN (set to empty array to hide)
  // ============================================================
  featuredIn: [],

  // ============================================================
  //  HERO IMAGE (homepage background)
  // ============================================================
  heroImage: "/images/hero.webp",
};

export type SiteConfig = typeof siteConfig;
