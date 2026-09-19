import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Placeholder — P1 Auth. Hubungkan ke Supabase Auth di migration 001.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Form React Hook Form + Zod akan ditambahkan setelah Supabase project linked.</p>
          <div className="flex gap-2">
            <Button render={<Link href="/dashboard" />} className="flex-1">Ke Dashboard</Button>
            <Button variant="outline" render={<Link href="/" />} className="flex-1">Home</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
