import { describe, it, expect, vi } from 'vitest';
import { toLocalYYYYMMDD } from '@/lib/date';

describe('Progress Date Formatting', () => {
  it('deterministically formats Date to YYYY-MM-DD discarding node ICU localization differences', () => {
    // Use an explicit UTC Date
    const d = new Date('2026-05-12T15:30:00Z');
    
    // Convert focusing entirely on 'Asia/Kolkata' timezone (+5:30)
    // 15:30 UTC = 21:00 IST (same day)
    const formattedIST = toLocalYYYYMMDD(d, 'Asia/Kolkata');
    expect(formattedIST).toBe('2026-05-12');
    
    const dLate = new Date('2026-05-12T23:30:00Z');
    // 23:30 UTC = 05:00 IST next day
    const formattedISTLate = toLocalYYYYMMDD(dLate, 'Asia/Kolkata');
    expect(formattedISTLate).toBe('2026-05-13');

    // Confirm standard format rules apply stringently
    const partsLength = formattedIST.split('-');
    expect(partsLength.length).toBe(3);
    
    // Explicit padding check
    const singleDigitDate = new Date('2026-01-05T12:00:00Z'); // Jan 5
    expect(toLocalYYYYMMDD(singleDigitDate, 'UTC')).toBe('2026-01-05');
  });

  // Since we rely on standard Intl string comparisons downstream instead of Date objects,
  // let's mechanically guarantee string comparison safety in isolated JS environments
  it('validates lexical YYYY-MM-DD comparison', () => {
    expect('2026-05-12' >= '2026-05-06').toBe(true);
    expect('2026-05-01' <= '2026-05-06').toBe(true);
    
    // The breaking bug simulated:
    // (This is what Vercel emitted causing failures)
    // '5/12/2026' is greater than '2026-05-06' (true), but LESS THAN '2026-05-12' is FALSE
    expect('5/12/2026' <= '2026-05-12').toBe(false);
  });
});
