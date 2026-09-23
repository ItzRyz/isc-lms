import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCertificates } from "@/features/certificates/actions";
import { IssueCertificateDialog } from "@/features/certificates/components/issue-form";
import { CertificateQR } from "@/features/certificates/components/certificate-qr";
import { Award, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page() {
  const certificates = await getCertificates();
  const isMock = certificates.length === 1 && (certificates[0] as { id: string }).id === "cert1";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Certificates</h1>
          <p className="text-muted-foreground">Issue • Verify via /verify/certificate/[token] • QR points to verification • PDF private storage</p>
        </div>
        <Badge variant="outline">P9 Certificates</Badge>
      </div>

      {isMock && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-900 dark:text-amber-200">Dev fallback — Supabase belum configured</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">Set Supabase env & `npx supabase db push` migration 010 untuk certificates real.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" /> My Certificates</CardTitle>
            <CardDescription>UNIQUE certificate_number + verification_token • RLS own • Public verify endpoint</CardDescription>
          </div>
          <IssueCertificateDialog triggerLabel="Issue Certificate" />
        </CardHeader>
        <CardContent className="space-y-4">
          {certificates.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {(certificates as Array<{ id: string; certificate_number: string; verification_token: string; issued_at: string; issuer: string; course_name?: string; recipient?: string }>).map((c) => (
                <Card key={c.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{c.certificate_number}</CardTitle>
                    <CardDescription>Issued {new Date(c.issued_at).toLocaleDateString()} by {c.issuer}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">Token: {c.verification_token.slice(0, 12)}... • Recipient: {(c as { recipient?: string }).recipient || "—"}</p>
                    <CertificateQR token={c.verification_token} />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ShieldCheck className="h-3 w-3" /> Verify at /verify/certificate/{c.verification_token}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No certificates. Issue via mentor/coordinator.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
