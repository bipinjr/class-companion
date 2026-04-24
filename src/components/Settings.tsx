import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function Settings() {
  const qc = useQueryClient();
  const [pin, setPin] = useState("");
  const [language, setLanguage] = useState("Kannada");
  const [weekLength, setWeekLength] = useState("6");

  useEffect(() => {
    setPin(localStorage.getItem("tsa_pin") || "1234");
    setLanguage(localStorage.getItem("tsa_language") || "Kannada");
    setWeekLength(localStorage.getItem("tsa_week_length") || "6");
  }, []);

  const savePin = () => {
    if (pin.length < 4) return toast.error("PIN must be at least 4 characters");
    localStorage.setItem("tsa_pin", pin);
    toast.success("PIN updated");
  };

  const saveLanguage = async () => {
    localStorage.setItem("tsa_language", language);
    await supabase.from("subjects").update({ language_type: language }).eq("name", "Languages");
    qc.invalidateQueries();
    toast.success(`Languages subject set to ${language}`);
  };

  const saveWeekLength = () => {
    localStorage.setItem("tsa_week_length", weekLength);
    toast.success("Week length saved");
  };

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-primary" /> Settings
        </h1>
      </div>

      <div className="neo-card p-5 space-y-4">
        <h2 className="font-semibold">Security</h2>
        <div>
          <Label>PIN code</Label>
          <div className="flex gap-2 mt-1">
            <Input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={8}
              className="font-mono"
            />
            <Button onClick={savePin} className="gradient-primary text-primary-foreground border-0">
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Used to unlock the app. Stored locally on this device.
          </p>
        </div>
      </div>

      <div className="neo-card p-5 space-y-4">
        <h2 className="font-semibold">Languages Subject</h2>
        <div>
          <Label>Default language</Label>
          <div className="flex gap-2 mt-1">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Kannada">Kannada</SelectItem>
                <SelectItem value="Hindi">Hindi</SelectItem>
                <SelectItem value="Sanskrit">Sanskrit</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={saveLanguage} className="gradient-primary text-primary-foreground border-0">
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
          </div>
        </div>
      </div>

      <div className="neo-card p-5 space-y-4">
        <h2 className="font-semibold">Week Length</h2>
        <div>
          <Label>Working days</Label>
          <div className="flex gap-2 mt-1">
            <Select value={weekLength} onValueChange={setWeekLength}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Mon – Fri (5 days)</SelectItem>
                <SelectItem value="6">Mon – Sat (6 days)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={saveWeekLength} className="gradient-primary text-primary-foreground border-0">
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Affects new weeks created going forward.
          </p>
        </div>
      </div>
    </div>
  );
}
