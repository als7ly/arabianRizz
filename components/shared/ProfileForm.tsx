"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { useToast } from "@/components/ui/use-toast";
import { updateUserProfile } from "@/lib/actions/user.actions";
import { Loader2 } from "lucide-react";

const profileSchema = z.object({
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  age: z.coerce.number().min(18, "You must be at least 18").optional().or(z.literal(0)),
  gender: z.string().optional(),
  occupation: z.string().max(100).optional(),
  relationshipGoal: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: any;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: user.bio || "",
      age: user.age || undefined,
      gender: user.gender || undefined,
      occupation: user.occupation || "",
      relationshipGoal: user.relationshipGoal || undefined,
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    try {
      await updateUserProfile(data);
      toast({
        title: "Profile Updated",
        description: "Your wingman now knows you better.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card border border-border rounded-xl p-6 glass-card animate-fade-in-up">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="25"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Non-binary">Non-binary</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="occupation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Occupation</FormLabel>
                <FormControl>
                  <Input placeholder="Software Engineer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="relationshipGoal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Relationship Goal</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="What are you looking for?" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Hookups">Hookups / Casual</SelectItem>
                    <SelectItem value="Dating">Dating</SelectItem>
                    <SelectItem value="Relationship">Long-term Relationship</SelectItem>
                    <SelectItem value="Friends">Friends</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>My Vibe (Bio)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about your hobbies, style, and what makes you tick..."
                  className="resize-none h-32"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The AI uses this to personalize your pickup lines and advice.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 min-w-[120px]"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Profile"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
