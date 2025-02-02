import React, { useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { formStyles } from "./style";
import dayjs from "dayjs";
// Add required dayjs plugins
import localizedFormat from "dayjs/plugin/localizedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Calendar, Check, X } from "../icons";
import { Horizontal, Vertical } from "../layout/Stack";
import { Button } from "../display/button";
import { Modal } from "../display/modal";
import { DirectusIcon } from "../display/directus-icon";
import { useTranslation } from "react-i18next";
import { InterfaceProps } from ".";
dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);

type DateTimeProps = InterfaceProps<{
  value?: string;
  onValueChange?: (datetime: string) => void;
}>;

export const DateTime = ({
  label,
  error,
  helper,
  value,
  onValueChange,
  placeholder = "Select date and time",
  disabled = false,
  required,
}: DateTimeProps) => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState(() => {
    if (value && dayjs(value).isValid()) {
      return {
        hours: dayjs(value).format("HH"),
        minutes: dayjs(value).format("mm"),
      };
    }
    return { hours: "12", minutes: "00" };
  });
  const { styles, theme } = useStyles(dateTimeStyles);
  const { styles: formStyle } = useStyles(formStyles);
  const [draftValue, setDraftValue] = useState<string | undefined>(value);

  // Get days in current month
  const daysInMonth = () => {
    const firstDayOfMonth = currentMonth.startOf("month");
    // Adjust for Monday start (Sunday is 0, we want Monday to be 0)
    const daysBeforeMonth = (firstDayOfMonth.day() + 6) % 7;

    // Create array of empty slots for days before the 1st
    const emptyDays = Array(daysBeforeMonth).fill(null);

    // Create array of actual days in the month
    const days = Array.from({ length: currentMonth.daysInMonth() }, (_, i) =>
      currentMonth.date(i + 1)
    );

    return [...emptyDays, ...days];
  };

  const previousMonth = () =>
    setCurrentMonth((curr) => curr.subtract(1, "month"));
  const nextMonth = () => setCurrentMonth((curr) => curr.add(1, "month"));

  const renderCalendarHeader = () => (
    <View style={styles.calendarHeader}>
      <Pressable onPress={previousMonth}>
        <DirectusIcon name="chevron_left" />
      </Pressable>
      <Text style={styles.monthText}>{currentMonth.format("MMMM YYYY")}</Text>
      <Pressable onPress={nextMonth}>
        <DirectusIcon name="chevron_right" />
      </Pressable>
    </View>
  );

  const renderWeekDays = () => (
    <View style={styles.weekDaysContainer}>
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
        <Text key={day} style={styles.weekDayText}>
          {day}
        </Text>
      ))}
    </View>
  );

  const handleDateSelect = (date: dayjs.Dayjs) => {
    const newDate = date
      .hour(parseInt(selectedTime.hours))
      .minute(parseInt(selectedTime.minutes));
    setDraftValue(newDate.format("YYYY-MM-DD HH:mm:ss"));
  };

  const handleTimeChange = (type: "hours" | "minutes", value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, "");

    if (type === "hours") {
      const newHours =
        numericValue === ""
          ? ""
          : parseInt(numericValue) > 23
          ? "23"
          : numericValue;
      setSelectedTime((prev) => {
        const newTime = { ...prev, hours: newHours };
        // Update draft instead of sending directly
        if (draftValue && newHours.length === 2) {
          const newDate = dayjs(draftValue)
            .hour(parseInt(newHours))
            .minute(parseInt(newTime.minutes));
          setDraftValue(newDate.format("YYYY-MM-DD HH:mm:ss"));
        }
        return newTime;
      });
    } else {
      const newMinutes =
        numericValue === ""
          ? ""
          : parseInt(numericValue) > 59
          ? "59"
          : numericValue;
      setSelectedTime((prev) => {
        const newTime = { ...prev, minutes: newMinutes };
        // Update draft instead of sending directly
        if (draftValue && newMinutes.length === 2) {
          const newDate = dayjs(draftValue)
            .hour(parseInt(newTime.hours))
            .minute(parseInt(newMinutes));
          setDraftValue(newDate.format("YYYY-MM-DD HH:mm:ss"));
        }
        return newTime;
      });
    }
  };

  const handleConfirm = () => {
    onValueChange?.(draftValue!);
    setModalVisible(false);
  };

  return (
    <View style={formStyle.formControl}>
      {label && (
        <Text
          style={[
            formStyle.label,
            disabled && { color: theme.colors.textTertiary },
          ]}
        >
          {label}
          {required && "*"}
        </Text>
      )}

      <Pressable
        style={[
          styles.selectButton,
          formStyle.inputContainer,
          error && formStyle.inputError,
          disabled && formStyle.inputDisabled,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text
          style={[
            styles.selectText,
            !value && styles.placeholder,
            disabled && { color: theme.colors.textTertiary },
          ]}
        >
          {value && dayjs(value).isValid()
            ? dayjs(value).format("lll")
            : placeholder}
        </Text>
        <View style={{ marginLeft: "auto" }}>
          <Calendar
            size={20}
            color={
              disabled ? theme.colors.textTertiary : theme.colors.textSecondary
            }
          />
        </View>
      </Pressable>

      {(error || helper) && (
        <Text style={[formStyle.helperText, error && formStyle.errorText]}>
          {error || helper}
        </Text>
      )}

      <Modal open={modalVisible} onClose={() => setModalVisible(false)}>
        <Modal.Content contentStyle={{ padding: theme.spacing.sm }}>
          {renderCalendarHeader()}
          {renderWeekDays()}
          <Vertical style={{ flexShrink: 1, justifyContent: "flex-start" }}>
            <View style={styles.daysGrid}>
              {daysInMonth().map((date, index) => (
                <Pressable
                  key={date?.toString() || `empty-${index}`}
                  style={[
                    styles.dayButton,
                    draftValue &&
                    date &&
                    dayjs(draftValue).format("YYYY-MM-DD") ===
                      date.format("YYYY-MM-DD")
                      ? styles.selectedDay
                      : null,
                  ]}
                  onPress={() => date && handleDateSelect(date)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      draftValue &&
                      date &&
                      dayjs(draftValue).format("YYYY-MM-DD") ===
                        date.format("YYYY-MM-DD")
                        ? styles.selectedDayText
                        : null,
                    ]}
                  >
                    {date?.format("D") || ""}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.timeContainer}>
              <TextInput
                style={styles.timeInput}
                value={selectedTime.hours}
                onChangeText={(value) => handleTimeChange("hours", value)}
                keyboardType="numeric"
                maxLength={2}
                editable={true}
                selectTextOnFocus={true}
                onBlur={(e) => {
                  if (!e.nativeEvent.text) {
                    handleTimeChange("hours", "12");
                  }
                }}
              />
              <Text style={styles.timeText}>:</Text>
              <TextInput
                style={styles.timeInput}
                value={selectedTime.minutes}
                onChangeText={(value) => handleTimeChange("minutes", value)}
                keyboardType="numeric"
                maxLength={2}
                editable={true}
                selectTextOnFocus={true}
                onBlur={(e) => {
                  if (!e.nativeEvent.text) {
                    handleTimeChange("minutes", "00");
                  }
                }}
              />
            </View>

            <Button
              variant="ghost"
              style={styles.setNowButton}
              onPress={() => handleDateSelect(dayjs())}
            >
              {t("components.datetime.set_to_now")}
            </Button>

            <Horizontal style={{ justifyContent: "flex-end" }}>
              <Button
                rounded
                variant="soft"
                onPress={() => setModalVisible(false)}
              >
                <X />
              </Button>
              <Button rounded onPress={handleConfirm} disabled={!draftValue}>
                <Check />
              </Button>
            </Horizontal>
          </Vertical>
        </Modal.Content>
      </Modal>
    </View>
  );
};

const dateTimeStyles = createStyleSheet((theme) => ({
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderWidth: theme.borderWidth.md,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    height: 44,
  },
  selectText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  placeholder: {
    color: theme.colors.textTertiary,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  navigationButton: {
    ...theme.typography.body,
    color: theme.colors.primary,
    padding: theme.spacing.md,
  },
  monthText: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
  },
  weekDaysContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  weekDayText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    width: 40,
    textAlign: "center",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    width: "100%",
  },
  dayButton: {
    width: `${100 / 7}%`,
    height: `100%`,

    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.borderRadius.full,
  },
  selectedDay: {
    backgroundColor: theme.colors.primary,
  },
  dayText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  selectedDayText: {
    color: theme.colors.background,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  timeInput: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
    borderWidth: theme.borderWidth.md,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    width: 70,
    textAlign: "center",
  },
  timeText: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
  },
  setNowButton: {
    alignItems: "center",
    padding: theme.spacing.sm,
  },
  setNowText: {
    ...theme.typography.body,
    color: theme.colors.primary,
  },
}));
