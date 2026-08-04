export default function QRCode({
  value,
  size = 120,
  getRef
}: {
  value?: string;
  size?: number;
  getRef?: (ref: { toDataURL: (cb: (data: string) => void) => void }) => void;
}) {
  getRef?.({ toDataURL: (cb) => cb(btoa(value ?? "QR")) });

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "grid",
        placeItems: "center",
        border: "1px solid #d1d5db",
        fontSize: 10,
        textAlign: "center",
        padding: 8
      }}
    >
      {value ?? "QR"}
    </div>
  );
}
