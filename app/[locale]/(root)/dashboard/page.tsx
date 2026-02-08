import { auth } from "@clerk/nextjs";
import { getUserGirls } from "@/lib/actions/girl.actions";
import { getUserById } from "@/lib/actions/user.actions";
import { GirlCard } from "@/components/shared/GirlCard";
import { AddGirlForm } from "@/components/forms/AddGirlForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getTranslations } from 'next-intl/server';
import CreditBalance from "@/components/shared/CreditBalance";
import OnboardingWizard from "@/components/shared/OnboardingWizard";
import { getUserContext } from "@/lib/actions/user-knowledge.actions";
import { Icons } from "@/components/ui/icons";
import { Link } from "@/navigation";

const Dashboard = async ({ params: { locale }, searchParams }: { params: { locale: string }, searchParams: any }) => {
  const { userId } = auth();
  const t = await getTranslations('Dashboard');

  if (!userId) return null;

  const user = await getUserById(userId);
  const girlsData = await getUserGirls({ userId: user._id, page: 1, limit: 3 });
  const girls = girlsData?.data || [];

  const userContext = await getUserContext(user._id, "persona");
  const showOnboarding = userContext.length === 0;

  return (
    <>
      {showOnboarding && <OnboardingWizard userId={user._id} open={true} />}

      <section className="mb-12 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="h2-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200">
                    {t('welcomeBack')}, {user.username || "King"}
                </h1>
                <p className="text-muted-foreground mt-2">Ready to level up your game today?</p>
            </div>

            <div className="flex items-center gap-4">
                 <div className="hidden md:block">
                    <CreditBalance userId={userId} />
                 </div>
                 <Link href="/dashboard/credits">
                    <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                        <Icons.billing className="mr-2 h-4 w-4" />
                        Top Up
                    </Button>
                 </Link>
            </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Dialog>
                <DialogTrigger asChild>
                    <div className="group p-6 rounded-2xl glass-card cursor-pointer hover:bg-white/10 transition-all border-l-4 border-l-primary relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Icons.add className="h-24 w-24" />
                        </div>
                        <div className="relative z-10">
                            <div className="h-12 w-12 rounded-full bg-primary/20 flex-center mb-4 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                <Icons.add className="h-6 w-6" />
                            </div>
                            <h3 className="h3-bold mb-2">New Persona</h3>
                            <p className="text-sm text-muted-foreground">Create a new girl profile to start chatting.</p>
                        </div>
                    </div>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('addGirl')}</DialogTitle>
                        <DialogDescription>{t('createProfileDesc')}</DialogDescription>
                    </DialogHeader>
                    <AddGirlForm userId={user._id} />
                </DialogContent>
            </Dialog>

            <Link href="/saved" className="block">
                <div className="group p-6 rounded-2xl glass-card cursor-pointer hover:bg-white/10 transition-all border-l-4 border-l-secondary relative overflow-hidden h-full">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Icons.bookmark className="h-24 w-24" />
                        </div>
                    <div className="relative z-10">
                         <div className="h-12 w-12 rounded-full bg-secondary/20 flex-center mb-4 text-secondary-foreground group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                            <Icons.bookmark className="h-6 w-6" />
                        </div>
                        <h3 className="h3-bold mb-2">Saved Lines</h3>
                        <p className="text-sm text-muted-foreground">Access your best pickup lines and replies.</p>
                    </div>
                </div>
            </Link>

             <Link href="/profile" className="block">
                <div className="group p-6 rounded-2xl glass-card cursor-pointer hover:bg-white/10 transition-all border-l-4 border-l-gold-500 relative overflow-hidden h-full">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Icons.settings className="h-24 w-24" />
                        </div>
                    <div className="relative z-10">
                         <div className="h-12 w-12 rounded-full bg-gold-500/20 flex-center mb-4 text-gold-500 group-hover:bg-gold-500 group-hover:text-white transition-colors">
                            <Icons.settings className="h-6 w-6" />
                        </div>
                        <h3 className="h3-bold mb-2">My Profile</h3>
                        <p className="text-sm text-muted-foreground">Update your bio to get better advice.</p>
                    </div>
                </div>
            </Link>
        </div>

        {/* Recent Girls / My Girls */}
        <div>
            <div className="flex-between mb-6">
                <h2 className="h2-bold">Recent Personas</h2>
                {girls.length > 3 && (
                     <Link href="/dashboard/girls" className="text-primary hover:underline flex items-center gap-1">
                        View All <Icons.arrowRight className="h-4 w-4" />
                    </Link>
                )}
            </div>

            {girls.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {girls.map((girl: any) => (
                        <GirlCard key={girl._id} girl={girl} />
                    ))}
                </div>
            ) : (
                <div className="p-12 text-center border border-dashed border-white/20 rounded-2xl bg-white/5">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex-center mx-auto mb-4 text-muted-foreground">
                        <Icons.user className="h-8 w-8" />
                    </div>
                    <h3 className="h3-bold mb-2">No personas yet</h3>
                    <p className="text-muted-foreground mb-6">Create your first AI persona to start getting tailored advice.</p>
                    <Dialog>
                        <DialogTrigger asChild>
                             <Button className="bg-primary hover:bg-primary/90">Create Persona</Button>
                        </DialogTrigger>
                        <DialogContent>
                             <DialogHeader>
                                <DialogTitle>{t('addGirl')}</DialogTitle>
                                <DialogDescription>{t('createProfileDesc')}</DialogDescription>
                            </DialogHeader>
                            <AddGirlForm userId={user._id} />
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </div>
      </section>
    </>
  );
};

export default Dashboard;
