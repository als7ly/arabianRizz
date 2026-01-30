"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createGirl } from "@/lib/actions/girl.actions";
import { analyzeProfile } from "@/lib/actions/wingman.actions";
import { CldUploadWidget } from "next-cloudinary";
import { Sparkles, UploadCloud } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";

const formSchema = z.object({
  name: z.string().min(2).max(50),
  age: z.string().transform((v) => Number(v) || 0).optional(),
  rating: z.string().transform((v) => Number(v) || 5).optional(),
  socialMediaHandle: z.string().optional(),
  vibe: z.string().optional(),
  dialect: z.string().optional(),
  relationshipStatus: z.string(),
  rating: z.coerce.number().min(1).max(10).default(5),
  socialMediaHandle: z.string().optional(),
});

export function AddGirlForm({ userId, closeDialog }: { userId: string, closeDialog?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const t = useTranslations('Forms');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      age: undefined,
      rating: "5",
      socialMediaHandle: "",
      vibe: "",
      dialect: "Modern Standard Arabic",
      relationshipStatus: "Just met",
      rating: 5,
      socialMediaHandle: "",
    },
  });

  const handleUploadComplete = async (result: any) => {
    const url = result?.info?.secure_url;
    if (!url) return;

    setIsAnalyzing(true);
    toast({
        title: t('MagicFill.analyzingToastTitle'),
        description: t('MagicFill.analyzingToastDesc'),
    });

    try {
        const data = await analyzeProfile(url);
        if (data) {
            if (data.name) form.setValue("name", data.name);
            if (data.age) form.setValue("age", data.age.toString());
            if (data.vibe) form.setValue("vibe", data.vibe);
            if (data.socialMediaHandle) form.setValue("socialMediaHandle", data.socialMediaHandle);

            toast({
                title: t('MagicFill.successTitle'),
                description: t('MagicFill.successDesc'),
                className: "success-toast",
            });
        } else {
            toast({
                title: t('MagicFill.failTitle'),
                description: t('MagicFill.failDesc'),
                variant: "destructive",
            });
        }
    } catch (e) {
        console.error(e);
        toast({
            title: t('MagicFill.errorTitle'),
            description: t('MagicFill.errorDesc'),
            variant: "destructive",
        });
    } finally {
        setIsAnalyzing(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await createGirl({
        name: values.name,
        age: values.age,
        rating: values.rating,
        socialMediaHandle: values.socialMediaHandle,
        vibe: values.vibe,
        dialect: values.dialect,
        relationshipStatus: values.relationshipStatus,
        rating: values.rating,
        socialMediaHandle: values.socialMediaHandle,
        userId,
        path: pathname,
      });

      toast({
        title: "Success",
        description: "Girl profile created!",
        className: "success-toast",
      });
      
      form.reset();
      if (closeDialog) closeDialog();
      
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create profile.",
        className: "error-toast",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <div className="mb-6">
          <CldUploadWidget
            uploadPreset="jsm_ArabianRizz"
            options={{
                multiple: false,
                resourceType: "image",
                maxFileSize: 5000000 // 5MB
            }}
            onSuccess={handleUploadComplete}
          >
            {({ open }) => (
                <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={() => open()}
                    disabled={isAnalyzing}
                >
                    {isAnalyzing ? (
                        <>{t('MagicFill.analyzing')}</>
                    ) : (
                        <>
                            <Sparkles size={18} className="text-yellow-500" />
                            {t('MagicFill.button')}
                        </>
                    )}
                </Button>
            )}
          </CldUploadWidget>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Her name" {...field} className="input-field" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="25" {...field} className="input-field" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Rating</FormLabel>
                <FormControl>
                  <Input type="number" min="1" max="10" placeholder="5" {...field} className="input-field" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="relationshipStatus"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="select-field">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Just met">Just met</SelectItem>
                    <SelectItem value="Talking">Talking</SelectItem>
                    <SelectItem value="Dating">Dating</SelectItem>
                    <SelectItem value="It's Complicated">It&apos;s Complicated</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

           <FormField
            control={form.control}
            name="socialMediaHandle"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Social Handle</FormLabel>
                <FormControl>
                  <Input placeholder="@username" {...field} className="input-field" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
             <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                <FormItem className="flex-1">
                    <FormLabel>Rating (1-10)</FormLabel>
                    <FormControl>
                    <Input type="number" min={1} max={10} {...field} className="input-field" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="socialMediaHandle"
                render={({ field }) => (
                <FormItem className="flex-1">
                    <FormLabel>Social Handle</FormLabel>
                    <FormControl>
                    <Input placeholder="@username" {...field} className="input-field" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        <FormField
          control={form.control}
          name="dialect"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dialect</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="select-field">
                    <SelectValue placeholder="Select dialect" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Modern Standard Arabic">Modern Standard Arabic (MSA)</SelectItem>
                  <SelectItem value="Egyptian">Egyptian (Masri)</SelectItem>
                  <SelectItem value="Levantine">Levantine (Shami)</SelectItem>
                  <SelectItem value="Gulf">Gulf (Khaleeji)</SelectItem>
                  <SelectItem value="Maghrebi">Maghrebi (Darija)</SelectItem>
                  <SelectItem value="Iraqi">Iraqi</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vibe"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vibe & Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="She loves sushi, hates small talk..." 
                  className="textarea-field rounded-[16px] border-2 border-purple-200/20 shadow-sm p-4" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="submit-button w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Create Profile"}
        </Button>
      </form>
    </Form>
  );
}
