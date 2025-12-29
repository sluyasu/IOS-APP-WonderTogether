import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Group, Profile, getUserGroup, getGroupMembers } from '../lib/groups';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// Types
// ============================================

interface GroupContextType {
    currentGroup: Group | null;
    allGroups: Group[];
    groupMembers: Profile[];
    isLoading: boolean;
    refreshGroup: () => Promise<void>;
    switchGroup: (groupId: string) => Promise<void>;
    hasGroup: boolean;
}

// ============================================
// Context
// ============================================

const GroupContext = createContext<GroupContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================

interface GroupProviderProps {
    children: ReactNode;
}

export function GroupProvider({ children }: GroupProviderProps) {
    const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
    const [allGroups, setAllGroups] = useState<Group[]>([]);
    const [groupMembers, setGroupMembers] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUserGroup();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                fetchUserGroup();
            } else if (event === 'SIGNED_OUT') {
                setCurrentGroup(null);
                setGroupMembers([]);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchUserGroup = async () => {
        setIsLoading(true);
        try {
            // Fetch ALL user's groups
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setCurrentGroup(null);
                setAllGroups([]);
                setGroupMembers([]);
                setIsLoading(false);
                return;
            }

            const { data: userGroups, error: groupsError } = await supabase
                .from('group_members')
                .select('group_id, groups(*)')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .order('last_accessed', { ascending: false });

            if (groupsError) {
                console.error('Error fetching groups:', groupsError);
                setCurrentGroup(null);
                setAllGroups([]);
                setGroupMembers([]);
                setIsLoading(false);
                return;
            }

            const groups = (userGroups || [])
                .map(ug => ug.groups)
                .filter((g): g is Group => g !== null && typeof g === 'object' && typeof g.id === 'string');
            setAllGroups(groups);

            // Get selected group ID from storage or use most recent
            const storedGroupId = await AsyncStorage.getItem('selected_group_id');
            let selectedGroup: Group | null = null;

            if (storedGroupId && groups.find(g => g.id === storedGroupId)) {
                selectedGroup = groups.find(g => g.id === storedGroupId) || groups[0] || null;
            } else {
                selectedGroup = groups[0] || null;
            }

            setCurrentGroup(selectedGroup);

            // Fetch group members if group exists
            if (selectedGroup) {
                const { members, error: membersError } = await getGroupMembers(selectedGroup.id);
                if (membersError) {
                    console.error('Error fetching group members:', membersError);
                } else {
                    setGroupMembers(members);
                }
            } else {
                setGroupMembers([]);
            }
        } catch (error) {
            console.error('Error in fetchUserGroup:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const switchGroup = async (groupId: string) => {
        try {
            const newGroup = allGroups.find(g => g.id === groupId);
            if (!newGroup) return;

            // Save selected group to storage
            await AsyncStorage.setItem('selected_group_id', groupId);

            // Update last_accessed in database
            await supabase
                .from('group_members')
                .update({ last_accessed: new Date().toISOString() })
                .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
                .eq('group_id', groupId);

            setCurrentGroup(newGroup);

            // Fetch members for new group
            const { members, error } = await getGroupMembers(groupId);
            if (error) {
                console.error('Error fetching group members:', error);
            } else {
                setGroupMembers(members);
            }
        } catch (error) {
            console.error('Error switching group:', error);
        }
    };

    const refreshGroup = async () => {
        await fetchUserGroup();
    };

    const value: GroupContextType = {
        currentGroup,
        allGroups,
        groupMembers,
        isLoading,
        refreshGroup,
        switchGroup,
        hasGroup: currentGroup !== null,
    };

    return (
        <GroupContext.Provider value={value}>
            {children}
        </GroupContext.Provider>
    );
}

// ============================================
// Hook
// ============================================

export function useGroup(): GroupContextType {
    const context = useContext(GroupContext);
    if (context === undefined) {
        throw new Error('useGroup must be used within a GroupProvider');
    }
    return context;
}

// ============================================
// HOC for screens that require a group
// ============================================

export function withGroup<P extends object>(
    Component: React.ComponentType<P>
): React.ComponentType<P> {
    return function WithGroupComponent(props: P) {
        const { hasGroup, isLoading } = useGroup();

        if (isLoading) {
            return null; // Or a loading screen
        }

        if (!hasGroup) {
            // Redirect to group onboarding
            // This will be handled by the root navigation
            return null;
        }

        return <Component {...props} />;
    };
}
