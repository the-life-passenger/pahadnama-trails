const { db } = require('./database.js');

console.log('Seeding Pahadnama Trails database...');

// Clear existing sample treks if any to avoid duplication
db.exec('DELETE FROM photos;');
db.exec('DELETE FROM faqs;');
db.exec('DELETE FROM trek_dates;');
db.exec('DELETE FROM feedback;');
db.exec('DELETE FROM treks;');

const treksData = [
  {
    name: "Harishchandragad — Kokankada & Kedareshwar",
    slug: "harishchandragad",
    tagline: "The Grand Canyon of Maharashtra & Ancient Cave Temples",
    location: "Khireshwar / Pachnai, Ahmednagar",
    region: "Malshej Ghat, Sahyadri",
    difficulty: "Moderate",
    duration: "1 Night 1 Day",
    distance: "9 km round trip",
    height: "4,665 ft (1,422 m)",
    season: "Monsoon & Winter",
    price: 1399,
    original_price: 1899,
    cover_photo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Konkan_kada%2C_harishchandragad_1.jpg",
    short_description: "Experience the jaw-dropping semicircular Kokankada cliff with misty reverse winds and the timeless Kedareshwar cave.",
    description: "Harishchandragad is an ancient hill fort renowned throughout the Sahyadris for its dramatic vertical rock face of Kokankada, historic 6th-century rock-carved temples, and the mystical Kedareshwar Cave where a giant Shiva Linga stands submerged in ice-cold waters supported by a single pillar.",
    highlights: JSON.stringify([
      "Legendary Konkan Kada semicircular cliff with reverse wind effect",
      "Ancient Kedareshwar Cave Temple surrounded by waist-deep waters",
      "Temple of Harishchandreshwar showcasing Hemadpanthi architecture",
      "Stunning monsoon greenery and sea of clouds experience",
      "Certified mountain trek leaders with safety-first protocol"
    ]),
    itinerary: JSON.stringify([
      "10:30 PM (Friday) — Mumbai pickup from Dadar, Chembur, Vashi, Thane & Kalyan",
      "04:30 AM — Reach base village Pachnai, freshen up & relax",
      "05:30 AM — Hot local Maharashtrian breakfast (Poha/Misal) & hot tea",
      "06:00 AM — Safety briefing & trek commencement via forest trail",
      "09:15 AM — Reach Harishchandreshwar Temple plateau & Kedareshwar Cave",
      "10:30 AM — Explore the epic Konkan Kada cliff & witness cloud formations",
      "12:30 PM — Begin descent back towards base village",
      "02:30 PM — Relish freshly prepared village lunch (veg / jowar bhakri / thecha)",
      "04:00 PM — Board vehicle for return journey to Mumbai",
      "09:30 PM — Reach Mumbai with unforgettable Sahyadri memories"
    ]),
    inclusions: JSON.stringify([
      "Private Non-AC bus travel from Mumbai to base village & return",
      "Morning breakfast with piping hot tea",
      "Authentic village lunch (Unlimited home-cooked Maharashtrian meal)",
      "Trek expertise, mountain guides, and route coordination",
      "First aid medical assistance & emergency gear",
      "Forest department entry permits and local toll taxes"
    ]),
    exclusions: JSON.stringify([
      "Personal expenses, bottled mineral water, and cold drinks",
      "Any extra food ordered outside the scheduled menu",
      "Medical insurance or personal emergency evacuations",
      "Anything not mentioned in the inclusions section"
    ]),
    meeting_point: "Dadar Station (Pritam Hotel) 10:30 PM • Chembur Amar Mahal 11:00 PM • Vashi Old Toll Plaza 11:20 PM • Thane Teen Hath Naka 11:45 PM • Kalyan Bypass 12:15 AM",
    pickups: JSON.stringify(["Dadar (Pritam Hotel)", "Chembur (Amar Mahal)", "Vashi (Plaza)", "Thane (Teen Hath Naka)", "Kalyan (Bypass)"]),
    things_to_carry: JSON.stringify([
      "Sturdy trekking or sports shoes with good rubber grip (mandatory)",
      "At least 2 to 3 litres of drinking water",
      "Raincoat, poncho, or windcheater (during monsoon batches)",
      "Extra set of dry clothes packed in plastic cover",
      "Small comfortable backpack (20L to 30L)",
      "Personal medications, band-aids, ORS / Glucon-D",
      "Torch or headlamp with fresh batteries"
    ]),
    instructions: "Please wear comfortable full-length quick-dry trekking pants and breathable t-shirts. Avoid jeans, tight denims, and slippery footwear. Alcohol and smoking are strictly prohibited on all Pahadnama Trails journeys.",
    cancellation_policy: "Cancellations made 48 hours before departure receive an 80% refund or free batch transfer. Cancellations within 24 hours of departure are non-refundable as vehicle and food logistics are pre-booked.",
    is_featured: 1,
    status: "active",
    gallery: [
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Konkan_kada%2C_harishchandragad_1.jpg",
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Harishchandragadh_Temple.jpg",
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kedareshwar_temple_at_Harishchandragad.jpg",
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Konkan_Kada_Harishchandragad.jpg"
    ],
    faqs: [
      { q: "Is Harishchandragad via Pachnai suitable for beginners?", a: "Yes! The Pachnai route is moderate and well-marked with gradual inclines and rock-cut railings, making it comfortable for beginners with reasonable stamina." },
      { q: "Are washrooms available at the base village?", a: "Yes, basic washrooms and changing rooms are available at our partner homestay in the base village before starting and after descending." },
      { q: "What if it rains heavily during the trek?", a: "Our certified trek leaders monitor local weather alerts and carry all necessary safety gear. The Pachnai trail remains safe even in rains, though proper raincoats and non-slip trekking shoes are mandatory." },
      { q: "Is food vegetarian?", a: "Yes, we serve freshly cooked, authentic vegetarian Maharashtrian food (dal, seasonal sabzi, hot jowar/bajra bhakri or chapatis, rice, and traditional thecha)." }
    ]
  },
  {
    name: "Kalsubai Peak — Everest of Maharashtra",
    slug: "kalsubai-peak",
    tagline: "Conquer Maharashtra's Highest Point at 5,400 Feet",
    location: "Bari Village, Igatpuri / Akole",
    region: "Kalsubai Harishchandragad Wildlife Sanctuary",
    difficulty: "Moderate",
    duration: "1 Day (Day Trek / Night Ascent)",
    distance: "6.6 km round trip",
    height: "5,400 ft (1,646 m)",
    season: "Monsoon, Winter & Pre-Monsoon Fireflies",
    price: 1299,
    original_price: 1699,
    cover_photo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kalsubai_peak.jpg",
    short_description: "Climb the highest summit in Maharashtra and touch the clouds at 5,400 ft with safe ladder sections and unmatched views.",
    description: "Kalsubai Peak reigns as the highest geographic summit of Maharashtra. Located in the picturesque Sahyadri range, the trail takes you past green paddy fields, gushing streams, vertical steel ladders secured into rock patches, and culminates at the revered Kalsubai Devi shrine with sweeping views of Bhandardara reservoir.",
    highlights: JSON.stringify([
      "Stand atop the highest point in Maharashtra at 5,400 ft (1,646 m)",
      "Thrill of climbing well-anchored steel ladder bridges on vertical cliffs",
      "Revered Kalsubai Temple at the summit",
      "Panoramic views of Alang, Madan, Kulang, Ratangad and Arthur Lake",
      "Dedicated trek leads and supportive group pace"
    ]),
    itinerary: JSON.stringify([
      "11:00 PM (Saturday night) — Departure from Mumbai (Dadar / Thane / Kalyan)",
      "04:15 AM — Reach base village Bari, rest & freshen up",
      "05:15 AM — Hot breakfast and authentic chai",
      "05:45 AM — Safety briefing and commencement of ascent",
      "09:15 AM — Reach Kalsubai summit! Flag unfurling, temple visit & photography",
      "10:30 AM — Start descent via ladder routes with guides assisting",
      "01:30 PM — Reach Bari base village & freshen up",
      "02:00 PM — Relish warm village lunch cooked with love by local hosts",
      "03:30 PM — Depart for Mumbai with songs and stories",
      "08:30 PM — Arrival in Mumbai"
    ]),
    inclusions: JSON.stringify([
      "Comfortable transport Mumbai–Bari–Mumbai",
      "Nutritious morning breakfast & tea",
      "Traditional home-style lunch at base village",
      "Forest sanctuary entry fees & permits",
      "Pahadnama experienced trek leaders",
      "First aid support"
    ]),
    exclusions: JSON.stringify([
      "Bottled water or soft drinks",
      "Lunch outside the fixed menu",
      "Any individual expenses"
    ]),
    meeting_point: "Borivali East (National Park) 10:30 PM • Dadar Pritam 11:00 PM • Thane Teen Hath Naka 11:45 PM • Kalyan Bypass 12:15 AM",
    pickups: JSON.stringify(["Borivali", "Dadar", "Thane", "Kalyan"]),
    things_to_carry: JSON.stringify([
      "Trekking shoes with solid grip",
      "3 litres of water",
      "Rainwear (monsoon)",
      "Change of clothes",
      "Small backpack",
      "Energy snacks / dry fruits",
      "Government photo ID card"
    ]),
    instructions: "Hydrate well before the trek. The ladder sections require patience and two hands on the handrails. Follow the instructions of the sweep and lead guides at all times.",
    cancellation_policy: "Full refund or free batch rollover on cancellations made at least 48 hours prior to the batch start time.",
    is_featured: 1,
    status: "active",
    gallery: [
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kalsubai_peak.jpg",
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kalsubai_Temple.jpg",
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Steps_to_Kalsubai_Peak.jpg",
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kalsubai_summit_view.jpg"
    ],
    faqs: [
      { q: "Are the steel ladders on Kalsubai safe?", a: "Yes, the ladders are firmly anchored into the volcanic basalt by the local forest department and have sturdy side railings. Our team escorts every participant safely across these sections." },
      { q: "How cold or windy does it get at the top?", a: "During monsoon and winter mornings, the summit is exceptionally windy with dense fog and temperatures dropping significantly. Carrying a windcheater or light jacket is recommended." }
    ]
  },
  {
    name: "Devkund Waterfall — Secret Blue Lagoon",
    slug: "devkund-waterfall",
    tagline: "Plunge into Sahyadri's Turquoise Forest Wonderland",
    location: "Bhira, Patnus, Raigad",
    region: "Tamhini Ghat, Western Ghats",
    difficulty: "Easy to Moderate",
    duration: "1 Day",
    distance: "7 km round trip",
    height: "River valley trail",
    season: "Monsoon & Post-Monsoon",
    price: 1199,
    original_price: 1599,
    cover_photo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Devkund_Waterfall_in_Maharashtra.jpg",
    short_description: "Walk through whispering Tamhini forests and sparkling stream crossings to find Maharashtra’s most breathtaking natural waterfall pond.",
    description: "Devkund is a majestic natural spectacle tucked deep inside the dense forests of Tamhini Ghat. Created by the confluence of three mountain streams, the waterfall drops from towering basalt cliffs directly into a shimmering emerald pool. The trail takes you through untouched forest canopies, river stones, and gentle rustic paths.",
    highlights: JSON.stringify([
      "Spectacular turquoise pond fed by three mountain water streams",
      "Scenic trail through dense Tamhini rainforests",
      "Fun natural stream crossings with trek leader guidance",
      "Safe and certified swimming boundaries monitored by local guards",
      "Beginner-friendly trail ideal for friends, solo travellers & families"
    ]),
    itinerary: JSON.stringify([
      "05:00 AM — Morning Mumbai pickup (Borivali / Dadar / Chembur / Vashi)",
      "08:30 AM — Reach Bhira base village, freshen up & village breakfast",
      "09:15 AM — Forest check-in & commence the jungle walk",
      "11:30 AM — Arrive at Devkund Waterfall! Soak in the roar of cascading water",
      "01:00 PM — Trek back through the forest canopy",
      "02:45 PM — Reach base village & indulge in freshly cooked lunch",
      "04:00 PM — Board our vehicle for the relaxing return trip",
      "08:30 PM — Drop-offs at Mumbai"
    ]),
    inclusions: JSON.stringify([
      "Travel by private transport Mumbai–Bhira–Mumbai",
      "Morning breakfast & hot tea",
      "Authentic local lunch at Bhira village",
      "Forest department entry fees & local guide charges",
      "Pahadnama trek captains & first aid support"
    ]),
    exclusions: JSON.stringify([
      "Personal snacks or extra beverage orders",
      "Any activities outside the planned itinerary"
    ]),
    meeting_point: "Borivali (National Park Gate) 04:30 AM • Dadar (Pritam Hotel) 05:00 AM • Chembur (Amar Mahal) 05:25 AM • Vashi (Toll Naka) 05:45 AM",
    pickups: JSON.stringify(["Borivali", "Dadar", "Chembur", "Vashi"]),
    things_to_carry: JSON.stringify([
      "Footwear with rubber soles (shoes that can handle water)",
      "Complete set of extra clothes & towel",
      "Water bottle (min 2 litres)",
      "Waterproof cover for phones and valuables",
      "Rainwear / poncho",
      "Personal toiletries"
    ]),
    instructions: "Entering the deep water zone beyond the marked safety ropes is strictly forbidden. The forest department and our leaders maintain constant vigil.",
    cancellation_policy: "Cancellations made 48 hours in advance are eligible for an 80% refund or transfer to another weekend batch.",
    is_featured: 1,
    status: "active",
    gallery: [
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Devkund_Waterfall_in_Maharashtra.jpg",
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Devkund_waterfall_pond.jpg",
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Devkund_Trail_Tamhini.jpg"
    ],
    faqs: [
      { q: "Is swimming allowed in the Devkund pool?", a: "Participants can wade in the shallow, designated edge of the pond under guide supervision. Deep areas are cordoned off by forest safety ropes." },
      { q: "Can beginners and first-timers join this trek?", a: "Yes! Devkund has very minimal elevation gain and is mostly flat forest walking, making it one of Maharashtra's best beginner trails." }
    ]
  },
  {
    name: "Rajgad Fort — The Royal Capital of Shivaji Maharaj",
    slug: "rajgad-fort",
    tagline: "Walk the Legendary Ramparts of the King of Sahyadri Forts",
    location: "Gunjavane, Bhor, Pune",
    region: "Sahyadri Forts, Pune District",
    difficulty: "Moderate",
    duration: "1 Day",
    distance: "8.5 km round trip",
    height: "4,514 ft (1,376 m)",
    season: "All Year (Monsoon & Winter Peak)",
    price: 1299,
    original_price: 1699,
    cover_photo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Rajgad_Fort_view.jpg",
    short_description: "Explore the king of all forts in Maharashtra — magnificent fortresses, double ramparts, and panoramic mountain views.",
    description: "Rajgad, literally meaning the 'King of Forts', served as the capital of Chhatrapati Shivaji Maharaj for over two and a half decades. The massive fort features three sprawling arms known as Padmavati Machi, Suvela Machi, and Sanjivani Machi, crowned by the impregnable Balekilla citadel.",
    highlights: JSON.stringify([
      "Historical capital of Maratha Empire for over 26 years",
      "Double fortified ramparts and stone bastions at Sanjivani Machi",
      "Iconic 'Nedhe' natural rock needle-hole on Suvela Machi",
      "Massive panoramic views of Torna, Sinhagad, and Bhatghar Dam",
      "Rich Maratha history narration by certified trek leaders"
    ]),
    itinerary: JSON.stringify([
      "11:00 PM (Saturday) — Mumbai pickup (Dadar / Chembur / Vashi / Pune Expressway)",
      "05:00 AM — Arrive at Gunjavane base village, relax & freshen up",
      "05:45 AM — Fresh village breakfast & hot tea",
      "06:30 AM — Ascend via the Gunjavane Darwaza trail",
      "09:30 AM — Reach Padmavati Machi, visit Padmavati Temple and Rameshwar Temple",
      "10:30 AM — Walk the scenic ridge to Suvela Machi and Nedhe viewpoint",
      "01:00 PM — Descend to base village",
      "03:00 PM — Enjoy authentic Maharashtrian Pithla Bhakri lunch",
      "04:30 PM — Return journey to Mumbai / Pune",
      "09:30 PM — Arrival in Mumbai"
    ]),
    inclusions: JSON.stringify([
      "Private bus transport from Mumbai & back",
      "Breakfast with tea & authentic Maharashtrian lunch",
      "Historical trek guide & leadership charges",
      "First aid and safety equipment"
    ]),
    exclusions: JSON.stringify([
      "Mineral water, cold drinks, personal snacks",
      "Anything not mentioned in inclusions"
    ]),
    meeting_point: "Dadar Pritam Hotel 11:00 PM • Chembur 11:30 PM • Vashi Toll 11:50 PM • Panvel 12:15 AM",
    pickups: JSON.stringify(["Dadar", "Chembur", "Vashi", "Panvel"]),
    things_to_carry: JSON.stringify([
      "Good grip shoes", "2.5L water", "Cap / sunglasses / rain jacket", "Extra clothes", "Personal medical kit"
    ]),
    instructions: "Rajgad is a revered heritage fort. Please respect all historical monuments and maintain cleanliness.",
    cancellation_policy: "Cancellations 48 hours prior to departure receive full rollover to future batches or 80% refund.",
    is_featured: 1,
    status: "active",
    gallery: [
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Rajgad_Fort_view.jpg",
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Sanjivani_Machi_Rajgad.jpg",
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Suvela_Machi_Rajgad.jpg"
    ],
    faqs: [
      { q: "Is Rajgad Fort suitable for children and families?", a: "Children above 10 years with good outdoor stamina can comfortably complete the trek via the Gunjavane or Chor Darwaza route under guide supervision." }
    ]
  },
  {
    name: "Jivdhan Fort & Reverse Waterfall Trail",
    slug: "jivdhan-fort",
    tagline: "Rock-Cut Passages & Historic Trade Gates of Naneghat",
    location: "Ghatghar, Junnar, Pune",
    region: "Naneghat Sahyadri Pass",
    difficulty: "Moderate to Thrilling",
    duration: "1 Day",
    distance: "7.5 km round trip",
    height: "3,757 ft (1,145 m)",
    season: "Monsoon & Winter",
    price: 1199,
    original_price: 1599,
    cover_photo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Jivdhan%202.JPG",
    short_description: "Trek the historic fortress guarding the ancient 2,000-year-old Naneghat trade route with thrilling rock-cut steps.",
    description: "Jivdhan Fort stands tall at the edge of the Deccan plateau overlooking the dramatic Konkan plains. Famous for guarding the ancient Satavahana-era Naneghat pass, it features magnificent rock-carved steps, ancient granaries, and the towering independent pinnacle of Vanarlingi.",
    highlights: JSON.stringify([
      "Ancient rock-cut staircases chiseled into the cliff face",
      "Spectacular view of the Vanarlingi climbing pinnacle",
      "Explore ancient water tanks, bastions, and Kalyan Darwaza",
      "Experience the reverse waterfall phenomenon at Naneghat during monsoons",
      "Accompanied by professional mountaineers and guides"
    ]),
    itinerary: JSON.stringify([
      "11:30 PM (Saturday) — Mumbai pickup",
      "05:00 AM — Reach Ghatghar village base & freshen up",
      "05:45 AM — Breakfast & safety briefing",
      "06:30 AM — Start trek to Jivdhan Fort",
      "09:30 AM — Summit exploration and Vanarlingi view",
      "12:30 PM — Descend to base village",
      "02:00 PM — Relish warm village lunch",
      "03:30 PM — Visit Naneghat reverse waterfall point",
      "05:00 PM — Depart for Mumbai",
      "09:30 PM — Drop-offs at Mumbai"
    ]),
    inclusions: JSON.stringify([
      "Travel from Mumbai and back", "Breakfast & tea", "Traditional village lunch", "Trek guidance & first aid"
    ]),
    exclusions: JSON.stringify(["Personal expenses", "Mineral water bottles"]),
    meeting_point: "Dadar 11:00 PM • Thane 11:45 PM • Kalyan 12:20 AM",
    pickups: JSON.stringify(["Dadar", "Thane", "Kalyan"]),
    things_to_carry: JSON.stringify(["Sturdy shoes", "2L water", "Rain gear", "Small backpack", "Extra clothes"]),
    instructions: "Rock steps can be slippery during rains. Use both hands and follow the lead instructor.",
    cancellation_policy: "Full rollover or 80% refund if cancelled 48 hours before departure.",
    is_featured: 1,
    status: "active",
    gallery: [
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Jivdhan%202.JPG",
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Jivdhan%203.JPG",
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Jivdhan%20Fort%20Junnar%20Pune%20%281%29%2001.jpg"
    ],
    faqs: [
      { q: "What is the reverse waterfall at Naneghat?", a: "During heavy monsoons, the strong updraft of winds blowing against the vertical cliffs of Naneghat forces the falling water streams upward into the sky, creating a reverse waterfall." }
    ]
  },
  {
    name: "Bhaskargad (Kulang Twin) & Waterfall Trail",
    slug: "bhaskargad-waterfall",
    tagline: "Verdant Monsoon Escapes in the Trimbak Mountain Range",
    location: "Nirgudpada, Trimbakeshwar, Nashik",
    region: "Trimbakeshwar Sahyadri Range",
    difficulty: "Easy to Moderate",
    duration: "1 Day",
    distance: "6 km round trip",
    height: "3,500 ft (1,100 m)",
    season: "Monsoon & Post-Monsoon",
    price: 999,
    original_price: 1399,
    cover_photo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Bhaskar%20gad%20flag.jpg",
    short_description: "A serene monsoon trail featuring rock-cut steps, lush green plateaus, and pristine mountain waterfalls in Nashik.",
    description: "Bhaskargad, also known as Basgad, is a historic hill fort in the Trimbak range near Igatpuri. The trail passes through lush tribal hamlets, cascading monsoon streams, and carved stone steps leading to a breezy summit plateau with panoramic views of the Sahyadri mountains.",
    highlights: JSON.stringify([
      "Picturesque monsoon mountain scenery with cascading streams",
      "Historic rock-hewn steps and old water cisterns",
      "Gentle beginner-friendly trail through verdant greenery",
      "View of Utwad fort, Harihar fort and Trimbak range",
      "Delicious hot village breakfast and authentic rural lunch"
    ]),
    itinerary: JSON.stringify([
      "05:30 AM — Pickup from Dadar / Thane / Kalyan",
      "08:45 AM — Reach Nirgudpada base village, morning breakfast & tea",
      "09:30 AM — Trek commencement through lush green fields",
      "11:30 AM — Summit reached! Enjoy the breeze and historical ramparts",
      "01:00 PM — Descend to village base",
      "02:30 PM — Relish traditional village lunch",
      "04:00 PM — Start return journey to Mumbai",
      "08:30 PM — Return to Mumbai"
    ]),
    inclusions: JSON.stringify([
      "Mumbai to Mumbai private transport", "Breakfast and tea", "Village lunch", "Trek leader & first aid support"
    ]),
    exclusions: JSON.stringify(["Personal expenditures", "Extra food and drinks"]),
    meeting_point: "Dadar 05:30 AM • Thane 06:15 AM • Kalyan Bypass 06:45 AM",
    pickups: JSON.stringify(["Dadar", "Thane", "Kalyan"]),
    things_to_carry: JSON.stringify(["Trek shoes", "2L water", "Raincoat", "Change of clothes"]),
    instructions: "Great for beginner trekkers looking for a peaceful nature escape without extreme endurance demands.",
    cancellation_policy: "48-hour prior notice required for full rollover or 80% refund.",
    is_featured: 1,
    status: "active",
    gallery: [
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Bhaskar%20gad%20flag.jpg",
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Bhaskargad%20stairs.jpg",
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Bhaskargad.jpg"
    ],
    faqs: [
      { q: "Is this trek suitable for solo travellers?", a: "Absolutely! Over 50% of our participants join solo and quickly bond with the Pahadnama community." }
    ]
  }
];

