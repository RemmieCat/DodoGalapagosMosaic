'use strict';

// ── Fun Facts ──────────────────────────────────────────────────────────────
// Shown in random order on the results screen. Each fact is shown once before
// any repeats (shuffle-without-replacement via localStorage queue).

const FUN_FACTS = [
  {
    image: 'a_mockingbird.png',
    title: 'Galápagos Mockingbird',
    facts: [
      'Despite the name and their famous North American relatives, Galápagos mockingbirds do not mimic other birds or noises.',
      'Different islands have distinct mockingbird species, each adapted to its local habitat.',
      'They are cooperative breeders, meaning multiple adults will band together in territorial groups and help raise the young of other members.',
      'They sometimes drink fluids from seabird eggs or carcasses during droughts — an unusual behavior for songbirds.',
      'While capable of flight, they spend much of their time running, hopping, and darting across volcanic rock.',
    ],
  },
  {
    image: 'a_tortoise.png',
    title: 'Galápagos Giant Tortoise',
    facts: [
      'They can live 80–170 years, with the oldest recorded reaching 175 years.',
      'They weigh 250–900 lbs, with the largest recorded at 919 lbs.',
      'Saddleback tortoises evolved upward-stretching shells to reach tall vegetation, while domed tortoises graze low plants.',
      'They amble along at a leisurely top speed of just 0.16 miles per hour.',
      'One subspecies was rediscovered in 2019 after being thought extinct for 112 years.',
    ],
  },
  {
    image: 'b_starfish.png',
    title: 'Purple Starfish',
    facts: [
      'Their vivid purple coloration comes from carotenoid and melanin pigments.',
      'They can regenerate lost arms — sometimes an entire new starfish from one arm.',
      'Tube feet allow them to pry open mussels with surprising strength.',
      'Tiny eye spots at the tips of their arms detect light.',
      'More than 800 species of mollusks live in Galápagos waters, from octopuses to oysters.',
    ],
  },
  {
    image: 'b_uchin.png',
    title: 'Purple Sea Urchin',
    facts: [
      'Their spines are used for defense, locomotion, and even shading themselves from sunlight.',
      'Urchins can live over 30 years in stable environments.',
      'They sense chemicals in the water to find food and avoid predators.',
      'The Galápagos Marine Reserve covers an area of 76,448 square miles and is home to over 3,000 aquatic species.',
      'This includes over 400 fish species, including 50 endemic ones.',
    ],
  },
  {
    image: 'c_lava_lizards.png',
    title: 'Galápagos Lava Lizard',
    facts: [
      'They are endemic and vary noticeably in color and pattern from island to island.',
      'Males perform "push-up" displays to defend territory.',
      'Females often have bright orange throats during breeding season.',
      'They thrive in hot volcanic terrain and bask on lava rocks.',
      'They help control insect populations across the islands.',
    ],
  },
  {
    image: 'c_sallylightfoot_crab.png',
    title: 'Sally Lightfoot Crab',
    facts: [
      'Their bright red, orange, and blue colors make them one of the most photographed Galápagos animals.',
      'They are extremely fast and agile — able to leap between rocks.',
      'Their name comes from their nimble, "light-footed" movement.',
      'Juveniles are dark and camouflaged, turning colorful as they mature.',
      'They feed on algae, detritus, and even parasites on marine iguanas.',
    ],
  },
  {
    image: 'd_nazca_booby.png',
    title: 'Nazca Booby',
    facts: [
      'Males generally produce high-pitched, wheezy bleats while females make deep, guttural croaks.',
      'Nazca boobies practice obligate siblicide — one chick often kills the other.',
      'They are powerful divers, plunging from great heights to catch fish.',
      'The word "booby" comes from the Spanish word bobo, meaning "clown" or "fool," referring to their awkward movement on land.',
      'They nest on open ground in large colonies.',
    ],
  },
  {
    image: 'd_sealion.png',
    title: 'Galápagos Sea Lion',
    facts: [
      'They are playful and often approach snorkelers due to their low fear of humans.',
      'Males can weigh over 600 lbs and defend beach territories.',
      'Pups recognize their mothers by unique vocal calls.',
      'They are excellent divers, reaching depths over 500 ft.',
      'They rest in large groups called "rafts" when at sea.',
    ],
  },
  {
    image: 'e_magnificent_frigatebird.png',
    title: 'Magnificent Frigatebird',
    facts: [
      'Males inflate a huge red throat pouch during courtship.',
      'They have the largest wingspan-to-body-weight ratio of any bird.',
      'They cannot get their feathers wet, so they never dive for food.',
      'They steal food mid-air from other seabirds — a behavior called kleptoparasitism.',
      'They can stay aloft for days riding warm air currents.',
    ],
  },
  {
    image: 'e_vermilion_flycatcher.png',
    title: 'Vermilion Flycatcher',
    facts: [
      'Males are brilliant red, making them one of the most striking Galápagos birds.',
      'They catch insects mid-air with acrobatic flight.',
      'Their song is a rapid series of high chirps.',
      'During courtship, the male will flutter high in the air and offer females "gifts" of flashy insects or butterflies.',
      'They inhabit arid zones and mangroves.',
    ],
  },
  {
    image: 'f_land_iguana.png',
    title: 'Galápagos Land Iguana',
    facts: [
      'These large iguanas can reach 5 ft in length and 25 lbs.',
      'They primarily eat prickly-pear cactus fruits and pads, including the thorns.',
      'Most of their hydration comes from their diet of cactus.',
      'They can live 50 to 60 years.',
      'To escape the midday heat, they dig burrows for shelter.',
    ],
  },
  {
    image: 'f_yellow_warbler.png',
    title: 'Galápagos Mangrove Warbler',
    facts: [
      'They are a subspecies of Yellow Warbler adapted to mangrove habitats.',
      'Males of this subspecies have a distinctive reddish crown patch.',
      'They feed on insects among mangrove leaves and roots.',
      'They show strong site fidelity, returning to the same territories year after year.',
      'Their song is a sweet, rapid series of whistles.',
    ],
  },
  {
    image: 'g_blue_footed_booby.png',
    title: 'Blue-Footed Booby',
    facts: [
      'About half of all breeding pairs nest in the Galápagos.',
      'They are exceptional divers, plunging for sardines and anchovies.',
      'Their bright blue feet are used in a high-stepping mating dance.',
      'Their striking blue color comes from carotenoid pigments found in the fresh fish they eat.',
      'A more vibrant blue indicates a healthier, well-nourished bird.',
    ],
  },
  {
    image: 'g_marine_iguana.png',
    title: 'Marine Iguana',
    facts: [
      'The only sea-foraging lizard in the world.',
      'They dive to feed on algae and seaweed.',
      'Their dark coloration helps them warm quickly after cold ocean dives.',
      'They sneeze salt through specialized nasal glands.',
      'Males become bright red and green during breeding season.',
    ],
  },
  {
    image: 'h_cactus_finch.png',
    title: 'Galápagos Finches',
    facts: [
      'Galápagos finches belong to the tanager family and are not closely related to true finches.',
      'There are 18 species of Galápagos finches; their beak shape varies by island and food availability.',
      'Common Cactus Finches specialize in feeding on cactus flowers and seeds.',
      'The Vampire Ground Finch supplements its scarce diet by drinking the blood of larger seabirds.',
      'The Woodpecker Finch uses twigs, cactus spines, and leaf stems to probe tree bark and extract insect larvae.',
    ],
  },
  {
    image: 'h_sea_turtle.png',
    title: 'Sea Turtles',
    facts: [
      'The Pacific Green Turtle is the only species of sea turtle that nests in the Galápagos.',
      'To trick predators, mother turtles will dig fake nests near their actual nests to hide their eggs.',
      'Females return to the same beaches where they hatched.',
      'Four species of sea turtles are seen in Galápagos waters: Green, Olive Ridley, Hawksbill, and Leatherback.',
      'Sea turtles can hold their breath for two hours.',
    ],
  },
  {
    image: 'darwin.png',
    title: 'Charles Darwin',
    facts: [
      'Darwin spent just five weeks on the Galápagos Archipelago in 1835, yet the islands inspired his theory of evolution.',
      'While Darwin\'s finches are more famous, mockingbirds were one of the first species that made Darwin suspect island populations evolve independently.',
      'He was not officially employed as a naturalist on the HMS Beagle.',
      'Harriet, a Santa Cruz tortoise collected by Darwin, survived for roughly 176 years before passing away in 2006.',
      'Despite spending five years at sea, Darwin suffered from terrible seasickness throughout much of the voyage.',
    ],
  },
  {
    image: 'islands1.png',
    title: 'Galápagos Islands',
    facts: [
      '97% of the land area is protected as Galápagos National Park, established in 1959.',
      'Only five of the islands are inhabited, leaving most of the archipelago pristine.',
      'The islands are millions of years old, formed by volcanic activity on a tectonic hotspot.',
      'Volcanic activity is ongoing; Sierra Negra erupted as recently as 2018.',
      'The archipelago lies on the equator, giving it "summer all year long."',
    ],
  },
  {
    image: 'islands2.png',
    title: 'Galápagos Archipelago',
    facts: [
      'The name "Galápagos" comes from the old Iberian word meaning "turtle" or "tortoise."',
      'The nickname "Enchanted Islands" came from early sailors who thought the islands mysteriously "disappeared" in fog.',
      'Isla Floreana has a centuries-old post office — a barrel where sailors once left mail for passing ships.',
      'It consists of 13 major islands, 6 smaller islands, and over 100 islets and rocks.',
      'The archipelago is located about 600 miles west of mainland Ecuador.',
    ],
  },
];

