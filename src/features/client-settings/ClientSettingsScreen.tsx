import { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { FeatureShell } from "@/shared/components/shell/FeatureShell";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { ColorPicker } from "@/shared/components/inputs/ColorPicker";
import { useColors } from "@/shared/hooks/useColors";
import { useClientStore } from "@/shared/store/clientStore";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { ChangePasswordSection } from "@/shared/components/inputs/ChangePasswordSection";

const TABS = [
  { key: "branding", label: "Apariencia" },
  { key: "security", label: "Seguridad" },
];

export function ClientSettingsScreen() {
  const c = useColors();
  const [activeTab, setActiveTab] = useState("branding");

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
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setLogoPreview(dataUrl);
      setBranding({ logoUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  function openFilePicker() {
    if (Platform.OS === "web" && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  function saveBranding() {
    setBrandingSaved(true);
    setTimeout(() => setBrandingSaved(false), 2000);
  }

  return (
    <FeatureShell
      title="Configuración"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "branding" ? (
        <View style={styles.tabContent}>
          {Platform.OS === "web" && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              style={{ display: "none" }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0];
                if (file) handleLogoFile(file);
              }}
            />
          )}

          <View style={[styles.card, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Identidad visual</Text>
            <Text style={[styles.sectionHint, { color: c.textMuted }]}>
              Personaliza el logo y los colores. Los cambios se aplican en tiempo real.
            </Text>

            <View style={styles.fields}>
              <View style={styles.logoSection}>
                <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Logo</Text>
                <View style={styles.logoRow}>
                  <View style={[styles.logoBox, { borderColor: c.border, backgroundColor: c.background }]}>
                    {logoPreview ? (
                      <Image source={{ uri: logoPreview }} style={styles.logoImage} resizeMode="contain" />
                    ) : (
                      <Text style={[styles.logoInitial, { color: c.primary }]}>
                        {branding.orgName.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.logoActions}>
                    <CustomButton onPress={openFilePicker} variant="secondary">
                      Subir imagen (JPG/PNG)
                    </CustomButton>
                    {logoPreview && (
                      <TouchableOpacity onPress={() => { setLogoPreview(null); setBranding({ logoUrl: null }); }}>
                        <Text style={[styles.removeText, { color: c.danger }]}>Eliminar logo</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              <ColorPicker label="Color primario" value={primaryColor} onChange={(v) => handleColorChange("primaryColor", v)} />
              <ColorPicker label="Color secundario" value={secondaryColor} onChange={(v) => handleColorChange("secondaryColor", v)} />
              <ColorPicker label="Color de fondo" value={backgroundColor} onChange={(v) => handleColorChange("backgroundColor", v)} />

              <CustomButton onPress={saveBranding}>
                {brandingSaved ? "¡Cambios guardados!" : "Confirmar cambios"}
              </CustomButton>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.tabContent}>
          <ChangePasswordSection />
        </View>
      )}
    </FeatureShell>
  );
}

const styles = StyleSheet.create({
  tabContent: { padding: SPACING.md },
  card: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.md, gap: SPACING.sm },
  sectionTitle: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: TYPOGRAPHY.fontWeight.semibold },
  sectionHint: { fontSize: TYPOGRAPHY.fontSize.sm },
  fields: { gap: SPACING.md, marginTop: SPACING.sm },
  fieldLabel: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "500", marginBottom: SPACING.xs },
  logoSection: { gap: SPACING.xs },
  logoRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md, flexWrap: "wrap" },
  logoBox: { width: 72, height: 72, borderRadius: BORDER_RADIUS.md, borderWidth: 1, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logoImage: { width: 72, height: 72 },
  logoInitial: { fontSize: 28, fontWeight: "800" },
  logoActions: { gap: SPACING.sm, flex: 1 },
  removeText: { fontSize: TYPOGRAPHY.fontSize.sm },
});
