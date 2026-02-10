"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ReferralList from "@/components/admin/ReferralList";
import ReferralForm from "@/components/admin/ReferralForm";
import { useRouter } from "next/navigation";

interface ReferralsManagerProps {
  initialItems: any[];
}

export default function ReferralsManager({ initialItems }: ReferralsManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const router = useRouter();

  const handleCreate = () => {
    setEditingItem(null);
    setIsEditing(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsEditing(true);
  };

  const handleSuccess = () => {
    setIsEditing(false);
    setEditingItem(null);
    router.refresh(); // Refresh server data
  };

  const handleRefresh = () => {
    router.refresh();
  };

  if (isEditing) {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">{editingItem ? "Edit Item" : "New Referral Item"}</h2>
            </div>
            <ReferralForm
                item={editingItem}
                onSuccess={handleSuccess}
                onCancel={() => setIsEditing(false)}
            />
        </div>
    );
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Referral Items</h2>
            <Button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
        </div>
        <ReferralList items={initialItems} onEdit={handleEdit} onRefresh={handleRefresh} />
    </div>
  );
}
