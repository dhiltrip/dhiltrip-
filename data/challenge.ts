import type { Focus } from "@/data/focus";

export const WHATSAPP_NUMBER = "6282234680849";

export const whatsappLink = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const POINTS = {
  perBottle: 10,
  tumbler: 10,
  teloBag: 10,
  maxBottlesPerTrip: 20,
} as const;

export type Stop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  funfact: string;
};

export type ChallengePackage = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  poster: string;
  /** Which part of the poster to keep in view where it is cropped. */
  posterFocus?: Focus | null;
  /** Shown for languages without their own price below. */
  priceLabel: string;
  /** Prices per currency (e.g. { IDR: 650000 }); a visitor sees the one for their chosen language. */
  prices?: Partial<Record<string, number>>;
  duration: string;
  tags: string[];
  destinationLabel: string;
  destinations: string[];
  includes: string[];
  meetingPoints: string[];
  stops: Stop[];
  /** The traveler picks one of the places instead of visiting them all. */
  routeChoice?: boolean;
  /** Letters at the start of this package's booking codes, e.g. CUT. */
  prefix?: string;
  /** Hidden packages stay in the database but are not offered to travelers. */
  hidden?: boolean;
  /** Position in the catalog, lowest first. */
  order?: number;
};

const PRICE = "50 USD / ₩65.000";
const STANDARD_MEETING_POINTS = ["Yogyakarta Train Station", "Bandara YIA", "Hotel"];

