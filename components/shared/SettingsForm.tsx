"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { updateUserSettings } from "@/lib/actions/settings.actions";
import ExportDataButton from "./ExportDataButton";
import DeleteAccount from "./DeleteAccount";
import { Loader2 } from "lucide-react";

interface SettingsFormProps {
  initialSettings: {
    defaultTone: string;
    lowBalanceAlerts: boolean;
    theme: string;
  };
}

export const SettingsForm = ({ initialSettings }: SettingsFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [defaultTone, setDefaultTone] = useState(initialSettings?.defaultTone || "Flirty");
  const [lowBalanceAlerts, setLowBalanceAlerts] = useState(initialSettings?.lowBalanceAlerts ?? true);
  const [theme, setTheme] = useState(initialSettings?.theme || "system");

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateUserSettings({
        defaultTone,
        lowBalanceAlerts,
        theme
      });
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 bg-card border border-border rounded-xl p-6 glass-card animate-fade-in-up">
      <div className="grid gap-6">

        {/* Default Tone */}
        <div className="space-y-2">
            <Label htmlFor="defaultTone">Default Wingman Tone</Label>
            <Select value={defaultTone} onValueChange={setDefaultTone}>
                <SelectTrigger id="defaultTone" className="w-full md:w-[300px]">
                    <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Flirty">Flirty</SelectItem>
                    <SelectItem value="Funny">Funny</SelectItem>
                    <SelectItem value="Serious">Serious</SelectItem>
                    <SelectItem value="Mysterious">Mysterious</SelectItem>
                </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">The default tone used when starting a new chat.</p>
        </div>

        {/* Theme */}
        <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme" className="w-full md:w-[300px]">
                    <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Choose your preferred appearance.</p>
        </div>

        {/* Low Balance Alerts */}
        <div className="flex items-center justify-between rounded-lg border p-4 bg-background/50">
            <div className="space-y-0.5">
                <Label htmlFor="lowBalanceAlerts" className="text-base font-medium">Low Balance Alerts</Label>
                <p className="text-xs text-muted-foreground">Receive emails when your credits drop below 10.</p>
            </div>
            <div className="flex items-center">
                 <input
                    type="checkbox"
                    id="lowBalanceAlerts"
                    checked={lowBalanceAlerts}
                    onChange={(e) => setLowBalanceAlerts(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary accent-purple-600 cursor-pointer"
                />
            </div>
        </div>

        {/* Data Export */}
        <div className="flex items-center justify-between rounded-lg border p-4 bg-background/50">
            <div className="space-y-0.5">
                <Label className="text-base font-medium">Export Data</Label>
                <p className="text-xs text-muted-foreground">Download a copy of your personal data and chat history.</p>
            </div>
            <ExportDataButton />
        </div>

        {/* Danger Zone */}
        <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5 space-y-4">
            <h3 className="text-destructive font-semibold">Danger Zone</h3>
            <div className="flex items-center justify-between">
                 <div className="space-y-0.5">
                    <Label className="text-base font-medium">Delete Account</Label>
                    <p className="text-xs text-muted-foreground">Permanently remove your account and all data.</p>
                </div>
                <DeleteAccount />
            </div>
        </div>

      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isLoading} className="bg-primary hover:bg-primary/90 min-w-[120px] shadow-md">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};
