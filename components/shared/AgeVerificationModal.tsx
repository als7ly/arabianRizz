"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const AgeVerificationModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasVerified = localStorage.getItem("age-verified");
    if (!hasVerified) {
      setIsOpen(true);
    }
  }, []);

  const handleConfirm = () => {
    localStorage.setItem("age-verified", "true");
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="bg-white border-red-500 border-2">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600 text-2xl font-bold flex items-center gap-2">
            🔞 Age Verification Required
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-700 text-lg">
            This website contains uncensored content and adult themes.
            <br /><br />
            You must be at least <strong>18 years old</strong> to enter.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:gap-0">
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto font-bold text-lg py-6"
          >
            I am 18 or Older - Enter
          </AlertDialogAction>
          <Button
            variant="ghost"
            onClick={() => window.location.href = 'https://google.com'}
            className="text-gray-500 hover:text-gray-900 mt-2 sm:mt-0"
          >
            I am under 18 - Leave
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AgeVerificationModal;
