"use client";

import { useState, useEffect } from "react";
import { addUserKnowledge, deleteUserKnowledge, getUserKnowledgeList } from "@/lib/actions/user-knowledge.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Plus, Trash2, BrainCircuit } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const PersonaManager = () => {
  const [knowledgeList, setKnowledgeList] = useState<{ _id: string; content: string }[]>([]);
  const [newKnowledge, setNewKnowledge] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    setFetching(true);
    try {
      const data = await getUserKnowledgeList();
      if (data) setKnowledgeList(data);
    } catch (error) {
      console.error(error);
    } finally {
      setFetching(false);
    }
  };

  const handleAdd = async () => {
    if (!newKnowledge.trim()) return;

    setLoading(true);
    try {
      const added = await addUserKnowledge(newKnowledge);
      if (added) {
        setKnowledgeList([added, ...knowledgeList]);
        setNewKnowledge("");
        toast({ title: "Memory Added", description: "Your AI Wingman now knows this about you." });
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not add memory.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Optimistic update
      const original = [...knowledgeList];
      setKnowledgeList(knowledgeList.filter((k) => k._id !== id));

      const res = await deleteUserKnowledge(id);
      if (!res?.success) {
        setKnowledgeList(original); // Revert
        toast({ title: "Error", description: "Could not delete memory.", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Card className="w-full bg-white border border-purple-100 shadow-sm mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-purple-600" />
            <CardTitle className="text-xl text-gray-800">My Persona (AI Memory)</CardTitle>
        </div>
        <CardDescription>
          Teach your Wingman about YOU. Add details like your job, hobbies, flirting style, or goals.
          The AI will use this to sound more like you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="e.g., I'm a software engineer who loves hiking..."
            value={newKnowledge}
            onChange={(e) => setNewKnowledge(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            disabled={loading}
          />
          <Button onClick={handleAdd} disabled={loading || !newKnowledge.trim()} className="bg-purple-600 hover:bg-purple-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        {/* List */}
        <div className="space-y-2 mt-4">
          {fetching ? (
            <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-purple-300" />
            </div>
          ) : knowledgeList.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4 italic">No memories yet. Add something about yourself!</p>
          ) : (
            knowledgeList.map((item) => (
              <div key={item._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 group hover:border-purple-200 transition-colors">
                <p className="text-gray-700 text-sm line-clamp-2">{item.content}</p>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item._id)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonaManager;
