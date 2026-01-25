import { auth } from "@clerk/nextjs";
import { getUserGirls } from "@/lib/actions/girl.actions";
import { getUserById } from "@/lib/actions/user.actions";
import { GirlCard } from "@/components/shared/GirlCard";
import { AddGirlForm } from "@/components/forms/AddGirlForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { getTranslations } from 'next-intl/server';

const Dashboard = async ({ params: { locale } }: { params: { locale: string } }) => {
  const { userId } = auth();
  const t = await getTranslations('Dashboard');
  const tIndex = await getTranslations('Index');

  if (!userId) return null;

  const user = await getUserById(userId);
  const girls = await getUserGirls(user._id);

  return (
    <>
      <section className="home">
        <h1 className="home-heading">
          {tIndex('title')}
        </h1>
        <p className="text-white mt-4 text-center text-lg opacity-90">{tIndex('subtitle')}</p>
      </section>

      <section className="mt-10 wrapper">
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

        {girls.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {girls.map((girl: any) => (
              <GirlCard key={girl._id} girl={girl} />
            ))}
          </div>
        ) : (
          <div className="flex-center w-full h-60 border-2 border-dashed border-purple-200/20 rounded-[16px] bg-purple-50/50">
            <div className="text-center">
                <p className="p-20-semibold text-purple-500">{t('noGirls')}</p>
                <p className="p-14-regular mt-2 text-dark-400">Click the button above to add one.</p>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default Dashboard;
