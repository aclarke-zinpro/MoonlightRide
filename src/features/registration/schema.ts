import { z } from "zod";

export const REGISTERED_MESSAGE = "Thanks for registering! Check your email for your confirmation.";

const PHONE = /^[0-9+()\- ]{7,20}$/;

export const registerSchema = z.object({
  fullName: z
    .string({ error: "Enter your full name." })
    .trim()
    .min(2, { error: "Enter your full name." })
    .max(100, { error: "Enter your full name." }),
  email: z
    .string({ error: "Enter an email address like name@example.com." })
    .trim()
    .toLowerCase()
    .max(254, { error: "Enter an email address like name@example.com." })
    .pipe(z.email({ error: "Enter an email address like name@example.com." })),
  phone: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || PHONE.test(v), {
      error: "Enter a phone number with 7 to 20 digits, or leave it blank.",
    }),
  emergencyContactName: z
    .string({ error: "Enter the name of someone we can call in an emergency." })
    .trim()
    .min(2, { error: "Enter the name of someone we can call in an emergency." })
    .max(100, { error: "Enter the name of someone we can call in an emergency." }),
  emergencyContactPhone: z
    .string({ error: "Enter a phone number for your emergency contact." })
    .trim()
    .regex(PHONE, { error: "Enter a phone number for your emergency contact." }),
  partySize: z.coerce
    .number({ error: "Party size must be between 1 and 10 riders." })
    .int({ error: "Party size must be between 1 and 10 riders." })
    .min(1, { error: "Party size must be between 1 and 10 riders." })
    .max(10, { error: "Party size must be between 1 and 10 riders." }),
  acceptWaiver: z.literal("on", { error: "You need to accept the waiver to register." }),
});

export type RegisterInput = z.output<typeof registerSchema>;

export const waiverSchema = z.object({
  body: z
    .string()
    .trim()
    .min(50, { error: "The waiver must be at least 50 characters." })
    .max(20000, { error: "The waiver can be at most 20,000 characters." }),
});

export const registrationSettingsSchema = z.object({
  open: z
    .string()
    .nullish()
    .transform((v) => v === "on"),
  capacity: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v ? Number(v) : null))
    .pipe(
      z
        .number({ error: "Capacity must be a whole number of riders, or blank for no limit." })
        .int({ error: "Capacity must be a whole number of riders, or blank for no limit." })
        .min(1, { error: "Capacity must be at least 1, or blank for no limit." })
        .nullable(),
    ),
});
