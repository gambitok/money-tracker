import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button, HelperText, List, SegmentedButtons, Text, TextInput } from 'react-native-paper';

import type { TransactionType } from '@/types/domain';
import { useCategories, useCreateCategory } from '@/hooks/useCategories';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(40),
});

type FormValues = z.infer<typeof schema>;

export function CategoriesScreen() {
  const [type, setType] = useState<TransactionType>('expense');
  const { data, isLoading, error } = useCategories(type);
  const createCategory = useCreateCategory();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });

  const onSubmit = useMemo(
    () =>
      handleSubmit(async ({ name }) => {
        await createCategory.mutateAsync({ name: name.trim(), type });
        reset({ name: '' });
      }),
    [createCategory, handleSubmit, reset, type]
  );

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Categories</Text>

      <SegmentedButtons
        value={type}
        onValueChange={(v) => setType(v as TransactionType)}
        buttons={[
          { value: 'expense', label: 'Expense' },
          { value: 'income', label: 'Income' },
        ]}
      />

      <View style={styles.formRow}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value, onBlur } }) => (
            <TextInput
              style={styles.nameInput}
              label="New category"
              mode="outlined"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={!!errors.name}
            />
          )}
        />
        <Button
          mode="contained"
          onPress={onSubmit}
          loading={isSubmitting || createCategory.isPending}
          disabled={isSubmitting || createCategory.isPending}>
          Add
        </Button>
      </View>
      <HelperText type="error" visible={!!errors.name}>
        {errors.name?.message}
      </HelperText>
      <HelperText type="error" visible={!!createCategory.error}>
        {createCategory.error instanceof Error ? createCategory.error.message : 'Failed to create'}
      </HelperText>

      {isLoading ? <Text>Loading…</Text> : null}
      {error ? <Text>Failed to load categories.</Text> : null}

      <List.Section>
        {(data ?? []).map((c) => (
          <List.Item key={c.id} title={c.name} left={(props) => <List.Icon {...props} icon="tag" />} />
        ))}
      </List.Section>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  formRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nameInput: { flex: 1 },
});

