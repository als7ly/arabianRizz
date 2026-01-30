import { auth } from "@clerk/nextjs";
import { getGirlById } from "@/lib/actions/girl.actions";
import Message from "@/lib/database/models/message.model";
import { connectToDatabase } from "@/lib/database/mongoose";
import Header from "@/components/shared/Header";
import { ChatInterface } from "@/components/shared/ChatInterface";
import { DeleteGirlButton } from "@/components/shared/DeleteGirlButton";
import { EditGirlButton } from "@/components/shared/EditGirlButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EditGirlForm } from "@/components/forms/EditGirlForm";

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <Header title={girl.name} subtitle={girl.relationshipStatus} />
          <div className="flex gap-4 mt-2 ml-1">
            <div className="text-yellow-500 font-bold flex items-center gap-1 text-sm">
                ⭐ {girl.rating || 5}/10
            </div>
            {girl.socialMediaHandle && (
                <div className="text-blue-500 font-medium text-sm">
                    @{girl.socialMediaHandle.replace('@', '')}
                </div>
            )}
          </div>
        </div>
        {girl.age && <Badge variant="secondary" className="text-lg px-4 py-1">{girl.age}</Badge>}
      </div>

      <section className="w-full max-w-4xl mx-auto">
        <ChatInterface girlId={girl._id} initialMessages={serializedMessages} />
      </section>
    </>
  );
};

export default GirlPage;
