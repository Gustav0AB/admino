import { Component, type ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { lightColors, type AppColors } from "@/shared/theme/colors";
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from "@/shared/theme/tokens";

type ErrorBoundaryState = {
  error: Error | null;
};

type ErrorBoundaryClassProps = {
  children: ReactNode;
  colors: AppColors;
  fallback?: (error: Error, reset: () => void) => ReactNode;
};

class ErrorBoundaryClass extends Component<ErrorBoundaryClassProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    const { children, colors: c, fallback } = this.props;

    if (!error) return children;

    if (fallback) return fallback(error, this.reset);

    return (
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: c.background }]}
      >
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>⚠</Text>
        </View>
        <Text style={[styles.title, { color: c.text }]}>Something went wrong</Text>
        <Text style={[styles.message, { color: c.textMuted }]}>{error.message}</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: c.primary }]}
          onPress={this.reset}
          accessibilityRole="button"
          accessibilityLabel="Retry"
        >
          <Text style={[styles.buttonText, { color: c.primaryForeground }]}>Try again</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
}

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
};

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  return (
    <ErrorBoundaryClass colors={lightColors} fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.md,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: "600",
  },
});
