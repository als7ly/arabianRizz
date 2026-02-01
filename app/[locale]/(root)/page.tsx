import { auth } from "@clerk/nextjs";
import { getUserGirls } from "@/lib/actions/girl.actions";
import { getUserById } from "@/lib/actions/user.actions";
import { GirlCard } from "@/components/shared/GirlCard";
import { AddGirlForm } from "@/components/forms/AddGirlForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { getTranslations } from 'next-intl/server';
import CreditBalance from "@/components/shared/CreditBalance";
import Pagination from "@/components/shared/Pagination";
import Search from "@/components/shared/Search";
import RizzTips from "@/components/shared/RizzTips";
import OnboardingWizard from "@/components/shared/OnboardingWizard";
import { getUserContext } from "@/lib/actions/user-knowledge.actions";

const Dashboard = async ({ params: { locale }, searchParams }: { params: { locale: string }, searchParams: SearchParamProps['searchParams'] }) => {
  const { userId } = auth();
  const t = await getTranslations('Dashboard');
  const tIndex = await getTranslations('Index');
  const page = Number(searchParams?.page) || 1;
  const searchQuery = (searchParams?.query as string) || "";

  if (!userId) return null;

  const user = await getUserById(userId);
  const girlsData = await getUserGirls({ userId: user._id, page, query: searchQuery });
  const girls = girlsData?.data || [];
  const totalPages = girlsData?.totalPages || 0;

  // Check if user has completed onboarding (by checking if they have any knowledge/persona)
  // Or check a specific flag on user model. For now, checking UserKnowledge count is simple.
  const userContext = await getUserContext(user._id, "persona");
  const showOnboarding = userContext.length === 0;

  return (
    <>
      {showOnboarding && <OnboardingWizard userId={user._id} open={true} />}

      <section className="home relative overflow-hidden bg-purple-900">
        <div className="absolute inset-0 bg-[url('/assets/images/hero-pattern.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute top-[-50%] left-[-20%] w-[800px] h-[800px] bg-purple-600 rounded-full blur-[120px] opacity-30 animate-pulse"></div>
        <div className="flex justify-between items-start w-full max-w-6xl mx-auto px-5 md:px-10 py-10 relative z-10">
            <div className="max-w-2xl">
                <h1 className="home-heading text-5xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-md">
                {tIndex('title')}
                </h1>
                <p className="text-purple-100 mt-6 text-left text-xl md:text-2xl font-light leading-relaxed max-w-lg">
                    {tIndex('subtitle')}
                </p>
                <div className="mt-8 flex gap-4">
                     <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-white text-purple-900 hover:bg-gray-100 text-lg px-8 py-6 rounded-full font-bold shadow-lg transition-transform hover:scale-105">
                                {t('addGirl')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                             <DialogHeader>
                                <DialogTitle>{t('addGirl')}</DialogTitle>
                                <DialogDescription>{t('createProfileDesc')}</DialogDescription>
                            </DialogHeader>
                            <AddGirlForm userId={user._id} />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <div className="hidden lg:block bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl">
                <h3 className="text-white font-semibold mb-2">{t('balance')}</h3>
                <CreditBalance userId={userId} />
            </div>
        </div>
      </section>

      <section className="mt-10 wrapper">
        <div className="sm:hidden mb-6 flex justify-center">
             <CreditBalance userId={userId} />
        </div>

        <RizzTips />

        <div className="flex-between mb-8">
            <h2 className="h2-bold text-dark-600">{t('myGirls')}</h2>
            
            <Dialog>
                <DialogTrigger asChild>
                    <Button className="button bg-purple-gradient bg-cover text-white gap-2">
                        <Plus size={20} />
                        <span className="hidden sm:inline">{t('addGirl')}</span>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('addGirl')}</DialogTitle>
                        <DialogDescription>
                            {t('createProfileDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <AddGirlForm userId={user._id} />
                </DialogContent>
            </Dialog>
        </div>

        <div className="mb-8">
            <Search placeholder={t('searchPlaceholder')} />
        </div>

        {girls.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 mb-10">
              {girls.map((girl: any) => (
                <GirlCard key={girl._id} girl={girl} />
              ))}
            </div>
            <div className="flex-center">
                <Pagination page={page} totalPages={totalPages} />
            </div>
          </>
        ) : (
          <div className="w-full bg-white rounded-xl border border-purple-100 shadow-sm p-8 text-center space-y-6">
            <div className="max-w-md mx-auto space-y-4">
                <h3 className="h3-bold text-dark-600">{t('welcomeTitle')}</h3>
                <p className="p-16-regular text-dark-400">
                    {t('welcomeDesc')}
                </p>
                <ul className="text-left bg-purple-50 p-6 rounded-lg space-y-3">
                    <li className="flex items-center gap-3">
                        <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex-center text-xs font-bold">1</span>
                        <p className="p-14-medium">{t('step1')}</p>
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex-center text-xs font-bold">2</span>
                        <p className="p-14-medium">{t.rich('step2', {b: (chunks) => <b>{chunks}</b>})}</p>
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex-center text-xs font-bold">3</span>
                        <p className="p-14-medium">{t.rich('step3', {b: (chunks) => <b>{chunks}</b>})}</p>
                    </li>
                </ul>
                <div className="pt-4">
                    <p className="p-14-regular text-gray-400 mb-2">{t('noGirls')}</p>
                </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default Dashboard;
