import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getFinanceOverview } from "@/features/finance/actions";
import { FinanceFormDialog } from "@/features/finance/components/finance-form";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { accounts, transactions, balance, income, expense, forbidden } = (await getFinanceOverview()) as {
    accounts: Array<{ id: string; name: string; balance: number }>;
    transactions: Array<{ id: string; amount: number; description: string | null; created_at: string; category?: string }>;
    balance: number;
    income: number;
    expense: number;
    forbidden?: boolean;
  };

  if (forbidden) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Forbidden — Treasurer Only</CardTitle>
            <CardDescription>Finance isolated via RLS — only TREASURER/SUPER_ADMIN can view.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isMock = transactions.length === 2 && transactions[0]?.id === "tx1";

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Finance</h1>
          <p className="text-muted-foreground">Treasurer — income/expenses, cash balance, member contributions, RLS isolated</p>
        </div>
        <Badge variant="outline">P9 Finance</Badge>
      </div>

      {isMock && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-900 dark:text-amber-200">Dev fallback — Supabase belum configured</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">Set Supabase env & `npx supabase db push` migration 010 untuk finance real.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1"><Wallet className="h-4 w-4" /> Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {balance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">financial_accounts.balance • ON DELETE RESTRICT</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1 text-green-600"><TrendingUp className="h-4 w-4" /> Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{income.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1 text-red-600"><TrendingDown className="h-4 w-4" /> Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-{expense.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>Ledger financial_transactions • amount ≠0 • audit • No cascade delete</CardDescription>
          </div>
          <FinanceFormDialog accounts={accounts as never} triggerLabel="New Transaction" />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length ? (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm">{tx.description || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{(tx as { category?: string }).category || "—"}</Badge>
                      </TableCell>
                      <TableCell className={tx.amount > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>{tx.amount > 0 ? `+${tx.amount}` : tx.amount}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No transactions.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">TREASURER owns this domain • RLS: has_role TREASURER/SUPER_ADMIN only • No physical delete (archival).</p>
        </CardContent>
      </Card>
    </div>
  );
}
