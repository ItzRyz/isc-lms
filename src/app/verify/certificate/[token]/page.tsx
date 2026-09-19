import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="container mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Verify Certificate</h1>
      <Card>
        <CardHeader>
          <CardTitle>Certificate Verification</CardTitle>
          <CardDescription>Public endpoint /verify/certificate/[token] — AGENTS.md §28</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Token: {token}</p>
          <p className="mt-2">QR code akan point ke endpoint ini. Validasi via DB certificates.verification_token (unique).</p>
        </CardContent>
      </Card>
    </div>
  );
}
