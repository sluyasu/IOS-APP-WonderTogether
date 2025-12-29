import AsyncStorage from '@react-native-async-storage/async-storage';

const SEEN_ACHIEVEMENTS_KEY = '@seen_achievements';

export interface Achievement {
    id: string;
    name: string;
    icon: string;
    target: number;
    metric: string;
    progress: number;
    unlocked: boolean;
}

/**
 * Get the list of achievement IDs that have been seen by the user
 */
export async function getSeenAchievements(): Promise<string[]> {
    try {
        const seen = await AsyncStorage.getItem(SEEN_ACHIEVEMENTS_KEY);
        return seen ? JSON.parse(seen) : [];
    } catch (error) {
        console.error('Error loading seen achievements:', error);
        return [];
    }
}

/**
 * Mark an achievement as seen
 */
export async function markAchievementAsSeen(achievementId: string): Promise<void> {
    try {
        const seen = await getSeenAchievements();
        if (!seen.includes(achievementId)) {
            seen.push(achievementId);
            await AsyncStorage.setItem(SEEN_ACHIEVEMENTS_KEY, JSON.stringify(seen));
        }
    } catch (error) {
        console.error('Error marking achievement as seen:', error);
    }
}

/**
 * Mark multiple achievements as seen
 */
export async function markAchievementsAsSeen(achievementIds: string[]): Promise<void> {
    try {
        const seen = await getSeenAchievements();
        const updated = [...new Set([...seen, ...achievementIds])];
        await AsyncStorage.setItem(SEEN_ACHIEVEMENTS_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Error marking achievements as seen:', error);
    }
}

/**
 * Get newly unlocked achievements that haven't been seen yet
 */
export function getNewlyUnlocked(allUnlocked: Achievement[], seen: string[]): Achievement[] {
    return allUnlocked.filter(achievement => !seen.includes(achievement.id));
}

/**
 * Clear all seen achievements (for testing)
 */
export async function clearSeenAchievements(): Promise<void> {
    try {
        await AsyncStorage.removeItem(SEEN_ACHIEVEMENTS_KEY);
    } catch (error) {
        console.error('Error clearing seen achievements:', error);
    }
}
