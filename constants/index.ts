export const navLinks = [
  {
    label: "Dashboard",
    key: "dashboard",
    route: "/dashboard",
    icon: "dashboard",
  },
  {
    label: "Saved Lines",
    key: "saved",
    route: "/saved",
    icon: "bookmark",
  },
  {
    label: "Profile",
    key: "profile",
    route: "/profile",
    icon: "user",
  },
  {
    label: "Settings",
    key: "settings",
    route: "/settings",
    icon: "settings",
  },
];

export const VOICE_OPTIONS = [
  { key: "nova", value: "nova" },
  { key: "shimmer", value: "shimmer" },
  { key: "alloy", value: "alloy" },
  { key: "echo", value: "echo" },
  { key: "fable", value: "fable" },
  { key: "onyx", value: "onyx" },
];

export const plans = [
  {
    _id: 1,
    name: "Free",
    translationKey: "free",
    icon: "/assets/icons/free-plan.svg",
    price: 0,
    credits: 20,
    stripePriceId: "", // Free plan has no Stripe ID
    inclusions: [
      {
        label: "20 Free Credits",
        key: "credits_20",
        isIncluded: true,
      },
      {
        label: "Basic Rizz Access",
        key: "basic_rizz",
        isIncluded: true,
      },
      {
        label: "Uncensored AI",
        key: "uncensored_ai",
        isIncluded: false,
      },
      {
        label: "Art Generation",
        isIncluded: false,
      },
    ],
  },
  {
    _id: 2,
    name: "Starter Pack",
    translationKey: "starter",
    icon: "/assets/icons/free-plan.svg",
    price: 9.99,
    credits: 100,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || "price_starter_pack_placeholder",
    inclusions: [
      {
        label: "100 Credits",
        key: "credits_100",
        isIncluded: true,
      },
      {
        label: "Uncensored Wingman",
        key: "uncensored_wingman",
        isIncluded: true,
      },
      {
        label: "Art Generation Access",
        key: "art_access",
        isIncluded: true,
      },
      {
        label: "Priority Support",
        key: "priority_support",
        isIncluded: true,
      },
    ],
  },
  {
    _id: 3,
    name: "Playboy Pack",
    translationKey: "playboy",
    icon: "/assets/icons/free-plan.svg",
    price: 19.99,
    credits: 250,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PLAYBOY_PRICE_ID || "price_playboy_pack_placeholder",
    inclusions: [
      {
        label: "250 Credits",
        key: "credits_250",
        isIncluded: true,
      },
      {
        label: "Uncensored Wingman",
        key: "uncensored_wingman",
        isIncluded: true,
      },
      {
        label: "Art Generation Access",
        key: "art_access",
        isIncluded: true,
      },
      {
        label: "Priority Updates",
        key: "priority_updates",
        isIncluded: true,
      },
    ],
  },
  {
    _id: 4,
    name: "Rizz God Pack",
    translationKey: "rizz_god",
    icon: "/assets/icons/free-plan.svg",
    price: 49.99,
    credits: 1000,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_RIZZ_GOD_PRICE_ID || "price_rizz_god_pack_placeholder",
    inclusions: [
      {
        label: "1000 Credits",
        key: "credits_1000",
        isIncluded: true,
      },
      {
        label: "Ultimate Uncensored Access",
        key: "ultimate_uncensored",
        isIncluded: true,
      },
      {
        label: "Unlimited Art Generation*",
        key: "unlimited_art",
        isIncluded: true,
      },
      {
        label: "VIP Status",
        key: "vip_status",
        isIncluded: true,
      },
    ],
  },
];

export const creditFee = -1;

export const BLOCKED_KEYWORDS = [
  "child", "minor", "underage", "teen", "baby", "rape", "abuse", "kill", "murder", "suicide", "terror", "bomb"
];

export const LOW_BALANCE_THRESHOLD = 10;
