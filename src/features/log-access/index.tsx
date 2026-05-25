import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialIcons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import QRCode from "react-native-qrcode-svg";
import { useColors } from "@/shared/hooks/useColors";
import { useAuth } from "@/shared/hooks/useAuth";
import { useClientStore } from "@/shared/store/clientStore";
import { useApiQuery, useApiMutation } from "@/shared/api/useApiQuery";
import { mockCheckIn, mockGetCheckIns } from "@/shared/api/mocks/logAccess";
import type { CheckIn } from "@/shared/types/api";

// ── Client view ────────────────────────────────────────────────────────────────

type ScanState = "idle" | "scanning" | "success" | "error";

function ClientCheckIn() {
  const c = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>("idle");
  const cooldown = useRef(false);

  const { mutate: checkIn, isPending } = useApiMutation<
    typeof mockCheckIn,
    { qrData: string }
  >("/log-access/check-in", mockCheckIn, { method: "POST" }, {
    onSuccess: () => {
      setScanState("success");
    },
    onError: () => {
      setScanState("error");
    },
  });

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (cooldown.current || scanState !== "scanning") return;
    cooldown.current = true;
    checkIn({ qrData: data });
  };

  const reset = () => {
    setScanState("idle");
    cooldown.current = false;
  };

  if (scanState === "success") {
    return (
      <View style={[styles.centered, { backgroundColor: c.background }]}>
        <View style={[styles.successCard, { backgroundColor: c.backgroundHover }]}>
          <MaterialIcons name="check-circle" size={72} color="#22c55e" />
          <Text style={[styles.successTitle, { color: c.text }]}>
            Registro correcto
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: c.primary }]}
            onPress={reset}
          >
            <Text style={styles.btnText}>Nuevo registro</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (scanState === "error") {
    return (
      <View style={[styles.centered, { backgroundColor: c.background }]}>
        <View style={[styles.successCard, { backgroundColor: c.backgroundHover }]}>
          <MaterialIcons name="error-outline" size={72} color="#ef4444" />
          <Text style={[styles.successTitle, { color: c.text }]}>
            Error al registrar
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: c.primary }]}
            onPress={reset}
          >
            <Text style={styles.btnText}>Intentar de nuevo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (scanState === "idle") {
    return (
      <View style={[styles.centered, { backgroundColor: c.background }]}>
        <MaterialIcons name="qr-code-scanner" size={64} color={c.primary} />
        <Text style={[styles.idleTitle, { color: c.text }]}>Check-in</Text>
        <Text style={[styles.idleSubtitle, { color: c.textMuted }]}>
          Escanea el código QR del gimnasio para registrar tu asistencia
        </Text>
        {!permission?.granted ? (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: c.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.btnText}>Permitir cámara</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: c.primary }]}
            onPress={() => setScanState("scanning")}
          >
            <Text style={styles.btnText}>Abrir cámara</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // scanning state
  return (
    <View style={styles.cameraContainer}>
      {isPending ? (
        <View style={[styles.centered, { backgroundColor: c.background }]}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={[styles.idleSubtitle, { color: c.textMuted, marginTop: 12 }]}>
            Registrando...
          </Text>
        </View>
      ) : (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleBarCodeScanned}
        >
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>Apunta al código QR</Text>
            <TouchableOpacity style={styles.cancelBtn} onPress={reset}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      )}
    </View>
  );
}

// ── Admin / Coach view ─────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`;
  return `hace ${Math.floor(diff / 3600)}h`;
}

