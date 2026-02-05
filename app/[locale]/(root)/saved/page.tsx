import { getTranslations } from "next-intl/server";
import { getSavedMessages } from "@/lib/actions/saved-message.actions";
import SavedList from "@/components/shared/SavedList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Lines - ArabianRizz",
  description: "Your collection of best lines.",
};

export default async function SavedPage() {
  const t = await getTranslations("Saved");
  const messages = await getSavedMessages();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-purple-gradient bg-cover w-fit">
          {t("title")}
        </h1>
        <p className="text-gray-500">{t("subtitle")}</p>
      </div>

      <SavedList initialMessages={messages} />
    </div>
  );
}
