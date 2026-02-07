import { MessageCircle, Heart, Flame, Zap, Ghost, Frown, Coffee, Instagram, HelpCircle } from "lucide-react";

export type Scenario = {
  id: string;
  label: string;
  icon: any; // React component type
  instruction: string;
  color?: string; // Tailwind text color class
};

export type ScenarioCategory = {
  id: string;
  label: string;
  scenarios: Scenario[];
};

export const SCENARIO_CATEGORIES: ScenarioCategory[] = [
  {
    id: "openers",
    label: "Starters & Openers",
    scenarios: [
      {
        id: "funny_opener",
        label: "Funny Opener",
        icon: MessageCircle,
        instruction: "Give me a funny, attention-grabbing opening line to start the conversation.",
        color: "text-blue-500"
      },
      {
        id: "direct_opener",
        label: "Direct & Bold",
        icon: Zap,
        instruction: "Give me a direct, confident opener that shows intent without being creepy.",
        color: "text-yellow-500"
      },
      {
        id: "curious_opener",
        label: "Curious Question",
        icon: HelpCircle,
        instruction: "Give me an intriguing question to spark a conversation.",
        color: "text-purple-500"
      },
    ]
  },
  {
    id: "replies",
    label: "Replies & Flirting",
    scenarios: [
      {
        id: "roast",
        label: "Playful Roast",
        icon: Flame,
        instruction: "Give me a playful, flirty roast to tease her.",
        color: "text-red-500"
      },
      {
        id: "comfort",
        label: "Comfort & Support",
        icon: Heart,
        instruction: "She seems upset. Suggest a comforting and supportive message.",
        color: "text-pink-500"
      },
      {
        id: "date",
        label: "Ask for Date",
        icon: Coffee,
        instruction: "Suggest a creative and fun date idea based on our conversation.",
        color: "text-orange-500"
      },
    ]
  },
  {
    id: "situational",
    label: "Situational",
    scenarios: [
      {
        id: "ghosted",
        label: "Revive (Ghosted)",
        icon: Ghost,
        instruction: "She stopped replying. Give me a double-text to revive the conversation (playful, not desperate).",
        color: "text-gray-500"
      },
      {
        id: "rejection",
        label: "Handle Rejection",
        icon: Frown,
        instruction: "She said no or maybe. Give me a classy, unbothered reply to keep the door open or exit gracefully.",
        color: "text-indigo-500"
      },
      {
        id: "social",
        label: "Reply to Story",
        icon: Instagram,
        instruction: "I want to reply to her social media story. Suggest a witty or complimentary reply.",
        color: "text-pink-600"
      },
    ]
  }
];
