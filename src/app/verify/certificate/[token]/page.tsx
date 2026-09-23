import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCertificateByToken } from "@/features/certificates/actions";
import { ShieldCheck, ShieldX, Award } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const cert = (await getCertificateByToken(token)) as {
    id: string;
    certificate_number: string;
    verification_token: string;
    issued_at: string;
    issuer: string;
    user_id: string;
    profiles?: { email: string; full_name: string | null };
    divisions?: { name: string } | null;
  } | null;

  const isValid = !!cert;

  return (
    <div className="container mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <Award className="h-6 w-6" /> Verify Certificate
      </h1>

      <Card className={isValid ? "border-green-200" : "border-destructive"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isValid ? <ShieldCheck className="h-5 w-5 text-green-600" /> : <ShieldX className="h-5 w-5 text-destructive" />}
            {isValid ? "Certificate Valid" : "Invalid Certificate"}
            {isValid ? <Badge className="bg-green-600">Valid</Badge> : <Badge variant="destructive">Invalid</Badge>}
          </CardTitle>
          <CardDescription>Public endpoint /verify/certificate/[token] — AGENTS.md §28 • verification_token UNIQUE • QR points here</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Token: <code className="bg-muted px-1 py-0.5 rounded text-xs">{token}</code>
          </p>
          {isValid && cert ? (
            <>
              <div className="rounded border p-3 bg-muted/20 space-y-1">
                <p><strong>Number:</strong> {cert.certificate_number}</p>
                <p><strong>Recipient:</strong> {cert.profiles?.full_name || cert.user_id.slice(0, 8)} ({cert.profiles?.email || "—"})</p>
                <p><strong>Division:</strong> {cert.divisions?.name || "—"}</p>
                <p><strong>Issuer:</strong> {cert.issuer}</p>
                <p><strong>Issued:</strong> {new Date(cert.issued_at).toLocaleString()}</p>
              </div>
              <p className="text-xs text-muted-foreground">Issuer verified • Token UNIQUE • PDF path via storage certificates bucket (private signed URL) • This page is public (anon RLS).</p>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">Token tidak ditemukan di DB. QR mungkin palsu atau expired.</p>
              <p className="text-xs text-muted-foreground">Validasi via DB certificates.verification_token (UNIQUE). Jika valid, akan tampil detail.</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">How it works</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          <p>Certificate QR → {`https://yourdomain.com/verify/certificate/[token]`} → server cek verification_token → tampil valid/invalid. Number format ISC-000001-YYYY.</p>
        </CardContent>
      </Card>
    </div>
  );
}
