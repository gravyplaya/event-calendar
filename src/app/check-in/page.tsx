'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, PartyPopper, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { checkIn } from '@/app/subscriber-actions';
import type { CheckInInput } from '@/lib/validations';

function CheckInForm() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || '';
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    points?: number;
    isNew?: boolean;
    needsSignup?: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckInInput>({
    defaultValues: {
      code,
      smsOptIn: false,
    },
  });

  const showNameFields = watch('email') || watch('phone');

  const onSubmit = async (data: CheckInInput) => {
    setIsLoading(true);
    try {
      const result = await checkIn(data);
      setResult(result);
      if (result.success) {
        toast.success(result.message || 'Checked in successfully!');
      } else if (result.error !== 'new_member_needs_info') {
        toast.error(result.message || result.error || 'Something went wrong.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (result?.success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-strong mx-auto max-w-md rounded-3xl p-8 text-center md:p-12"
      >
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
          {result.isNew ? (
            <PartyPopper className="h-10 w-10 text-green-500" />
          ) : (
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          )}
        </div>
        <h1 className="mb-2 text-2xl font-bold">
          {result.isNew ? 'Welcome to The Nest!' : "You're checked in!"}
        </h1>
        <p className="text-muted-foreground mb-4 text-lg">{result.message}</p>
        {result.points !== undefined && (
          <div className="mb-4 rounded-xl border border-white/5 bg-white/5 p-4">
            <p className="text-muted-foreground text-sm">Your points balance</p>
            <p className="text-primary text-3xl font-bold">
              {result.points} pts
            </p>
          </div>
        )}
        <a
          href="/calendar"
          className="text-muted-foreground hover:text-foreground inline-block text-sm transition-colors"
        >
          View upcoming events →
        </a>
      </motion.div>
    );
  }

  // Form state
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-strong mx-auto max-w-md rounded-3xl p-8 md:p-12"
    >
      <div className="mb-8 text-center">
        <div className="bg-primary/10 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full">
          <QrCode className="text-primary h-8 w-8" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Event Check-In</h1>
        <p className="text-muted-foreground">
          {result?.needsSignup
            ? "You're not a member yet! Enter your details to sign up and earn points."
            : 'Enter your email or phone to check in and earn loyalty points.'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register('code')} />

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            {...register('email')}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-destructive text-sm">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium">
            Phone Number
          </label>
          <Input
            id="phone"
            type="tel"
            placeholder="(231) 555-0123"
            {...register('phone')}
            disabled={isLoading}
          />
          {errors.phone && (
            <p className="text-destructive text-sm">{errors.phone.message}</p>
          )}
        </div>

        {result?.needsSignup && showNameFields && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className="space-y-4 overflow-hidden"
          >
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium">
                First Name
              </label>
              <Input
                id="firstName"
                placeholder="John"
                {...register('firstName')}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium">
                Last Name
              </label>
              <Input
                id="lastName"
                placeholder="Doe"
                {...register('lastName')}
                disabled={isLoading}
              />
            </div>
          </motion.div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking in...
            </>
          ) : (
            'Check In & Earn Points'
          )}
        </Button>
      </form>
    </motion.div>
  );
}

export default function CheckInPage() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        }
      >
        <CheckInForm />
      </Suspense>
    </div>
  );
}
