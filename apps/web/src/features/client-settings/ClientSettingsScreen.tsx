import { useRef, useState } from "react";
import { Button, Card, TextField } from "@/shared/ui";
import { useClientStore } from "@/shared/store/clientStore";
import { ChangePasswordSection } from "@/shared/components/inputs/ChangePasswordSection";

const tabs = [
  { key: "branding", label: "Apariencia" },
  { key: "security", label: "Seguridad" },
] as const;

type Tab = (typeof tabs)[number]["key"];

export function ClientSettingsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("branding");
  const { branding, setBranding } = useClientStore();
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(branding.secondaryColor);
  const [backgroundColor, setBackgroundColor] = useState(branding.backgroundColor);
  const [logoPreview, setLogoPreview] = useState<string | null>(branding.logoUrl);
  const [brandingSaved, setBrandingSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleColorChange(key: "primaryColor" | "secondaryColor" | "backgroundColor", value: string) {
    if (key === "primaryColor") setPrimaryColor(value);
    if (key === "secondaryColor") setSecondaryColor(value);
    if (key === "backgroundColor") setBackgroundColor(value);
    setBranding({ [key]: value });
  }

  function handleLogoFile(file: File) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setLogoPreview(dataUrl);
      setBranding({ logoUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  function saveBranding() {
    setBrandingSaved(true);
    setTimeout(() => setBrandingSaved(false), 2000);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? "tab-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === "branding" ? (
          <Card className="max-w-2xl">
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Identidad visual</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Personaliza el logo y los colores. Los cambios se aplican en tiempo real.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleLogoFile(file);
                }}
              />

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-3xl font-extrabold text-primary">
                      {branding.orgName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                    Subir imagen (JPG/PNG)
                  </Button>
                  {logoPreview && (
                    <Button type="button" variant="ghost" onClick={() => { setLogoPreview(null); setBranding({ logoUrl: null }); }}>
                      Eliminar logo
                    </Button>
                  )}
                </div>
              </div>

              <ColorField label="Color primario" value={primaryColor} onChange={(value) => handleColorChange("primaryColor", value)} />
              <ColorField label="Color secundario" value={secondaryColor} onChange={(value) => handleColorChange("secondaryColor", value)} />
              <ColorField label="Color de fondo" value={backgroundColor} onChange={(value) => handleColorChange("backgroundColor", value)} />

              <Button type="button" onClick={saveBranding}>
                {brandingSaved ? "¡Cambios guardados!" : "Confirmar cambios"}
              </Button>
            </div>
          </Card>
        ) : (
          <ChangePasswordSection />
        )}
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex items-end gap-3">
      <input
        aria-label={label}
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-12 cursor-pointer rounded border border-gray-200 bg-white p-1"
      />
      <TextField
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="font-mono"
      />
    </div>
  );
}
