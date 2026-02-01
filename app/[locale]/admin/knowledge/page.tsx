import { getPendingKnowledge } from "@/lib/actions/admin.actions";
import CrawlerForm from "@/components/shared/CrawlerForm";
import PendingItem from "@/components/shared/PendingItem";
import Header from "@/components/shared/Header";
import Pagination from "@/components/shared/Pagination";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function KnowledgeAdminPage({ searchParams }: { searchParams: SearchParamProps['searchParams'] }) {
  const { userId } = auth();

  // Basic Auth Check - In a real app, check against an ADMIN_ID env var or user role
  if (!userId) {
      redirect("/sign-in");
  }

  const page = Number(searchParams?.page) || 1;
  const language = (searchParams?.language as string) || 'all';

  const result = await getPendingKnowledge(page, 20, language);
  const pendingItems = result.data || [];
  const totalPages = result.totalPages || 0;

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <Header title="Knowledge Base Admin" subtitle="Crawl content and refine RAG data." />

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 text-gray-800">1. Crawler</h3>
        <CrawlerForm />
      </div>

      <div className="mt-12">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">2. Review Queue</h3>
            {/* Simple Language Filter Link - In a real app, this would be a proper client component filter */}
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
