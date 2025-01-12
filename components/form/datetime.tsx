import React, { useState } from "react";
import { View, Text, Pressable, Modal, TextInput } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { formStyles } from "./style";
import dayjs from "dayjs";
// Add required dayjs plugins
import localizedFormat from "dayjs/plugin/localizedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Calendar } from "../icons";
dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);

interface DateTimeProps {
  label?: string;
  error?: string;
  helper?: string;
  value?: string;
  onValueChange?: (datetime: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const DateTime = ({
  label,
  error,
  helper,
  value,
  onValueChange,
  placeholder = "Select date and time",
  disabled = false,
}: DateTimeProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState(() => {
    const initialHours = value ? dayjs(value).format('HH') : "12";
    const initialMinutes = value ? dayjs(value).format('mm') : "00";
    console.log('Initial time:', initialHours, initialMinutes);
    return { hours: initialHours, minutes: initialMinutes };
  });
  const { styles, theme } = useStyles(dateTimeStyles);
  const { styles: formStyle } = useStyles(formStyles);

  // Get days in current month
  const daysInMonth = Array.from({ length: currentMonth.daysInMonth() }, (_, i) => 
    currentMonth.date(i + 1)
  );

  const previousMonth = () => setCurrentMonth(curr => curr.subtract(1, 'month'));
  const nextMonth = () => setCurrentMonth(curr => curr.add(1, 'month'));

  const renderCalendarHeader = () => (
    <View style={styles.calendarHeader}>
      <Pressable onPress={previousMonth}>
        <Text style={styles.navigationButton}>{"<"}</Text>
      </Pressable>
      <Text style={styles.monthText}>
        {currentMonth.format("MMMM YYYY")}
      </Text>
      <Pressable onPress={nextMonth}>
        <Text style={styles.navigationButton}>{">"}</Text>
      </Pressable>
    </View>
  );

  const renderWeekDays = () => (
    <View style={styles.weekDaysContainer}>
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
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
    onValueChange?.(newDate.format('YYYY-MM-DD HH:mm:ss'));
  };

  const handleTimeChange = (type: 'hours' | 'minutes', value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (type === 'hours') {
      const newHours = numericValue === '' ? '' : 
                      parseInt(numericValue) > 23 ? '23' : numericValue;
      setSelectedTime(prev => {
        const newTime = { ...prev, hours: newHours };
        // If we have a valid date and time, trigger the change
        if (value && newHours.length === 2) {
          const newDate = dayjs(value || new Date())
            .hour(parseInt(newHours))
            .minute(parseInt(newTime.minutes));
          onValueChange?.(newDate.format('YYYY-MM-DD HH:mm:ss'));
        }
        return newTime;
      });
    } else {
      const newMinutes = numericValue === '' ? '' : 
                        parseInt(numericValue) > 59 ? '59' : numericValue;
      setSelectedTime(prev => {
        const newTime = { ...prev, minutes: newMinutes };
        // If we have a valid date and time, trigger the change
        if (value && newMinutes.length === 2) {
          const newDate = dayjs(value || new Date())
            .hour(parseInt(newTime.hours))
            .minute(parseInt(newMinutes));
          onValueChange?.(newDate.format('YYYY-MM-DD HH:mm:ss'));
        }
        return newTime;
      });
    }
  };

  return (
    <View style={formStyle.formControl}>
      {label && (
        <Text style={[formStyle.label, disabled && { color: theme.colors.textTertiary }]}>
          {label}
          {label.endsWith("*") ? "" : " *"}
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
          {value ? dayjs(value).format("lll") : placeholder}
        </Text>
        <View style={{ marginLeft: "auto" }}>
          <Calendar size={20} color={disabled ? theme.colors.textTertiary : theme.colors.textSecondary} />
        </View>
      </Pressable>

      {(error || helper) && (
        <Text style={[formStyle.helperText, error && formStyle.errorText]}>
          {error || helper}
        </Text>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setModalVisible(false)}
        >
          <Pressable 
            style={styles.modalContent} 
            onPress={(e) => e.stopPropagation()}
          >
            {renderCalendarHeader()}
            {renderWeekDays()}
            <View style={styles.daysGrid}>
              {daysInMonth.map((date) => (
                <Pressable
                  key={date.toString()}
                  style={[
                    styles.dayButton,
                    value && dayjs(value).format("YYYY-MM-DD") === date.format("YYYY-MM-DD")
                      ? styles.selectedDay
                      : null,
                  ]}
                  onPress={() => handleDateSelect(date)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      value && dayjs(value).format("YYYY-MM-DD") === date.format("YYYY-MM-DD")
                        ? styles.selectedDayText
                        : null,
                    ]}
                  >
                    {date.format("D")}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.timeContainer}>
              <TextInput
                style={styles.timeInput}
                value={selectedTime.hours}
                onChangeText={(value) => handleTimeChange('hours', value)}
                keyboardType="numeric"
                maxLength={2}
                editable={true}
                selectTextOnFocus={true}
              />
              <Text style={styles.timeText}>:</Text>
              <TextInput
                style={styles.timeInput}
                value={selectedTime.minutes}
                onChangeText={(value) => handleTimeChange('minutes', value)}
                keyboardType="numeric"
                maxLength={2}
                editable={true}
                selectTextOnFocus={true}
              />
            </View>
            <Pressable style={styles.setNowButton} onPress={() => handleDateSelect(dayjs())}>
              <Text style={styles.setNowText}>Set to Now</Text>
            </Pressable>
          </Pressable>
        </Pressable>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: "90%",
    maxWidth: 400,
    marginHorizontal: "auto",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
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
    marginBottom: theme.spacing.md,
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
    justifyContent: "space-around",
  },
  dayButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    margin: 2,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
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
    width: 45,
    textAlign: 'center',
  },
  timeText: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
  },
  setNowButton: {
    alignItems: "center",
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  setNowText: {
    ...theme.typography.body,
    color: theme.colors.primary,
  },
})); 