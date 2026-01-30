"use client";

import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EditGirlForm } from "@/components/forms/EditGirlForm";
import { useState } from "react";

export const EditGirlButton = ({ girl }: { girl: any }) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:bg-gray-50 hover:text-purple-600"
                title="Edit Profile"
            >
                <Edit size={24} />
            </Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                    Update details for {girl.name}.
                </DialogDescription>
            </DialogHeader>
            <EditGirlForm girl={girl} closeDialog={() => setOpen(false)} />
        </DialogContent>
    </Dialog>
  );
};
