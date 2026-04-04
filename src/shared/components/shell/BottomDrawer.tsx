import { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";

type BottomDrawerProps = {
  visible: boolean;
  onClose: () => void;
  /** Optional heading shown inside the sheet */
  title?: string;
  children: React.ReactNode;
};

/**
 * A bottom sheet that slides up over the screen.
 * Used on mobile as a filter overlay in place of the inline filter bar.
 * Dismiss by tapping the backdrop or pressing the hardware back button.
 */
export function BottomDrawer({
  visible,
  onClose,
  title,
  children,
}: BottomDrawerProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : 500,
      useNativeDriver: false, // false keeps web/native parity
      damping: 22,
      mass: 0.9,
      stiffness: 180,
    }).start();
  }, [visible, translateY]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop — tap to dismiss */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: c.background,
              borderTopColor: c.border,
              paddingBottom: insets.bottom + SPACING.md,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Drag handle */}
          <View style={[styles.handle, { backgroundColor: c.border }]} />

          {title && (
            <Text style={[styles.title, { color: c.text }]}>{title}</Text>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    borderTopWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    maxHeight: "82%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: "center",
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  contentContainer: {
    paddingBottom: SPACING.sm,
    gap: SPACING.md,
  },
});
