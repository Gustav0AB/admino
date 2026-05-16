import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { CustomModal } from "@/shared/components/feedback/CustomModal";
import { CustomInput } from "@/shared/components/inputs/CustomInput";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { CustomSelect } from "@/shared/components/inputs/CustomSelect";
import { CustomCheckbox } from "@/shared/components/inputs/CustomCheckbox";
import { useColors } from "@/shared/hooks/useColors";
import { SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { SECTION_PERMISSIONS } from "@/shared/types/member";
import type { AdminOrg, ClientType, CreateOrgInput, UpdateOrgInput } from "@/shared/types/admin";

const TIPO_OPTIONS = [
  { label: "Gimnasio", value: "gym" },
  { label: "Academia", value: "academy" },
  { label: "Escuela", value: "school" },
  { label: "Empresa", value: "company" },
  { label: "Organización", value: "organization" },
  { label: "Otro", value: "other" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  org?: AdminOrg | null;
  onSubmit: (data: CreateOrgInput | UpdateOrgInput) => void;
  isLoading?: boolean;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

export function ClientFormModal({ open, onClose, org, onSubmit, isLoading }: Props) {
  const c = useColors();
  const isEditing = !!org;

  const [name, setName] = useState("");
  const [tipo, setTipo] = useState<ClientType>("gym");
  const [accountName, setAccountName] = useState("");
  const [accountNameTouched, setAccountNameTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [clientPermissions, setClientPermissions] = useState<string[]>([]);
  const [memberPermissions, setMemberPermissions] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setName(org?.name ?? "");
      setTipo((org?.tipo ?? "gym") as ClientType);
      setAccountName(org?.slug ?? "");
      setAccountNameTouched(false);
      setPassword("");
      setClientPermissions(org?.clientPermissions ?? []);
      setMemberPermissions(org?.memberPermissions ?? []);
      setErrors({});
    }
  }, [open, org]);

  useEffect(() => {
    if (!accountNameTouched && !isEditing) {
      setAccountName(slugify(name));
    }
  }, [name, accountNameTouched, isEditing]);

  const fe = (key: string) =>
    errors[key] ? ({ error: errors[key] } as { error: string }) : {};

  function togglePerm(key: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(key) ? list.filter((p) => p !== key) : [...list, key]);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "El nombre es obligatorio";
    if (!accountName.trim()) errs.accountName = "El account name es obligatorio";
    else if (!/^[a-z0-9-]+$/.test(accountName)) errs.accountName = "Solo letras minúsculas, números y guiones";
    if (!isEditing && password.length < 8) errs.password = "Mínimo 8 caracteres";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    if (isEditing) {
      onSubmit({
        name: name.trim(),
        clientPermissions,
        memberPermissions,
      } as UpdateOrgInput);
    } else {
      onSubmit({
        name: name.trim(),
        tipo,
        accountName: accountName.trim(),
        password,
        clientPermissions,
        memberPermissions,
      } as CreateOrgInput);
    }
  }

  return (
    <CustomModal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title={isEditing ? "Editar cliente" : "Nuevo cliente"}
      size="md"
      footer={
        <>
          <CustomButton variant="outline" onPress={onClose} disabled={!!isLoading}>
            Cancelar
          </CustomButton>
          <CustomButton onPress={handleSubmit} loading={!!isLoading} disabled={!!isLoading}>
            {isEditing ? "Guardar cambios" : "Crear cliente"}
          </CustomButton>
        </>
      }
    >
      <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* ── Basic info ────────────────────────────────── */}
          <CustomInput
            label="Nombre"
            value={name}
            onChangeText={setName}
            placeholder="Ej. FitLife Studio"
            autoCapitalize="words"
            {...fe("name")}
          />

          {!isEditing && (
            <CustomSelect
              label="Tipo"
              value={tipo}
              options={TIPO_OPTIONS}
              onValueChange={(v) => setTipo(v as ClientType)}
            />
          )}

          <CustomInput
            label="Account name"
            value={accountName}
            onChangeText={(v) => {
              setAccountNameTouched(true);
              setAccountName(v.toLowerCase().replace(/[^a-z0-9-]/g, ""));
            }}
            placeholder="fitlife-studio"
            autoCapitalize="none"
            hint="Identificador único del cliente"
            {...fe("accountName")}
          />

          {!isEditing && (
            <CustomInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
              {...fe("password")}
            />
          )}

          {/* ── Client permissions ───────────────────────── */}
          <View style={styles.permSection}>
            <Text style={[styles.permTitle, { color: c.text }]}>
              Servicios del cliente
            </Text>
            <Text style={[styles.permHint, { color: c.textMuted }]}>
              Qué secciones puede ver y usar este cliente.
            </Text>
            <View style={styles.permGrid}>
              {SECTION_PERMISSIONS.map((perm) => (
                <CustomCheckbox
                  key={perm.key}
                  label={perm.label}
                  checked={clientPermissions.includes(perm.key)}
                  onCheckedChange={() => togglePerm(perm.key, clientPermissions, setClientPermissions)}
                />
              ))}
            </View>
          </View>

          {/* ── Member permissions ───────────────────────── */}
          <View style={styles.permSection}>
            <Text style={[styles.permTitle, { color: c.text }]}>
              Servicios para miembros
            </Text>
            <Text style={[styles.permHint, { color: c.textMuted }]}>
              Qué secciones pueden ver los miembros de este cliente.
            </Text>
            <View style={styles.permGrid}>
              {SECTION_PERMISSIONS.map((perm) => (
                <CustomCheckbox
                  key={perm.key}
                  label={perm.label}
                  checked={memberPermissions.includes(perm.key)}
                  onCheckedChange={() => togglePerm(perm.key, memberPermissions, setMemberPermissions)}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  permSection: {
    gap: SPACING.sm,
  },
  permTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  permHint: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  permGrid: {
    gap: SPACING.sm,
  },
});
