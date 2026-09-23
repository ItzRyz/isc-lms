"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { financeTransactionSchema } from "@/lib/validation/event";

type ActionResult = { success: true } | { success: false; error: { code: string; message: string } };

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

const mockAccounts = [
  { id: "acc1", name: "General", balance: 1250000 },
];
const mockTransactions = [
  { id: "tx1", account_id: "acc1", amount: 500000, description: "Member Contribution", created_at: new Date().toISOString(), category: "Member Contribution" },
  { id: "tx2", account_id: "acc1", amount: -150000, description: "Event Expense — Workshop", created_at: new Date().toISOString(), category: "Event Expense" },
];

export async function getFinanceOverview() {
  if (!isSupabaseConfigured()) {
    return {
      accounts: mockAccounts,
      transactions: mockTransactions,
      balance: 1350000,
      income: 500000,
      expense: 150000,
    };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { accounts: [], transactions: [], balance: 0, income: 0, expense: 0 };
  // Check treasurer
  const { data: roles } = await supabase.from("user_roles").select("roles(name)").eq("user_id", user.id);
  const isTreasurer = (roles || []).some((r: unknown) => (r as { roles: { name: string } }).roles.name === "TREASURER" || (r as { roles: { name: string } }).roles.name === "SUPER_ADMIN");
  if (!isTreasurer) return { accounts: [], transactions: [], balance: 0, income: 0, expense: 0, forbidden: true };

  const { data: accounts } = await supabase.from("financial_accounts").select("*");
  const { data: transactions } = await supabase.from("financial_transactions").select("*, financial_categories(name)").order("created_at", { ascending: false }).limit(50);
  const balance = (transactions as Array<{ amount: number }> | null)?.reduce((sum, t) => sum + t.amount, 0) || 0;
  const income = (transactions as Array<{ amount: number }> | null)?.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0) || 0;
  const expense = (transactions as Array<{ amount: number }> | null)?.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0) || 0;
  return { accounts: accounts || mockAccounts, transactions: transactions || [], balance, income, expense };
}

export async function createFinanceTransaction(formData: FormData): Promise<ActionResult> {
  const raw = {
    account_id: String(formData.get("account_id") || ""),
    category_id: formData.get("category_id") ? String(formData.get("category_id")) : null,
    amount: Number(formData.get("amount") || 0),
    description: String(formData.get("description") || ""),
  };
  const parsed = financeTransactionSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };
  if (!isSupabaseConfigured()) {
    revalidatePath("/finance");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };
  const { error } = await supabase.from("financial_transactions").insert({ ...parsed.data, created_by: user.id });
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  // Update account balance (in real, via trigger; for MVP, manual)
  const { data: account } = await supabase.from("financial_accounts").select("balance").eq("id", parsed.data.account_id).maybeSingle();
  if (account) {
    await supabase.from("financial_accounts").update({ balance: (account as { balance: number }).balance + parsed.data.amount }).eq("id", parsed.data.account_id);
  }
  revalidatePath("/finance");
  return { success: true };
}
