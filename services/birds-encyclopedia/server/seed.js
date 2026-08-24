import { initSchema, db } from './db.js';
import { users } from './models/users.js';
import { birds } from './models/birds.js';
import { topics } from './models/topics.js';
import { hashPassword } from './auth.js';

initSchema();

const SEED_BIRDS = [
  {
    common_name: 'Bald Eagle',
    scientific_name: 'Haliaeetus leucocephalus',
    order_name: 'Accipitriformes',
    family: 'Accipitridae',
    conservation_status: 'LC',
    size_cm: 90,
    wingspan_cm: 200,
    diet: 'Fish, waterbirds, carrion',
    habitat: 'Lakes, rivers, coastlines, wetlands across North America',
    range: 'North America (Canada, USA, northern Mexico)',
    identification:
      'Adults: white head and tail with dark brown body and wings; yellow hooked beak. Juveniles are mottled brown for 4–5 years before gaining adult plumage.',
    behavior:
      'Soaring raptor; steals food from other birds (kleptoparasitism). Builds the largest tree nests of any North American bird.',
    description:
      'The national bird of the United States. A sea eagle that was endangered by DDT in the 20th century and recovered after its ban.',
    fun_facts: [
      'Bald eagles can live over 30 years in the wild.',
      'Their nest can weigh more than a ton after years of reuse.',
      'Despite the name, they are not bald — "balde" is old English for white.',
    ],
    image_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Bald_Eagle.jpg',
  },
  {
    common_name: 'African Penguin',
    scientific_name: 'Spheniscus demersus',
    order_name: 'Sphenisciformes',
    family: 'Spheniscidae',
    conservation_status: 'EN',
    size_cm: 60,
    wingspan_cm: 80,
    diet: 'Sardines, anchovies, squid',
    habitat: 'Rocky coastlines and islands of southern Africa',
    range: 'South Africa and Namibia',
    identification:
      'Black back, white belly with a distinct black band, and a pink gland above the eye that helps regulate heat.',
    behavior:
      'Colony-nesting; communicates with braying calls. Unlike Antarctic penguins, it lives in a temperate climate.',
    description:
      'The only penguin species that breeds in Africa. Also called the "jackass penguin" for its donkey-like bray.',
    fun_facts: [
      'They use their pink eye glands to cool down in hot weather.',
      'Population declined over 95% in the last century due to overfishing and oil spills.',
    ],
    image_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/African_penguin.jpg',
  },
  {
    common_name: 'Common Kingfisher',
    scientific_name: 'Alcedo atthis',
    order_name: 'Coraciiformes',
    family: 'Alcedinidae',
    conservation_status: 'LC',
    size_cm: 16,
    wingspan_cm: 25,
    diet: 'Small fish, aquatic insects',
    habitat: 'Rivers, streams, lakes with clear water',
    range: 'Europe, Asia, North Africa',
    identification:
      'Brilliant teal-blue back and orange underparts; short tail; long pointed black bill. Often seen as a blue flash over water.',
    behavior:
      'Perches motionless then dives headfirst to catch fish. Nests in burrows dug into riverbanks.',
    description:
      'A small, jewel-like river specialist found across Eurasia. Solitary and territorial along waterways.',
    fun_facts: [
      'It can dive at speeds that briefly make its vision monochromatic to cut glare.',
      'Kingfishers lay 5–7 eggs in a tunnel up to a meter long.',
    ],
    image_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Common_Kingfisher_-_Alcedo_atthis.jpg',
  },
  {
    common_name: 'Emperor Penguin',
    scientific_name: 'Aptenodytes forsteri',
    order_name: 'Sphenisciformes',
    family: 'Spheniscidae',
    conservation_status: 'NT',
    size_cm: 115,
    wingspan_cm: 90,
    diet: 'Fish, krill, squid',
    habitat: 'Antarctic sea ice and pack ice',
    range: 'Antarctica (circumpolar, near the coast)',
    identification:
      'Tallest and heaviest penguin. Black head with yellow-orange ear patches fading to the chest; pale-yellow breast.',
    behavior:
      'Males incubate a single egg on their feet through the Antarctic winter while females forage at sea for up to two months.',
    description:
      'The only penguin that breeds during the Antarctic winter. Highly adapted to extreme cold.',
    fun_facts: [
      'They can dive deeper than 500 meters and hold their breath for over 20 minutes.',
      'A huddling colony can reduce each bird’s heat loss by sharing warmth.',
    ],
    image_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Emperor_penguin.jpg',
  },
  {
    common_name: 'Ruby-throated Hummingbird',
    scientific_name: 'Archilochus colubris',
    order_name: 'Apodiformes',
    family: 'Trochilidae',
    conservation_status: 'LC',
    size_cm: 9,
    wingspan_cm: 11,
    diet: 'Nectar, small insects',
    habitat: 'Gardens, woodlands, meadows, edges',
    range: 'Eastern North America; winters in Central America',
    identification:
      'Tiny bird; males have an iridescent ruby-red throat, females and juveniles are plain white-throated. Hovering flight with a faint hum.',
    behavior:
      'The only hummingbird that breeds east of the Mississippi. Migrates across the Gulf of Mexico nonstop (~800 km).',
    description:
      'A feats-of-endurance migrant that powers itself with nectar and beats its wings ~50 times per second.',
    fun_facts: [
      'They enter torpor (a hibernation-like state) at night to save energy.',
      'Their hearts can beat over 1,200 times per minute in flight.',
    ],
    image_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ruby-throated_Hummingbird_(Archilochus_colubris).jpg',
  },
  {
    common_name: 'Common Raven',
    scientific_name: 'Corvus corax',
    order_name: 'Passeriformes',
    family: 'Corvidae',
    conservation_status: 'LC',
    size_cm: 64,
    wingspan_cm: 130,
    diet: 'Omnivore: carrion, insects, fruit, eggs, scraps',
    habitat: 'Cliffs, forests, tundra, mountains, urban areas',
    range: 'Northern Hemisphere (Holarctic)',
    identification:
      'Largest passerine. All-black with a wedge-shaped tail in flight and a deep, croaking call. Thicker bill than a crow.',
    behavior:
      'Highly intelligent; uses tools, solves puzzles, and plays. Forms long-term pair bonds.',
    description:
      'A signature member of the crow family, celebrated for problem-solving and vocal variety.',
    fun_facts: [
      'Ravens can mimic human speech and other sounds.',
      'They engage in aerial play, including snowboarding down roofs.',
    ],
    image_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Common_raven.jpg',
  },
  {
    common_name: 'Atlantic Puffin',
    scientific_name: 'Fratercula arctica',
    order_name: 'Charadriiformes',
    family: 'Alcidae',
    conservation_status: 'VU',
    size_cm: 30,
    wingspan_cm: 55,
    diet: 'Small fish (sand lance, herring)',
    habitat: 'North Atlantic cliffs and islands; open ocean in winter',
    range: 'North Atlantic (Iceland, Norway, UK, eastern Canada)',
    identification:
      'Black back, white face and belly, large triangular red-orange bill with a blue-grey base. Bright orange feet.',
    behavior:
      '"Clown of the sea." Nests in burrows on grassy cliffs; carries many fish crosswise in its bill at once.',
    description:
      'A charismatic seabird that spends most of its life at sea and returns to land only to breed.',
    fun_facts: [
      'A single puffin can carry more than 10 fish at once thanks to a unique hinge in its beak.',
      'Their colorful bill fades to dull grey in winter.',
    ],
    image_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Atlantic_puffin.jpg',
  },
  {
    common_name: 'Ostrich',
    scientific_name: 'Struthio camelus',
    order_name: 'Struthioniformes',
    family: 'Struthionidae',
    conservation_status: 'LC',
    size_cm: 210,
    wingspan_cm: 200,
    diet: 'Plants, seeds, insects, small vertebrates',
    habitat: 'Savannas, open woodlands, semi-desert',
    range: 'Sub-Saharan Africa',
    identification:
      'Largest living bird; long bare legs, long neck, small head. Males black with white tail plumes; females grey-brown.',
    behavior:
      'Flightless; runs up to 70 km/h. Lives in groups with a dominant male. Males roar like lions during mating.',
    description:
      'The heaviest and tallest bird alive. Has the largest eyes of any land vertebrate (5 cm across).',
    fun_facts: [
      'Ostrich eggs are the largest of any living animal — about 1.4 kg each.',
      'They have two toes, unlike most birds which have three or four.',
    ],
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Struthio_camelus_%28captive%29_in_Jardim_Zool%C3%B3gico_de_Curitiba.jpg',
  },
  {
    common_name: 'Snowy Owl',
    scientific_name: 'Bubo scandiacus',
    order_name: 'Strigiformes',
    family: 'Strigidae',
    conservation_status: 'VU',
    size_cm: 65,
    wingspan_cm: 150,
    diet: 'Lemmings, small mammals and birds',
    habitat: 'Arctic tundra; irrupts southward into open fields in winter',
    range: 'Circumpolar Arctic; winters across northern continents',
    identification:
      'White plumage with dark barring (females and young more marked). Yellow eyes, no ear tufts. Rounded head.',
    behavior:
      'Hunts by day in the continuous Arctic light. Nests on the ground. Irrupts south in cycles tied to lemming numbers.',
    description:
      'An Arctic specialist made famous as Harry Potter’s companion Hedwig.',
    fun_facts: [
      'They can rotate their heads about 270 degrees.',
      'A female may lay up to 11 eggs when lemmings are abundant.',
    ],
    image_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Bubo_scandiacus_-_Karlsruhe_Zoo_01.jpg',
  },
  {
    common_name: 'Blue Jay',
    scientific_name: 'Cyanocitta cristata',
    order_name: 'Passeriformes',
    family: 'Corvidae',
    conservation_status: 'LC',
    size_cm: 28,
    wingspan_cm: 43,
    diet: 'Acorns, nuts, seeds, insects, eggs',
    habitat: 'Forests, woodlands, suburban gardens',
    range: 'Eastern and central North America',
    identification:
      'Bright blue upperparts, white face, black necklace, and a crest. Loud, varied calls including hawk mimicry.',
    behavior:
      'Intelligent and social; caches acorns (helping oak dispersal). Mimics red-shouldered hawk calls.',
    description:
      'A bold, noisy corvid of eastern North America, known for its intelligence and striking coloration.',
    fun_facts: [
      'Blue jays can mimic the calls of hawks to scare other birds away from feeders.',
      'They help plant forests by forgetting where they buried some acorns.',
    ],
    image_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Cyanocitta-cristata-004.jpg',
  },
  {
    common_name: 'Wandering Albatross',
    scientific_name: 'Diomedea exulans',
    order_name: 'Procellariiformes',
    family: 'Diomedeidae',
    conservation_status: 'VU',
    size_cm: 110,
    wingspan_cm: 350,
    diet: 'Squid, fish, crustaceans',
    habitat: 'Open Southern Ocean; nests on remote islands',
    range: 'Southern Ocean circumpolar; breeds on subantarctic islands',
    identification:
      'The largest wingspan of any living bird (up to 3.5 m). Mostly white body with black wing margins and a long pink bill.',
    behavior:
      'Spends most of its life gliding over the ocean, landing only to breed. Can circle the globe in weeks.',
    description:
      'The master of dynamic soaring, it exploits wind gradients to fly vast distances with almost no flapping.',
    fun_facts: [
      'It can stay aloft for days or weeks without touching land.',
      'Albatrosses mate for life and perform elaborate courtship dances.',
    ],
    image_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Diomedea_exulans_-_SE_Tasmania.jpg',
  },
  {
    common_name: 'Greater Flamingo',
    scientific_name: 'Phoenicopterus roseus',
    order_name: 'Phoenicopteriformes',
    family: 'Phoenicopteridae',
    conservation_status: 'LC',
    size_cm: 130,
    wingspan_cm: 150,
    diet: 'Algae, brine shrimp, mollusks filtered from water',
    habitat: 'Shallow saline or alkaline lakes and lagoons',
    range: 'Africa, southern Europe, southwest Asia, Indian subcontinent',
    identification:
      'Pale pink plumage, long curved neck, downward-bent black-tipped bill, and long pink legs. Often in huge flocks.',
    behavior:
      'Filters food with its upside-down bill. Performs synchronized group displays. Highly social.',
    description:
      'The tallest flamingo species. Its pink color comes from carotenoid pigments in its food.',
    fun_facts: [
      'Flamingos are born grey and only turn pink from their diet.',
      'They often stand on one leg to conserve body heat.',
    ],
    image_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Phoenicopterus_roseus_Luc_Viatour.jpg',
  },
  {
    common_name: 'Peregrine Falcon',
    scientific_name: 'Falco peregrinus',
    order_name: 'Falconiformes',
    family: 'Falconidae',
    conservation_status: 'LC',
    size_cm: 45,
    wingspan_cm: 110,
    diet: 'Birds caught in flight (pigeons, ducks, songbirds)',
    habitat: 'Cliffs, coasts, cities, tall buildings',
    range: 'Worldwide on every continent except Antarctica',
    identification:
      'Blue-grey back, barred white underparts, dark "moustache" mark under the eye, and a pointed beak with a notch (tomial tooth).',
    behavior:
      'The fastest animal on Earth; stoops (dives) at over 320 km/h to strike prey mid-air.',
    description:
      'A cosmopolitan falcon that recovered from 20th-century pesticide declines and now thrives in cities.',
    fun_facts: [
      'Its hunting stoop is the fastest recorded movement of any animal (~389 km/h).',
      'City peregrines nest on skyscrapers, treating them like cliffs.',
    ],
    image_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Peregrine_Falcon.jpg',
  },
  {
    common_name: 'Resplendent Quetzal',
    scientific_name: 'Pharomachrus mocinno',
    order_name: 'Trogoniformes',
    family: 'Trogonidae',
    conservation_status: 'NT',
    size_cm: 36,
    wingspan_cm: 65,
    diet: 'Fruit (wild avocado), insects, small frogs',
    habitat: 'Cloud forests of Central America',
    range: 'Southern Mexico to Panama',
    identification:
      'Iridescent green body, red belly, and in males a spectacular train of up to 1 m of tail feathers. Shy and solitary.',
    behavior:
      'Important seed disperser for wild avocado trees. Nests in tree cavities. Weak flight.',
    description:
      'A sacred bird of Mesoamerican cultures (the Aztecs and Maya), symbolizing liberty and the divine.',
    fun_facts: [
      'It was considered a crime punishable by death to kill a quetzal in ancient Maya society.',
      'Its tail feathers were used as currency and regalia.',
    ],
    image_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Resplendent_quetzal.jpg',
  },
  {
    common_name: 'Kiwi',
    scientific_name: 'Apteryx mantelli',
    order_name: 'Apterygiformes',
    family: 'Apterygidae',
    conservation_status: 'VU',
    size_cm: 40,
    wingspan_cm: 0,
    diet: 'Invertebrates, worms, fruit, seeds',
    habitat: 'Native forests, scrub, grassland (mostly nocturnal)',
    range: 'New Zealand',
    identification:
      'Small, fuzzy, brown, flightless; long flexible bill with nostrils at the tip; no tail; strong legs. Lays a huge egg relative to body size.',
    behavior:
      'Nocturnal and ground-dwelling; uses smell (rare in birds) to find food. Pairs mate for life.',
    description:
      'New Zealand’s national symbol. A living relic of ancient ratites, uniquely adapted to a predator-free past.',
    fun_facts: [
      'Kiwis have nostrils at the end of their bill and a keen sense of smell.',
      'Their egg can weigh a quarter of the female’s body mass.',
    ],
    image_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Apteryx_australis_TZSL.jpg',
  },
];

