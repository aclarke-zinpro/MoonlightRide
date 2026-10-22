import { describe, expect, it } from "vitest";
import { nextSubscribeStep } from "@/server/services/subscription";

const now = new Date("2026-10-01T12:00:00Z");
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000);

describe("US4 subscriber state transitions", () => {
  it("(new) → pending, with a confirmation email", () => {
    expect(nextSubscribeStep(null, now)).toEqual({ status: "pending", sendConfirmation: true });
  });

  it("unsubscribed → pending if the person subscribes again", () => {
    expect(nextSubscribeStep({ status: "unsubscribed", confirmSentAt: minutesAgo(1) }, now)).toEqual({
      status: "pending",
      sendConfirmation: true,
    });
  });

  it("an active subscriber stays active and gets no email", () => {
    expect(nextSubscribeStep({ status: "active", confirmSentAt: minutesAgo(1) }, now)).toEqual({
      status: "active",
      sendConfirmation: false,
    });
  });

  it("resends a pending confirmation at most once per 10 minutes", () => {
    expect(nextSubscribeStep({ status: "pending", confirmSentAt: minutesAgo(5) }, now)).toEqual({
      status: "pending",
      sendConfirmation: false,
    });
    expect(nextSubscribeStep({ status: "pending", confirmSentAt: minutesAgo(11) }, now)).toEqual({
      status: "pending",
      sendConfirmation: true,
    });
  });
});
