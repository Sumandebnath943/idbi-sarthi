"use client";

import { useCustomers, type CustomerLite } from "@/hooks/use-customers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { UserRound } from "lucide-react";

type Props = {
  value: string;
  onChange: (id: string) => void;
  label?: string;
  customers?: CustomerLite[];
};

export function CustomerPicker({ value, onChange, label = "Customer", customers: injected }: Props) {
  const { customers: fetched, loading } = useCustomers();
  const customers = injected ?? fetched;
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
        <UserRound className="h-3 w-3" /> {label}
      </Label>
      {loading ? (
        <Skeleton className="h-9 w-full" />
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="glass">
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent className="glass-strong max-h-80">
            {customers.map(c => (
              <SelectItem key={c.id} value={c.id}>
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground text-xs ml-2">· {c.id} · {c.segment}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
