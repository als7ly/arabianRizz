"use client";

import { CldUploadWidget } from "next-cloudinary"
import { Paperclip } from "lucide-react";
import { Button } from "../ui/button";
import { useTranslations } from "next-intl";

type ChatUploaderProps = {
  onUploadComplete: (url: string) => void;
  disabled?: boolean;
}

const ChatUploader = ({ onUploadComplete, disabled }: ChatUploaderProps) => {
  const t = useTranslations('Chat');
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
            aria-label={t('uploadScreenshotAria')}
            title={t('uploadScreenshotTitle')}
        >
            <Paperclip size={24} />
        </Button>
      )}
    </CldUploadWidget>
  )
}

export default ChatUploader