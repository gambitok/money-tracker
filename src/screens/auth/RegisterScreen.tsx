import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';

import { supabase } from '@/services/supabase/client';

const schema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type FormValues = z.infer<typeof schema>;

export function RegisterScreen() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = useMemo(
    () =>
      handleSubmit(async ({ email, password }) => {
        setServerError(null);
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setServerError(error.message);
          return;
        }
        setSubmittedEmail(email);
      }),
    [handleSubmit]
  );

  if (submittedEmail) {
    return (
      <View style={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>
          Check your email
        </Text>
        <Text style={styles.subtitle}>
          We sent a confirmation link to <Text style={styles.email}>{submittedEmail}</Text>.
        </Text>
        <Text style={styles.subtitle}>After confirming, come back and sign in.</Text>

        <Link href="/(auth)/login" asChild>
          <Button mode="contained">Go to sign in</Button>
        </Link>

        <Button mode="outlined" onPress={() => setSubmittedEmail(null)}>
          Use a different email
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Create account
      </Text>
      <Text style={styles.subtitle}>Start tracking expenses and income.</Text>

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

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, value, onBlur } }) => (
          <TextInput
            label="Confirm password"
            mode="outlined"
            secureTextEntry
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={!!errors.confirmPassword}
            style={styles.input}
          />
        )}
      />
      <HelperText type="error" visible={!!errors.confirmPassword}>
        {errors.confirmPassword?.message}
      </HelperText>

      <HelperText type="error" visible={!!serverError}>
        {serverError}
      </HelperText>

      <Button mode="contained" onPress={onSubmit} loading={isSubmitting} disabled={isSubmitting}>
        Create account
      </Button>

      <View style={styles.footer}>
        <Text>Already have an account? </Text>
        <Link href="/(auth)/login">Sign in</Link>
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
  email: { fontWeight: '700' },
  input: { marginTop: 6 },
  footer: { marginTop: 16, flexDirection: 'row', justifyContent: 'center' },
});

