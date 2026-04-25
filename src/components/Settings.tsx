import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, Save, Lock, ShieldCheck } from "lucide-react";
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
  const navigate = useNavigate();
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [language, setLanguage] = useState("Kannada");
  const [weekLength, setWeekLength] = useState("6");

  useEffect(() => {
    setLanguage(localStorage.getItem("tsa_language") || "Kannada");
    setWeekLength(localStorage.getItem("tsa_week_length") || "6");
  }, []);

  const savePin = () => {
    if (!/^\d{4}$/.test(newPin)) return toast.error("PIN must be exactly 4 digits");
    if (newPin !== confirmPin) return toast.error("PINs do not match");
    localStorage.setItem("tsa_pin", newPin);
    setNewPin("");
    setConfirmPin("");
    toast.success("PIN updated");
  };

  const lockNow = () => {
    localStorage.setItem("tsa_locked", "true");
    navigate("/lock", { replace: true });
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
        <h2 className="font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Security
        </h2>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">Current PIN:</span>
          <span className="font-mono px-2 py-0.5 rounded bg-secondary tracking-[0.3em]">••••</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>New PIN</Label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              className="font-mono tracking-[0.3em]"
              placeholder="••••"
            />
          </div>
          <div>
            <Label>Confirm PIN</Label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              className="font-mono tracking-[0.3em]"
              placeholder="••••"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={savePin} className="gradient-primary text-primary-foreground border-0">
            <Save className="h-4 w-4 mr-1" /> Save PIN
          </Button>
          <Button onClick={lockNow} variant="outline">
            <Lock className="h-4 w-4 mr-1" /> Lock App Now
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          PIN is stored locally on this device. Locking will return you to the lock screen.
        </p>
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