const insTrek = db.prepare(`
INSERT INTO treks (
  name, slug, tagline, location, region, difficulty, duration, distance, height, season,
  price, original_price, cover_photo, short_description, description, highlights, itinerary,
  inclusions, exclusions, meeting_point, pickups, things_to_carry, instructions, cancellation_policy,
  is_featured, status
) VALUES (
  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
  ?, ?, ?, ?, ?, ?, ?,
  ?, ?, ?, ?, ?, ?, ?,
  ?, ?
)`);

const insDate = db.prepare(`
INSERT INTO trek_dates (trek_id, event_date, day_of_week, total_seats, available_seats, status)
VALUES (?, ?, ?, ?, ?, ?)
`);

const insPhoto = db.prepare(`
INSERT INTO photos (trek_id, url, caption)
VALUES (?, ?, ?)
`);

const insFaq = db.prepare(`
INSERT INTO faqs (trek_id, question, answer, order_num)
VALUES (?, ?, ?, ?)
`);

// Helper to compute upcoming weekend dates (Saturdays and Sundays)
function getUpcomingWeekendDates(weeksAhead = 4) {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= weeksAhead * 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const day = d.getDay();
    if (day === 6) { // Saturday
      dates.push({ dateStr: d.toISOString().split('T')[0], dayName: 'Saturday' });
    } else if (day === 0) { // Sunday
      dates.push({ dateStr: d.toISOString().split('T')[0], dayName: 'Sunday' });
    }
  }
  return dates;
}

