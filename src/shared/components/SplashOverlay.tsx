import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

type SplashOverlayProps = {
  visible: boolean;
  primaryColor: string;
  orgName: string;
};

export function SplashOverlay({ visible, primaryColor, orgName }: SplashOverlayProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [isRendered, setIsRendered] = useState(true);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      opacity.setValue(1);
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setIsRendered(false);
      });
    }
  }, [visible]);

  if (!isRendered) return null;

  return (
    <Animated.View
      style={[styles.container, { opacity, backgroundColor: primaryColor }]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoLetter}>
            {orgName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.orgName}>{orgName.toUpperCase()}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  logoLetter: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -2,
  },
  orgName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    letterSpacing: 1,
  },
});
