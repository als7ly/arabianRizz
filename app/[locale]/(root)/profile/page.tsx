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
import { getTransactions } from "@/lib/actions/transaction.actions";
import CreditBalance from "@/components/shared/CreditBalance";
import PersonaManager from "@/components/shared/PersonaManager";
import BillingHistory from "@/components/shared/BillingHistory";
import ManageSubscriptionButton from "@/components/shared/ManageSubscriptionButton";
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
  const transactions = await getTransactions(user._id);

  return (
    <>
      <Header title={t('title')} subtitle={t('subtitle')} />

      <section className="profile mt-10 max-w-4xl mx-auto">
        <div className="space-y-10">
            {/* User Info */}
            <div className="flex items-center gap-6 pb-8 border-b border-border">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex-center text-primary text-3xl font-bold border border-primary/20">
                    {user.firstName?.[0] || user.username?.[0]}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-foreground">{user.firstName} {user.lastName}</h2>
                    <p className="text-lg font-medium text-muted-foreground">@{user.username}</p>
                    <p className="text-sm text-muted-foreground/80">{user.email}</p>
                </div>
            </div>

            {/* Credits Section */}
            <div className="pb-8 border-b border-border">
                <h3 className="text-xl font-semibold text-foreground mb-6">{t('subscription')}</h3>
                <div className="flex justify-between items-center bg-secondary/50 border border-border p-6 rounded-2xl flex-wrap gap-6">
                    <div>
                        <p className="text-lg font-medium text-foreground">{t('currentPlan')} <span className="text-primary font-bold">{tPlans('names.free')}</span></p>
                        <div className="mt-2">
                            <CreditBalance userId={user.clerkId} />
                        </div>
                    </div>
                    <div className="flex gap-3">
                         <ManageSubscriptionButton />
                         <Link href="/credits">
                            <Button variant="default" className="bg-primary text-white hover:bg-primary/90 shadow-md">
                                {t('upgrade')}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Billing History */}
            <div className="pb-8 border-b border-border">
                <h3 className="text-xl font-semibold text-foreground mb-6">Billing History</h3>
                <div className="bg-background border border-border rounded-2xl overflow-hidden">
                    <BillingHistory transactions={transactions} />
                </div>
            </div>

            {/* Persona Section */}
            <div className="pb-8 border-b border-border">
                 <h3 className="text-xl font-semibold text-foreground mb-6">My Personas</h3>
                <PersonaManager />
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4">
                <SignOutButton>
                    <Button variant="destructive" size="lg">{t('signOut')}</Button>
                </SignOutButton>
            </div>
        </div>
      </section>
    </>
  );
};

export default Profile;
