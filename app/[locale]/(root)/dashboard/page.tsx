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

      <section className="mb-12 space-y-10">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-border pb-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    {t('welcomeBack')}, {user.username || "King"}
                </h1>
                <p className="text-muted-foreground text-lg">{t('welcomeSubtitle')}</p>
            </div>

            <div className="flex items-center gap-4">
                 <div className="hidden md:block">
                    <CreditBalance userId={userId} />
                 </div>
                 <Link href="/dashboard/credits">
                    <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                        <Icons.billing className="me-2 h-4 w-4" />
                        {t('topUpCredits')}
                    </Button>
                 </Link>
            </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Dialog>
                <DialogTrigger asChild>
                    <div className="group p-6 rounded-2xl bg-card border border-border cursor-pointer hover:border-primary/50 transition-all relative overflow-hidden shadow-sm hover:shadow-md">
                        <div className="relative z-10 flex flex-col items-start h-full">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex-center mb-4 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                <Icons.add className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t('newPersonaTitle')}</h3>
                            <p className="text-sm text-muted-foreground mt-auto">{t('newPersonaDesc')}</p>
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

            <Link href="/saved" className="block h-full">
                <div className="group p-6 rounded-2xl bg-card border border-border cursor-pointer hover:border-blue-500/50 transition-all relative overflow-hidden shadow-sm hover:shadow-md h-full">
                    <div className="relative z-10 flex flex-col items-start h-full">
                         <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex-center mb-4 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <Icons.bookmark className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">{t('savedLinesTitle')}</h3>
                        <p className="text-sm text-muted-foreground mt-auto">{t('savedLinesDesc')}</p>
                    </div>
                </div>
            </Link>

             <Link href="/profile" className="block h-full">
                <div className="group p-6 rounded-2xl bg-card border border-border cursor-pointer hover:border-orange-500/50 transition-all relative overflow-hidden shadow-sm hover:shadow-md h-full">
                    <div className="relative z-10 flex flex-col items-start h-full">
                         <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex-center mb-4 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                            <Icons.settings className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">{t('myProfileTitle')}</h3>
                        <p className="text-sm text-muted-foreground mt-auto">{t('myProfileDesc')}</p>
                    </div>
                </div>
            </Link>
        </div>

        {/* Recent Girls / My Girls */}
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">{t('recentPersonas')}</h2>
                {girls.length > 3 && (
                     <Link href="/dashboard/girls" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                        {t('viewAll')} <Icons.arrowRight className="h-4 w-4 rtl:rotate-180" />
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
                <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-secondary/50">
                    <div className="w-16 h-16 bg-secondary rounded-full flex-center mx-auto mb-4 text-muted-foreground">
                        <Icons.user className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{t('noPersonasTitle')}</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{t('noPersonasDesc')}</p>
                    <Dialog>
                        <DialogTrigger asChild>
                             <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">{t('createPersonaBtn')}</Button>
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
