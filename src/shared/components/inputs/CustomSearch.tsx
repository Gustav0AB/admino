import { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
  Modal,
  Text,
} from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";

type SearchOption = {
  id: string;
  label: string;
  value: any;
};

type CustomSearchProps = {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSelect?: (option: SearchOption) => void;
  options?: SearchOption[];
  loading?: boolean;
  error?: string;
  hint?: string;
  disabled?: boolean;
  showSuggestions?: boolean;
  maxSuggestions?: number;
};

export function CustomSearch({
  label,
  placeholder = "Search...",
  value = "",
  onChangeText,
  onSelect,
  options = [],
  loading = false,
  error,
  hint,
  disabled = false,
  showSuggestions = true,
  maxSuggestions = 5,
}: CustomSearchProps) {
  const [searchText, setSearchText] = useState(value);
  const [filteredOptions, setFilteredOptions] = useState<SearchOption[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [focused, setFocused] = useState(false);
  const c = useColors();

  useEffect(() => {
    setSearchText(value);
  }, [value]);

  useEffect(() => {
    if (searchText && showSuggestions) {
      const filtered = options
        .filter((option) =>
          option.label.toLowerCase().includes(searchText.toLowerCase()),
        )
        .slice(0, maxSuggestions);
      setFilteredOptions(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setShowDropdown(false);
    }
  }, [searchText, options, showSuggestions, maxSuggestions]);

  const handleTextChange = (text: string) => {
    setSearchText(text);
    onChangeText?.(text);
  };

  const handleSelect = (option: SearchOption) => {
    setSearchText(option.label);
    setShowDropdown(false);
    onSelect?.(option);
    onChangeText?.(option.label);
  };

  const renderSuggestion = ({ item }: { item: SearchOption }) => (
    <TouchableOpacity
      style={[styles.suggestionItem, { borderBottomColor: c.border }]}
      onPress={() => handleSelect(item)}
    >
      <Text style={{ color: c.text }}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: c.text }]}>{label}</Text>}

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: c.background,
              borderColor: error ? c.danger : focused ? c.primary : c.border,
              borderWidth: error || focused ? 2 : 1,
              color: c.text,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={c.textPlaceholder}
          value={searchText}
          onChangeText={handleTextChange}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            // Delay hiding dropdown to allow selection
            setTimeout(() => setShowDropdown(false), 150);
          }}
          editable={!disabled}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {loading && (
          <View style={styles.loadingIndicator}>
            <Text style={{ color: c.textMuted }}>⟳</Text>
          </View>
        )}
      </View>

      {showDropdown && filteredOptions.length > 0 && (
        <Modal visible={showDropdown} transparent animationType="none">
          <TouchableOpacity
            style={styles.dropdownOverlay}
            onPress={() => setShowDropdown(false)}
            activeOpacity={1}
          >
            <View
              style={[
                styles.dropdown,
                {
                  backgroundColor: c.background,
                  borderColor: c.border,
                  shadowColor: c.text,
                },
              ]}
            >
              <FlatList
                data={filteredOptions}
                keyExtractor={(item) => item.id}
                renderItem={renderSuggestion}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {hint && !error && (
        <Text style={[styles.hintText, { color: c.textMuted }]}>{hint}</Text>
      )}

      {error && (
        <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text>
      )}
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
  inputContainer: {
    position: "relative",
  },
  input: {
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "inherit",
    }),
    ...Platform.select({
      web: {
        outlineStyle: "none",
      },
    }),
  },
  loadingIndicator: {
    position: "absolute",
    right: SPACING.md,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  dropdownOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  dropdown: {
    position: "absolute",
    top: 120, // Position below the input
    left: SPACING.lg,
    right: SPACING.lg,
    maxHeight: 200,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  suggestionItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  hintText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.xs,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.xs,
  },
});
