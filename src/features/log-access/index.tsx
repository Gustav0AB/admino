import { useRef, useState } from "react";
import { Button, Card, TextField } from "@/shared/ui";
import * as Print from "@/web/print";
import QRCode from "@/web/qrCode";
import { useApiMutation, useApiQuery } from "@/shared/api/useApiQuery";
import { mockCheckIn, mockGetCheckIns } from "@/shared/api/mocks/logAccess";
import { useAuth } from "@/shared/hooks/useAuth";
import { useClientStore } from "@/shared/store/clientStore";
import type { CheckIn } from "@/shared/types/api";

type ScanState = "idle" | "success" | "error";

function ClientCheckIn() {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [qrData, setQrData] = useState("");

  const { mutate: checkIn, isPending } = useApiMutation<typeof mockCheckIn, { qrData: string }>(
    "/log-access/check-in",
    mockCheckIn,
    { method: "POST" },
    {
      onSuccess: () => setScanState("success"),
      onError: () => setScanState("error"),
    },
  );

  function submit() {
    if (!qrData.trim()) return;
    checkIn({ qrData: qrData.trim() });
  }

  if (scanState === "success") return <ResultCard icon="✅" title="Registro correcto" action="Nuevo registro" onClick={() => { setScanState("idle"); setQrData(""); }} />;
  if (scanState === "error") return <ResultCard icon="⚠️" title="Error al registrar" action="Intentar de nuevo" onClick={() => setScanState("idle")} />;

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-md text-center">
        <div className="flex flex-col gap-4">
          <p className="text-5xl">▣</p>
          <h1 className="text-2xl font-bold text-gray-900">Check-in</h1>
          <p className="text-sm text-gray-500">Por ahora en web pega el valor del QR para registrar asistencia.</p>
          <TextField value={qrData} onChange={(event) => setQrData(event.target.value)} placeholder="checkin:gimnasio" />
          <Button loading={isPending} loadingText="Registrando..." onClick={submit}>Registrar</Button>
        </div>
      </Card>
    </div>
  );
}

function ResultCard({ icon, title, action, onClick }: { icon: string; title: string; action: string; onClick: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-sm text-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-6xl">{icon}</p>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <Button onClick={onClick}>{action}</Button>
        </div>
      </Card>
    </div>
  );
}

function formatRelativeTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`;
  return `hace ${Math.floor(diff / 3600)}h`;
}

function buildQrHtml(dataUrl: string, orgName: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
    body{font-family:Helvetica,Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff}
    .card{text-align:center;padding:48px 40px;border-radius:24px;border:2px solid #e5e7eb;max-width:400px;width:100%}
    .org{font-size:28px;font-weight:800;color:#111827;margin-bottom:6px}.sub{font-size:14px;color:#6b7280;margin-bottom:32px}
    img{width:240px;height:240px}.hint{margin-top:28px;font-size:13px;color:#9ca3af;line-height:1.5}
  </style></head><body><div class="card"><div class="org">${orgName}</div><div class="sub">Escanea para registrar tu asistencia</div><img src="data:image/png;base64,${dataUrl}" alt="QR Code"/><div class="hint">Admino → Log Access → Check-in</div></div></body></html>`;
}

function AdminCheckIns() {
  const { branding } = useClientStore();
  const qrRef = useRef<{ toDataURL: (cb: (data: string) => void) => void } | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const { data, isLoading, refetch } = useApiQuery(["check-ins"], "/log-access/check-ins", mockGetCheckIns, { refetchInterval: 30_000 });
  const checkIns = data?.data.items ?? [];

  function handleGeneratePdf() {
    if (!qrRef.current) return;
    setGeneratingPdf(true);
    qrRef.current.toDataURL(async (dataUrl) => {
      try {
        await Print.printAsync({ html: buildQrHtml(dataUrl, branding.orgName) });
      } finally {
        setGeneratingPdf(false);
      }
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 bg-gray-50 p-4">
      <div className="pointer-events-none absolute opacity-0">
        <QRCode value={`checkin:${branding.orgName}`} size={240} getRef={(ref) => { qrRef.current = ref as typeof qrRef.current; }} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Asistencia hoy</h1>
        <div className="flex gap-2">
          <Button size="sm" loading={generatingPdf} loadingText="Generando..." onClick={handleGeneratePdf}>▣ Generar QR</Button>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>↺</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-gray-500">Cargando…</div>
      ) : checkIns.length === 0 ? (
        <Card className="border-dashed text-center">
          <p className="text-4xl">👥</p>
          <p className="text-sm text-gray-500">Sin registros por ahora</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto">
          {checkIns.map((item: CheckIn) => (
            <Card key={item.id} padding="sm">
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-bold text-primary">{item.userName.charAt(0).toUpperCase()}</span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">{item.userName}</p>
                  <p className="truncate text-xs text-gray-500">{item.userEmail}</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p className="text-green-600">✓</p>
                  <p>{formatRelativeTime(item.checkedInAt)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function LogAccessScreen() {
  const { isClient } = useAuth();
  return isClient ? <ClientCheckIn /> : <AdminCheckIns />;
}
