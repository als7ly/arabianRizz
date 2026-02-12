import { auth } from "@clerk/nextjs";
import { getUserGirls } from "@/lib/actions/girl.actions";
import { getUserById } from "@/lib/actions/user.actions";
import { GirlCard } from "@/components/shared/GirlCard";
import { AddGirlForm } from "@/components/forms/AddGirlForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getTranslations } from 'next-intl/server';
import Pagination from "@/components/shared/Pagination";
import Search from "@/components/shared/Search";
import { Icons } from "@/components/ui/icons";

const MyGirlsPage = async ({ params: { locale }, searchParams }: { params: { locale: string }, searchParams: any }) => {
  const { userId } = auth();
  const t = await getTranslations('Dashboard');
  const page = Number(searchParams?.page) || 1;
  const searchQuery = (searchParams?.query as string) || "";

  if (!userId) return null;

  const user = await getUserById(userId);
  const girlsData = await getUserGirls({ userId: user._id, page, query: searchQuery });
  const girls = girlsData?.data || [];
  const totalPages = girlsData?.totalPages || 0;

  return (
    <section>
        <div className="flex-between mb-8">
            <h2 className="h2-bold">{t('myGirls')}</h2>

            <Dialog>
                <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 gap-2">
                        <Icons.add size={20} />
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
          <div className="p-12 text-center border border-dashed border-white/20 rounded-2xl bg-white/5">
             <div className="w-16 h-16 bg-white/10 rounded-full flex-center mx-auto mb-4 text-muted-foreground">
                <Icons.user className="h-8 w-8" />
             </div>
             <h3 className="h3-bold mb-2">No personas found</h3>
             <p className="text-muted-foreground">Try adjusting your search or add a new one.</p>
          </div>
        )}
      </section>
  );
};

export default MyGirlsPage;
