import Header from "@/components/shared/Header";
import { plans } from "@/constants";
import Image from "next/image";
import Checkout from "@/components/shared/Checkout";
import { auth } from "@clerk/nextjs";
import { getUserById } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

const Credits = async () => {
  const { userId } = auth();

  if (!userId) redirect("/sign-in");

  const user = await getUserById(userId);

  return (
    <>
      <Header title="Buy Credits" subtitle="Choose a credit package that suits your needs!" />

      <section>
        <ul className="credits-list mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <li key={plan.name} className="credits-item rounded-[16px] border-2 border-purple-200/20 bg-white p-8 shadow-xl shadow-purple-200/20 lg:max-w-none">
              <div className="flex-center flex-col gap-3">
                <Image src={plan.icon} alt="check" width={50} height={50} />
                <p className="p-20-semibold mt-2 text-purple-500">
                  {plan.name}
                </p>
                <p className="h1-semibold text-dark-600">${plan.price}</p>
                <p className="p-14-regular">{plan.credits} Credits</p>
              </div>

              {/* Inclusions */}
              <ul className="flex flex-col gap-5 py-9">
                {plan.inclusions.map((inclusion) => (
                  <li
                    key={plan.name + inclusion.label}
                    className="flex items-center gap-4"
                  >
                    <Image
                      src={`/assets/icons/${
                        inclusion.isIncluded ? "check.svg" : "cross.svg"
                      }`}
                      alt="check"
                      width={24}
                      height={24}
                    />
                    <p className="p-16-regular">{inclusion.label}</p>
                  </li>
                ))}
              </ul>

              {plan.name === "Free" ? (
                <Button variant="outline" className="credits-btn">
                  Free Consumable
                </Button>
              ) : (
                <Checkout
                  plan={plan.name}
                  amount={plan.price}
                  credits={plan.credits}
                  buyerId={user._id}
                />
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
};

export default Credits;
