"use client";

import { CldUploadWidget } from "next-cloudinary"
import { Paperclip } from "lucide-react";
import { Button } from "../ui/button";

type ChatUploaderProps = {
  onUploadComplete: (url: string) => void;
  disabled?: boolean;
}

const ChatUploader = ({ onUploadComplete, disabled }: ChatUploaderProps) => {
  const onUploadSuccessHandler = (result: any) => {
    onUploadComplete(result?.info?.secure_url);
  }

  return (
    <CldUploadWidget
      uploadPreset="jsm_ArabianRizz"
      options={{
        multiple: false,
        resourceType: "image",
      }}
      onSuccess={onUploadSuccessHandler}
    >
      {({ open }) => (
        <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={() => open()} 
            disabled={disabled}
            className="text-dark-400 hover:text-purple-500"
            aria-label="Upload screenshot"
        >
            <Paperclip size={24} />
        </Button>
      )}
    </CldUploadWidget>
  )
}

export default ChatUploader