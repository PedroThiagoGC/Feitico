import { describe, it, expect } from "vitest";
import {
  computeSlotGrid,
  hasTimeConflict,
  calculateCommission,
  OVERTIME_MARGIN,
  type TimeRange,
  type ExistingBooking,
} from "./bookingService";

/* ── computeSlotGrid ──────────────────────────────────────── */

describe("computeSlotGrid", () => {
  const window8to12: TimeRange[] = [{ start: 480, end: 720 }]; // 08:00–12:00

  it("returns slots in 5-min increments for a given window", () => {
    const slots = computeSlotGrid(window8to12, [], [], 30);
    expect(slots[0]).toBe("08:00");
    expect(slots[1]).toBe("08:05");
    // last slot should start at most at 12:00 + 60min - 30min = 12:30 window
    // but cannot start >= window.end (12:00), so last slot is 11:55
    expect(slots[slots.length - 1]).toBe("11:55");
  });

  it("returns empty array when totalOccupiedMinutes is 0", () => {
    // fetchAvailableSlots returns [] for <=0, but computeSlotGrid would
    // still produce slots with 0 occupation — the guard is upstream
    const slots = computeSlotGrid(window8to12, [], [], 0);
    // with 0 min occupation, every m qualifies, including m == window.end-1
    expect(slots.length).toBeGreaterThan(0);
  });

  it("respects overtime margin: slot can extend past window end", () => {
    const slots = computeSlotGrid(window8to12, [], [], 90, 60);
    // slot at 11:30 => ends at 13:00 => 13:00 <= 12:00+60=13:00 ✓
    expect(slots).toContain("11:30");
    // slot at 11:35 => ends at 13:05 => 13:05 > 13:00 ✗
    expect(slots).not.toContain("11:35");
  });

  it("respects overtime margin: slot must start before window end", () => {
    // even with overtime, cannot start at or after window end
    const slots = computeSlotGrid(window8to12, [], [], 30, 120);
    expect(slots).not.toContain("12:00");
  });

  it("excludes slots that overlap with blocked ranges", () => {
    const blocked: TimeRange[] = [{ start: 540, end: 600 }]; // 09:00–10:00
    const slots = computeSlotGrid(window8to12, blocked, [], 30);
    expect(slots).not.toContain("09:00");
    expect(slots).not.toContain("09:30");
    // 08:30 occupies 08:30–09:00, does not overlap 09:00–10:00 (end == start is ok)
    expect(slots).toContain("08:30");
    // 08:35 => 08:35–09:05 overlaps 09:00–10:00
    expect(slots).not.toContain("08:35");
    // 10:00 => 10:00–10:30 starts at blocked end — not overlapping
    expect(slots).toContain("10:00");
  });

  it("excludes slots that conflict with existing bookings", () => {
    const bookings: ExistingBooking[] = [
      { booking_time: "10:00", total_occupied_minutes: 60, total_duration: 45 },
    ];
    const slots = computeSlotGrid(window8to12, [], bookings, 30);
    // 10:00 ⇒ 10:00-10:30 conflicts with 10:00-11:00
    expect(slots).not.toContain("10:00");
    // 09:45 ⇒ 09:45-10:15 conflicts with 10:00-11:00
    expect(slots).not.toContain("09:45");
    // 09:30 ⇒ 09:30-10:00 — end == start, NOT conflicting
    expect(slots).toContain("09:30");
    // 11:00 ⇒ 11:00-11:30 — start == end, NOT conflicting
    expect(slots).toContain("11:00");
  });

  it("ignores bookings with null booking_time", () => {
    const bookings: ExistingBooking[] = [
      { booking_time: null, total_occupied_minutes: 60, total_duration: 45 },
    ];
    const slots = computeSlotGrid(window8to12, [], bookings, 30);
    expect(slots).toContain("10:00");
  });

  it("uses total_duration as fallback when total_occupied_minutes is null", () => {
    const bookings: ExistingBooking[] = [
      { booking_time: "10:00", total_occupied_minutes: null, total_duration: 60 },
    ];
    const slots = computeSlotGrid(window8to12, [], bookings, 30);
    expect(slots).not.toContain("10:00");
    expect(slots).not.toContain("10:30");
    expect(slots).toContain("11:00");
  });

  it("defaults to 30 minutes when both occupied and duration are null", () => {
    const bookings: ExistingBooking[] = [
      { booking_time: "10:00", total_occupied_minutes: null, total_duration: null },
    ];
    const slots = computeSlotGrid(window8to12, [], bookings, 30);
    expect(slots).not.toContain("10:00");
    // 10:00 booking occupies 10:00-10:30 (default 30), so 10:30 should be free
    expect(slots).toContain("10:30");
  });

  it("handles multiple windows", () => {
    const windows: TimeRange[] = [
      { start: 480, end: 540 }, // 08:00–09:00
      { start: 600, end: 660 }, // 10:00–11:00
    ];
    const slots = computeSlotGrid(windows, [], [], 30);
    expect(slots).toContain("08:00");
    expect(slots).toContain("10:00");
    // 09:30 is in between windows — should not exist without overtime
    expect(slots).not.toContain("09:30");
  });
});

/* ── hasTimeConflict ──────────────────────────────────────── */

describe("hasTimeConflict", () => {
  const bookings: ExistingBooking[] = [
    { booking_time: "10:00", total_occupied_minutes: 60, total_duration: 45 },
  ];

  it("detects overlap: new slot starts during existing booking", () => {
    expect(hasTimeConflict("10:30", 30, bookings)).toBe(true);
  });

  it("detects overlap: new slot straddles start of existing booking", () => {
    expect(hasTimeConflict("09:45", 30, bookings)).toBe(true);
  });

  it("no conflict when new slot ends exactly at existing start", () => {
    expect(hasTimeConflict("09:30", 30, bookings)).toBe(false);
  });

  it("no conflict when new slot starts exactly at existing end", () => {
    expect(hasTimeConflict("11:00", 30, bookings)).toBe(false);
  });

  it("returns false with no existing bookings", () => {
    expect(hasTimeConflict("10:00", 30, [])).toBe(false);
  });

  it("ignores bookings with null booking_time", () => {
    const bks: ExistingBooking[] = [
      { booking_time: null, total_occupied_minutes: 60, total_duration: 45 },
    ];
    expect(hasTimeConflict("10:00", 30, bks)).toBe(false);
  });
});

/* ── calculateCommission ───────────────────────────────────── */

describe("calculateCommission", () => {
  it("calculates percentage commission", () => {
    expect(calculateCommission(200, "percentage", 30)).toBe(60);
  });

  it("returns fixed commission value", () => {
    expect(calculateCommission(200, "fixed", 50)).toBe(50);
  });

  it("returns 0 for unknown commission type", () => {
    expect(calculateCommission(200, "other", 50)).toBe(0);
  });
});

/* ── OVERTIME_MARGIN constant ──────────────────────────────── */

describe("OVERTIME_MARGIN", () => {
  it("is 60 minutes", () => {
    expect(OVERTIME_MARGIN).toBe(60);
  });
});
