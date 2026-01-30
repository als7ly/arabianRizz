import { auth } from "@clerk/nextjs";
import Image from "next/image";
import { redirect } from "next/navigation";
import Header from "@/components/shared/Header";
import { getUserById } from "@/lib/actions/user.actions";
import { plans } from "@/constants";
import Checkout from "@/components/shared/Checkout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";

const Profile = async () => {
  const { userId } = auth();

  if (!userId) redirect("/sign-in");

  const user = await getUserById(userId);

  return (
    <>
      <Header title="Profile" subtitle="Manage your account and credits" />

      <section className="profile">
        <div className="profile-balance flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-purple-100">
          <div className="relative h-20 w-20">
             <Image
                src={user.photo}
                alt="user"
                fill
                className="rounded-full object-cover"
             />
          </div>
          <div>
             <h2 className="text-2xl font-bold text-gray-800">{user.username}</h2>
             <div className="flex items-center gap-2 mt-2">
                 <Image src="/assets/icons/coins.svg" alt="coins" width={24} height={24} />
                 <span className="text-xl font-semibold text-purple-600">{user.creditBalance} Credits</span>
             </div>
          </div>
        </div>
      </section>

      <section className="mt-10">
         <h3 className="h3-bold text-dark-600 mb-6">Buy Credits</h3>

         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
             {plans.map((plan) => (
                 <Card key={plan._id} className="flex flex-col justify-between border-2 border-purple-200/20 hover:border-purple-200 transition-all shadow-sm">
                     <CardHeader>
                         <CardTitle className="text-purple-600">{plan.name}</CardTitle>
                         <CardDescription>
                            <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                            {plan.price > 0 && <span className="text-gray-500"> / one-time</span>}
                         </CardDescription>
                     </CardHeader>
                     <CardContent>
                        <div className="flex items-center gap-2 mb-4">
                            <Badge className="bg-purple-100 text-purple-600 hover:bg-purple-200">{plan.credits} Credits</Badge>
                        </div>
                        <ul className="space-y-3">
                            {plan.inclusions.map((inclusion) => (
                                <li key={inclusion.label} className="flex items-center gap-2 text-sm text-gray-600">
                                    {inclusion.isIncluded ? (
                                        <Check className="text-green-500 h-4 w-4" />
                                    ) : (
                                        <Check className="text-gray-300 h-4 w-4" />
                                    )}
                                    <span className={!inclusion.isIncluded ? "text-gray-400 line-through" : ""}>
                                        {inclusion.label}
                                    </span>
                                </li>
                            ))}
                        </ul>
                     </CardContent>
                     <CardFooter>
                         {plan.price > 0 ? (
                            <Checkout
                                plan={plan.name}
                                amount={plan.price}
                                credits={plan.credits}
                                buyerId={user._id}
                            />
                         ) : (
                            <Button variant="outline" className="w-full rounded-full cursor-default">Free Plan</Button>
                         )}
                     </CardFooter>
                 </Card>
             ))}
         </div>
      </section>
    </>
  );
};

export default Profile;
