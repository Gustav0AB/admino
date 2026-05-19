import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { CustomInput } from "@/shared/components/inputs/CustomInput";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { useToast } from "@/shared/components/feedback/Toast";
import { useColors } from "@/shared/hooks/useColors";
import { ENV } from "@/shared/config/env";
import { httpClient } from "@/shared/api/client";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function ChangePasswordSection() {
  const c = useColors();
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!current) errs.current = "Required";
    if (next.length < 8) errs.next = "At least 8 characters";
    if (next !== confirm) errs.confirm = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (ENV.USE_MOCK) {
        await delay(600);
        return;
      }
      await httpClient("/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
    },
    onSuccess: () => {
      toast.success("Password updated");
      setCurrent("");
      setNext("");
      setConfirm("");
      setErrors({});
    },
    onError: (e: Error) => {
      toast.error(e.message ?? "Failed to update password");
    },
  });

  function handleSubmit() {
    if (!validate()) return;
    mutation.mutate();
  }

  return (
    <View style={[styles.card, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
      <Text style={[styles.title, { color: c.text }]}>Change Password</Text>
      <View style={styles.fields}>
        <CustomInput
          label="Current password"
          value={current}
          onChangeText={setCurrent}
          secureTextEntry
          placeholder="••••••••"
          {...(errors.current ? { error: errors.current } : {})}
        />
        <CustomInput
          label="New password"
          value={next}
          onChangeText={setNext}
          secureTextEntry
          placeholder="Min. 8 characters"
          {...(errors.next ? { error: errors.next } : {})}
        />
        <CustomInput
          label="Confirm new password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="••••••••"
          {...(errors.confirm ? { error: errors.confirm } : {})}
        />
        <CustomButton onPress={handleSubmit} loading={mutation.isPending} disabled={mutation.isPending}>
          Update password
        </CustomButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: "600",
  },
  fields: {
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
});