/** The original four packages. They seed the database and are used when Firebase is off. */
export const packages: ChallengePackage[] = [
  {
    id: "code-urban-trail",
    title: "Code Urban Trail",
    tagline: "Walk Through the Heart of Yogyakarta",
    description:
      "Experience the heart of Yogyakarta's riverside life through narrow alleys, vibrant murals, terraced houses, and local community spaces. Discover the history of the Code Riverbank and experience its strong Javanese community culture and eco-initiatives.",
    poster: "/challenge/poster-code-urban.webp",
    priceLabel: PRICE,
    duration: "One Day Trip",
    tags: ["Culture", "Urban", "Community"],
    destinationLabel: "Route / Destination",
    destinations: ["Code River Walk", "Gondolayu Bridge", "Cokrodiningratan"],
    includes: [
      "Guided walking tour",
      "Interactive stops",
      "Local culture experience",
      "Exploration of riverside community life",
    ],
    meetingPoints: STANDARD_MEETING_POINTS,
    stops: [
      {
        id: "code-river",
        name: "Code River",
        lat: -7.7795,
        lng: 110.3702,
        funfact:
          "Code River originates from Mount Merapi and cuts through the city of Yogyakarta. The residential area along its banks underwent a major transformation in the 1980s by Romo Mangunwijaya, evolving from a slum into a neighborhood with a distinct architectural identity and a unique social life.",
      },
      {
        id: "cokrodiningratan",
        name: "Cokrodiningratan",
        lat: -7.7782,
        lng: 110.3655,
        funfact:
          "Cokrodiningratan is a neighborhood in Yogyakarta that draws interest through the diverse activities of its residents. The area is known for the Kranggan Market, which serves as a hub for local economic activity and a destination for those seeking traditional culinary delights.",
      },
      {
        id: "gondolayu-bridge",
        name: "Gondolayu Bridge",
        lat: -7.7829,
        lng: 110.3691,
        funfact:
          "Gondolayu Bridge is a historic bridge in Yogyakarta from the Dutch colonial era. It connected the Jetis area and the center of Yogyakarta, and is documented in archives from 1937, which depict the area surrounding it as still being shaded by lush trees.",
      },
    ],
  },
  {
    id: "mount-merapi-foothills",
    title: "Mount Merapi Foothills",
    tagline: "Breathe in the Mountain, Walk with Merapi",
    description:
      "Experience the cool atmosphere of Mount Merapi through a gentle trekking adventure. Walk along pine forests, ridge paths, and elevated viewpoints while enjoying views of Merapi and its surrounding lava ravines.",
    poster: "/challenge/poster-merapi.webp",
    priceLabel: PRICE,
    duration: "One Day Trip",
    tags: ["Nature", "Trekking", "Mountain"],
    destinationLabel: "Choose your own route",
    routeChoice: true,
    destinations: ["Kalitalang", "Klangon", "Deles Indah"],
    includes: [
      "Hotel pickup in Jogja City",
      "Soft trekking experience",
      "Mountain viewpoint exploration",
      "Cooling down at Ledok Sambi",
      "Breakfast option",
    ],
    meetingPoints: ["Hotel pickup in Jogja City"],
    stops: [
      {
        id: "kalitalang",
        name: "Kalitalang",
        lat: -7.5856,
        lng: 110.4744,
        funfact:
          "Kalitalang is a viewpoint on the slopes of Mount Merapi on the Klaten side, popular for its open, close-range view of the volcano.",
      },
      {
        id: "klangon",
        name: "Klangon",
        lat: -7.5892,
        lng: 110.4626,
        funfact:
          "Klangon is a hilltop area in Cangkringan, Sleman, known for wide views of Merapi and the landscape shaped by its past eruptions.",
      },
      {
        id: "deles-indah",
        name: "Deles Indah",
        lat: -7.5678,
        lng: 110.4817,
        funfact:
          "Deles Indah is a highland recreation area in Kemalang, Klaten, on the southern side of Merapi, with cool air and forest surroundings.",
      },
    ],
  },
  {
    id: "countryside-breeze",
    title: "Countryside Breeze",
    tagline: "Ride Beyond the City, Discover Village Life",
    description:
      "Escape the city's hustle and explore the peaceful countryside of Bangunjiwo. Cycle through green rice paddies and quiet village lanes. Meet local craftsmen and experience traditional pottery, wooden craft, and bamboo production. End the journey with a countryside tea break and a sunset ride through the rice fields.",
    poster: "/challenge/poster-countryside.webp",
    priceLabel: PRICE,
    duration: "One Day Trip",
    tags: ["Cycling", "Village", "Craft"],
    destinationLabel: "Destination",
    destinations: [
      "Bicycle rental",
      "Heritage cycling tour",
      "Local street food stops",
      "Traditional Masangin game experience",
    ],
    includes: [
      "Countryside cycling experience",
      "Tea and local snacks",
      "Village community walk",
      "Wooden and bamboo craft studio visit",
      "Traditional pottery workshop visit",
    ],
    meetingPoints: ["Yogyakarta Train Station", "Bandara YIA", "Hotel/Penginapan"],
    stops: [
      {
        id: "bangunjiwo",
        name: "Bangunjiwo",
        lat: -7.8481,
        lng: 110.3283,
        funfact:
          "Bangunjiwo, in Bantul, is a village area home to the Kasongan pottery tradition, where clay craft has been passed down through generations.",
      },
      {
        id: "alun-alun-kidul-masangin",
        name: "Alun-Alun Selatan",
        lat: -7.8115,
        lng: 110.3631,
        funfact:
          "Masangin is a local tradition of walking blindfolded between the two banyan trees at Alun-Alun Selatan. Folklore says those who pass straight through have a pure heart.",
      },
    ],
  },
  {
    id: "jogja-taste-trail",
    title: "Jogja Taste Trail",
    tagline: "A Taste of Yogyakarta",
    description:
      "Start your afternoon with a traditional Javanese lunch. Discover the process behind Yogyakarta's famous Bakpia through a factory visit and tasting. Continue with legendary local snacks before enjoying an early dinner. Finish the experience at Alun-Alun Selatan with a warm cup of Wedang Ronde.",
    poster: "/challenge/poster-jogja-taste.webp",
    priceLabel: PRICE,
    duration: "One Day Trip",
    tags: ["Culinary", "Heritage", "Local"],
    destinationLabel: "Destination",
    destinations: [
      "Heritage Javanese Lunch",
      "Bakpia Factory",
      "Legendary Snack Corner",
      "Alun-Alun Selatan",
    ],
    includes: [
      "Gudeg lunch set",
      "Bakpia factory tour",
      "Bakpia tasting box",
      "Street food experience",
      "Bakmi Jawa or Soto dinner",
      "Tea during the factory walkthrough",
      "Wedang Ronde at Alun-Alun Selatan",
    ],
    meetingPoints: ["Yogyakarta Train Station", "Bandara YIA", "Hotel/Penginapan"],
    stops: [
      {
        id: "bakpia-pathuk",
        name: "Bakpia Factory",
        lat: -7.7945,
        lng: 110.3595,
        funfact:
          "Bakpia is strongly associated with the Pathuk area of Yogyakarta, where small family bakeries helped turn it into the city's best-known edible souvenir.",
      },
      {
        id: "alun-alun-selatan",
        name: "Alun-Alun Selatan",
        lat: -7.8115,
        lng: 110.3631,
        funfact:
          "Alun-Alun Selatan is the southern square of the Yogyakarta Palace and a favorite evening gathering spot, where Wedang Ronde, a warm ginger drink, is a classic treat.",
      },
    ],
  },
];

