/**
 * Transponder (SSR) code generation.
 *
 * A squawk is an *octal* four-digit code — every digit is 0–7, because each
 * digit is encoded in three pulse positions. A code containing 8 or 9 cannot be
 * dialled into a real transponder, so it must never reach a clearance.
 */

/**
 * Codes ATC will not assign as a discrete code.
 *
 * 7500/7600/7700 are the ICAO emergency codes (unlawful interference, radio
 * failure, general emergency); 7000 is the European VFR conspicuity code and
 * 1200 its US equivalent; 2000 is the code for entering from a non-SSR area;
 * 0000 is a non-code used to indicate a transponder fault.
 */
export const RESERVED_SQUAWKS = new Set([
    '7500', '7600', '7700', '7000', '2000', '1200', '0000',
])

/** True when `code` is a well-formed, assignable discrete squawk. */
export function isValidSquawk(code: string): boolean {
    if (!/^[0-7]{4}$/.test(code)) return false
    return !RESERVED_SQUAWKS.has(code)
}

/** A random assignable discrete squawk: four octal digits, no reserved code. */
export function generateSquawk(): string {
    // The reserved set is tiny next to the 4096-code space, so re-rolling
    // terminates immediately in practice; the bound just makes that guaranteed.
    for (let attempt = 0; attempt < 20; attempt++) {
        let code = ''
        for (let digit = 0; digit < 4; digit++) {
            code += String(Math.floor(Math.random() * 8))
        }
        if (isValidSquawk(code)) return code
    }
    return '1000'
}