const weekendDates = getUpcomingWeekendDates(4);
let firstTrekId = null;

treksData.forEach((t, index) => {
  const res = insTrek.run(
    t.name, t.slug, t.tagline, t.location, t.region, t.difficulty, t.duration, t.distance, t.height, t.season,
    t.price, t.original_price, t.cover_photo, t.short_description, t.description, t.highlights, t.itinerary,
    t.inclusions, t.exclusions, t.meeting_point, t.pickups, t.things_to_carry, t.instructions, t.cancellation_policy,
    t.is_featured, t.status
  );
  const trekId = res.lastInsertRowid;
  if (!firstTrekId) firstTrekId = trekId;

  // Insert photos
  (t.gallery || []).forEach(imgUrl => {
    insPhoto.run(trekId, imgUrl, t.name);
  });

  // Insert FAQs
  (t.faqs || []).forEach((faq, fIndex) => {
    insFaq.run(trekId, faq.q, faq.a, fIndex);
  });

  // Insert Saturday and Sunday dates
  weekendDates.slice(0, 4).forEach((wd, dIndex) => {
    let status = 'AVAILABLE';
    let availableSeats = 25;
    if (dIndex === 0) {
      status = 'AVAILABLE';
      availableSeats = 18;
    } else if (dIndex === 1) {
      status = 'FAST_FILLING';
      availableSeats = 6;
    } else if (dIndex === 2) {
      status = 'AVAILABLE';
      availableSeats = 28;
    } else if (dIndex === 3) {
      status = index % 2 === 0 ? 'FULL' : 'AVAILABLE';
      availableSeats = index % 2 === 0 ? 0 : 30;
    }
    insDate.run(trekId, wd.dateStr, wd.dayName, 30, availableSeats, status);
  });
});

