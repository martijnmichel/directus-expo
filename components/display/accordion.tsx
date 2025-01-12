import React, { createContext, useContext, useState } from "react";
import { View, ViewProps } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./collapsible";

interface AccordionContextType {
  value: string | null;
  onChange: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextType | null>(null);

interface AccordionProps extends ViewProps {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
}

interface CollapsibleTriggerProps {
  onPress?: () => void;
  children: React.ReactNode;
  color?: string;
  prepend?: React.ReactNode;
}

export const Accordion = ({
  children,
  defaultValue,
  value: controlledValue,
  onChange: controlledOnChange,
  style,
  ...props
}: AccordionProps) => {
  const [uncontrolledValue, setUncontrolledValue] = useState<string | null>(
    defaultValue ?? null
  );

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const onChange = (newValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(newValue);
    }
    controlledOnChange?.(newValue);
  };

  return (
    <AccordionContext.Provider value={{ value, onChange }}>
      <View style={style} {...props}>
        {children}
      </View>
    </AccordionContext.Provider>
  );
};

interface AccordionItemProps extends ViewProps {
  children: React.ReactNode;
  value: string;
  variant?: "default" | "group-detail";
  color?: string;
  prepend?: React.ReactNode;
}

export const AccordionItem = ({
  children,
  value,
  variant,
  color,
  prepend,
  ...props
}: AccordionItemProps) => {
  const context = useContext(AccordionContext);
  if (!context) throw new Error("AccordionItem must be used within Accordion");

  const isOpen = context.value === value;

  return (
    <Collapsible defaultOpen={isOpen} variant={variant} {...props}>
      {React.Children.map(children, (child) => {
        if (
          React.isValidElement<CollapsibleTriggerProps>(child) &&
          child.type === CollapsibleTrigger
        ) {
          return React.cloneElement(child, {
            onPress: () => context.onChange(value),
            color,
            prepend,
          });
        }
        return child;
      })}
    </Collapsible>
  );
};

export {
  CollapsibleTrigger as AccordionTrigger,
  CollapsibleContent as AccordionContent,
};
