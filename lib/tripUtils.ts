/**
 * Get automatic trip status based on end date
 * @param endDate - Trip end date string
 * @returns 'completed' if trip has ended, 'planned' otherwise
 */
export function getAutoTripStatus(endDate: string | null | undefined): 'completed' | 'planned' {
    if (!endDate) return 'planned';

    const tripEndDate = new Date(endDate);
    const today = new Date();

    // Reset time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    tripEndDate.setHours(0, 0, 0, 0);

    return tripEndDate < today ? 'completed' : 'planned';
}

/**
 * Check if a trip is completed (end date is in the past)
 */
export function isTripCompleted(endDate: string | null | undefined): boolean {
    return getAutoTripStatus(endDate) === 'completed';
}

/**
 * Check if a trip is upcoming/planned (end date is in the future)
 */
export function isTripPlanned(endDate: string | null | undefined): boolean {
    return getAutoTripStatus(endDate) === 'planned';
}