// Seed feedback reviews
const insFeedback = db.prepare(`
INSERT INTO feedback (trek_id, name, trek_name, rating, comment, approved)
VALUES (?, ?, ?, ?, ?, ?)
`);

const sampleReviews = [
  {
    name: "Rohan Kulkarni",
    trek_name: "Harishchandragad — Kokankada",
    rating: 5,
    comment: "Pahadnama Trails made my first ever Sahyadri trek memorable! The Kokankada reverse wind experience was surreal. The trek leaders kept everyone safe, paced comfortably and the hot village bhakri lunch at Pachnai was soul food.",
    approved: 1
  },
  {
    name: "Tanvi Sawant",
    trek_name: "Kalsubai Peak",
    rating: 5,
    comment: "Conquering Kalsubai at 5,400 ft with Pahadnama was empowering. Being a solo female traveller, safety was my priority. The team was warm, professional, and well-organized. 10/10 recommended!",
    approved: 1
  },
  {
    name: "Aditya Deshmukh",
    trek_name: "Devkund Waterfall",
    rating: 5,
    comment: "Devkund trail was pure magic! Clean arrangements, timely pickups from Dadar, and certified leads who ensured no one drifted into unsafe water zones. Genuine trekking passion in their team.",
    approved: 1
  },
  {
    name: "Meera Nair",
    trek_name: "Rajgad Fort",
    rating: 5,
    comment: "The historical narration on Sanjivani Machi gave goosebumps. You don't just trek with Pahadnama, you connect with the mountain's soul and history. Highly trustworthy brand.",
    approved: 1
  },
  {
    name: "Sameer Joshi",
    trek_name: "Jivdhan Fort",
    rating: 5,
    comment: "Rock-cut steps on Jivdhan gave an adrenaline rush. Clear briefing, no unnecessary rushing, and great group energy. Looking forward to my next Sahyadri batch!",
    approved: 1
  },
  {
    name: "Pooja Verma",
    trek_name: "Harishchandragad",
    rating: 5,
    comment: "Everything was transparent — right from booking via WhatsApp to the actual execution on the mountain. True to their word: Safar jahan manzil se zyada khoobsurat hai.",
    approved: 1
  }
];

sampleReviews.forEach(r => {
  insFeedback.run(firstTrekId, r.name, r.trek_name, r.rating, r.comment, r.approved);
});

console.log('Seeding complete! Database populated with authentic Maharashtra treks, weekend dates, and reviews.');
