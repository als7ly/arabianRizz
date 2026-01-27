import { auth } from "@clerk/nextjs";
import { getGirlById } from "@/lib/actions/girl.actions";
import { getContext } from "@/lib/actions/rag.actions"; // We can reuse this or create getHistory
import Message from "@/lib/database/models/message.model"; // Direct DB access for initial load
import { connectToDatabase } from "@/lib/database/mongoose";
import Header from "@/components/shared/Header";
import { ChatInterface } from "@/components/shared/ChatInterface";
import { DeleteGirlButton } from "@/components/shared/DeleteGirlButton";
import { Badge } from "@/components/ui/badge";

const GirlPage = async ({ params: { id } }: { params: { id: string } }) => {
  const { userId } = auth();
  if (!userId) return null;

  const girl = await getGirlById(id);

  // Fetch initial messages (last 50)
  await connectToDatabase();
  const messages = await Message.find({ girl: id }).sort({ createdAt: 1 }).limit(50);
  const serializedMessages = JSON.parse(JSON.stringify(messages));

  return (
    <>
      <div className="mb-6">
        <Header
            title={girl.name}
            subtitle={girl.relationshipStatus}
            rightElement={
                <div className="flex items-center gap-4">
                     {girl.age && <Badge variant="secondary" className="text-lg px-4 py-1">{girl.age}</Badge>}
                     <DeleteGirlButton girlId={girl._id} />
                </div>
            }
        />
      </div>

      <section className="w-full max-w-4xl mx-auto">
        <ChatInterface girlId={girl._id} initialMessages={serializedMessages} />
      </section>
    </>
  );
};

export default GirlPage;
