import { useState, useEffect } from "react";
import { View } from "react-native";
import { CustomModal } from "@/shared/components/feedback/CustomModal";
import { CustomInput } from "@/shared/components/inputs/CustomInput";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { SPACING } from "@/shared/theme/tokens";
import type { OrgMember, CreateMemberInput, UpdateMemberInput } from "@/shared/types/member";

type Props = {
  open: boolean;
  onClose: () => void;
  member?: OrgMember | null;
  onSubmit: (data: CreateMemberInput | UpdateMemberInput) => void;
  isLoading?: boolean;
};

export function MemberFormModal({ open, onClose, member, onSubmit, isLoading }: Props) {
  const isEditing = !!member;

  const [name, setName] = useState("");
  const [username, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setName(member?.name ?? "");
      setEmail(member?.username ?? "");
      setPassword("");
      setErrors({});
    }
  }, [open, member]);

  const fe = (key: string) =>
    errors[key] ? ({ error: errors[key] } as { error: string }) : {};

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "El nombre es obligatorio";
    if (!isEditing) {
      if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) errs.username = "Solo letras, números, puntos, guiones y _";
      if (password.length < 8) errs.password = "Mínimo 8 caracteres";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    if (isEditing) {
      onSubmit({ name: name.trim() } as UpdateMemberInput);
    } else {
      onSubmit({ name: name.trim(), username: username.trim(), password, role: "MEMBER", permissions: [] } as CreateMemberInput);
    }
  }

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
          placeholder="Nombre completo"
          autoCapitalize="words"
          {...fe("name")}
        />

        {!isEditing && (
          <>
            <CustomInput
              label="Account name"
              value={username}
              onChangeText={setEmail}
              placeholder="ej. john_doe"
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
          </>
        )}
      </View>
    </CustomModal>
  );
}
