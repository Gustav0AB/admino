import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { CustomModal } from "@/shared/components/feedback/CustomModal";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { StatusBadge } from "@/shared/components/data-display/StatusBadge";
import { Avatar } from "@/shared/components/data-display/Avatar";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import type { AdminOrgDetail, AdminOrgMember } from "@/shared/types/admin";

type Props = {
  open: boolean;
  onClose: () => void;
  orgDetail: AdminOrgDetail | null;
  isLoading?: boolean;
  onImpersonate: (member: AdminOrgMember) => void;
  isImpersonating?: boolean;
};

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Miembro",
};

export function ClientMembersModal({
  open,
  onClose,
  orgDetail,
  isLoading,
  onImpersonate,
  isImpersonating,
}: Props) {
  const c = useColors();

  return (
    <CustomModal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title={orgDetail ? `Miembros — ${orgDetail.name}` : "Miembros"}
      size="lg"
      footer={
        <CustomButton variant="outline" onPress={onClose}>
          Cerrar
        </CustomButton>
      }
    >
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.primary} />
        </View>
      ) : (
        <ScrollView
          style={{ maxHeight: 420 }}
          contentContainerStyle={{ gap: SPACING.sm }}
          showsVerticalScrollIndicator={false}
        >
          {orgDetail?.members.length === 0 && (
            <Text style={{ color: c.textMuted, textAlign: "center", paddingVertical: SPACING.lg }}>
              Sin miembros
            </Text>
          )}

          {orgDetail?.members.map((member) => (
            <View
              key={member.id}
              style={[
                styles.memberRow,
                {
                  backgroundColor: c.backgroundStrong,
                  borderColor: c.border,
                  opacity: member.isActive ? 1 : 0.55,
                },
              ]}
            >
              <Avatar name={member.name} size="sm" />

              <View style={styles.memberInfo}>
                <View style={styles.memberNameRow}>
                  <Text
                    style={[
                      styles.memberName,
                      { color: c.text, fontSize: TYPOGRAPHY.fontSize.sm },
                    ]}
                    numberOfLines={1}
                  >
                    {member.name}
                  </Text>
                  <StatusBadge
                    status={member.isActive ? "active" : "cancelled"}
                    customLabel={member.isActive ? "Activo" : "Inactivo"}
                    size="sm"
                  />
                </View>
                <Text
                  style={[styles.memberEmail, { color: c.textMuted, fontSize: TYPOGRAPHY.fontSize.xs }]}
                  numberOfLines={1}
                >
                  {member.email}
                </Text>
                <Text style={[styles.memberRole, { color: c.primary, fontSize: TYPOGRAPHY.fontSize.xs }]}>
                  {ROLE_LABEL[member.role] ?? member.role}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.impersonateBtn,
                  {
                    backgroundColor: c.primary + "15",
                    borderColor: c.primary + "40",
                  },
                ]}
                onPress={() => onImpersonate(member)}
                disabled={isImpersonating || !member.isActive}
                accessibilityLabel={`Impersonar a ${member.name}`}
              >
                {isImpersonating ? (
                  <ActivityIndicator size="small" color={c.primary} />
                ) : (
                  <Text style={[styles.impersonateBtnText, { color: c.primary, fontSize: TYPOGRAPHY.fontSize.xs }]}>
                    Impersonar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  center: {
    paddingVertical: SPACING.xl,
    alignItems: "center",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  memberInfo: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    flexWrap: "wrap",
  },
  memberName: {
    fontWeight: "600",
    flexShrink: 1,
  },
  memberEmail: {
    flexShrink: 1,
  },
  memberRole: {
    fontWeight: "500",
  },
  impersonateBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
    minHeight: 32,
  },
  impersonateBtnText: {
    fontWeight: "600",
  },
});
