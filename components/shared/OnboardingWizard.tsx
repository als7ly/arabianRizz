"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
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
          <div className="text-sm text-purple-600 font-medium pt-2">
            Step {step} of 3
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
            {step === 1 && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            placeholder="Your Name (or Nickname)"
                            value={data.name}
                            onChange={(e) => setData({...data, name: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <Input
                            id="age"
                            type="number"
                            placeholder="Your Age"
                            value={data.age}
                            onChange={(e) => setData({...data, age: e.target.value})}
                        />
                    </div>
                </>
            )}

            {step === 2 && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="vibe">Your Vibe</Label>
                        <Textarea
                            id="vibe"
                            placeholder="E.g., I'm a software engineer who loves hiking and coffee. I'm sarcastic but kind."
                            value={data.vibe}
                            onChange={(e) => setData({...data, vibe: e.target.value})}
                            className="min-h-[100px]"
                        />
                    </div>
                </>
            )}

            {step === 3 && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="goal">The Goal</Label>
                        <Input
                            id="goal"
                            placeholder="E.g., Hookups, Long-term relationship, Casual dating"
                            value={data.goal}
                            onChange={(e) => setData({...data, goal: e.target.value})}
                        />
                    </div>
                </>
            )}
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between">
          {step > 1 && (
             <Button onClick={handleBack} variant="outline" className="mr-auto">
                Back
             </Button>
          )}
          <Button onClick={handleNext} className="bg-purple-600 ml-auto">
            {step === 3 ? "Finish Setup" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
