import { describe, expect, it } from "vitest";
import { registerSchema } from "@/features/registration/schema";
import { validRegistration } from "../helpers/forms";

const messagesFor = (values: Record<string, unknown>) => {
  const result = registerSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe("US3 registration schema", () => {
  it("accepts a valid registration and normalizes it", () => {
    const parsed = registerSchema.parse({ ...validRegistration, email: "  Rider@Example.COM " });
    expect(parsed.email).toBe("rider@example.com");
    expect(parsed.partySize).toBe(2);
    expect(parsed.phone).toBe("507-555-0100");
  });

  it("treats a blank phone as not given", () => {
    expect(registerSchema.parse({ ...validRegistration, phone: "" }).phone).toBeNull();
  });

  it("uses the contract's messages for each field", () => {
    expect(messagesFor({ ...validRegistration, fullName: "A" })).toContain("Enter your full name.");
    expect(messagesFor({ ...validRegistration, email: "not-an-email" })).toContain(
      "Enter an email address like name@example.com.",
    );
    expect(messagesFor({ ...validRegistration, phone: "12" })).toContain(
      "Enter a phone number with 7 to 20 digits, or leave it blank.",
    );
    expect(messagesFor({ ...validRegistration, emergencyContactName: "" })).toContain(
      "Enter the name of someone we can call in an emergency.",
    );
    expect(messagesFor({ ...validRegistration, emergencyContactPhone: "abc" })).toContain(
      "Enter a phone number for your emergency contact.",
    );
    expect(messagesFor({ ...validRegistration, partySize: "11" })).toContain(
      "Party size must be between 1 and 10 riders.",
    );
    expect(messagesFor({ ...validRegistration, partySize: "0" })).toContain(
      "Party size must be between 1 and 10 riders.",
    );
    const { acceptWaiver: _omit, ...noWaiver } = validRegistration;
    expect(messagesFor(noWaiver)).toContain("You need to accept the waiver to register.");
  });

  it("limits names to 100 characters and email to 254", () => {
    expect(messagesFor({ ...validRegistration, fullName: "x".repeat(101) })).toContain(
      "Enter your full name.",
    );
    expect(
      messagesFor({ ...validRegistration, email: `${"x".repeat(250)}@example.com` }),
    ).toContain("Enter an email address like name@example.com.");
  });
});
