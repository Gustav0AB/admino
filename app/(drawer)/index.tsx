import { useState } from "react";
import { View, Platform, Alert, Text } from "react-native";
import { MainLayout } from "@/shared/components/MainLayout";
import { useColors } from "@/shared/hooks/useColors";
import { useOrgTheme } from "@/shared/theme/useOrgTheme";
import {
  Card,
  ContentBlock,
  CustomButton,
  CustomInput,
  CustomSwitch,
  StatusBadge,
  Avatar,
  CustomModal,
  CustomSelect,
  CustomRadio,
  CustomCheckbox,
  CustomTextArea,
  CustomDatePicker,
  CustomSearch,
  CustomTabs,
  CustomAccordion,
} from "@/shared/components";
import { SPACING } from "@/shared/theme/tokens";

export default function DashboardScreen() {
  const c = useColors();
  const { primaryColor } = useOrgTheme();

  // Component states
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");
  const [switchValue, setSwitchValue] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // New component states
  const [selectedOption, setSelectedOption] = useState("");
  const [radioValue, setRadioValue] = useState("option1");
  const [checkboxValues, setCheckboxValues] = useState<string[]>(["checkbox1"]);
  const [textAreaValue, setTextAreaValue] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("tab1");

  const handleButtonPress = (variant: string) => {
    if (Platform.OS === "web") {
      // Use browser alert for web
      window.alert(`You pressed the ${variant} button!`);
    } else {
      // Use React Native Alert for mobile
      Alert.alert("Button Pressed", `You pressed the ${variant} button!`);
    }
  };

  const validateInput = (value: string) => {
    if (value.length < 3) {
      setInputError("Must be at least 3 characters");
    } else {
      setInputError("");
    }
  };

  return (
    <MainLayout scrollable padding={false}>
      <View style={{ gap: SPACING.xl, padding: SPACING.md, width: "100%" }}>
        {/* Header */}
        <ContentBlock
          title="Component Showcase"
          paragraph="A comprehensive demo of all custom components in the design system"
        />

        {/* Buttons Section */}
        <Card variant="elevated">
          <ContentBlock
            title="Buttons"
            paragraph="Interactive buttons with different variants and sizes"
          />
          <View style={{ gap: SPACING.md, marginTop: SPACING.md }}>
            <CustomButton
              variant="primary"
              onPress={() => handleButtonPress("Primary")}
            >
              Primary Button
            </CustomButton>
          </View>
        </Card>

        {/* Form Components Section */}
        <Card variant="elevated">
          <ContentBlock
            title="Form Components"
            paragraph="Input fields, switches, and status indicators"
          />
          <View style={{ gap: SPACING.lg, marginTop: SPACING.md }}>
            <CustomInput
              label="Demo Input"
              placeholder="Type something here..."
              value={inputValue}
              onChangeText={(text) => {
                setInputValue(text);
                validateInput(text);
              }}
              error={inputError}
              hint="This input validates minimum length"
            />
            <CustomSwitch
              label="Demo Switch"
              checked={switchValue}
              onCheckedChange={setSwitchValue}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: SPACING.md,
              }}
            >
              <Text>Switch State:</Text>
              <StatusBadge status={switchValue ? "active" : "cancelled"} />
            </View>
          </View>
        </Card>

        {/* Advanced Form Components Section */}
        <Card variant="elevated">
          <ContentBlock
            title="Advanced Form Components"
            paragraph="Select dropdowns, radio buttons, checkboxes, and text areas"
          />
          <View style={{ gap: SPACING.lg, marginTop: SPACING.md }}>
            <CustomSelect
              label="Select Option"
              placeholder="Choose an option..."
              value={selectedOption}
              onValueChange={setSelectedOption}
              options={[
                { label: "Option 1", value: "option1" },
                { label: "Option 2", value: "option2" },
                { label: "Option 3", value: "option3" },
              ]}
            />
            <CustomRadio
              label="Radio Group"
              value={radioValue}
              onValueChange={setRadioValue}
              options={[
                { label: "Option 1", value: "option1" },
                { label: "Option 2", value: "option2" },
                { label: "Option 3", value: "option3" },
              ]}
            />
            <CustomCheckbox
              label="Checkbox Group"
              values={checkboxValues}
              onValuesChange={setCheckboxValues}
              options={[
                { label: "Checkbox 1", value: "checkbox1" },
                { label: "Checkbox 2", value: "checkbox2" },
                { label: "Checkbox 3", value: "checkbox3" },
              ]}
            />
            <CustomTextArea
              label="Text Area"
              placeholder="Enter longer text here..."
              value={textAreaValue}
              onChangeText={setTextAreaValue}
              rows={3}
              hint="This supports multiple lines of text"
            />
          </View>
        </Card>

        {/* Date and Search Components Section */}
        <Card variant="elevated">
          <ContentBlock
            title="Date & Search Components"
            paragraph="Date pickers and search inputs with autocomplete"
          />
          <View style={{ gap: SPACING.lg, marginTop: SPACING.md }}>
            <CustomDatePicker
              label="Select Date & Time"
              value={selectedDate}
              onChange={setSelectedDate}
              mode="datetime"
              hint="Choose a date and time"
            />
            <CustomSearch
              label="Search with Suggestions"
              placeholder="Type to search..."
              value={searchText}
              onChangeText={setSearchText}
              options={[
                { id: "1", label: "Apple", value: "apple" },
                { id: "2", label: "Banana", value: "banana" },
                { id: "3", label: "Cherry", value: "cherry" },
                { id: "4", label: "Date", value: "date" },
                { id: "5", label: "Elderberry", value: "elderberry" },
              ]}
              hint="Try typing 'a' to see suggestions"
            />
          </View>
        </Card>

        {/* Tabs Section */}
        <Card variant="elevated">
          <ContentBlock
            title="Tabs"
            paragraph="Tabbed navigation with different variants"
          />
          <View style={{ gap: SPACING.md, marginTop: SPACING.md }}>
            <CustomTabs
              tabs={[
                { key: "tab1", label: "Tab 1" },
                { key: "tab2", label: "Tab 2", badge: 3 },
                { key: "tab3", label: "Tab 3" },
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              variant="underline"
            />
            <ContentBlock
              title={`Active Tab: ${activeTab}`}
              paragraph="Click different tabs to see the active state change"
            />
          </View>
        </Card>

        {/* Accordion Section */}
        <Card variant="elevated">
          <ContentBlock
            title="Accordion"
            paragraph="Collapsible content sections"
          />
          <View style={{ gap: SPACING.md, marginTop: SPACING.md }}>
            <CustomAccordion
              items={[
                {
                  id: "item1",
                  title: "Accordion Item 1",
                  content: (
                    <ContentBlock
                      title="Content for Item 1"
                      paragraph="This is the expanded content for the first accordion item. It can contain any components or text."
                    />
                  ),
                },
                {
                  id: "item2",
                  title: "Accordion Item 2",
                  content: (
                    <View style={{ gap: SPACING.sm }}>
                      <ContentBlock
                        title="Content for Item 2"
                        paragraph="This accordion item has multiple elements in its content."
                      />
                      <CustomButton variant="outline" size="sm">
                        Action Button
                      </CustomButton>
                    </View>
                  ),
                },
                {
                  id: "item3",
                  title: "Accordion Item 3",
                  content: (
                    <ContentBlock
                      title="Content for Item 3"
                      paragraph="This is the last accordion item in the list."
                    />
                  ),
                },
              ]}
              multiple={true}
            />
          </View>
        </Card>

        {/* Status Badges Section */}
        <Card variant="elevated">
          <ContentBlock
            title="Status Badges"
            paragraph="Visual indicators for different states"
          />
          <View style={{ gap: SPACING.md, marginTop: SPACING.md }}>
            <View
              style={{
                flexDirection: "row",
                gap: SPACING.sm,
                flexWrap: "wrap",
                alignItems: "flex-start",
              }}
            >
              <StatusBadge status="active" />
              <StatusBadge status="pending" />
              <StatusBadge status="completed" />
              <StatusBadge status="error" />
            </View>
          </View>
        </Card>

        {/* Avatars Section */}
        <Card variant="elevated">
          <ContentBlock
            title="Avatars"
            paragraph="User profile images with different sizes"
          />
          <View style={{ gap: SPACING.md, marginTop: SPACING.md }}>
            <View
              style={{
                flexDirection: "row",
                gap: SPACING.md,
                alignItems: "center",
              }}
            >
              <Avatar name="John Doe" size="sm" />
              <Avatar name="Jane Smith" size="md" />
              <Avatar name="Bob Johnson" size="lg" />
            </View>
          </View>
        </Card>

        {/* Cards Section */}
        <View style={{ gap: SPACING.md }}>
          <ContentBlock
            title="Cards"
            paragraph="Container components with different styling variants"
          />
          <Card variant="elevated">
            <ContentBlock
              title="Elevated Card"
              paragraph="This card has elevation and shadow for depth."
            />
          </Card>
        </View>

        {/* Modal Demo */}
        <Card variant="elevated">
          <ContentBlock
            title="Modal"
            paragraph="Dialog components for user interactions"
          />
          <View style={{ gap: SPACING.md, marginTop: SPACING.md }}>
            <CustomButton variant="primary" onPress={() => setModalOpen(true)}>
              Open Modal
            </CustomButton>
          </View>
        </Card>

        {/* Footer */}
        <Card variant="outlined">
          <ContentBlock
            title="Design System Complete"
            paragraph="All components are now using the unified design system with consistent styling across iOS, Android, and web platforms."
          />
        </Card>
      </View>

      {/* Modal */}
      <CustomModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Modal Demo"
        size="md"
      >
        <View style={{ gap: SPACING.md }}>
          <ContentBlock
            title="Modal Dialog"
            paragraph="This is a modal dialog with custom content. You can put any components inside modals!"
          />
          <View
            style={{
              flexDirection: "row",
              gap: SPACING.sm,
              justifyContent: "flex-end",
            }}
          >
            <CustomButton variant="outline" onPress={() => setModalOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton variant="primary" onPress={() => setModalOpen(false)}>
              Confirm
            </CustomButton>
          </View>
        </View>
      </CustomModal>
    </MainLayout>
  );
}
