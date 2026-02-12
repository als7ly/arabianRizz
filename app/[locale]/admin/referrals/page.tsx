import { auth } from "@clerk/nextjs";
import { getUserById } from "@/lib/actions/user.actions";
import { getReferralItems } from "@/lib/actions/referral.actions";
import { redirect } from "next/navigation";
import Header from "@/components/shared/Header";
import ReferralsManager from "@/components/admin/ReferralsManager";

export default async function ReferralsAdminPage({ searchParams }: { searchParams: { page?: string } }) {
  const { userId } = auth();

  if (!userId) {
      redirect("/sign-in");
  }

  // RBAC Check
  try {
      const user = await getUserById(userId);
      if (user.role !== 'admin') {
          redirect("/");
      }
  } catch (e) {
      redirect("/");
  }

  const page = Number(searchParams?.page) || 1;
  const result = await getReferralItems({ page, limit: 20 });
  const items = result.data || [];

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <Header title="Referral Management" subtitle="Manage affiliate products, date ideas, and gifts." />

      <div className="mt-8">
        <ReferralsManager initialItems={items} />
      </div>
    </div>
  );
}
