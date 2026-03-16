import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';

import { supabase } from '@/services/supabase/client';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export function LoginScreen() {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = useMemo(
    () =>
      handleSubmit(async ({ email, password }) => {
        setServerError(null);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setServerError(error.message);
      }),
    [handleSubmit]
  );

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Welcome back
      </Text>
      <Text style={styles.subtitle}>Sign in to track your money.</Text>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value, onBlur } }) => (
          <TextInput
            label="Email"
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={!!errors.email}
            style={styles.input}
          />
        )}
      />
      <HelperText type="error" visible={!!errors.email}>
        {errors.email?.message}
      </HelperText>

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value, onBlur } }) => (
          <TextInput
            label="Password"
            mode="outlined"
            secureTextEntry
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={!!errors.password}
            style={styles.input}
          />
        )}
      />
      <HelperText type="error" visible={!!errors.password}>
        {errors.password?.message}
      </HelperText>

      <HelperText type="error" visible={!!serverError}>
        {serverError}
      </HelperText>

      <Button mode="contained" onPress={onSubmit} loading={isSubmitting} disabled={isSubmitting}>
        Sign in
      </Button>

      <View style={styles.footer}>
        <Text>New here? </Text>
        <Link href="/(auth)/register">Create an account</Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 6,
  },
  title: { marginBottom: 2 },
  subtitle: { marginBottom: 16, opacity: 0.8 },
  input: { marginTop: 6 },
  footer: { marginTop: 16, flexDirection: 'row', justifyContent: 'center' },
});

