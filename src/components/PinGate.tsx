import { useEffect, useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PIN_KEY = "tsa_pin_unlocked";
const DEFAULT_PIN = "1234"; // Change in Settings later

interface Props {
  children: React.ReactNode;
}

export function PinGate({ children }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [storedPin, setStoredPin] = useState(DEFAULT_PIN);

  useEffect(() => {
    const saved = localStorage.getItem("tsa_pin") || DEFAULT_PIN;
    setStoredPin(saved);
    if (sessionStorage.getItem(PIN_KEY) === "1") setUnlocked(true);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === storedPin) {
      sessionStorage.setItem(PIN_KEY, "1");
      setUnlocked(true);
    } else {
      setError("Incorrect PIN");
      setPin("");
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
      <form
        onSubmit={submit}
        className="neo-card w-full max-w-md p-8 space-y-6 animate-scale-in"
      >
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center glow">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Teacher Smart Assistant</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your PIN to continue</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError("");
              }}
              placeholder="••••"
              className="pl-10 text-center text-lg tracking-[0.5em] h-12"
              maxLength={8}
            />
          </div>
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </div>

        <Button type="submit" className="w-full h-11 gradient-primary text-primary-foreground border-0 hover:opacity-90">
          Unlock
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Default PIN is <span className="font-mono font-semibold">1234</span> — change it in Settings
        </p>
      </form>
    </div>
  );
}
