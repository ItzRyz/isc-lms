"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register as registerAction } from "@/features/auth/actions";
import { toast } from "sonner";

export default function Page() {
  const router = useRouter();
  const {
    register: reg,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(registerSchema as any) as any,
  });

  const onSubmit = async (data: RegisterInput) => {
    const fd = new FormData();
    fd.set("fullName", data.fullName);
    fd.set("email", data.email);
    fd.set("password", data.password);
    fd.set("confirmPassword", data.confirmPassword);
    const res = await registerAction(fd);
    if (res.success) {
      toast.success("Registered — check email for verification");
      router.push("/login");
    } else toast.error(res.error.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>Creates profile via trigger handle_new_user → MEMBER</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input {...reg("fullName")} placeholder="Your Name" />
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...reg("email")} placeholder="you@example.com" />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" {...reg("password")} placeholder="••••••••" />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" {...reg("confirmPassword")} placeholder="••••••••" />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Register"}
            </Button>
            <div className="text-sm text-center">
              <Link href="/login" className="text-primary hover:underline">Already have account? Login</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
