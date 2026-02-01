import { getPendingKnowledge } from "@/lib/actions/admin.actions";
import { getAnalyticsData } from "@/lib/actions/analytics.actions";
import { getUserById } from "@/lib/actions/user.actions";
import CrawlerForm from "@/components/shared/CrawlerForm";
import PendingItem from "@/components/shared/PendingItem";
import Header from "@/components/shared/Header";
import Pagination from "@/components/shared/Pagination";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { BarChart, Users, DollarSign, Database, Activity } from "lucide-react";

export default async function KnowledgeAdminPage({ searchParams }: { searchParams: SearchParamProps['searchParams'] }) {
  const { userId } = auth();

  if (!userId) {
      redirect("/sign-in");
  }

  // RBAC Check
  try {
      const user = await getUserById(userId);
      if (user.role !== 'admin') {
          redirect("/"); // Redirect unauthorized users to home
      }
  } catch (e) {
      redirect("/");
  }

  const page = Number(searchParams?.page) || 1;
  const language = (searchParams?.language as string) || 'all';

  const result = await getPendingKnowledge(page, 20, language);
  const pendingItems = result.data || [];
  const totalPages = result.totalPages || 0;

  const analytics = await getAnalyticsData();

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <Header title="Knowledge Base Admin" subtitle="Crawl content and refine RAG data." />

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-full">
                  <DollarSign size={24} />
              </div>
              <div>
                  <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
                  <h3 className="text-2xl font-bold text-gray-800">${analytics.totalRevenue.toFixed(2)}</h3>
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                  <Users size={24} />
              </div>
              <div>
                  <p className="text-sm text-gray-500 font-medium">Active Users (24h)</p>
                  <h3 className="text-2xl font-bold text-gray-800">{analytics.activeUsers}</h3>
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                  <Database size={24} />
              </div>
              <div>
                  <p className="text-sm text-gray-500 font-medium">Global Knowledge</p>
                  <h3 className="text-2xl font-bold text-gray-800">{analytics.totalKnowledge}</h3>
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
                  <Activity size={24} />
              </div>
              <div>
                  <p className="text-sm text-gray-500 font-medium">Total Interactions</p>
                  <h3 className="text-2xl font-bold text-gray-800">{analytics.totalInteractions}</h3>
              </div>
          </div>
      </div>

      <div className="mt-12">
        <h3 className="text-xl font-bold mb-4 text-gray-800">1. Crawler</h3>
        <CrawlerForm />
      </div>

      <div className="mt-12">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">2. Review Queue</h3>
            <div className="flex gap-2 text-sm">
                <a href="?language=all" className={`px-2 py-1 rounded ${language === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>All</a>
                <a href="?language=ar" className={`px-2 py-1 rounded ${language === 'ar' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>AR</a>
                <a href="?language=en" className={`px-2 py-1 rounded ${language === 'en' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>EN</a>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
            {pendingItems.length === 0 ? (
                <p className="text-gray-500 italic">No pending items to review.</p>
            ) : (
                pendingItems.map((item: any) => (
                    <PendingItem key={item._id} item={item} />
                ))
            )}
        </div>

        <div className="mt-8 flex justify-center">
            <Pagination page={page} totalPages={totalPages} />
        </div>
      </div>
    </div>
  );
}
