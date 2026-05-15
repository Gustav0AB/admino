import React from "react";
import { View, StyleSheet, Image, Pressable, ScrollView, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Body, BodyStrong, Caption, CustomButton } from "@/shared/components";
import { useColors } from "@/shared/hooks/useColors";
import { SPACING, BORDER_RADIUS } from "@/shared/theme/tokens";
import { useTrackerStore } from "@/shared/store/trackerStore";

const ACCEPTED_TYPES = ["image/*", "video/*"];

export function EvidenceUploader() {
  const colors = useColors();
  const { evidenceUris, addEvidenceUri, removeEvidenceUri } = useTrackerStore();

  const handlePick = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ACCEPTED_TYPES,
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      result.assets.forEach((asset) => addEvidenceUri(asset.uri));
    }
  };

  return (
    <View style={styles.root}>
      <BodyStrong style={{ color: colors.text, marginBottom: SPACING.sm }}>
        Evidence Upload
      </BodyStrong>

      {evidenceUris.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previews}>
          {evidenceUris.map((uri) => (
            <View key={uri} style={styles.previewWrapper}>
              <Image
                source={{ uri }}
                style={[styles.preview, { borderColor: colors.border }]}
                resizeMode="cover"
              />
              <Pressable
                onPress={() => removeEvidenceUri(uri)}
                style={[styles.removeBtn, { backgroundColor: colors.danger }]}
                accessibilityRole="button"
                accessibilityLabel="Remove file"
              >
                <Caption style={{ color: colors.white }}>✕</Caption>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      <Pressable
        onPress={handlePick}
        style={[styles.dropzone, { borderColor: colors.border, backgroundColor: colors.backgroundStrong }]}
        accessibilityRole="button"
        accessibilityLabel="Upload evidence"
      >
        <Body style={{ color: colors.textMuted, fontSize: 24 }}>📎</Body>
        <Body style={{ color: colors.textMuted, marginTop: SPACING.xs }}>
          Tap to add photos or videos
        </Body>
        <Caption style={{ color: colors.textPlaceholder }}>
          {evidenceUris.length > 0 ? `${evidenceUris.length} file(s) selected` : "Images & videos accepted"}
        </Caption>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: SPACING.sm,
  },
  previews: {
    flexDirection: "row",
    marginBottom: SPACING.xs,
  },
  previewWrapper: {
    position: "relative",
    marginRight: SPACING.sm,
  },
  preview: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: BORDER_RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  dropzone: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
  },
});
