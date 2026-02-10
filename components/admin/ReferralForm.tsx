"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Link as LinkIcon, DownloadCloud } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { fetchProductMetadata } from "@/lib/actions/scraper.actions";
import { createReferralItem, updateReferralItem } from "@/lib/actions/referral.actions";

interface ReferralFormProps {
  item?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ReferralForm({ item, onSuccess, onCancel }: ReferralFormProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: item?.name || "",
    description: item?.description || "",
    category: item?.category || "product",
    url: item?.url || "",
    imageUrl: item?.imageUrl || "",
    price: item?.price || "",
    currency: item?.currency || "USD",
    tags: item?.tags ? item.tags.join(", ") : "",
    isActive: item?.isActive ?? true
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAutoFill = async () => {
    if (!formData.url) return;
    setFetching(true);
    try {
        const meta = await fetchProductMetadata(formData.url);
        if (meta) {
            setFormData(prev => ({
                ...prev,
                name: meta.title || prev.name,
                description: meta.description || prev.description,
                imageUrl: meta.image || prev.imageUrl,
                price: meta.price ? meta.price.toString() : prev.price,
                currency: meta.currency || prev.currency
            }));
            toast({ title: "Auto-filled", description: "Metadata fetched successfully." });
        } else {
            toast({ title: "Failed", description: "Could not fetch metadata.", variant: "destructive" });
        }
    } catch (e) {
        toast({ title: "Error", description: "Failed to fetch URL.", variant: "destructive" });
    } finally {
        setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        const payload = {
            ...formData,
            price: formData.price ? Number(formData.price) : undefined,
            tags: formData.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        };

        if (item?._id) {
            await updateReferralItem(item._id, payload);
            toast({ title: "Updated", description: "Item updated successfully." });
        } else {
            await createReferralItem(payload);
            toast({ title: "Created", description: "Item created successfully." });
        }
        onSuccess();
    } catch (e) {
        console.error(e);
        toast({ title: "Error", description: "Operation failed.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-card text-card-foreground">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="url">Product/Link URL</Label>
                <div className="flex gap-2">
                    <Input
                        id="url"
                        value={formData.url}
                        onChange={(e) => handleChange("url", e.target.value)}
                        placeholder="https://..."
                        required
                    />
                    <Button type="button" variant="outline" size="icon" onClick={handleAutoFill} disabled={fetching || !formData.url} title="Auto-fill from URL">
                        {fetching ? <Loader2 className="animate-spin" size={16} /> : <DownloadCloud size={16} />}
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(val) => handleChange("category", val)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="date_idea">Date Idea</SelectItem>
                        <SelectItem value="gift">Gift</SelectItem>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="clothes">Clothes</SelectItem>
                        <SelectItem value="jewelry">Jewelry</SelectItem>
                        <SelectItem value="perfume">Perfume</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Name / Title</Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows={3}
                />
            </div>

             <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <div className="flex gap-2 items-center">
                    <Input
                        id="imageUrl"
                        value={formData.imageUrl}
                        onChange={(e) => handleChange("imageUrl", e.target.value)}
                        placeholder="https://..."
                    />
                    {formData.imageUrl && (
                        <div className="w-10 h-10 rounded overflow-hidden border shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                 <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleChange("price", e.target.value)}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                        id="currency"
                        value={formData.currency}
                        onChange={(e) => handleChange("currency", e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => handleChange("tags", e.target.value)}
                    placeholder="romantic, summer, luxury..."
                />
            </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                {loading && <Loader2 className="animate-spin mr-2" size={16} />}
                {item ? "Update Item" : "Create Item"}
            </Button>
        </div>
    </form>
  );
}
