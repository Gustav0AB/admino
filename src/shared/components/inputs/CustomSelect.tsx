import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";

const isWeb = Platform.OS === "web";

type SelectOption = {
  label: string;
  value: string | number;
};

type CustomSelectProps = {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  onValueChange?: (value: string | number) => void;
  error?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function CustomSelect({
  label,
  placeholder = "Select an option",
  options,
  value,
  onChange,
  onValueChange,
  error,
  disabled = false,
  style,
}: CustomSelectProps) {
  const handleChange = onChange ?? onValueChange ?? (() => {});
  const [modalVisible, setModalVisible] = useState(false);
  const c = useColors();

  const selectedOption = options.find((option) => option.value === value);

  const handleSelect = (option: SelectOption) => {
    handleChange(option.value);
    setModalVisible(false);
  };

  if (isWeb) {
    return (
      <View style={[styles.container, style]}>
        {label && (
          <Text style={[styles.label, { color: c.text }]}>{label}</Text>
        )}
        {/* @ts-ignore — select is valid on web */}
        <select
          value={value ?? ""}
          disabled={disabled}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleChange(e.target.value)
          }
          style={{
            height: 44,
            paddingLeft: SPACING.md,
            paddingRight: SPACING.md,
            borderRadius: BORDER_RADIUS.md,
            borderWidth: error ? 2 : 1,
            borderStyle: "solid",
            borderColor: error ? c.danger : c.border,
            backgroundColor: c.background,
            color: value !== undefined && value !== "" ? c.text : c.textPlaceholder,
            fontSize: TYPOGRAPHY.fontSize.md,
            width: "100%",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            outline: "none",
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
          }}
        >
          <option value="" disabled hidden>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: c.text }]}>{label}</Text>}

      <TouchableOpacity
        style={[
          styles.selectButton,
          {
            backgroundColor: c.background,
            borderColor: error ? c.danger : c.border,
            borderWidth: error ? 2 : 1,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text
          style={[
            styles.selectText,
            {
              color: selectedOption ? c.text : c.textPlaceholder,
            },
          ]}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text style={[styles.arrow, { color: c.textMuted }]}>▼</Text>
      </TouchableOpacity>

      {error && (
        <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: c.background, borderColor: c.border },
            ]}
          >
            <FlatList
              data={options}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    {
                      backgroundColor:
                        item.value === value
                          ? c.backgroundStrong
                          : c.background,
                    },
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={[styles.optionText, { color: c.text }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 200 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.xs,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...Platform.select({
      web: {
        cursor: "pointer",
      },
    }),
  },
  selectText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    flex: 1,
  },
  arrow: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginLeft: SPACING.sm,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    maxWidth: 300,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  option: {
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  optionText: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
});
