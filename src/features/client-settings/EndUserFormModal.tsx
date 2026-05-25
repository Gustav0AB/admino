import { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { CustomModal } from "@/shared/components/feedback/CustomModal";
import { CustomInput } from "@/shared/components/inputs/CustomInput";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { CustomSwitch } from "@/shared/components/inputs/CustomSwitch";
import { SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useColors } from "@/shared/hooks/useColors";
import type {
  EndUserMember,
  CreateEndUserMemberInput,
  UpdateEndUserMemberInput,
} from "@/shared/types/member";

type Props = {
  open: boolean;
  onClose: () => void;
  member?: EndUserMember | null;
  onSubmit: (data: CreateEndUserMemberInput | UpdateEndUserMemberInput) => void;
  isLoading?: boolean;
};

function calcAge(isoDate: string): number | null {
  const dob = new Date(isoDate);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 0 ? age : null;
}

function toIsoDate(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split("/");
  if (!d || !m || !y || y.length < 4) return "";
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function toDisplayDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function EndUserFormModal({ open, onClose, member, onSubmit, isLoading }: Props) {
  const c = useColors();
  const isEditing = !!member;

  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [withAccount, setWithAccount] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setName(member?.name ?? "");
      setLastname(member?.lastname ?? "");
      setBirthdate(toDisplayDate(member?.birthdate ?? null));
      setWithAccount(!!member?.username);
      setUsername(member?.username ?? "");
      setPassword("");
      setErrors({});
    }
  }, [open, member]);

  const isoDate = toIsoDate(birthdate);
  const age = isoDate ? calcAge(isoDate) : null;

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "El nombre es obligatorio";
    if (!lastname.trim()) errs.lastname = "El apellido es obligatorio";
    if (!birthdate.trim()) {
      errs.birthdate = "La fecha es obligatoria";
    } else if (!isoDate || isNaN(new Date(isoDate).getTime()) || age === null) {
      errs.birthdate = "Formato: DD/MM/AAAA";
    }
    if (!isEditing && withAccount) {
      if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim()) || username.trim().length < 3)
        errs.username = "Mínimo 3 caracteres, solo letras, números, puntos, guiones y _";
      if (password.length < 8)
        errs.password = "Mínimo 8 caracteres";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    if (isEditing) {
      onSubmit({ name: name.trim(), lastname: lastname.trim(), birthdate: isoDate } as UpdateEndUserMemberInput);
    } else {
      const payload: CreateEndUserMemberInput = {
        name: name.trim(),
        lastname: lastname.trim(),
        birthdate: isoDate,
        ...(withAccount ? { username: username.trim(), password } : {}),
      };
      onSubmit(payload);
    }
  }

  const fe = (key: string) =>
    errors[key] ? ({ error: errors[key] } as { error: string }) : {};

  return (
    <CustomModal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title={isEditing ? "Editar miembro" : "Nuevo miembro"}
      size="sm"
      footer={
        <>
          <CustomButton variant="outline" onPress={onClose} disabled={!!isLoading}>
            Cancelar
          </CustomButton>
          <CustomButton onPress={handleSubmit} loading={!!isLoading} disabled={!!isLoading}>
            {isEditing ? "Guardar" : "Agregar"}
          </CustomButton>
        </>
      }
    >
      <View style={{ gap: SPACING.md }}>
        <CustomInput
          label="Nombre"
          value={name}
          onChangeText={setName}
          placeholder="Nombre"
          autoCapitalize="words"
          {...fe("name")}
        />
        <CustomInput
          label="Apellido"
          value={lastname}
          onChangeText={setLastname}
          placeholder="Apellido"
          autoCapitalize="words"
          {...fe("lastname")}
        />
        <View>
          <CustomInput
            label="Fecha de nacimiento"
            value={birthdate}
            onChangeText={setBirthdate}
            placeholder="DD/MM/AAAA"
            keyboardType="numeric"
            {...fe("birthdate")}
          />
          {age !== null && (
            <Text style={{ color: c.textMuted, fontSize: TYPOGRAPHY.fontSize.xs, marginTop: 4 }}>
              Edad: {age} años
            </Text>
          )}
        </View>

        {!isEditing && (
          <View style={{ gap: SPACING.sm }}>
            <CustomSwitch
              label="Crear cuenta de acceso"
              checked={withAccount}
              onCheckedChange={setWithAccount}
            />

            {withAccount && (
              <View style={{ gap: SPACING.md }}>
                <CustomInput
                  label="Nombre de usuario"
                  value={username}
                  onChangeText={setUsername}
                  placeholder="ej. juan_perez"
                  autoCapitalize="none"
                  {...fe("username")}
                />
                <CustomInput
                  label="Contraseña"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 8 caracteres"
                  secureTextEntry
                  {...fe("password")}
                />
              </View>
            )}
          </View>
        )}
      </View>
    </CustomModal>
  );
}
