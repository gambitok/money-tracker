import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button, HelperText, List, SegmentedButtons, Text, TextInput } from 'react-native-paper';

import type { TransactionType } from '@/types/domain';
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/hooks/useCategories';
import { SelectField, type SelectOption } from '@/components/fields/SelectField';
import { CATEGORY_COLORS, CATEGORY_ICON_OPTIONS } from '@/utils/categoryPresets';
import { useFeedback } from '@/providers/FeedbackProvider';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(40),
  color: z.string().min(1, 'Select a color'),
  icon: z.string().min(1, 'Select an icon'),
});

type FormValues = z.infer<typeof schema>;

export function CategoriesScreen() {
  const [type, setType] = useState<TransactionType>('expense');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const { data, isLoading, error } = useCategories(type);
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const updateCategory = useUpdateCategory(editingCategoryId ?? '');
  const { showMessage } = useFeedback();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', color: CATEGORY_COLORS[0], icon: CATEGORY_ICON_OPTIONS[0] },
  });

  const colorOptions = useMemo<SelectOption<string>[]>(
    () => CATEGORY_COLORS.map((color) => ({ value: color, label: color, leadingColor: color })),
    []
  );
  const iconOptions = useMemo<SelectOption<string>[]>(
    () => CATEGORY_ICON_OPTIONS.map((icon) => ({ value: icon, label: icon, leadingIcon: icon })),
    []
  );

  const onSubmit = useMemo(
    () =>
      handleSubmit(async ({ name, color, icon }) => {
        if (editingCategoryId) {
          await updateCategory.mutateAsync({ name: name.trim(), type, color, icon });
          showMessage('Category updated');
        } else {
          await createCategory.mutateAsync({ name: name.trim(), type, color, icon });
          showMessage('Category created');
        }

        setEditingCategoryId(null);
        reset({ name: '', color: CATEGORY_COLORS[0], icon: CATEGORY_ICON_OPTIONS[0] });
      }),
    [createCategory, editingCategoryId, handleSubmit, reset, showMessage, type, updateCategory]
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">Categories</Text>

      <SegmentedButtons
        value={type}
        onValueChange={(v) => {
          setType(v as TransactionType);
          setEditingCategoryId(null);
          reset({ name: '', color: CATEGORY_COLORS[0], icon: CATEGORY_ICON_OPTIONS[0] });
        }}
        buttons={[
          { value: 'expense', label: 'Expense' },
          { value: 'income', label: 'Income' },
        ]}
      />

      <View style={styles.formCard}>
        <Text variant="titleMedium">{editingCategoryId ? 'Edit category' : 'New category'}</Text>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value, onBlur } }) => (
            <TextInput
              label="Category name"
              mode="outlined"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={!!errors.name}
            />
          )}
        />
        <HelperText type="error" visible={!!errors.name}>
          {errors.name?.message}
        </HelperText>

        <Controller
          control={control}
          name="color"
          render={({ field: { onChange, value } }) => (
            <SelectField label="Color" value={value} options={colorOptions} onChange={(next) => onChange(next ?? CATEGORY_COLORS[0])} />
          )}
        />

        <Controller
          control={control}
          name="icon"
          render={({ field: { onChange, value } }) => (
            <SelectField label="Icon" value={value} options={iconOptions} onChange={(next) => onChange(next ?? CATEGORY_ICON_OPTIONS[0])} />
          )}
        />

        <View style={styles.actionsRow}>
          {editingCategoryId ? (
            <Button
              mode="text"
              onPress={() => {
                setEditingCategoryId(null);
                reset({ name: '', color: CATEGORY_COLORS[0], icon: CATEGORY_ICON_OPTIONS[0] });
              }}>
              Cancel
            </Button>
          ) : null}
          <Button
            mode="contained"
            onPress={onSubmit}
            loading={isSubmitting || createCategory.isPending || updateCategory.isPending}
            disabled={isSubmitting || createCategory.isPending || updateCategory.isPending}>
            {editingCategoryId ? 'Save' : 'Add'}
          </Button>
        </View>
      </View>

      <HelperText type="error" visible={!!createCategory.error || !!updateCategory.error}>
        {(createCategory.error instanceof Error && createCategory.error.message) ||
          (updateCategory.error instanceof Error && updateCategory.error.message) ||
          ''}
      </HelperText>

      {isLoading ? <Text>Loading…</Text> : null}
      {error ? <Text>Failed to load categories.</Text> : null}

      <List.Section>
        {(data ?? []).map((category) => (
          <List.Item
            key={category.id}
            title={category.name}
            description={`${category.icon ?? 'tag-outline'} • ${category.color ?? 'no color'}`}
            left={(props) => <List.Icon {...props} icon={category.icon ?? 'tag-outline'} color={category.color ?? undefined} />}
            onPress={() => {
              setEditingCategoryId(category.id);
              reset({
                name: category.name,
                color: category.color ?? CATEGORY_COLORS[0],
                icon: category.icon ?? CATEGORY_ICON_OPTIONS[0],
              });
            }}
            right={() => (
              <Button
                mode="text"
                textColor="#D14B61"
                onPress={() =>
                  Alert.alert('Delete category', 'Transactions will become uncategorized.', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        await deleteCategory.mutateAsync(category.id);
                        if (editingCategoryId === category.id) {
                          setEditingCategoryId(null);
                          reset({ name: '', color: CATEGORY_COLORS[0], icon: CATEGORY_ICON_OPTIONS[0] });
                        }
                        showMessage('Category deleted');
                      },
                    },
                  ])
                }>
                Delete
              </Button>
            )}
          />
        ))}
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, gap: 12, paddingBottom: 32 },
  formCard: {
    gap: 10,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(127,127,127,0.08)',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
});
