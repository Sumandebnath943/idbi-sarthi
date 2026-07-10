"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, Wallet, CreditCard, TrendingUp, AlertTriangle, Mail, Phone, MapPin, Calendar, BadgeCheck, Clock, ArrowRight, ArrowLeft } from "lucide-react";
import { ModuleHeader, StatCard, GlassCard, SectionTitle, EmptyState } from "@/components/shell/primitives";
import { CustomerPicker } from "@/components/shell/customer-picker";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Customer } from "@/lib/data";

export function CustomerDashboard() {
  const [customerId, setCustomerId] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/customers/${customerId}`);
        if (!r.ok) { if (!cancelled) setCustomer(null); return; }
        const d = await r.json();
        if (!cancelled) { setCustomer(d); }
      } catch {
        if (!cancelled) setCustomer(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [customerId]);

  return (
    <div>
      <ModuleHeader
        title="Customer 360 Dashboard"
        desc="Unified profile, accounts, transactions & risk signals"
        icon={LayoutDashboard}
      />

      <div className="max-w-md mb-6">
        <CustomerPicker value={customerId} onChange={setCustomerId} />
      </div>

      {!customerId && (
        <EmptyState icon={LayoutDashboard} message="Select a customer to view their 360° profile" />
      )}

      {customerId && loading && (
        <div className="grid lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      )}

      {customerId && !loading && customer && (
        <div className="space-y-6">
          {/* Profile header */}
          <GlassCard className="p-5">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                {customer.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{customer.name}</h3>
                  <Badge variant="outline" className="text-[10px]">{customer.segment}</Badge>
                  {customer.npaFlag && <Badge variant="destructive" className="text-[10px]">NPA</Badge>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{customer.email}</span>
                  <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{customer.phone}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{customer.city}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />Age {customer.age}</span>
                  <span className="flex items-center gap-1.5"><BadgeCheck className="h-3 w-3" />KYC {customer.kycStatus}</span>
                  <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />Since {customer.onboardingDate}</span>
                  <span className="flex items-center gap-1.5"><Wallet className="h-3 w-3" />RM {customer.rmId}</span>
                  <span className="flex items-center gap-1.5"><CreditCard className="h-3 w-3" />{customer.numProducts} products</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Monthly Income" value={`INR ${(customer.monthlyIncome/1000).toFixed(0)}K`} tone="primary" icon={Wallet} />
            <StatCard label="Savings" value={`INR ${(customer.totalSavings/100000).toFixed(2)}L`} tone="success" icon={TrendingUp} />
            <StatCard label="Investments" value={`INR ${(customer.totalInvestments/100000).toFixed(2)}L`} tone="primary" icon={TrendingUp} />
            <StatCard label="Outstanding Debt" value={`INR ${(customer.outstandingDebt/100000).toFixed(2)}L`} tone={customer.outstandingDebt > customer.creditLimit * 0.5 ? "danger" : "default"} icon={CreditCard} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Accounts */}
            <GlassCard className="p-5">
              <SectionTitle>Accounts Held</SectionTitle>
              <div className="space-y-2">
                {customer.accounts.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/40">
                    <div>
                      <div className="text-sm font-medium">{a.type}</div>
                      <div className="text-[10px] text-muted-foreground">{a.id} · Since {a.openedOn}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">INR {a.balance.toLocaleString("en-IN")}</div>
                      <div className="text-[10px] text-muted-foreground">{a.currency}</div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Recent transactions */}
            <GlassCard className="p-5">
              <SectionTitle>Recent Transactions</SectionTitle>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40">
                    <TableHead className="text-[10px] uppercase">Date</TableHead>
                    <TableHead className="text-[10px] uppercase">Description</TableHead>
                    <TableHead className="text-[10px] uppercase text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.transactions.map(t => (
                    <TableRow key={t.id} className="border-border/20">
                      <TableCell className="text-xs text-muted-foreground py-2">{t.date}</TableCell>
                      <TableCell className="text-xs py-2">
                        <div className="font-medium">{t.description}</div>
                        <div className="text-[10px] text-muted-foreground">{t.category}</div>
                      </TableCell>
                      <TableCell className={`text-right text-xs py-2 font-mono ${t.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {t.amount >= 0 ? "+" : ""}INR {Math.abs(t.amount).toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </GlassCard>
          </div>

          {/* Risk signals */}
          <GlassCard className="p-5">
            <SectionTitle action={<AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}>Risk Signals</SectionTitle>
            {customer.riskFactors.length === 0 ? (
              <div className="text-sm text-emerald-600">No active risk signals — healthy profile</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {customer.riskFactors.map((rf, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                    <span className="text-xs">{rf.label}</span>
                    <Badge variant="outline" className="text-[9px]">{(rf.weight*100).toFixed(0)}% weight</Badge>
                  </div>
                ))}
              </d