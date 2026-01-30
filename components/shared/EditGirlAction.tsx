"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EditGirlForm } from "@/components/forms/EditGirlForm";
import { Pencil } from "lucide-react";

export const EditGirlAction = ({ girl }: { girl: any }) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-2 border-purple-200 bg-white text-purple-700 hover:bg-purple-50">
          <Pencil className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <EditGirlForm girl={girl} closeDialog={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};
