import { auth } from "@clerk/nextjs";
import { getGirlById } from "@/lib/actions/girl.actions";
import Message from "@/lib/database/models/message.model";
import { connectToDatabase } from "@/lib/database/mongoose";
import Header from "@/components/shared/Header";
import { ChatInterface } from "@/components/shared/ChatInterface";
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
      <div className="mb-6">
        <Header
            title={girl.name}
            subtitle={girl.relationshipStatus}
            rightElement={
                <div className="flex items-center gap-2">
                    {girl.age && <Badge variant="secondary" className="text-lg px-4 py-1">{girl.age}</Badge>}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon" className="h-9 w-9">
                                <Edit size={16} className="text-gray-500" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Profile</DialogTitle>
                                <DialogDescription>Update details for {girl.name}</DialogDescription>
                            </DialogHeader>
                            <EditGirlForm girl={girl} />
                        </DialogContent>
                    </Dialog>
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
