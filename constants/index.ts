export const navLinks = [
  {
    label: "Home",
    route: "/",
    icon: "/assets/icons/home.svg",
  },
  {
    label: "Profile",
    route: "/profile",
    icon: "/assets/icons/profile.svg",
  },
];

export const plans = [
  {
    _id: 1,
    name: "Free",
    icon: "/assets/icons/free-plan.svg",
    price: 0,
    credits: 20,
    inclusions: [
      {
        label: "20 Free Credits",
        isIncluded: true,
      },
      {
        label: "Basic Rizz Access",
        isIncluded: true,
      },
      {
        label: "Uncensored AI",
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
    icon: "/assets/icons/free-plan.svg",
    price: 9.99,
    credits: 100,
    inclusions: [
      {
        label: "100 Credits",
        isIncluded: true,
      },
      {
        label: "Uncensored Wingman",
        isIncluded: true,
      },
      {
        label: "Art Generation Access",
        isIncluded: true,
      },
      {
        label: "Priority Support",
        isIncluded: true,
      },
    ],
  },
  {
    _id: 3,
    name: "Playboy Pack",
    icon: "/assets/icons/free-plan.svg",
    price: 19.99,
    credits: 250,
    inclusions: [
      {
        label: "250 Credits",
        isIncluded: true,
      },
      {
        label: "Uncensored Wingman",
        isIncluded: true,
      },
      {
        label: "Art Generation Access",
        isIncluded: true,
      },
      {
        label: "Priority Updates",
        isIncluded: true,
      },
    ],
  },
  {
    _id: 4,
    name: "Rizz God Pack",
    icon: "/assets/icons/free-plan.svg",
    price: 49.99,
    credits: 1000,
    inclusions: [
      {
        label: "1000 Credits",
        isIncluded: true,
      },
      {
        label: "Ultimate Uncensored Access",
        isIncluded: true,
      },
      {
        label: "Unlimited Art Generation*",
        isIncluded: true,
      },
      {
        label: "VIP Status",
        isIncluded: true,
      },
    ],
  },
];

export const creditFee = -1;