const SEED_TOPICS = [
  {
    slug: 'what-is-a-bird',
    title: 'What Is a Bird?',
    category: 'Fundamentals',
    level: 'beginner',
    summary: 'The defining features that make a bird a bird.',
    content:
      'Birds are warm-blooded vertebrates in the class Aves, the only living group of animals with feathers. ' +
      'They are descendants of theropod dinosaurs and share a common ancestor with crocodiles. ' +
      'Key defining traits:\n' +
      '• Feathers — for flight, insulation, display, and waterproofing.\n' +
      '• Beaks (no teeth in living species) — highly adapted to diet.\n' +
      '• Lightweight, hollow bones (pneumatized) and a wishbone (furcula) for flight.\n' +
      '• A high-efficiency respiratory system with air sacs that lets air flow one-way through the lungs.\n' +
      '• Egg-laying (amniote eggs with hard or leathery shells).\n' +
      '• Strong muscles (pectoralis) powering the wings.\n' +
      'Modern birds number roughly 11,000 species — more than any other class of terrestrial vertebrates except perhaps fish.',
    order_index: 1,
  },
  {
    slug: 'bird-anatomy',
    title: 'Bird Anatomy & Physiology',
    category: 'Fundamentals',
    level: 'beginner',
    summary: 'How feathers, bones, and the respiratory system work.',
    content:
      'Feathers have a central rachis with barbs and barbules that zip together; down feathers insulate. ' +
      'Birds molt (replace feathers) regularly, often twice a year.\n' +
      'The skeleton is lightweight: many bones are hollow and reinforced. The keel (sternum extension) anchors flight muscles.\n' +
      'Uniquely, birds breathe with a system of air sacs that keeps fresh air moving through the lungs in one direction — ' +
      'so oxygen is extracted on both inhalation and exhalation. This is why they can fly at high altitude.\n' +
      'Vision is acute: many see ultraviolet light; raptors have telescopic foveae for spotting prey from far away.',
    order_index: 2,
  },
  {
    slug: 'taxonomy-classification',
    title: 'How Birds Are Classified',
    category: 'Fundamentals',
    level: 'beginner',
    summary: 'Orders, families, and the tree of bird life.',
    content:
      'Birds are classified in a hierarchy: Class Aves → Order → Family → Genus → Species. ' +
      'The scientific name is the Genus + species (binomial), e.g. Haliaeetus leucocephalus.\n' +
      'Major orders include:\n' +
      '• Passeriformes (perching songbirds) — over half of all bird species.\n' +
      '• Anseriformes (ducks, geese, swans).\n' +
      '• Accipitriformes (hawks, eagles, vultures).\n' +
      '• Strigiformes (owls).\n' +
      '• Sphenisciformes (penguins), Struthioniformes (ostriches), Apterygiformes (kiwis) — flightless ratites.\n' +
      '• Procellariiformes (albatrosses, petrels) — the great ocean wanderers.\n' +
      'Modern classification is based on DNA, which has rearranged many old groupings.',
    order_index: 3,
  },
  {
    slug: 'field-identification',
    title: 'Field Identification: How to ID a Bird',
    category: 'Identification',
    level: 'beginner',
    summary: 'Size, shape, color, behavior, and habitat clues.',
    content:
      'Field identification is the skill of recognizing birds in the wild. Start with:\n' +
      '1. Size & shape (the "jizz" — overall impression).\n' +
      '2. Color patterns and field marks (wing bars, eye rings, breast streaks).\n' +
      '3. Behavior — how it feeds, flies, perches, flocks.\n' +
      '4. Habitat and range — where and when you are matters.\n' +
      '5. Voice — songs and calls are often the best clue.\n' +
      'Use a field guide or app, note your location and date, and observe before reaching for the camera.',
    order_index: 4,
  },
  {
    slug: 'bird-songs-and-calls',
    title: 'Understanding Bird Song & Calls',
    category: 'Identification',
    level: 'intermediate',
    summary: 'Why birds vocalize and how to learn their voices.',
    content:
      'Songs are typically complex, learned vocalizations used in territorial defense and mate attraction — ' +
      'most are sung by males in the breeding season. Calls are shorter, innate sounds for alarms, contact, and flock coordination.\n' +
      'Songbirds (Passeriformes) learn songs from tutors; some, like mockingbirds, mimic many species. ' +
      'To learn voices: listen daily, use spectrogram apps, and associate each sound with a sighting.',
    order_index: 5,
  },
  {
    slug: 'migration',
    title: 'Bird Migration',
    category: 'Behavior & Ecology',
    level: 'intermediate',
    summary: 'The great seasonal journeys of birds.',
    content:
      'Migration is the regular, often seasonal movement between breeding and non-breeding areas. ' +
      'It is driven by food availability and day length. Birds navigate using:\n' +
      '• The sun and stars (celestial cues).\n' +
      '• Earth’s magnetic field (magnetoreception, via iron-rich cells).\n' +
      '• Landscape features and infrasound.\n' +
      'The Arctic Tern migrates the farthest — from the Arctic to Antarctica and back, ~70,000 km a year. ' +
      'Migration is dangerous: collisions, exhaustion, and habitat loss take a heavy toll.',
    order_index: 6,
  },
  {
    slug: 'flight-mechanics',
    title: 'How Birds Fly',
    category: 'Behavior & Ecology',
    level: 'intermediate',
    summary: 'Lift, wings, and the styles of flight.',
    content:
      'Flight relies on lift (from wing shape/angle) overcoming gravity, and thrust (from flapping) overcoming drag. ' +
      'Wing shape reflects lifestyle: long narrow wings for soaring (albatross), short rounded wings for maneuvering in forests (woodpeckers), ' +
      'broad wings for slow soaring (eagles). Birds use upstrokes and downstrokes, and some (hummingbirds) hover by figure-eight wingbeats.\n' +
      'Takeoff and landing are the most energy-intensive phases; many seabirds take off into the wind.',
    order_index: 7,
  },
  {
    slug: 'habitats', title: 'Bird Habitats', category: 'Behavior & Ecology', level: 'beginner',
    summary: 'Where birds live — forests, wetlands, grasslands, cities.',
    content:
      'Birds occupy nearly every habitat: rainforests, deserts, tundra, wetlands, oceans, mountains, and cities. ' +
      'Each habitat favors different adaptations — webbed feet for swimmers, long bills for probing mud, ' +
      'cryptic plumage for ground-nesters. Protecting habitat is the single most important action for bird conservation.',
    order_index: 8,
  },
  {
    slug: 'diet-and-feeding',
    title: 'Diet & Feeding Strategies',
    category: 'Behavior & Ecology',
    level: 'beginner',
    summary: 'From nectar to fish to carrion — how birds eat.',
    content:
      'Beak shape is a window into diet:\n' +
      '• Cone-shaped (finches) — cracking seeds.\n' +
      '• Long thin (hummingbirds, sunbirds) — nectar.\n' +
      '• Hooked (eagles, owls) — tearing flesh.\n' +
      '• Flat broad (ducks) — filtering.\n' +
      '• Long curved (curlews, ibises) — probing mud for invertebrates.\n' +
      'Feeding guilds include carnivores, granivores, nectarivores, insectivores, and scavengers.',
    order_index: 9,
  },
  {
    slug: 'breeding-and-nests',
    title: 'Breeding, Nests & Eggs',
    category: 'Behavior & Ecology',
    level: 'intermediate',
    summary: 'Courtship, nests, eggs, and raising young.',
    content:
      'Most birds are socially monogamous, at least for a breeding season. Courtship can involve song, dance, plumage, and gifts. ' +
      'Nest types: open cups, enclosed domes, burrows, cavities, scrapes on the ground, and platform piles. ' +
      'Clutch size and incubation vary widely. Altricial young (e.g. songbirds) hatch blind and helpless; ' +
      'precocial young (e.g. ducks, seabirds) can walk and feed soon after hatching.',
    order_index: 10,
  },
  {
    slug: 'conservation-status',
    title: 'Conservation Status & Threats',
    category: 'Conservation',
    level: 'beginner',
    summary: 'IUCN categories and the major threats to birds.',
    content:
      'The IUCN Red List categories: LC (Least Concern), NT (Near Threatened), VU (Vulnerable), ' +
      'EN (Endangered), CR (Critically Endangered), EW (Extinct in the Wild), EX (Extinct).\n' +
      'Major threats:\n' +
      '• Habitat loss and fragmentation.\n' +
      '• Climate change shifting ranges and timing.\n' +
      '• Invasive predators (rats, cats) on islands.\n' +
      '• Window collisions, power lines, and pollution.\n' +
      '• Overexploitation and fishing bycatch.\n' +
      'Success stories: Bald Eagle and Peregrine Falcon recovered after DDT was banned. Citizen science (e.g. eBird) helps track populations.',
    order_index: 11,
  },
  {
    slug: 'how-to-help-birds',
    title: 'How You Can Help Birds',
    category: 'Conservation',
    level: 'beginner',
    summary: 'Practical actions for backyard and beyond.',
    content:
      '• Keep cats indoors or supervised.\n' +
      '• Make windows bird-safe (decals, screens, netting).\n' +
      '• Plant native plants and provide water.\n' +
      '• Avoid pesticides; support insect life.\n' +
      '• Reduce light pollution during migration.\n' +
      '• Join citizen-science projects (eBird, Christmas Bird Count) to contribute data.\n' +
      '• Support habitat protection organizations.',
    order_index: 12,
  },
  {
    slug: 'birdwatching-gear',
    title: 'Getting Started: Birdwatching Gear',
    category: 'Getting Started',
    level: 'beginner',
    summary: 'Binoculars, field guides, and apps.',
    content:
      'Essentials for a beginner birdwatcher:\n' +
      '• Binoculars: 8x42 is a versatile all-round choice (8x magnification, 42mm objective).\n' +
      '• A regional field guide (book or app) with range maps.\n' +
      '• A notebook or a recording app for logging sightings.\n' +
      '• Patience and quiet observation. Early morning is often best.\n' +
      'Free apps like Merlin Bird ID can identify birds from photos and sound.',
    order_index: 13,
  },
  {
    slug: 'common-bird-myths',
    title: 'Common Bird Myths Debunked',
    category: 'Getting Started',
    level: 'beginner',
    summary: 'Ostriches, parrots, and "lost" migration facts.',
    content:
      '• Ostriches do NOT bury their heads in sand — they lie low to hide and may turn eggs with their beaks.\n' +
      '• Not all birds fly, but all have feathers.\n' +
      '• Birds are not "dinosaur descendants" in a metaphorical sense — they ARE dinosaurs (avian theropods).\n' +
      '• Touching a baby bird does not cause parents to reject it; still, best to leave it unless it is in danger.\n' +
      '• Penguins are not "fish" — they are flightless birds with feathers and lungs.',
    order_index: 14,
  },
];

