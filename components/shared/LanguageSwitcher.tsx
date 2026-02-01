"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/navigation";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Sidebar");

  const onSelectChange = (nextLocale: string) => {
    router.replace(pathname, { locale: nextLocale });
  };

  const languages = [
    { value: "en", label: "English" },
    { value: "ar", label: "العربية" },
    { value: "fr", label: "Français" },
    { value: "zh", label: "中文" },
    { value: "ja", label: "日本語" },
    { value: "es", label: "Español" },
    { value: "hi", label: "हिन्दी" },
    { value: "pt", label: "Português" },
    { value: "ru", label: "Русский" },
    { value: "de", label: "Deutsch" },
  ];

  return (
    <div className="px-4 py-2">
      <Select defaultValue={locale} onValueChange={onSelectChange}>
        <SelectTrigger className="w-full bg-transparent border-none text-gray-700 focus:ring-0 focus:ring-offset-0 gap-2 px-2">
           <Globe size={20} className="text-gray-500" />
           <SelectValue placeholder={t('language')} />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.value} value={lang.value}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
