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

  return (
    <>
      <section className="home">
        <div className="flex justify-between items-start w-full max-w-5xl mx-auto px-5 md:px-10 py-5">
            <div>
                <h1 className="home-heading">
                {tIndex('title')}
                </h1>
                <p className="text-white mt-4 text-left text-lg opacity-90">{tIndex('subtitle')}</p>
            </div>
            <div className="hidden sm:block">
                <CreditBalance userId={userId} />
            </div>
        </div>
      </section>

      <section className="mt-10 wrapper">
        <div className="sm:hidden mb-6 flex justify-center">
             <CreditBalance userId={userId} />
        </div>

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
                            Create a profile for the girl you want to hook up with.
                        </DialogDescription>
                    </DialogHeader>
                    <AddGirlForm userId={user._id} />
                </DialogContent>
            </Dialog>
        </div>

        <div className="mb-8">
            <Search placeholder="Search girls by name or vibe..." />
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
                <h3 className="h3-bold text-dark-600">Welcome to ArabianRizz! 🧞‍♂️</h3>
                <p className="p-16-regular text-dark-400">
                    Your personal AI Wingman is ready. Follow these steps to get started:
                </p>
                <ul className="text-left bg-purple-50 p-6 rounded-lg space-y-3">
                    <li className="flex items-center gap-3">
                        <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex-center text-xs font-bold">1</span>
                        <p className="p-14-medium">Create a profile for the girl you like.</p>
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex-center text-xs font-bold">2</span>
                        <p className="p-14-medium">Use <b>Magic Fill</b> to extract details from a screenshot.</p>
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex-center text-xs font-bold">3</span>
                        <p className="p-14-medium">Start chatting and ask for <b>Hookup Lines</b>!</p>
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