// Sound classification for each seed bird, keyed by scientific name.
// sound_type ∈ Song|Call|Alarm|Drum|Wingbeat|Silent ; sound_band ∈ Low|Mid|High|Very high.
const SOUND_CLASS = {
  'Haliaeetus leucocephalus':  { sound_type: 'Call',     sound_band: 'High',     sound_description: 'High, thin, squeaky whistles and chirps — surprisingly weak for such a large raptor.' },
  'Spheniscus demersus':       { sound_type: 'Call',     sound_band: 'Mid',      sound_description: 'Loud donkey-like braying ("jackass penguin") used in colony contact and pair recognition.' },
  'Alcedo atthis':             { sound_type: 'Call',     sound_band: 'High',     sound_description: 'Sharp, metallic "chee" or "tsee" given in flight; a rattling alarm when alarmed.' },
  'Aptenodytes forsteri':      { sound_type: 'Call',     sound_band: 'Low',      sound_description: 'Male emits a prolonged, trumpet-like display call; female a shorter, higher contact call.' },
  'Archilochus colubris':      { sound_type: 'Wingbeat', sound_band: 'High',     sound_description: 'A faint, insect-like hum from wings beating ~50x/sec; a short squeaky "chip" call.' },
  'Corvus corax':              { sound_type: 'Call',     sound_band: 'Low',      sound_description: 'Deep, reverberant croak ("kraa") with many variants; also mimics other sounds.' },
  'Fratercula arctica':        { sound_type: 'Call',     sound_band: 'Mid',      sound_description: 'Growling, purring calls at the colony; a soft "arr-arr" during courtship.' },
  'Struthio camelus':          { sound_type: 'Call',     sound_band: 'Low',      sound_description: 'Male booms a lion-like roar in the breeding season; hisses when threatened.' },
  'Bubo scandiacus':           { sound_type: 'Call',     sound_band: 'Low',      sound_description: 'Mostly silent; a deep, hollow "hoo-hoo" and barking alarm near the nest.' },
  'Cyanocitta cristata':       { sound_type: 'Call',     sound_band: 'Mid',      sound_description: 'Loud, harsh "jay!" and a wide repertoire, including convincing red-shouldered hawk mimicry.' },
  'Diomedea exulans':          { sound_type: 'Call',     sound_band: 'Low',      sound_description: 'Mostly silent at sea; groans and bill-claps at the nest during courtship.' },
  'Phoenicopterus roseus':     { sound_type: 'Call',     sound_band: 'Mid',      sound_description: 'Goose-like honking and nasal "ka-haa" calls, especially in flock displays.' },
  'Falco peregrinus':          { sound_type: 'Alarm',    sound_band: 'High',     sound_description: 'Rapid, high "kak-kak-kak" alarm ("wik-wik-wik") when the nest is threatened.' },
  'Pharomachrus mocinno':      { sound_type: 'Call',     sound_band: 'Low',      sound_description: 'Soft, singular "kyow" and low clucks; sings little, mostly silent in the canopy.' },
  'Apteryx mantelli':          { sound_type: 'Call',     sound_band: 'Low',      sound_description: 'Male a high rising whistle, female a lower growl — used to stay in contact at night.' },
};

function seed() {
  let createdBirds = 0;
  for (const b of SEED_BIRDS) {
    const existing = birds.list({ q: b.scientific_name, limit: 1 });
    if (!existing.rows.length) {
      const sound = SOUND_CLASS[b.scientific_name] || {};
      birds.create({ ...b, ...sound });
      createdBirds++;
    }
  }

  let createdTopics = 0;
  for (const t of SEED_TOPICS) {
    if (!topics.findBySlug(t.slug)) {
      topics.create(t);
      createdTopics++;
    }
  }

  // Admin user
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@birds.local';
  let adminMsg = 'already present';
  if (!users.findByUsername(adminUser)) {
    users.create({ username: adminUser, email: adminEmail, password: adminPass, role: 'admin' });
    adminMsg = 'created';
  }

  console.log(
    `Seed complete: ${createdBirds} new birds, ${createdTopics} new topics, admin "${adminUser}" ${adminMsg}.`
  );
}

export { seed };

// Only auto-run when invoked directly (npm run seed), not when imported by tests.
if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
}
