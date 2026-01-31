import { getRandomTip } from "@/lib/actions/tips.actions";
import { Lightbulb } from "lucide-react";
import { getLocale } from "next-intl/server";

export default async function RizzTips() {
  const locale = await getLocale();
  const tip = await getRandomTip(locale);

  if (!tip) return null;

  return (
    <div className="bg-gradient-to-r from-purple-100 to-white p-4 rounded-xl border border-purple-200 shadow-sm mb-8 flex items-start gap-4">
      <div className="bg-white p-2 rounded-full shadow-sm text-purple-600">
        <Lightbulb size={24} />
      </div>
      <div>
        <h4 className="font-bold text-purple-900 mb-1">Rizz Tip of the Moment</h4>
        <p className="text-gray-700 text-sm leading-relaxed italic">
          "{tip.content.length > 150 ? tip.content.substring(0, 150) + "..." : tip.content}"
        </p>
      </div>
    </div>
  );
}
