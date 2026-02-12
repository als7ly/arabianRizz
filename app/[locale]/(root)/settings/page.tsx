import { auth } from "@clerk/nextjs";
import { getUserSettings } from "@/lib/actions/settings.actions";
import { SettingsForm } from "@/components/shared/SettingsForm";
import Header from "@/components/shared/Header";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings - ArabianRizz",
  description: "Manage your account preferences.",
};

export default async function SettingsPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const settings = await getUserSettings();

  return (
    <>
      <Header title="Settings" subtitle="Manage your preferences and account." />

      <section className="mt-10 max-w-4xl mx-auto">
        <SettingsForm initialSettings={settings} />
      </section>
    </>
  );
}
