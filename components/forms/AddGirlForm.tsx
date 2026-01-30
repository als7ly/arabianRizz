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
  FormDescription,
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
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { CldUploadWidget } from "next-cloudinary";
import { extractTextFromImage } from "@/lib/actions/ocr.actions";
import { analyzeProfile } from "@/lib/actions/analysis.actions";
import { Camera, Sparkles, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  age: z.string().transform((v) => Number(v) || 0).optional(),
  vibe: z.string().optional(),
  dialect: z.string().optional(),
  relationshipStatus: z.string(),
});

export function AddGirlForm({ userId, closeDialog }: { userId: string, closeDialog?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      age: undefined,
      vibe: "",
      dialect: "Modern Standard Arabic",
      relationshipStatus: "Just met",
    },
  });

  const onUploadSuccess = async (result: any) => {
    const url = result?.info?.secure_url;
    if (url) {
      setIsAnalyzing(true);
      toast({ title: "Processing Image...", description: "Extracting text and analyzing details." });

      try {
        const text = await extractTextFromImage(url);
        if (text) {
          const analysis = await analyzeProfile(text);
          if (analysis) {
            form.setValue("name", analysis.name || "");
            if(analysis.age) form.setValue("age", String(analysis.age));
            form.setValue("vibe", analysis.vibe || "");
            if (analysis.dialect) form.setValue("dialect", analysis.dialect);
            if (analysis.relationshipStatus) form.setValue("relationshipStatus", analysis.relationshipStatus);

            toast({
                title: "Magic Fill Complete! ✨",
                description: "We've auto-filled the details. Please review them.",
                className: "success-toast bg-purple-50 border-purple-200 text-purple-900"
            });
          } else {
             toast({ title: "Analysis Failed", description: "Could not understand the profile. Please fill details manually.", variant: "destructive" });
          }
        } else {
             toast({ title: "No Text Found", description: "Could not find any text in the screenshot. Try a clearer image.", variant: "destructive" });
        }
      } catch (e) {
        console.error(e);
        toast({ title: "Error", description: "Failed to process image.", variant: "destructive" });
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await createGirl({
        name: values.name,
        age: values.age,
        vibe: values.vibe,
        dialect: values.dialect,
        relationshipStatus: values.relationshipStatus,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h4 className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <Sparkles size={16} /> Magic Fill
            </h4>
            <p className="text-xs text-purple-700 mb-4">
                Upload a screenshot of her dating profile (Tinder, Bumble, etc.) and we'll automatically fill in her details for you.
            </p>

            <CldUploadWidget
                uploadPreset="arabian_rizz_preset"
                onSuccess={onUploadSuccess}
                options={{ maxFileSize: 5000000 }} // 5MB limit
            >
            {({ open }) => (
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => open()}
                    disabled={isAnalyzing}
                    className="w-full bg-white text-purple-700 border-purple-200 hover:bg-purple-100"
                >
                    {isAnalyzing ? (
                        <>Analyzing...</>
                    ) : (
                        <>
                            <Camera className="w-4 h-4 mr-2" />
                            Upload Screenshot
                        </>
                    )}
                </Button>
            )}
            </CldUploadWidget>
        </div>

        <div className="space-y-4">
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
                    <FormLabel>Age (Optional)</FormLabel>
                    <FormControl>
                    <Input type="number" placeholder="25" {...field} className="input-field" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />

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
                <FormDescription className="text-xs">
                    This helps the AI respond with the correct slang.
                </FormDescription>
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
                    placeholder="She loves sushi, hates small talk. We matched on Bumble..."
                    className="textarea-field min-h-[100px] rounded-[16px] border-2 border-purple-100 shadow-sm p-4 focus-visible:border-purple-300"
                    {...field}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <Button type="submit" className="submit-button w-full bg-purple-600 hover:bg-purple-700" disabled={isSubmitting || isAnalyzing}>
          {isSubmitting ? "Creating Profile..." : "Create Profile"}
        </Button>
      </form>
    </Form>
  );
}
