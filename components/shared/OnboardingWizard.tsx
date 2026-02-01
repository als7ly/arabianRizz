"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { completeOnboarding } from "@/lib/actions/onboarding.actions";
import { useRouter } from "next/navigation";

export default function OnboardingWizard({ userId, open }: { userId: string, open: boolean }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ name: "", age: "", vibe: "", goal: "" });
  const [isOpen, setIsOpen] = useState(open);
  const router = useRouter();

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      await completeOnboarding(userId, data);
      setIsOpen(false);
      router.refresh();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to ArabianRizz!</DialogTitle>
          <DialogDescription>
            Let's set up your profile so the AI knows how to represent you.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
            {step === 1 && (
                <>
                    <h4 className="font-medium text-purple-900">Step 1: The Basics</h4>
                    <Input
                        placeholder="Your Name (or Nickname)"
                        value={data.name}
                        onChange={(e) => setData({...data, name: e.target.value})}
                    />
                    <Input
                        type="number"
                        placeholder="Your Age"
                        value={data.age}
                        onChange={(e) => setData({...data, age: e.target.value})}
                    />
                </>
            )}

            {step === 2 && (
                <>
                    <h4 className="font-medium text-purple-900">Step 2: Your Vibe</h4>
                    <Textarea
                        placeholder="E.g., I'm a software engineer who loves hiking and coffee. I'm sarcastic but kind."
                        value={data.vibe}
                        onChange={(e) => setData({...data, vibe: e.target.value})}
                        className="min-h-[100px]"
                    />
                </>
            )}

            {step === 3 && (
                <>
                    <h4 className="font-medium text-purple-900">Step 3: The Goal</h4>
                    <Input
                        placeholder="E.g., Hookups, Long-term relationship, Casual dating"
                        value={data.goal}
                        onChange={(e) => setData({...data, goal: e.target.value})}
                    />
                </>
            )}
        </div>

        <DialogFooter>
          <Button onClick={handleNext} className="bg-purple-600">
            {step === 3 ? "Finish Setup" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
