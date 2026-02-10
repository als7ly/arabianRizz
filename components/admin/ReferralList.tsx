"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { deleteReferralItem } from "@/lib/actions/referral.actions";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface ReferralListProps {
  items: any[];
  onEdit: (item: any) => void;
  onRefresh: () => void;
}

export default function ReferralList({ items, onEdit, onRefresh }: ReferralListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    setDeletingId(id);
    try {
        await deleteReferralItem(id);
        toast({ title: "Deleted", description: "Item removed." });
        onRefresh();
    } catch (e) {
        toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    } finally {
        setDeletingId(null);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                    <tr>
                        <th className="px-4 py-3">Image</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Tags</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {items.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No items found.</td>
                        </tr>
                    ) : (
                        items.map((item) => (
                            <tr key={item._id} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3">
                                    {item.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded bg-gray-100" />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">N/A</div>
                                    )}
                                </td>
                                <td className="px-4 py-3 font-medium text-gray-900">
                                    <div className="flex flex-col">
                                        <span>{item.name}</span>
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 flex items-center hover:underline">
                                            Link <ExternalLink size={10} className="ml-1" />
                                        </a>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant="secondary" className="capitalize">{item.category.replace('_', ' ')}</Badge>
                                </td>
                                <td className="px-4 py-3">
                                    {item.price ? `${item.price} ${item.currency}` : '-'}
                                </td>
                                <td className="px-4 py-3 max-w-[200px] truncate text-gray-500">
                                    {item.tags.join(", ")}
                                </td>
                                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                                    <Button variant="ghost" size="icon" onClick={() => onEdit(item)} title="Edit">
                                        <Edit2 size={16} className="text-gray-500 hover:text-blue-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item._id)} disabled={deletingId === item._id} title="Delete">
                                        {deletingId === item._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} className="text-gray-500 hover:text-red-600" />}
                                    </Button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
}
