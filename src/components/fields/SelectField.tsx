import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Divider,
  Icon,
  List,
  Modal,
  Portal,
  Searchbar,
  Surface,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';

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
  const [query, setQuery] = useState('');

  const display = useMemo(() => {
    if (props.value == null) return props.placeholder ?? '';
    return props.options.find((option) => option.value === props.value)?.label ?? props.value;
  }, [props.options, props.placeholder, props.value]);

  const selected = props.value ? props.options.find((option) => option.value === props.value) : undefined;

  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return props.options;
    return props.options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery, props.options]);

  const optionsToRender = props.allowNull
    ? [{ value: null, label: props.nullLabel ?? 'None' } as const, ...filteredOptions.map((option) => ({ ...option }))]
    : filteredOptions.map((option) => ({ ...option }));

  const openPicker = () => {
    setQuery('');
    setOpen(true);
  };

  const closePicker = () => {
    setQuery('');
    setOpen(false);
  };

  return (
    <>
      <TouchableRipple borderless={false} onPress={openPicker} style={styles.trigger}>
        <View pointerEvents="none">
          <TextInput
            label={props.label}
            mode="outlined"
            value={display}
            editable={false}
            right={<TextInput.Icon icon={open ? 'chevron-up' : 'chevron-down'} />}
            left={
              selected?.leadingIcon ? (
                <TextInput.Icon icon={selected.leadingIcon} color={selected.leadingColor ? selected.leadingColor : undefined} />
              ) : undefined
            }
          />
        </View>
      </TouchableRipple>

      <Portal>
        <Modal visible={open} onDismiss={closePicker} contentContainerStyle={styles.modalContainer}>
          <Surface style={[styles.sheet, { backgroundColor: theme.colors.elevation.level2 }]}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text variant="titleLarge">{props.label}</Text>
                <Text style={styles.headerHint}>Choose one option</Text>
              </View>
              <TouchableRipple borderless onPress={closePicker} style={styles.closeButton}>
                <View>
                  <Icon source="close" size={20} color={theme.colors.onSurface} />
                </View>
              </TouchableRipple>
            </View>

            {props.options.length >= 6 ? (
              <Searchbar
                placeholder="Search"
                value={query}
                onChangeText={setQuery}
                style={styles.searchbar}
                inputStyle={styles.searchInput}
              />
            ) : null}

            <View style={styles.listContainer}>
              {optionsToRender.length ? (
                optionsToRender.map((option, index) => {
                  const optionValue = option.value;
                  const isSelected = props.value === optionValue;
                  const leadingColor = 'leadingColor' in option ? option.leadingColor : undefined;
                  const leadingIcon = 'leadingIcon' in option ? option.leadingIcon : undefined;

                  return (
                    <React.Fragment key={optionValue ?? 'null-option'}>
                      <List.Item
                        title={option.label}
                        titleStyle={styles.itemTitle}
                        style={[styles.item, isSelected && { backgroundColor: theme.colors.secondaryContainer }]}
                        onPress={() => {
                          props.onChange(optionValue);
                          closePicker();
                        }}
                        left={(iconProps) =>
                          leadingIcon ? (
                            <List.Icon {...iconProps} icon={leadingIcon} color={leadingColor || iconProps.color} />
                          ) : (
                            <List.Icon {...iconProps} icon={optionValue == null ? 'circle-off-outline' : 'circle-medium'} />
                          )
                        }
                        right={(iconProps) =>
                          isSelected ? <List.Icon {...iconProps} icon="check-circle" color={theme.colors.primary} /> : null
                        }
                      />
                      {index < optionsToRender.length - 1 ? <Divider /> : null}
                    </React.Fragment>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.headerHint}>No matching options</Text>
                </View>
              )}
            </View>
          </Surface>
        </Modal>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderRadius: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  sheet: {
    maxHeight: '82%',
    borderRadius: 28,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  headerHint: {
    opacity: 0.6,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchbar: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 0,
  },
  searchInput: {
    minHeight: 0,
  },
  listContainer: {
    paddingBottom: 8,
  },
  item: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: 12,
    borderRadius: 18,
  },
  itemTitle: {
    fontSize: 17,
  },
  emptyState: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
});
