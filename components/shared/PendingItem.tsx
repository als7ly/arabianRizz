"use client";

import { approveKnowledge, rejectKnowledge, editKnowledge } from "@/lib/actions/admin.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Edit2, Save } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export default function PendingItem({ item }: { item: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(item.content);
  const { toast } = useToast();

  const handleApprove = async () => {
    await approveKnowledge(item._id);
    toast({ title: "Approved" });
  };

  const handleReject = async () => {
    await rejectKnowledge(item._id);
    toast({ title: "Rejected" });
  };

  const handleSave = async () => {
    await editKnowledge(item._id, content);
    setIsEditing(false);
    toast({ title: "Updated" });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
      <div className="flex justify-between items-center text-sm text-gray-500">
         <span>Lang: <span className="font-bold text-gray-700 uppercase">{item.language}</span></span>
         <span className="truncate max-w-[300px]">{item.sourceUrl}</span>
      </div>

      {isEditing ? (
        <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px]"
        />
      ) : (
        <p className="text-gray-800 p-2 bg-gray-50 rounded text-sm leading-relaxed">{item.content}</p>
      )}

      <div className="flex justify-end gap-2">
        {isEditing ? (
             <Button size="sm" onClick={handleSave} variant="outline" className="text-blue-600 gap-1">
                <Save size={16} /> Save
             </Button>
        ) : (
             <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                <Edit2 size={16} />
             </Button>
        )}

        <Button size="sm" onClick={handleReject} variant="destructive" className="gap-1">
            <X size={16} /> Reject
        </Button>
        <Button size="sm" onClick={handleApprove} className="bg-green-600 hover:bg-green-700 gap-1">
            <Check size={16} /> Approve
        </Button>
      </div>
    </div>
  );
}
