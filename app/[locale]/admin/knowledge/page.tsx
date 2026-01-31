import { getPendingKnowledge } from "@/lib/actions/admin.actions";
import CrawlerForm from "@/components/shared/CrawlerForm";
import PendingItem from "@/components/shared/PendingItem";
import Header from "@/components/shared/Header";

export default async function KnowledgeAdminPage() {
  const pendingItems = await getPendingKnowledge();

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <Header title="Knowledge Base Admin" subtitle="Crawl content and refine RAG data." />

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 text-gray-800">1. Crawler</h3>
        <CrawlerForm />
      </div>

      <div className="mt-12">
        <h3 className="text-xl font-bold mb-4 text-gray-800">2. Review Queue ({pendingItems.length})</h3>
        <div className="grid grid-cols-1 gap-4">
            {pendingItems.length === 0 ? (
                <p className="text-gray-500 italic">No pending items to review.</p>
            ) : (
                pendingItems.map((item: any) => (
                    <PendingItem key={item._id} item={item} />
                ))
            )}
        </div>
      </div>
    </div>
  );
}
