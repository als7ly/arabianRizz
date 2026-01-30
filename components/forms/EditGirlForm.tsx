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
import { updateGirl } from "@/lib/actions/girl.actions";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  name: z.string().min(2).max(50),
  age: z.string().transform((v) => Number(v) || 0).optional(),
  vibe: z.string().optional(),
  dialect: z.string().optional(),
  relationshipStatus: z.string(),
});

export function EditGirlForm({ girl, closeDialog }: { girl: any, closeDialog?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: girl.name,
      age: girl.age ? String(girl.age) : undefined,
      vibe: girl.vibe || "",
      dialect: girl.dialect || "Modern Standard Arabic",
      relationshipStatus: girl.relationshipStatus || "Just met",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await updateGirl({
        _id: girl._id,
        name: values.name,
        age: values.age,
        vibe: values.vibe,
        dialect: values.dialect,
        relationshipStatus: values.relationshipStatus,
        path: pathname,
      });

      toast({
        title: "Success",
        description: "Girl profile updated!",
        className: "success-toast",
      });

      if (closeDialog) closeDialog();

    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        className: "error-toast",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
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
          {isSubmitting ? "Saving..." : "Update Profile"}
        </Button>
      </form>
    </Form>
  );
}