function buildQrHtml(dataUrl: string, orgName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Helvetica, Arial, sans-serif;
            display: flex; align-items: center; justify-content: center;
            min-height: 100vh; background: #fff;
          }
          .card {
            text-align: center; padding: 48px 40px; border-radius: 24px;
            border: 2px solid #e5e7eb; max-width: 400px; width: 100%;
          }
          .org { font-size: 28px; font-weight: 800; color: #111827; margin-bottom: 6px; }
          .sub { font-size: 14px; color: #6b7280; margin-bottom: 32px; }
          img { width: 240px; height: 240px; }
          .hint {
            margin-top: 28px; font-size: 13px; color: #9ca3af;
            line-height: 1.5; max-width: 260px; margin-inline: auto;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="org">${orgName}</div>
          <div class="sub">Escanea para registrar tu asistencia</div>
          <img src="data:image/png;base64,${dataUrl}" alt="QR Code"/>
          <div class="hint">Abre la app Admino → Log Access → Escanear QR</div>
        </div>
      </body>
    </html>
  `;
}

function AdminCheckIns() {
  const c = useColors();
  const { branding } = useClientStore();
  const qrRef = useRef<{ toDataURL: (cb: (data: string) => void) => void } | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const { data, isLoading, refetch } = useApiQuery(
    ["check-ins"],
    "/log-access/check-ins",
    mockGetCheckIns,
    { refetchInterval: 30_000 }
  );

  const checkIns = data?.data.items ?? [];

  const handleGeneratePdf = () => {
    if (!qrRef.current) return;
    setGeneratingPdf(true);
    qrRef.current.toDataURL(async (dataUrl) => {
      try {
        const html = buildQrHtml(dataUrl, branding.orgName);
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
      } finally {
        setGeneratingPdf(false);
      }
    });
  };

  return (
    <View style={[styles.listContainer, { backgroundColor: c.background }]}>
      {/* Hidden QR used only to extract PNG for the PDF */}
      <View style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}>
        <QRCode
          value={`checkin:${branding.orgName}`}
          size={240}
          getRef={(ref) => {
            qrRef.current = ref as typeof qrRef.current;
          }}
        />
      </View>

      <View style={styles.listHeader}>
        <Text style={[styles.listTitle, { color: c.text }]}>Asistencia hoy</Text>
        <View style={styles.listActions}>
          <TouchableOpacity
            style={[styles.pdfBtn, { backgroundColor: c.primary }]}
            onPress={handleGeneratePdf}
            disabled={generatingPdf}
          >
            {generatingPdf ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="qr-code-2" size={16} color="#fff" />
                <Text style={styles.pdfBtnText}>Generar QR</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => refetch()}>
            <MaterialIcons name="refresh" size={22} color={c.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={c.primary} />
      ) : checkIns.length === 0 ? (
        <View style={styles.centered}>
          <MaterialIcons name="people-outline" size={48} color={c.textMuted} />
          <Text style={[styles.idleSubtitle, { color: c.textMuted }]}>
            Sin registros por ahora
          </Text>
        </View>
      ) : (
        <FlatList
          data={checkIns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }: { item: CheckIn }) => (
            <View
              style={[
                styles.checkInRow,
                { backgroundColor: c.backgroundHover, borderColor: c.border },
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: c.primary + "22" }]}>
                <Text style={[styles.avatarText, { color: c.primary }]}>
                  {item.userName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.checkInName, { color: c.text }]}>
                  {item.userName}
                </Text>
                <Text style={[styles.checkInEmail, { color: c.textMuted }]}>
                  {item.userEmail}
                </Text>
              </View>
              <View style={styles.checkInMeta}>
                <MaterialIcons name="check-circle" size={16} color="#22c55e" />
                <Text style={[styles.checkInTime, { color: c.textMuted }]}>
                  {formatRelativeTime(item.checkedInAt)}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

// ── Entry point ────────────────────────────────────────────────────────────────

export function LogAccessScreen() {
  const { isClient } = useAuth();
  return isClient ? <ClientCheckIn /> : <AdminCheckIns />;
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  successCard: {
    alignItems: "center",
    padding: 40,
    borderRadius: 20,
    gap: 16,
    width: "100%",
    maxWidth: 340,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  idleTitle: {
    fontSize: 26,
    fontWeight: "700",
    marginTop: 8,
  },
  idleSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  btn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  // Camera
  cameraContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#fff",
  },
  scanHint: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cancelBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
  },
  cancelBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  // Admin list
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  listActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pdfBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  pdfBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  checkInRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
  },
  checkInName: {
    fontSize: 15,
    fontWeight: "600",
  },
  checkInEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  checkInMeta: {
    alignItems: "center",
    gap: 4,
  },
  checkInTime: {
    fontSize: 11,
  },
});
