import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const postsDir = '/Users/home/Desktop/Projects/current_blogs/thearcheryexpert/src/content/posts';

// Product data: unique highlights, pros, cons for each product in each file
const productData = {
  'bow-hunting-packs.md': [
    {
      name: 'Badlands Pursuit Hunting Backpack',
      highlights: ['AirTrack Suspension', 'Waterproof Build', 'Approach Camo', 'Lifetime Warranty'],
      pros: [
        "AirTrack technology keeps air flowing between the pack and your back",
        "Built-in waterproofing protects gear in heavy rain",
        "Approach camo pattern blends well in multiple terrains",
        "Backed by Badlands' unconditional lifetime warranty"
      ],
      cons: [
        "On the pricier side compared to entry-level packs",
        "Limited internal capacity for multi-day trips"
      ]
    },
    {
      name: 'Great Fit Pursuit Bruiser Deer Hunting Treestand Backpack',
      highlights: ['Silent Closure', 'Treestand Ready', 'Velcro Free', 'Easy Access'],
      pros: [
        "Velcro-free design keeps pocket closures quiet during your approach",
        "Built specifically for treestand hunters with easy-access pockets",
        "Soft materials won't spook game when brushing against branches",
        "Compact enough to hang on a tree hook without getting in the way"
      ],
      cons: [
        "Not ideal for long backcountry treks due to limited padding",
        "Fewer organizational compartments than larger hunting packs"
      ]
    },
    {
      name: 'North Mountain Gear Camo Hunting Backpack',
      highlights: ['100% Polyester', 'Waterproof Fabric', 'Lightweight Frame', 'Budget Friendly'],
      pros: [
        "Made from 100% durable polyester that resists tears and abrasion",
        "Waterproof fabric keeps contents dry in wet conditions",
        "Lightweight design won't weigh you down on long hikes",
        "Affordable price point makes it great for new hunters"
      ],
      cons: [
        "Zippers feel less robust than premium pack brands",
        "Shoulder straps could use more padding for heavy loads"
      ]
    },
    {
      name: 'Slumberjack Pursuit',
      highlights: ['Low Profile Fit', 'Snug Body Design', 'Multi Activity', 'Quick Draw Access'],
      pros: [
        "Low-profile fit sits snugly against your body for unrestricted movement",
        "Works well for stalking, riding, and spot-and-stalk hunts",
        "Quick-draw access to essential gear without removing the pack",
        "Lightweight enough to wear all day without fatigue"
      ],
      cons: [
        "Smaller capacity won't work for overnight hunts",
        "Limited color and camo pattern options"
      ]
    },
    {
      name: 'TENZING TX Pace Day Hunting Pack',
      highlights: ['Field Tested', 'Lifetime Durability', 'Organized Pockets', 'Comfortable Straps'],
      pros: [
        "Torture-tested in the field to outlast the most brutal hunts",
        "Well-organized pocket layout keeps gear easy to find",
        "Padded shoulder straps and hip belt distribute weight evenly",
        "Built to handle years of heavy use without falling apart"
      ],
      cons: [
        "Heavier empty weight than some ultralight alternatives",
        "External attachment points are limited"
      ]
    },
    {
      name: 'ALPS Outdoorz Big Bear Hunting Day Pack',
      highlights: ['Convertible Design', 'Fanny Pack Mode', 'Day Pack Mode', 'Versatile Use'],
      pros: [
        "Converts between a fanny pack, day pack, or both configurations",
        "Versatile design works for short walks or all-day sits",
        "Brushed Realtree HD fabric stays quiet in the field",
        "Multiple compartments provide solid gear organization"
      ],
      cons: [
        "Not large enough for backcountry or multi-day hunts",
        "Waist belt buckle can be tricky to adjust with cold hands"
      ]
    },
    {
      name: 'G GATRIAL Hunting Backpack',
      highlights: ['MOLLE System', 'Hydration Ready', 'Tactical Design', 'Rain Cover Included'],
      pros: [
        "MOLLE webbing lets you attach extra pouches and accessories",
        "Hydration bladder compatible for hands-free water access",
        "Durable 900D Oxford fabric resists punctures and tears",
        "Comes with a rain cover for unexpected downpours"
      ],
      cons: [
        "Tactical look may not appeal to traditional hunters",
        "Hydration bladder isn't included and must be bought separately"
      ]
    },
    {
      name: 'Badlands Diablo Dos Hunting Backpack',
      highlights: ['Hypervent Cooling', 'Dual Compartment', 'Quiet Fabric', 'Built In Rain Cover'],
      pros: [
        "Hypervent suspension pulls the pack away from your back for cooling airflow",
        "Dual main compartments keep gear organized and accessible",
        "Quiet fabric and zipper pulls won't alert nearby game",
        "Integrated rain cover deploys quickly when weather changes"
      ],
      cons: [
        "Premium price tag puts it above many competitors",
        "Frame can feel rigid during long seated periods in a treestand"
      ]
    },
    {
      name: 'SOWLAND Hunting Backpacks',
      highlights: ['Ergonomic Straps', 'Camo Patterns', 'Multiple Pockets', 'Beginner Friendly'],
      pros: [
        "Ergonomic padded straps make it comfortable for all-day wear",
        "Available in multiple camo patterns to match your hunting terrain",
        "Plenty of pockets and compartments for organized storage",
        "Beginner-friendly price makes it a solid entry-level choice"
      ],
      cons: [
        "Material isn't fully waterproof without a separate rain cover",
        "Stitching quality doesn't match premium hunting pack brands"
      ]
    },
    {
      name: 'INSIGHTS Hunting Backpack',
      highlights: ['TS3 Front Panel', 'Bow Carrier', 'Scent Control', 'Gear Organization'],
      pros: [
        "TS3 front panel system lets you customize accessory placement",
        "Integrated bow carrier frees up your hands on the hike in",
        "Thoughtful gear organization with labeled compartments",
        "Comfortable enough for extended backcountry use"
      ],
      cons: [
        "Heavier than some competitors when fully loaded",
        "TS3 accessories are sold separately and add to the total cost"
      ]
    }
  ],

  'bow-rangefinders.md': [
    {
      name: 'Bushnell Bone Collector 4x Laser Rangefinder',
      highlights: ['4x Magnification', 'Beginner Friendly', '600 Yard Range', 'Compact Size'],
      pros: [
        "Simple one-button operation is perfect for beginners",
        "4x magnification with a long 20mm eye relief for comfortable viewing",
        "Ranges targets accurately out to 600 yards",
        "Compact and lightweight enough to carry in a pocket"
      ],
      cons: [
        "Lacks angle compensation for elevated treestand shots",
        "No illuminated display, which makes it harder to read in low light"
      ]
    },
    {
      name: 'Nikon Monarch 2000',
      highlights: ['2000 Yard Range', 'ID Technology', 'OLED Display', 'Nikon Optics'],
      pros: [
        "Ranges out to 2,000 yards with Nikon's trusted optical clarity",
        "ID (Incline/Decline) technology provides true horizontal distance",
        "Bright OLED display is easy to read in any lighting condition",
        "Compact ergonomic body fits naturally in one hand"
      ],
      cons: [
        "Higher price point than most entry-level rangefinders",
        "Battery life could be longer with frequent use"
      ]
    },
    {
      name: 'Vortex Optics Ranger 1800 Laser Rangefinders',
      highlights: ['1800 Yard Range', 'HCD Mode', 'Lifetime Warranty', '6x Magnification'],
      pros: [
        "HCD (Horizontal Component Distance) mode gives angle-compensated readings",
        "Ranges reflective targets out to 1,800 yards",
        "Backed by Vortex's unconditional lifetime VIP warranty",
        "6x magnification provides clear target identification"
      ],
      cons: [
        "Scan mode can drain the battery faster than single-read mode",
        "Slightly bulkier than some ultra-compact competitors"
      ]
    },
    {
      name: 'Sig Sauer Kilo 2200 BDX LASER Rangefinder',
      highlights: ['BDX Technology', 'Bluetooth Enabled', '3400 Yard Range', 'Applied Ballistics'],
      pros: [
        "BDX system pairs wirelessly with compatible riflescopes for automatic holdover data",
        "Ranges reflective targets up to 3,400 yards",
        "Built-in Applied Ballistics calculator for precise drop calculations",
        "Bluetooth connectivity syncs ballistic profiles from your phone"
      ],
      cons: [
        "BDX features require a compatible Sig Sauer scope to fully utilize",
        "Premium price reflects the advanced tech built into it"
      ]
    },
    {
      name: 'Leupold RX-1600i TBR Laser Rangefinder',
      highlights: ['6x Magnification', 'TBR/W Technology', 'DNA Engine', 'Fog Mode'],
      pros: [
        "6x magnification with Leupold's Digitally eNhanced Accuracy (DNA) engine",
        "TBR/W technology accounts for slope and wind for true ballistic range",
        "Built-in fog mode helps get readings in poor weather conditions",
        "Rugged aluminum housing stands up to field abuse"
      ],
      cons: [
        "Menu navigation takes some time to learn",
        "Heavier than simpler rangefinder models in this price range"
      ]
    },
    {
      name: 'Leica Rangemaster CRF 1600B',
      highlights: ['Leica Glass', '7x Magnification', 'ABC Ballistics', 'Premium Optics'],
      pros: [
        "Leica's world-class glass delivers outstanding optical clarity",
        "7x magnification makes target identification easy at long distances",
        "Advanced Ballistic Compensation (ABC) calculates holdover points",
        "Slim, lightweight body slips easily into a jacket pocket"
      ],
      cons: [
        "One of the most expensive rangefinders on this list",
        "Advanced features have a steeper learning curve for new users"
      ]
    },
    {
      name: 'Simmons Hunting Laser Rangefinder; Volt & Venture Models',
      highlights: ['Budget Price', '600 Yard Range', 'Simple Operation', 'Tilt Sensor'],
      pros: [
        "One of the most affordable laser rangefinders on the market",
        "Simple point-and-shoot operation with no complicated menus",
        "Tilt intelligence provides angle-compensated distance readings",
        "Lightweight and compact for easy carry in the field"
      ],
      cons: [
        "600-yard max range is shorter than most mid-range competitors",
        "Optics aren't as clear as premium brands in low light"
      ]
    },
    {
      name: 'TecTecTec ProWild S with Angle Compensation - Laser Rangefinder',
      highlights: ['Angle Compensation', '540 Yard Range', 'Continuous Scan', 'Slope Mode'],
      pros: [
        "Built-in angle compensation gives true horizontal distance for angled shots",
        "Continuous scan mode tracks distance as you follow a moving target",
        "Ranges targets accurately up to 540 yards",
        "Affordable price brings angle compensation to budget-minded hunters"
      ],
      cons: [
        "540-yard max range limits usefulness for long-distance scouting",
        "Display can wash out in bright direct sunlight"
      ]
    },
    {
      name: 'Halo XL450-7 Rangefinder',
      highlights: ['AI Technology', '450 Yard Range', 'Scan Mode', 'Auto Acquire'],
      pros: [
        "AI technology automatically calculates angle-compensated distance",
        "Scan mode lets you sweep across the landscape for quick readings",
        "Auto-acquire feature locks onto targets without manual adjustment",
        "Very affordable entry point for hunters on a tight budget"
      ],
      cons: [
        "450-yard range is the shortest on this list",
        "Build quality feels plasticky compared to mid-range models"
      ]
    },
    {
      name: 'WOSPORTS 700/1200 Yards Hunting Laser Rangefinder',
      highlights: ['Flag Lock', 'Speed Mode', 'USB Rechargeable', 'Multi Mode'],
      pros: [
        "Flag-lock vibration confirms when you've locked onto a flagstick or target",
        "Speed mode measures the velocity of moving targets",
        "USB rechargeable battery eliminates the need for replacement batteries",
        "Multiple measurement modes cover hunting, golf, and general use"
      ],
      cons: [
        "Accuracy can drop off at the very edge of max range",
        "Instructions could be clearer for first-time rangefinder users"
      ]
    }
  ],

  'coiled-straw-archery-target.md': [
    {
      name: 'KAINOKAI Traditional Hand-Made Straw Archery Target',
      highlights: ['Handmade Straw', 'Eco Friendly', 'Easy Arrow Pull', 'Multiple Sizes'],
      pros: [
        "Handmade from natural foliage for an eco-friendly archery target",
        "Arrows pull out cleanly without damaging the shaft or fletching",
        "Available in multiple sizes from small practice to full competition",
        "Lightweight and portable enough to move around your yard easily"
      ],
      cons: [
        "Natural straw material degrades faster in wet weather",
        "Not rated for broadhead arrows or high draw weight bows"
      ]
    },
    {
      name: 'SinoArt Traditional Solid Straw Round 3 Layers Hand-Made Archery Target Face',
      highlights: ['3 Layer Design', 'Solid Straw Core', 'Hand Stitched', 'Bright Target Face'],
      pros: [
        "Three solid straw layers provide excellent stopping power for arrows",
        "Hand-stitched construction ensures tight, consistent density throughout",
        "Bright, high-contrast target face is visible from long distances",
        "Round shape works well for both indoor and outdoor practice sessions"
      ],
      cons: [
        "Center area wears out faster with repeated bullseye shots",
        "Heavier than single-layer targets, making it less portable"
      ]
    },
    {
      name: 'DOSTYLE Traditional Solid Straw Round Archery Target',
      highlights: ['Coiled Rope Binding', 'Solid Construction', 'Smooth Arrow Pull', 'Indoor Outdoor'],
      pros: [
        "Tightly coiled straw with rope binding holds its shape through heavy use",
        "Smooth arrow removal protects your arrows from bending or breaking",
        "Works well for both indoor garage shooting and outdoor backyard practice",
        "Affordable price makes it easy to stock up on replacement targets"
      ],
      cons: [
        "Smaller sizes may not stop arrows from bows over 35 lbs",
        "Straw fibers can shed over time and create a mess beneath the target"
      ]
    },
    {
      name: 'SS OPER Tree Branch Decoration Archery Round Coiled Straw Target for Christmas',
      highlights: ['Decorative Design', 'Holiday Gift Ready', 'Wall Mountable', 'Natural Materials'],
      pros: [
        "Doubles as a wall decoration when you're not using it for practice",
        "Made from natural tree branch and straw materials for a rustic look",
        "Easy to mount on a wall, fence, or tree for quick target sessions",
        "Makes a great holiday or birthday gift for archery enthusiasts"
      ],
      cons: [
        "Decorative priority means it's less durable than competition targets",
        "Smaller diameter limits the usable shooting area"
      ]
    },
    {
      name: 'TOPARCHERY Traditional Solid Straw Archery Target',
      highlights: ['Dense Straw Fill', 'Rope Wrapped', 'Lightweight Build', 'Field Point Safe'],
      pros: [
        "Dense straw fill provides reliable stopping power for field point arrows",
        "Rope-wrapped edges keep the target from unraveling during use",
        "Lightweight enough for one person to carry and set up anywhere",
        "Budget-friendly price point for casual backyard archers"
      ],
      cons: [
        "Density can vary slightly between units due to handmade construction",
        "Doesn't hold up well when left outdoors in heavy rain for days"
      ]
    },
    {
      name: 'TBONTBY Traditional Solid Straw Archery Target',
      highlights: ['Tight Coil Pattern', 'Uniform Density', 'Easy Setup', 'Recurve Bow Safe'],
      pros: [
        "Tight coil pattern creates a uniform surface for consistent arrow stops",
        "Sets up in seconds with no assembly or frame required",
        "Safe for use with recurve bows and longbows at standard draw weights",
        "Replaceable target face papers let you keep the same base longer"
      ],
      cons: [
        "Straw tends to loosen around the edges after extended heavy use",
        "Not thick enough to stop arrows from compound bows over 40 lbs"
      ]
    },
    {
      name: 'Ogrmar 3 Layers 20 inch Traditional Solid Straw Archery Target',
      highlights: ['20 Inch Diameter', '3 Layer Thick', 'Visible Rings', 'Durable Binding'],
      pros: [
        "20-inch diameter gives plenty of surface area for practice at various distances",
        "Three layers of solid straw provide enough depth to stop arrows safely",
        "Clearly printed scoring rings help track accuracy improvements",
        "Durable outer binding resists fraying even after many sessions"
      ],
      cons: [
        "20-inch size may feel small for beginners shooting at longer ranges",
        "Arrows shot at high velocity can pass through the outer edges"
      ]
    },
    {
      name: 'Morrell Youth Field Point Bag Archery Target',
      highlights: ['Bag Target Design', 'Internal Fill', 'Weather Resistant', 'Youth Rated'],
      pros: [
        "Bag-style design handles field point arrows from bows up to 50 lbs",
        "Internal layered fill stops arrows quickly and allows easy removal",
        "Weather-resistant cover material holds up well when left outdoors",
        "Sized and rated specifically for youth archers and beginners"
      ],
      cons: [
        "Not a traditional straw target, so it has a different feel on arrow impact",
        "Heavier than pure straw targets when you need to move it"
      ]
    },
    {
      name: 'Block GenZ XL 20" Youth Archery Arrow Target',
      highlights: ['PolyFusion Layers', 'Easy Arrow Pull', 'Lightweight Foam', '4 Shootable Sides'],
      pros: [
        "PolyFusion layered technology makes arrow removal nearly effortless",
        "Lightweight foam construction is easy for young archers to carry",
        "Four shootable sides extend the overall lifespan of the target",
        "Open-layer design won't grab or damage arrow shafts"
      ],
      cons: [
        "Foam material differs from traditional straw target feel and look",
        "Not designed for broadhead tips or crossbow bolts"
      ]
    },
    {
      name: 'Block Vault 4-Sided Archery Target with Polyfusion Technology',
      highlights: ['4 Sided Shooting', 'PolyFusion Tech', 'High Visibility', 'All Arrow Types'],
      pros: [
        "Four shooting sides give you multiple fresh target faces to rotate through",
        "PolyFusion technology provides an easy-pull arrow removal experience",
        "High-visibility aiming points are easy to spot from 20+ yards",
        "Handles field points, broadheads, and expandable tips"
      ],
      cons: [
        "Heavier and bulkier than flat straw targets for storage",
        "Higher price compared to basic single-face straw options"
      ]
    }
  ],

  'competion-bows.md': [
    {
      name: 'Genesis Original Bow',
      highlights: ['Single Cam', 'Zero Let Off', 'No Draw Length Req', 'NASP Approved'],
      pros: [
        "Single cam design eliminates tuning issues and reduces noise",
        "Zero let-off means there's no specific draw length to set",
        "NASP approved and used in school archery programs nationwide",
        "Fits archers of any age, size, or skill level without adjustments"
      ],
      cons: [
        "10-20 lb draw weight is too light for hunting or advanced competition",
        "Outgrown quickly by serious archers who want more power"
      ]
    },
    {
      name: 'Diamond Archery',
      highlights: ['Binary Cam System', 'Wide Adjustment', 'Smooth Draw', 'Ready To Hunt'],
      pros: [
        "Binary cam system delivers a smooth, consistent draw cycle",
        "Wide draw weight and length adjustments grow with the archer",
        "Comes ready to shoot out of the box with accessories included",
        "Forgiving enough for beginners while capable for intermediate shooters"
      ],
      cons: [
        "Heavier than single-cam bows in the same class",
        "Factory strings may need an upgrade for serious tournament use"
      ]
    },
    {
      name: 'Genesis Pro Bow',
      highlights: ['Upgraded Cam', 'Customizable Setup', 'Aluminum Riser', 'Tournament Ready'],
      pros: [
        "Upgraded cam system compared to the Original for better performance",
        "More customization options for sight, rest, and stabilizer mounting",
        "Machined aluminum riser provides a solid, vibration-free platform",
        "Popular choice among competitive youth archers in NASP tournaments"
      ],
      cons: [
        "Still limited to lower draw weights for true competition archers",
        "Premium over the Genesis Original may not be worth it for casual use"
      ]
    },
    {
      name: 'Southland Archery Supply Outrage Compound Bow',
      highlights: ['55 lb Draw Weight', 'CNC Riser', 'Let Off System', 'Hunting Capable'],
      pros: [
        "Up to 55 lb draw weight makes it capable for both target and hunting use",
        "CNC machined aluminum riser ensures precision and durability",
        "Smooth let-off system makes holding at full draw comfortable",
        "Compact axle-to-axle length handles well in tight shooting lanes"
      ],
      cons: [
        "Not as adjustable as some grow-with-you compound bow packages",
        "Accessories like sights and rests aren't included"
      ]
    },
    {
      name: 'Southland Archery Supply Explorer Metal Rise Takedown Recurve Bow',
      highlights: ['Metal Riser', 'Maple Laminate', 'Takedown Design', 'Multiple Weights'],
      pros: [
        "Metal riser with maple laminated limbs for a stable, accurate platform",
        "Takedown design breaks apart for easy transport and storage",
        "Available in multiple draw weights from 20 to 36 lbs",
        "Threaded bushings accept standard sights, plungers, and stabilizers"
      ],
      cons: [
        "Limbs can feel stiff at lower draw weights during break-in",
        "Metal riser adds weight compared to wooden alternatives"
      ]
    },
    {
      name: 'Samick Sage Takedown Recurve Bow',
      highlights: ['Legendary Design', 'Hardwood Riser', 'Upgrade Path', 'Wide Draw Range'],
      pros: [
        "One of the most popular recurve bows among beginners and experienced archers alike",
        "Hardwood riser feels natural in the hand with a comfortable grip",
        "Limbs are interchangeable, letting you increase draw weight as you improve",
        "Available in draw weights from 25 to 60 lbs for any shooting style"
      ],
      cons: [
        "Doesn't include accessories, so you'll need to buy a rest and string separately",
        "Heavier riser may tire some archers during long practice sessions"
      ]
    },
    {
      name: 'SinoArt 68" Takedown Recurve Bow',
      highlights: ['68 Inch AMO', 'Hardwood Riser', 'Fiberglass Limbs', 'Target Length'],
      pros: [
        "68-inch AMO length provides stability for target and competition shooting",
        "Hardwood riser with fiberglass and maple laminated limbs shoots smoothly",
        "Longer limbs reduce finger pinch and improve draw comfort",
        "Accepts standard threaded accessories for full competition setups"
      ],
      cons: [
        "68-inch length is cumbersome for field archery or hunting in tight spaces",
        "Heavier overall weight compared to shorter recurve bows"
      ]
    },
    {
      name: 'SinoArt Metal Riser Takedown Recurve Bow',
      highlights: ['Metal Riser', 'Maple Limbs', 'Durable Build', 'Accessory Ready'],
      pros: [
        "Aluminum metal riser provides maximum stiffness and accuracy",
        "Maple laminated fiberglass limbs deliver a smooth, forgiving draw",
        "Durable construction handles frequent practice sessions without issue",
        "Threaded riser accepts sights, stabilizers, and arrow rests"
      ],
      cons: [
        "Metal riser gets cold in low temperatures during outdoor shooting",
        "Slightly heavier than wood-riser bows in the same draw weight class"
      ]
    },
    {
      name: 'Gonex Takedown Recurve Bow',
      highlights: ['Dacron String', 'Ergonomic Grip', 'Quick Assembly', 'Beginner Friendly'],
      pros: [
        "Durable Dacron bowstring provides consistent performance over time",
        "Ergonomic wooden grip reduces hand fatigue during long practice rounds",
        "Quick tool-free assembly gets you shooting in minutes",
        "Great starter recurve for archers exploring traditional shooting"
      ],
      cons: [
        "Lower draw weight options may feel underpowered for experienced archers",
        "Included string may need replacement sooner than premium alternatives"
      ]
    },
    {
      name: 'Southwest Archery Tigershark Takedown Recurve Bow',
      highlights: ['Satin Finish Riser', 'Fast Limbs', 'Premium Bowstring', 'Quiet Shot'],
      pros: [
        "All-new satin finish riser looks sharp and feels smooth in the hand",
        "Fast fiberglass limbs deliver impressive arrow speed for a recurve",
        "Comes with a premium-quality Dacron bowstring out of the box",
        "Quiet shot cycle makes it suitable for backyard practice"
      ],
      cons: [
        "Limited draw weight options compared to some takedown competitors",
        "Riser finish can show scuff marks over time with heavy use"
      ]
    }
  ],

  'larp-bow-and-arrow.md': [
    {
      name: 'WOARCHERY Combat Archery',
      highlights: ['Ambidextrous Design', 'ASTM Approved', '54 Inch Length', 'Fiberglass Limbs'],
      pros: [
        "Ambidextrous riser works for both left and right-hand shooters",
        "ASTM and CE safety approved for combat and LARP use",
        "Fiberglass limbs paired with a strong nylon riser",
        "Includes silica gel finger guard, stringer, and wrench"
      ],
      cons: [
        "No mounting points for sights or accessories",
        "30-40 lb draw weight may be too strong for young children"
      ]
    },
    {
      name: "TOP ARCHERY Traditional Recurve Bow 53''",
      highlights: ['Handmade Build', 'Leather Laminate', '40 lb Draw', 'Wall Display Ready'],
      pros: [
        "Carefully handmade with a polished and painted finish for durability",
        "Leather laminated grip prevents blisters during extended shooting",
        "53-inch length with a 28-inch draw provides solid traditional feel",
        "Doubles as a rustic wall-mounted decoration piece"
      ],
      cons: [
        "Arrows aren't included and must be purchased separately",
        "Some users report it wears down with daily heavy use"
      ]
    },
    {
      name: 'Feathered Indian Bow and Arrow Set',
      highlights: ['Native Art Style', 'Faux Fur Wrap', 'Ambidextrous', '40-50 lb Draw'],
      pros: [
        "Beautifully crafted with brown faux fur and Native American-inspired design",
        "Designed for both left and right-hand users",
        "Elastic bow provides a generous draw length without snapping",
        "Available in draw weights from 40 to 50 lbs"
      ],
      cons: [
        "Only one arrow included, so you'll need to buy more separately",
        "More of a decorative piece than a dedicated LARP combat bow"
      ]
    },
    {
      name: 'KAINOKAI Traditional Handmade Bow',
      highlights: ['Locust Wood Handle', 'Handcrafted Build', 'Arm Guard Included', 'Traditional Look'],
      pros: [
        "Locust wood handle is hand-polished for a beautiful traditional appearance",
        "Includes an arm guard, bowstring, targets, and three wooden arrows",
        "Paint and polish coating extends the bow's lifespan",
        "Makes an ideal gift for archery enthusiasts who love traditional gear"
      ],
      cons: [
        "Not collapsible, which makes transportation more difficult",
        "Longer length can be unwieldy in tight indoor LARP spaces"
      ]
    },
    {
      name: 'Enrack Recurve Bow for Archery',
      highlights: ['Hardwood Riser', 'Waterproof Limbs', '51 Inch Length', 'Easy Takedown'],
      pros: [
        "Hardwood bow riser with fiberglass limbs for a sturdy, reliable build",
        "Laminated limbs are waterproof and hold up in outdoor conditions",
        "Easily dismantled for compact storage and transportation",
        "Includes four gaskets, arm guard, screws, and a wrench"
      ],
      cons: [
        "Right-hand use only, so lefty archers will need to look elsewhere",
        "30-inch draw length may be short for taller adult archers"
      ]
    },
    {
      name: 'Rootmemory Bow And Arrow Archery',
      highlights: ['6 Carbon Arrows', 'Hardwood Build', '5 Target Faces', 'Complete Kit'],
      pros: [
        "Comes with six carbon arrows ready for real-time hunting or practice",
        "Made from hardwood that won't shrink or warp over time",
        "Package includes five target faces, quiver, and finger guard",
        "Ergonomic design is comfortable for beginner archers"
      ],
      cons: [
        "Right-hand design only with no left-hand option available",
        "30-40 lb draw weight range limits versatility for advanced shooters"
      ]
    },
    {
      name: 'Adventure Awaits! Handmade Wooden Bow and Arrow Set',
      highlights: ['Bamboo Build', '57 Inch Length', 'Leather Grip', '30-60 lb Range'],
      pros: [
        "Lightweight bamboo construction is easy to handle for all ages",
        "Supports a wide draw weight range from 30 to 60 lbs",
        "Comfortable leather-bound handle for extended shooting sessions",
        "Comes with 20 bamboo arrows, two quivers, and an arm guard"
      ],
      cons: [
        "Right-hand use only with no ambidextrous option",
        "Bamboo arrows aren't as durable as carbon or fiberglass options"
      ]
    }
  ],

  'left-handed-bow.md': [
    {
      name: 'Genesis Original Bow',
      highlights: ['Single Cam System', 'Left Hand Ready', 'Multiple Colors', 'NASP Approved'],
      pros: [
        "Single cam design means zero tuning issues and a quiet shot",
        "Available in left-hand configuration with multiple color options",
        "10-20 lb adjustable draw weight fits kids and beginners perfectly",
        "NASP approved and used in school archery programs across the country"
      ],
      cons: [
        "Low draw weight limits it to target shooting only",
        "Not suitable for experienced archers looking for more power"
      ]
    },
    {
      name: 'Samick Sage Takedown Recurve Bow',
      highlights: ['Lefty Available', 'Takedown Design', 'Hard Maple Riser', 'Wide Draw Range'],
      pros: [
        "Purpose-built left-hand model with a comfortable hard maple riser",
        "Takedown design lets you swap limbs to increase draw weight over time",
        "Available in draw weights from 25 to 60 lbs for beginners through experts",
        "Threaded bushings accept aftermarket sights, rests, and plungers"
      ],
      cons: [
        "No accessories included, so you'll need to buy a rest and arrows",
        "Can feel heavy for younger archers during long practice sessions"
      ]
    },
    {
      name: 'Barnett Outdoors Lil Banshee Jr. Compound Youth Archery Set',
      highlights: ['Youth Compound', '18 lb Draw', 'Soft Touch Grip', 'Complete Set'],
      pros: [
        "Designed specifically for young archers ages 5 to 8",
        "18 lb draw weight with 18-22 inch draw length fits small frames",
        "Soft-touch grip is comfortable for little hands",
        "Comes as a complete set with arrows and finger rollers"
      ],
      cons: [
        "Very limited draw weight with no room to grow",
        "Build quality reflects the low price point"
      ]
    },
    {
      name: 'Diamond Archery Infinite Edge Pro Bow Package',
      highlights: ['5-70 lb Range', 'Lifetime Bow', 'Full Package', 'Left Hand Model'],
      pros: [
        "Massive 5 to 70 lb draw weight range truly grows with you for years",
        "Comes as a complete package with sight, rest, quiver, and stabilizer",
        "Smooth draw cycle with solid back wall at full draw",
        "Available in a dedicated left-hand configuration"
      ],
      cons: [
        "Heavier than single-purpose bows due to its adjustable design",
        "Factory accessories may need upgrading for serious competition"
      ]
    },
    {
      name: 'Bear Archery Cruzer G2 Adult Compound Bow',
      highlights: ['5-70 lb Draw', '12-30 Inch Draw', 'Ready To Hunt', 'Left Hand Option'],
      pros: [
        "5 to 70 lb draw weight covers everything from youth to adult use",
        "12 to 30 inch draw length accommodates a wide range of body sizes",
        "Comes ready to hunt with trophy ridge sight, rest, quiver, and peep",
        "Smooth single-cam design provides a forgiving shooting experience"
      ],
      cons: [
        "At 3 lbs, it's heavier than some dedicated hunting compounds",
        "Limb bolts need frequent checking after draw weight adjustments"
      ]
    },
    {
      name: 'Bear Archery Approach RTH Compound Bow',
      highlights: ['340 FPS Speed', 'RTH Package', 'Hinge Guard', 'Left Hand Ready'],
      pros: [
        "Shoots up to 340 FPS, making it one of the fastest bows in its class",
        "Ready-to-Hunt package includes everything you need out of the box",
        "Bear's hinge guard cable system reduces torque for better accuracy",
        "Left-hand model available with the same full accessory package"
      ],
      cons: [
        "Higher price tag than most entry-level compound bows",
        "Speed-focused design can feel less forgiving than slower bows"
      ]
    },
    {
      name: 'Genesis Mini Bow',
      highlights: ['Mini Size', 'Youth Focused', '6-12 lb Draw', 'Left Hand Config'],
      pros: [
        "Scaled-down design built specifically for young archers under age 10",
        "6 to 12 lb draw weight is manageable for small children",
        "Same single-cam technology as the full-size Genesis for smooth shooting",
        "Available in left-hand configuration with fun color options"
      ],
      cons: [
        "Very limited draw weight range means kids outgrow it within a year or two",
        "Short draw length maxes out for taller children"
      ]
    },
    {
      name: 'PSE ARCHERY Mini Burner Compound Bow',
      highlights: ['Youth Compound', '40 lb Draw', 'Mossy Oak Camo', 'Ages 8-12'],
      pros: [
        "Designed for youth archers aged 8 to 12 with a 29-inch draw length",
        "Up to 40 lb draw weight gives growing archers room to progress",
        "Mossy Oak camo finish looks great and hides scuffs",
        "Smooth, forgiving cam system helps young shooters build confidence"
      ],
      cons: [
        "Limited to youth use and won't work for adult-sized archers",
        "Accessory compatibility is limited due to the compact riser"
      ]
    },
    {
      name: 'SinoArt Bow and Arrow Set for Teen',
      highlights: ['Teen Sized', 'Recurve Design', 'Complete Kit', 'Left Hand Option'],
      pros: [
        "Sized specifically for teen archers who've outgrown youth bows",
        "Recurve design teaches proper form and traditional shooting mechanics",
        "Comes as a complete kit with arrows, arm guard, and finger tab",
        "Affordable price makes it a low-risk way to get teens into archery"
      ],
      cons: [
        "Limited draw weight won't satisfy teens who progress quickly",
        "Included arrows are basic and may need upgrading for accuracy"
      ]
    }
  ],

  'mounted-archery-bow.md': [
    {
      name: 'Huntingdoor Archery Traditional Recurve Mongolian Horse Bow',
      highlights: ['Mongolian Style', 'Leather Wrapped', 'Compact 48 Inch', 'Handmade Build'],
      pros: [
        "Authentic Mongolian horse bow design with real leather wrapping",
        "Compact 48-inch length is ideal for shooting from horseback",
        "Handmade construction with attention to traditional craftsmanship",
        "Comes with additional accessories including a bowstring and arrow rest"
      ],
      cons: [
        "Requires a break-in period before the limbs reach full performance",
        "Leather wrapping can loosen over time and may need re-gluing"
      ]
    },
    {
      name: 'AF Turkish Short Bow',
      highlights: ['Turkish Design', 'Short Limbs', 'Laminated Build', 'Horseback Friendly'],
      pros: [
        "Authentic Turkish short bow design built for fast mounted shooting",
        "Short limb profile clears the horse's body on both sides easily",
        "Laminated construction with fiberglass and wood for durability",
        "Compact enough to draw and release quickly during a gallop"
      ],
      cons: [
        "Shorter draw length may feel restrictive for taller archers",
        "Needs a thumb ring for proper traditional Turkish shooting technique"
      ]
    },
    {
      name: 'AF Handmade Traditional Crimean Tatar Recurve Bow',
      highlights: ['Crimean Tatar Style', 'Handcrafted', 'Fiberglass Core', 'Smooth Draw'],
      pros: [
        "Handcrafted Crimean Tatar design with a unique historical aesthetic",
        "Fiberglass and wood laminated core delivers a smooth, fast draw",
        "Wide range of draw weights available for different skill levels",
        "Excellent choice for mounted archery competitions and practice"
      ],
      cons: [
        "Handmade nature means slight variations between individual bows",
        "Higher price point than mass-produced horse bows"
      ]
    },
    {
      name: 'Southland Archery Traditional Recurve Bow',
      highlights: ['Bamboo Limbs', 'Wooden Riser', 'Versatile Use', 'SAS Quality'],
      pros: [
        "Bamboo and fiberglass limbs provide a smooth, responsive draw",
        "Wooden riser has a comfortable grip for extended shooting sessions",
        "Versatile enough for ground archery, horseback, and target practice",
        "Southland Archery Supply is a trusted name in traditional archery gear"
      ],
      cons: [
        "Longer than ideal for tight-clearance mounted archery maneuvers",
        "Right-hand only design limits availability for lefty archers"
      ]
    },
    {
      name: 'Premium Korean Traditional Bow',
      highlights: ['Korean Design', 'Fast Arrow Speed', 'Compact Profile', 'Competition Grade'],
      pros: [
        "Korean traditional bow design produces impressive arrow speed for its size",
        "Compact profile is perfect for mounted archery courses",
        "Used in competitive mounted archery events worldwide",
        "Lightweight construction reduces arm fatigue during repeated shots"
      ],
      cons: [
        "Requires practice to adapt to the unique Korean draw technique",
        "Limited draw weight options compared to other horse bows on this list"
      ]
    },
    {
      name: 'PSE Archery Pro Max Traditional Recurve Bow',
      highlights: ['PSE Craftsmanship', 'Maple Laminate', 'Smooth Shooting', 'Affordable Price'],
      pros: [
        "PSE's proven craftsmanship delivers a reliable, well-built recurve",
        "Maple laminated limbs produce a smooth and quiet shot",
        "Affordable entry point into traditional and mounted archery",
        "Available in multiple draw weights for different shooting needs"
      ],
      cons: [
        "Longer AMO length isn't specifically designed for horseback use",
        "Plain finish may not appeal to archers wanting a traditional aesthetic"
      ]
    },
    {
      name: 'D&Q Takedown Recurve Bow and Arrow',
      highlights: ['Takedown Build', 'Aluminum Riser', 'Durable Limbs', 'Full Accessory Kit'],
      pros: [
        "Takedown design makes it easy to transport to the stable or range",
        "Strong aluminum alloy riser paired with fiberglass laminated limbs",
        "Comes with a complete accessory kit including arrows and arm guard",
        "Limbs are interchangeable if you want to change draw weight later"
      ],
      cons: [
        "Aluminum riser is heavier than wooden alternatives for mounted use",
        "Included arrows are basic quality and may need upgrading"
      ]
    },
    {
      name: 'Spyder XL Takedown Recurve Bow',
      highlights: ['64 Inch Length', 'CNC Aluminum', 'ILF Limb System', 'Tournament Capable'],
      pros: [
        "CNC machined aluminum riser provides outstanding accuracy and stiffness",
        "ILF limb system lets you swap limbs from many different manufacturers",
        "Tournament-capable build quality at an accessible price point",
        "Smooth draw and shot cycle reduce hand shock"
      ],
      cons: [
        "64-inch length is too long for practical horseback archery",
        "Heavier setup weight compared to traditional wooden horse bows"
      ]
    },
    {
      name: 'AF Turkish Style Handmade Traditional Laminated Recurve Bow',
      highlights: ['Turkish Style', 'Handmade Laminate', 'Beginner Friendly', 'Draw Weight Range'],
      pros: [
        "Handmade Turkish-style design is perfect for learning mounted archery basics",
        "Laminated construction with fiberglass provides consistent performance",
        "Available in a wide range of draw weights for all skill levels",
        "Short enough to clear the horse during mounted shooting drills"
      ],
      cons: [
        "Handmade quality can vary slightly between batches",
        "Finish isn't as polished as more expensive AF Archery models"
      ]
    },
    {
      name: 'Bear Archery Grizzly Recurve Right Hand',
      highlights: ['Bear Heritage', 'Satin Finish', 'One Piece Build', 'Rugged Design'],
      pros: [
        "Bear Archery's legendary Grizzly name with decades of proven performance",
        "One-piece design with a satin-finished hardwood riser feels premium",
        "Rugged build handles rough field conditions without damage",
        "Smooth shooting characteristics that instinctive archers love"
      ],
      cons: [
        "One-piece construction means you can't break it down for easy transport",
        "Right-hand only, so left-hand mounted archers need to look elsewhere"
      ]
    }
  ],

  'wooden-bows.md': [
    {
      name: 'Wooden Shop Youth Wooden Bow And Arrows',
      highlights: ['Youth Sized', 'Solid Wood', 'Safe Design', 'Starter Kit'],
      pros: [
        "Made from solid wood with a kid-friendly size that's easy to handle",
        "Safe design with rounded arrow tips for worry-free backyard use",
        "Perfect starter kit for children interested in learning archery",
        "Lightweight enough for small hands to hold and draw comfortably"
      ],
      cons: [
        "Not built for serious target practice or any real hunting use",
        "Low draw weight means limited arrow distance and speed"
      ]
    },
    {
      name: 'Longbowmaker Handmade Longbow',
      highlights: ['Handcrafted Wood', 'Traditional Longbow', 'Hungarian Style', 'Practice Ready'],
      pros: [
        "Handcrafted from quality wood with a traditional longbow profile",
        "Hungarian-style design delivers smooth shooting for target archery",
        "Well-suited for archers who enjoy traditional shooting without modern gadgets",
        "Impressive craftsmanship at a reasonable price point"
      ],
      cons: [
        "No accessories included, so arrows and a string must be sourced separately",
        "Handmade construction means slight cosmetic differences between units"
      ]
    },
    {
      name: 'Southland Robinhood Longbow',
      highlights: ['Classic Longbow', 'Hunting Ready', 'Laminated Limbs', 'Adult Sized'],
      pros: [
        "Classic English longbow design works for both hunting and recreation",
        "Laminated wood construction provides consistent flex and durability",
        "Adult-sized length delivers a smooth draw and stable shot",
        "Nostalgic Robin Hood aesthetic appeals to traditional archery fans"
      ],
      cons: [
        "Single draw weight option limits flexibility for different archers",
        "One-piece design isn't as portable as takedown alternatives"
      ]
    },
    {
      name: 'TOPARCHERY Handmade Longbow',
      highlights: ['35 lb Draw', 'Bamboo Laminate', 'Lightweight Build', 'Beginner Ready'],
      pros: [
        "35 lb draw weight is perfect for newcomers learning proper form",
        "Bamboo and fiberglass laminated limbs deliver a smooth release",
        "Lightweight build is easy to hold at full draw without arm fatigue",
        "Traditional handmade appearance with dependable modern materials"
      ],
      cons: [
        "35 lb draw may feel too light for experienced traditional archers",
        "Limited color and finish options compared to more expensive bows"
      ]
    },
    {
      name: 'AF Archery Laminated Longbow',
      highlights: ['Laminated Build', 'Stable Platform', 'Right Hand', 'Smooth Draw'],
      pros: [
        "Multi-layer laminated construction provides excellent stability and consistency",
        "Smooth draw cycle with minimal hand shock on release",
        "Durable enough for frequent practice sessions without limb fatigue",
        "Quality craftsmanship from AF Archery, a respected traditional bow maker"
      ],
      cons: [
        "Right-hand only design excludes left-handed archers",
        "Longer length can be challenging to maneuver in heavy brush"
      ]
    },
    {
      name: 'Martin Savannah Longbow',
      highlights: ['Martin Heritage', 'Reflex Deflex', 'Gordon Glass', 'American Made'],
      pros: [
        "Martin's reflex-deflex design improves arrow speed while keeping the shot smooth",
        "Gordon fiberglass limbs paired with quality wood provide years of use",
        "American-made craftsmanship from one of archery's most respected brands",
        "Comfortable grip shape works well for instinctive shooting"
      ],
      cons: [
        "Premium price reflects the Martin name and American manufacturing",
        "One-piece construction limits portability for travel"
      ]
    },
    {
      name: 'SAS Pioneer Longbow',
      highlights: ['Comfortable Grip', 'Maple Laminate', 'Smooth Performance', 'Value Price'],
      pros: [
        "Ergonomic grip design provides outstanding comfort during long shooting sessions",
        "Maple and fiberglass laminated limbs deliver smooth, consistent performance",
        "Great value for archers wanting a quality longbow without breaking the bank",
        "68-inch length offers a forgiving, smooth draw for taller archers"
      ],
      cons: [
        "68-inch length is too long for hunting in tight woodland areas",
        "Basic finish may not impress archers looking for a showpiece bow"
      ]
    },
    {
      name: 'Bear Archery Montana Longbow',
      highlights: ['Bear Legacy', 'Crowned Riser', 'Satin Finish', 'Hunting Proven'],
      pros: [
        "Bear Archery's Montana line is a proven performer for traditional hunters",
        "Crowned, locator grip riser made from premium hardwoods",
        "Satin finish on the limbs looks elegant and protects the wood",
        "Delivers enough power for hunting with proper draw weights"
      ],
      cons: [
        "One of the pricier longbows on this list",
        "Non-takedown design makes it harder to store and transport"
      ]
    },
    {
      name: 'SinoArt Sparrow Longbow',
      highlights: ['Beginner Friendly', 'Lightweight Frame', 'Smooth Shooting', 'Women and Teens'],
      pros: [
        "Designed specifically for beginners, women, and teens getting started",
        "Lightweight frame is easy to hold and draw without muscle strain",
        "Smooth shooting performance helps new archers focus on building form",
        "Available in lower draw weights that are comfortable for smaller frames"
      ],
      cons: [
        "Low draw weight range limits usefulness for hunting or advanced practice",
        "Basic construction won't satisfy archers who want a premium feel"
      ]
    },
    {
      name: 'SAS Gravity Hunting Traditional Longbow',
      highlights: ['Hunting Focused', 'High Draw Weight', 'Fiberglass Backed', 'Field Ready'],
      pros: [
        "Built for hunting with draw weights that produce enough kinetic energy for game",
        "Fiberglass-backed limbs add durability and snap to the shot",
        "Field-ready design handles rain, cold, and rough terrain without damage",
        "Solid choice for traditional hunters who prefer longbows over recurves"
      ],
      cons: [
        "Higher draw weights can be challenging for newer archers to manage",
        "Heavier overall weight compared to lighter recreational longbows"
      ]
    }
  ]
};