export type RewardCategory = "Wayang" | "Keychain" | "Earring";

export type Reward = {
  id: string;
  category: RewardCategory;
  label: string;
  image: string;
  points: number;
  priceLabel: string;
};

const wayang = (id: string, label: string, image: string): Reward => ({
  id,
  category: "Wayang",
  label,
  image: `/challenge/${image}.webp`,
  points: 200,
  priceLabel: "25 USD / ₩35.000",
});

const small = (
  id: string,
  category: RewardCategory,
  label: string,
  image: string,
): Reward => ({
  id,
  category,
  label,
  image: `/challenge/${image}.webp`,
  points: 50,
  priceLabel: "5 USD / ₩5000",
});

export const rewards: Reward[] = [
  wayang("wayang-wolverine", "Recycled plastic wayang, Wolverine", "wayang-wolverine"),
  wayang("wayang-pair-yellow", "Recycled plastic wayang pair", "wayang-pair-yellow"),
  wayang("wayang-bull-horse", "Recycled plastic wayang pair, bull and horse", "wayang-bull-horse"),
  wayang("wayang-cakil", "Recycled plastic wayang, Cakil", "wayang-cakil"),
  small("earring-heart", "Earring", "Heart note earrings", "earring-heart"),
  small("earring-set", "Earring", "Cat and turtle earrings", "earring-set"),
  small("key-blue-leaf", "Keychain", "Blue leaf keychain", "key-blue-leaf"),
  small("key-fish-leaf", "Keychain", "Fish and leaf keychain", "key-fish-leaf"),
  small("key-cat", "Keychain", "Cat keychain", "key-cat"),
  small("key-octopus", "Keychain", "Octopus keychain", "key-octopus"),
  small("key-boat", "Keychain", "Boat keychain", "key-boat"),
  small("key-pick", "Keychain", "Pick keychain", "key-pick"),
];

export const findPackage = (id: string | null | undefined) =>
  packages.find((p) => p.id === id) ?? null;

export const findReward = (id: string) => rewards.find((r) => r.id === id) ?? null;

/** The cheapest reward the visitor cannot afford yet, or null when everything is affordable. */
export const nextRewardFor = (points: number) =>
  [...rewards].filter((reward) => reward.points > points).sort((a, b) => a.points - b.points)[0] ?? null;

export const cheapestReward = () => Math.min(...rewards.map((reward) => reward.points));

/** Booking codes start with a short package prefix, e.g. CUT-1110-ABC. */
export const PACKAGE_PREFIX: Record<string, string> = {
  "code-urban-trail": "CUT",
  "mount-merapi-foothills": "MRP",
  "countryside-breeze": "CSB",
  "jogja-taste-trail": "JTT",
};

export const prefixOf = (pkg: ChallengePackage) => pkg.prefix ?? PACKAGE_PREFIX[pkg.id] ?? "DT";

const BOOKING_CODE = /^([A-Z]{2,4})-\d{4}-[A-Z0-9]{3}$/;

/** The package a booking code belongs to, or null when the text is not a booking code. */
export function packageForBookingCode(value: string, list: ChallengePackage[] = packages) {
  const match = BOOKING_CODE.exec(value.trim().toUpperCase());
  if (!match) return null;
  return list.find((pkg) => prefixOf(pkg) === match[1]) ?? null;
}
