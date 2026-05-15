import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { H2, Body, BodyStrong, CustomButton, Card } from "@/shared/components";
import { useColors } from "@/shared/hooks/useColors";
import { SPACING } from "@/shared/theme/tokens";
import { useTrackerStore } from "@/shared/store/trackerStore";
import { useWorkoutSocket } from "@/shared/hooks/useWorkoutSocket";
import { StreakBadge } from "./components/StreakBadge";
import { WorkoutCard } from "./components/WorkoutCard";
import { EvidenceUploader } from "./components/EvidenceUploader";
import { FeedbackModal } from "./components/FeedbackModal";

const MOCK_WORKOUT = {
  id: "wod-1",
  title: "Upper Body Power",
  date: new Date().toISOString(),
  description: "Focus on explosive movements and controlled negatives.",
  status: "pending" as const,
  exercises: [
    { id: "e1", name: "Bench Press", sets: 4, reps: 6, notes: "85% 1RM" },
    { id: "e2", name: "Pull-Ups", sets: 4, reps: 8 },
    { id: "e3", name: "Overhead Press", sets: 3, reps: 10, notes: "Controlled descent" },
    { id: "e4", name: "Barbell Row", sets: 3, reps: 10 },
    { id: "e5", name: "Face Pulls", sets: 3, reps: 15, notes: "Light weight" },
  ],
};

export function TrackerScreen() {
  const colors = useColors();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { workout, setWorkout, completeWorkout, resetFeedback } = useTrackerStore();

  useWorkoutSocket();

  useEffect(() => {
    if (!workout) {
      setWorkout(MOCK_WORKOUT);
    }
  }, []);

  const handleStartFeedback = () => {
    resetFeedback();
    setFeedbackOpen(true);
  };

  const handleSubmitFeedback = () => {
    completeWorkout();
    setFeedbackOpen(false);
  };

  const isCompleted = workout?.status === "completed";

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <View>
          <Body style={{ color: colors.textMuted }}>Today's Session</Body>
          <H2 style={{ color: colors.text }}>Workout of the Day</H2>
        </View>
        <StreakBadge />
      </View>

      {workout ? (
        <>
          <WorkoutCard workout={workout} />

          <Card variant="outlined" padding="md" style={styles.section}>
            <EvidenceUploader />
          </Card>

          {!isCompleted ? (
            <CustomButton
              variant="primary"
              size="lg"
              onPress={handleStartFeedback}
              style={styles.cta}
            >
              Log Feedback & Complete
            </CustomButton>
          ) : (
            <View style={[styles.completedBanner, { backgroundColor: "#F0FDF4", borderColor: "#86EFAC" }]}>
              <BodyStrong style={{ color: "#15803D" }}>✓ Workout completed — great work!</BodyStrong>
            </View>
          )}
        </>
      ) : (
        <View style={[styles.emptyState, { backgroundColor: colors.backgroundStrong }]}>
          <Body style={{ color: colors.textMuted, fontSize: 32 }}>🏋️</Body>
          <BodyStrong style={{ color: colors.text, marginTop: SPACING.sm }}>No workout scheduled</BodyStrong>
          <Body style={{ color: colors.textMuted, textAlign: "center", marginTop: SPACING.xs }}>
            Your coach hasn't assigned a workout for today yet. Check back soon.
          </Body>
        </View>
      )}

      <FeedbackModal
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        onSubmit={handleSubmitFeedback}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  section: {
    gap: SPACING.sm,
  },
  cta: {
    marginTop: SPACING.xs,
  },
  completedBanner: {
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  emptyState: {
    borderRadius: 12,
    padding: SPACING.xl,
    alignItems: "center",
    marginTop: SPACING.lg,
  },
});