// ── Solo Ranks ─────────────────────────────────────────────────────────────
const SOLO_RANKS = [
  {
    maxCards: 9,
    title: 'Clueless Tourist',
    quips: [
      'You are outsmarted by every booby you meet. There are thousands.',
      "I'm not sure how you lose a race with a tortoise, but you managed.",
      'You tried to take a selfie with a cactus finch and got photobombed by a crab.',
      'You asked if the marine iguanas "turn into dragons later."',
      'You asked a ranger where they keep the penguins "during the summer."',
    ],
  },
  {
    maxCards: 11,
    title: 'Casual Nature Lover',
    quips: [
      'Bring your binoculars next time, they help.',
      'Yes, "bird" is a correct ID. Technically.',
      'You can tell a tortoise from a rock… most of the time.',
      'You thought the marine iguana was "just a wet lizard," but points for enthusiasm.',
      'You thought the flightless cormorant was "just tired."',
    ],
  },
  {
    maxCards: 13,
    title: 'Wildlife Enthusiast',
    quips: [
      "You've mastered the art of stepping around sleeping sea lions.",
      '"That rock moved" usually means "that\'s an iguana." You know that now.',
      'You can now distinguish at least four shades of "tortoise beige."',
      'You waved at an albatross. It was confused, but appreciative.',
      "You've mastered the art of dodging frigatebirds during lunch.",
    ],
  },
  {
    maxCards: 15,
    title: 'Senior Guide',
    quips: [
      'Tourists think you actually live on Española.',
      'You can spot a camouflaged lava lizard before it spots you.',
      'Blue-footed Boobies request you by name for their mating-dance critiques.',
      "You give better tours than the actual guides, and they're starting to notice.",
      "You can predict where a sea lion will nap before it knows.",
    ],
  },
  {
    maxCards: Infinity,
    title: 'Expert Naturalist',
    quips: [
      'Even the finches ask you for help with species ID.',
      'Park rangers quietly follow you around taking notes.',
      'Even Darwin would ask you to double-check his notes.',
      'You can identify finches by the sound of their beaks clicking.',
      "Park rangers whisper your name like you're a rare endemic species.",
    ],
  },
];

// ── Shuffle-without-replacement queue ──────────────────────────────────────
const _QUEUE_KEY = 'galapagos_fact_queue';

function _newShuffledQueue() {
  const indices = Array.from({ length: FUN_FACTS.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

function pickFunFact() {
  let queue = [];
  try { queue = JSON.parse(localStorage.getItem(_QUEUE_KEY) || '[]'); } catch (e) {}
  if (!Array.isArray(queue) || queue.length === 0) queue = _newShuffledQueue();
  const idx = queue.shift();
  try { localStorage.setItem(_QUEUE_KEY, JSON.stringify(queue)); } catch (e) {}
  return FUN_FACTS[idx] ?? FUN_FACTS[0];
}

function getSoloRank(cardCount) {
  for (const rank of SOLO_RANKS) {
    if (cardCount <= rank.maxCards) return rank;
  }
  return SOLO_RANKS[SOLO_RANKS.length - 1];
}
