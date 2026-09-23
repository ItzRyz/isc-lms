"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotInput } from "@/lib/validation/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/features/auth/actions";
import { toast } from "sonner";

export default function Page() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(forgotPasswordSchema as any) as any,
  });

  const onSubmit = async (data: ForgotInput) => {
    const fd = new FormData();
    fd.set("email", data.email);
    const res = await forgotPassword(fd);
    if (res.success) toast.success("Reset email sent — check inbox (via Resend SMTP smtp.resend.com)");
    else toast.error(res.error.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>Supabase resetPasswordForEmail → Resend SMTP</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register("email")} placeholder="you@example.com" />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Reset Email"}
            </Button>
            <div className="text-sm text-center">
              <Link href="/login" className="text-primary hover:underline">Back to login</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
