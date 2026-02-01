import { auth } from "@clerk/nextjs";
import Image from "next/image";
import Header from "@/components/shared/Header";
import { plans } from "@/constants";
import Checkout from "@/components/shared/Checkout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { getUserById } from "@/lib/actions/user.actions";
import CreditBalance from "@/components/shared/CreditBalance";
import PersonaManager from "@/components/shared/PersonaManager";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

const Profile = async () => {
  const { userId } = auth();
  const t = await getTranslations('Profile');
  const tPlans = await getTranslations('Plans');

  if (!userId) redirect("/sign-in");

  const user = await getUserById(userId);

  return (
    <>
      <Header title={t('title')} subtitle={t('subtitle')} />

      <section className="profile mt-10">
        <div className="profile-card p-5 bg-white rounded-xl border border-purple-200/20 shadow-lg space-y-6">
            {/* User Info */}
            <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-purple-100 flex-center text-purple-600 text-2xl font-bold">
                    {user.firstName?.[0] || user.username?.[0]}
                </div>
                <div>
                    <h2 className="h3-bold text-dark-600">{user.firstName} {user.lastName}</h2>
                    <p className="p-16-regular text-dark-400">@{user.username}</p>
                    <p className="p-14-regular text-gray-400">{user.email}</p>
                </div>
            </div>

            {/* Credits Section */}
            <div className="border-t border-gray-100 pt-6">
                <h3 className="h4-medium text-dark-600 mb-4">{t('subscription')}</h3>
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                    <div>
                        <p className="p-16-semibold text-dark-600">{t('currentPlan')} <span className="text-purple-600">{tPlans('names.free')}</span></p>
                        <div className="mt-2">
                            <CreditBalance userId={user.clerkId} />
                        </div>
                    </div>
                    <Link href="/credits">
                        <Button variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50">
                            {t('upgrade')}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Persona Section */}
            <div className="border-t border-gray-100 pt-6">
                <PersonaManager />
            </div>

            {/* Actions */}
            <div className="border-t border-gray-100 pt-6 flex justify-end">
                <SignOutButton>
                    <Button variant="destructive">{t('signOut')}</Button>
                </SignOutButton>
            </div>
        </div>
      </section>
    </>
  );
};

export default Profile;
