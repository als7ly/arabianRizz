"use client";

import { useState } from "react";
import { Search, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchMessages } from "@/lib/actions/girl.actions";
import { cn } from "@/lib/utils";

interface SearchResult {
    _id: string;
    role: string;
    content: string;
    createdAt: string;
}

interface SearchChatDialogProps {
  girlId: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SearchChatDialog({ girlId, trigger, open, onOpenChange }: SearchChatDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
        const response = await searchMessages(girlId, query);
        if (response.success) {
            setResults(response.data as any);
        } else {
            console.error(response.error);
            setResults([]);
        }
    } catch (error) {
        console.error("Search failed", error);
    } finally {
        setIsLoading(false);
        setHasSearched(true);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Search Chat History</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mt-2">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search messages..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    aria-label="Search query"
                />
                 {query && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                        aria-label="Clear search"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
            <Button onClick={handleSearch} disabled={isLoading || !query.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
        </div>

        <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1" role="list">
            {hasSearched && results.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                    No results found for "{query}"
                </div>
            )}

            {results.map((msg) => (
                <div key={msg._id} className="border rounded-lg p-3 bg-slate-50 text-sm" role="listitem">
                    <div className="flex justify-between items-start mb-1">
                        <span className={cn(
                            "font-semibold text-xs px-2 py-0.5 rounded-full",
                            msg.role === 'user' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                        )}>
                            {msg.role === 'user' ? "Me" : "Her"}
                        </span>
                        <span className="text-xs text-gray-400">
                             {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{msg.content}</p>
                </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
