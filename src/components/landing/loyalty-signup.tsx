'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail, Phone, Gift, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { subscribe } from '@/app/subscriber-actions';
import { subscribeSchema, type SubscribeInput } from '@/lib/validations';

export function LoyaltySignup({ embedded = false }: { embedded?: boolean } = {}) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SubscribeInput>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: {
      smsOptIn: false,
    },
  });

  const smsOptIn = watch('smsOptIn');

  const onSubmit = async (data: SubscribeInput) => {
    setIsLoading(true);
    try {
      const result = await subscribe(data);
      if (result.success) {
        toast.success(result.message || 'Welcome to The Nest Loyalty Program!');
        reset();
      } else if (result.error === 'already_subscribed') {
        toast.info(
          result.message ||
            'You are already subscribed to The Nest loyalty program.',
        );
      } else {
        toast.error(result.error || 'Something went wrong. Please try again.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="h-full"
    >
      <div className="glass-strong h-full rounded-3xl p-8 md:p-12">
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                <Sparkles className="text-primary h-4 w-4" />
                <span className="text-muted-foreground text-sm font-medium">
                  Loyalty Program
                </span>
              </div>
              <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
                Join The Nest Rewards
              </h2>
              <p className="text-muted-foreground text-lg">
                Earn points for every visit. Get food and drink discounts.
                It&apos;s free to join — and you&apos;ll get{' '}
                <span className="text-primary font-semibold">
                  100 bonus points
                </span>{' '}
                just for signing up.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="firstName"
                    className="text-foreground text-sm font-medium"
                  >
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    {...register('firstName')}
                    disabled={isLoading}
                    aria-invalid={!!errors.firstName}
                  />
                  {errors.firstName && (
                    <p className="text-destructive text-sm">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="lastName"
                    className="text-foreground text-sm font-medium"
                  >
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    {...register('lastName')}
                    disabled={isLoading}
                    aria-invalid={!!errors.lastName}
                  />
                  {errors.lastName && (
                    <p className="text-destructive text-sm">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-foreground text-sm font-medium"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    className="pl-10"
                    {...register('email')}
                    disabled={isLoading}
                    aria-invalid={!!errors.email}
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive text-sm">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="phone"
                  className="text-foreground text-sm font-medium"
                >
                  Phone Number{' '}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </label>
                <div className="relative">
                  <Phone className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(231) 555-0123"
                    className="pl-10"
                    {...register('phone')}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/5 p-4">
                <Checkbox
                  id="smsOptIn"
                  checked={smsOptIn}
                  onCheckedChange={(checked) => {
                    setValue('smsOptIn', checked === true);
                  }}
                  disabled={isLoading}
                />
                <div>
                  <label
                    htmlFor="smsOptIn"
                    className="cursor-pointer text-sm font-medium"
                  >
                    Send me text messages about events and specials
                  </label>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Message rates may apply. Unsubscribe anytime.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-4 w-4" />
                    Join The Nest Rewards
                  </>
                )}
              </Button>

              <p className="text-muted-foreground text-center text-xs">
                By signing up, you agree to receive emails from The Nest. You
                can unsubscribe at any time with one click.
              </p>
            </form>
      </div>
    </motion.div>
  );

  if (embedded) return inner;

  return (
    <section className="relative py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl">{inner}</div>
      </div>
    </section>
  );
}
