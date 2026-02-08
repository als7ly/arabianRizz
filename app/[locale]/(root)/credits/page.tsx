import { plans } from "@/constants";
import Checkout from "@/components/shared/Checkout";
import { auth } from "@clerk/nextjs";
import { getUserById } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const Credits = async () => {
  const { userId } = auth();
  const t = await getTranslations('Credits');
  const tPlans = await getTranslations('Plans');

  if (!userId) redirect("/sign-in");

  const user = await getUserById(userId);

  return (
    <>
      <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in-up">
        <h1 className="h1-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-4">{t('title')}</h1>
        <p className="text-muted-foreground text-lg">{t('subtitle')}</p>
      </div>

      <section className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
             const isPopular = plan.name === "Playboy Pack";

             return (
                <li key={plan.name} className={cn(
                    "relative flex flex-col rounded-2xl border p-8 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl",
                    isPopular ? "border-primary bg-primary/10 shadow-primary/20" : "border-white/10 bg-white/5 glass-card"
                )}>
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider shadow-lg">
                        Best Value
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <div className={cn("mb-4 flex-center h-16 w-16 mx-auto rounded-full border border-white/10", isPopular ? "bg-primary/20" : "bg-white/5")}>
                        {/* Dynamic Icon Logic */}
                        {plan.name.includes("God") ? <Icons.sparkles className="h-8 w-8 text-gold-500" /> :
                         plan.name.includes("Playboy") ? <Icons.heart className="h-8 w-8 text-primary" /> :
                         <Icons.zap className="h-8 w-8 text-muted-foreground" />}
                    </div>
                    <h3 className={cn("text-xl font-bold mb-2", isPopular ? "text-primary" : "text-white")}>
                      {tPlans(`names.${plan.translationKey}`)}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-extrabold text-white">${plan.price}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{plan.credits} {t('credits')}</p>
                  </div>

                  {/* Inclusions */}
                  <ul className="flex-1 flex flex-col gap-4 mb-8">
                    {plan.inclusions.map((inclusion) => (
                      <li
                        key={plan.name + inclusion.key}
                        className="flex items-start gap-3"
                      >
                         {inclusion.isIncluded ? (
                            <Icons.check className="h-5 w-5 text-green-500 shrink-0" />
                         ) : (
                            <Icons.close className="h-5 w-5 text-muted-foreground/30 shrink-0" />
                         )}
                        <p className={cn("text-sm text-left leading-tight", inclusion.isIncluded ? "text-gray-200" : "text-muted-foreground/50")}>
                            {tPlans(`inclusions.${inclusion.key}`)}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                      {plan.name === "Free" ? (
                        <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-muted-foreground cursor-not-allowed" disabled>
                          {t('freeConsumable')}
                        </Button>
                      ) : (
                        <Checkout
                          plan={plan.name}
                          amount={plan.price}
                          credits={plan.credits}
                          buyerId={user._id}
                        />
                      )}
                  </div>
                </li>
          )})}
        </ul>
      </section>

      {/* Subscription Upsell - Future Proofing */}
      <div className="mt-20 p-8 rounded-3xl bg-gradient-to-r from-purple-900/50 to-black/50 border border-purple-500/30 text-center relative overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
         <div className="absolute top-0 right-0 p-32 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
         <div className="relative z-10">
            <h2 className="h2-bold mb-4">Want Unlimited Rizz?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join the Pro Club and get monthly credits, exclusive features, and priority access to our most advanced models.
            </p>
            <Button size="lg" className="bg-white text-purple-900 hover:bg-gray-100 font-bold px-8 rounded-full shadow-lg transition-transform hover:scale-105">
                Coming Soon
            </Button>
         </div>
      </div>
    </>
  );
};

export default Credits;
