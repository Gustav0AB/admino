export function useCameraPermissions() {
  return [{ granted: false }, async () => ({ granted: false })] as const;
}

export function CameraView({ children, style }: Record<string, any>) {
  return <div style={style as React.CSSProperties}>{children}</div>;
}