// Process each file
for (const [filename, products] of Object.entries(productData)) {
  const filePath = join(postsDir, filename);
  let content = readFileSync(filePath, 'utf8');

  for (const product of products) {
    const { name, highlights, pros, cons } = product;

    // 1. Replace frontmatter highlights for this product
    // Find the product block in frontmatter by name, then replace its highlights
    const fmHighlightsOld = `    highlights:\n      - "Quality Build"\n      - "Great Value"\n      - "Archery Tested"\n      - "Top Rated"`;
    const fmHighlightsNew = `    highlights:\n${highlights.map(h => `      - "${h}"`).join('\n')}`;

    // 2. Replace frontmatter pros
    const fmProsOld = `    pros:\n      - "Well-designed for archery use"\n      - "Good value for the price"\n      - "Durable construction"`;
    const fmProsNew = `    pros:\n${pros.map(p => `      - "${p}"`).join('\n')}`;

    // 3. Replace frontmatter cons
    const fmConsOld = `    cons:\n      - "May not suit all preferences"\n      - "Size options may vary"`;
    const fmConsNew = `    cons:\n${cons.map(c => `      - "${c}"`).join('\n')}`;

    // 4. Replace body highlight-tag spans (generic)
    const bodyHighlightsOld = `<span class="highlight-tag">Quality Build</span>\n<span class="highlight-tag">Great Value</span>\n<span class="highlight-tag">Archery Tested</span>\n<span class="highlight-tag">Top Rated</span>`;
    const bodyHighlightsNew = highlights.map(h => `<span class="highlight-tag">${h}</span>`).join('\n');

    // 5. Replace body pros-list items (generic)
    const bodyProsOld = `<li>Well-designed for archery use</li>\n<li>Good value for the price</li>\n<li>Durable construction</li>`;
    const bodyProsNew = pros.map(p => `<li>${p}</li>`).join('\n');

    // 6. Replace body cons-list items (generic)
    const bodyConsOld = `<li>May not suit all preferences</li>\n<li>Size options may vary</li>`;
    const bodyConsNew = cons.map(c => `<li>${c}</li>`).join('\n');

    // Apply replacements (one at a time, first occurrence only for frontmatter)
    content = content.replace(fmHighlightsOld, fmHighlightsNew);
    content = content.replace(fmProsOld, fmProsNew);
    content = content.replace(fmConsOld, fmConsNew);
    content = content.replace(bodyHighlightsOld, bodyHighlightsNew);
    content = content.replace(bodyProsOld, bodyProsNew);
    content = content.replace(bodyConsOld, bodyConsNew);
  }

  writeFileSync(filePath, content, 'utf8');

  // Verify no generic content remains
  const remaining = content.match(/Quality Build|Well-designed for archery use|May not suit all preferences/g);
  if (remaining) {
    console.log(`WARNING: ${filename} still has ${remaining.length} generic matches remaining`);
  } else {
    console.log(`OK: ${filename} - all generic content replaced`);
  }
}

console.log('\nDone. All products updated.');
