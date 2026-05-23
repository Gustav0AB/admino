import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { CustomModal, CustomTextArea, Body, BodyStrong, Caption } from "@/shared/components";
import { useColors } from "@/shared/hooks/useColors";
import { SPACING, BORDER_RADIUS } from "@/shared/theme/tokens";
import { useTrackerStore } from "@/shared/store/trackerStore";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
};

export function FeedbackModal({ open, onOpenChange, onSubmit }: Props) {
  const colors = useColors();
  const { rpe, feedbackNotes, setRpe, setFeedbackNotes } = useTrackerStore();

  const RPE_LABELS: Record<number, string> = {
    1: "Very easy",
    2: "Easy",
    3: "Moderate",
    4: "Somewhat hard",
    5: "Hard",
    6: "Harder",
    7: "Very hard",
    8: "Very very hard",
    9: "Maximal",
    10: "Absolute max",
  };

  const rpeColor = (value: number) => {
    if (value <= 3) return "#22C55E";
    if (value <= 6) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <CustomModal
      open={open}
      onOpenChange={onOpenChange}
      title="Log Workout Feedback"
      footer={
        <View style={styles.footer}>
          <Pressable
            onPress={() => onOpenChange(false)}
            style={[styles.footerBtn, { borderWidth: 1, borderColor: colors.border, borderRadius: BORDER_RADIUS.md }]}
            accessibilityRole="button"
          >
            <Body style={{ color: colors.textMuted }}>Cancel</Body>
          </Pressable>
          <Pressable
            onPress={onSubmit}
            disabled={rpe === null}
            style={[
              styles.footerBtn,
              {
                backgroundColor: rpe !== null ? colors.primary : colors.border,
                borderRadius: BORDER_RADIUS.md,
              },
            ]}
            accessibilityRole="button"
          >
            <BodyStrong style={{ color: colors.primaryForeground }}>Complete Workout</BodyStrong>
          </Pressable>
        </View>
      }
    >
      <View style={styles.body}>
        <BodyStrong style={{ color: colors.text }}>Rate of Perceived Exertion</BodyStrong>
        <Caption style={{ color: colors.textMuted, marginTop: 2 }}>
          {rpe !== null ? `${rpe} — ${RPE_LABELS[rpe]}` : "Select how hard it felt (1–10)"}
        </Caption>

        <View style={styles.rpeGrid}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => {
            const selected = rpe === value;
            return (
              <Pressable
                key={value}
                onPress={() => setRpe(value)}
                accessibilityRole="button"
                accessibilityLabel={`RPE ${value}`}
                accessibilityState={{ selected }}
                style={[
                  styles.rpeBtn,
                  {
                    backgroundColor: selected ? rpeColor(value) : colors.backgroundStrong,
                    borderColor: selected ? rpeColor(value) : colors.border,
                  },
                ]}
              >
                <BodyStrong style={{ color: selected ? "#fff" : colors.text }}>{value}</BodyStrong>
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: SPACING.md }}>
          <CustomTextArea
            label="Notes"
            placeholder="How did the session feel? Any pain or wins to note..."
            value={feedbackNotes}
            onChangeText={setFeedbackNotes}
            rows={4}
          />
        </View>
      </View>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: SPACING.sm,
  },
  rpeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  rpeBtn: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "flex-end",
  },
  footerBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
