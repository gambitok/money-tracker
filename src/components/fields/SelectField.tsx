import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Portal, Text, TextInput, useTheme } from 'react-native-paper';

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  leadingIcon?: string;
  leadingColor?: string;
};

export function SelectField<T extends string>(props: {
  label: string;
  value: T | null;
  options: Array<SelectOption<T>>;
  onChange: (value: T | null) => void;
  placeholder?: string;
  allowNull?: boolean;
  nullLabel?: string;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const display = useMemo(() => {
    if (props.value == null) return props.placeholder ?? '';
    return props.options.find((o) => o.value === props.value)?.label ?? props.value;
  }, [props.options, props.placeholder, props.value]);

  const selected = props.value ? props.options.find((o) => o.value === props.value) : undefined;

  return (
    <>
      <View>
        <TextInput
          label={props.label}
          mode="outlined"
          value={display}
          editable={false}
          right={<TextInput.Icon icon={open ? 'chevron-up' : 'chevron-down'} onPress={() => setOpen(true)} />}
          left={
            selected?.leadingIcon ? (
              <TextInput.Icon
                icon={selected.leadingIcon}
                color={selected.leadingColor ? selected.leadingColor : undefined}
                onPress={() => setOpen(true)}
              />
            ) : undefined
          }
          onPressIn={() => setOpen(true)}
        />
      </View>

      <Portal>
        {open ? (
          <View style={styles.overlay}>
            <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
            <Card style={styles.sheet}>
              <Card.Content style={styles.sheetContent}>
                <View style={styles.sheetHeader}>
                  <Text variant="titleMedium">{props.label}</Text>
                  <Pressable onPress={() => setOpen(false)}>
                    <Text style={{ color: theme.colors.primary }}>Close</Text>
                  </Pressable>
                </View>

                <ScrollView style={styles.optionsScroll} contentContainerStyle={styles.optionsContent}>
                  {props.allowNull ? (
                    <Pressable
                      style={styles.optionRow}
                      onPress={() => {
                        props.onChange(null);
                        setOpen(false);
                      }}>
                      <Text variant="bodyLarge">{props.nullLabel ?? 'None'}</Text>
                    </Pressable>
                  ) : null}

                  {props.options.map((o) => {
                    const isSelected = props.value === o.value;
                    return (
                      <Pressable
                        key={o.value}
                        style={[styles.optionRow, isSelected && { backgroundColor: theme.colors.surfaceVariant }]}
                        onPress={() => {
                          props.onChange(o.value);
                          setOpen(false);
                        }}>
                        <View style={styles.optionText}>
                          <Text
                            variant="bodyLarge"
                            style={o.leadingColor ? { color: o.leadingColor } : undefined}>
                            {o.label}
                          </Text>
                          {isSelected ? <Text style={{ color: theme.colors.primary }}>Selected</Text> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </Card.Content>
            </Card>
          </View>
        ) : null}
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: '70%',
  },
  sheetContent: {
    gap: 14,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionsScroll: {
    width: '100%',
  },
  optionsContent: {
    gap: 8,
  },
  optionRow: {
    width: '100%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  optionText: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
});
