import ActivityTimeline from '../models/activityTimeline.model.js';

/**
 * Centralised Timeline Event Logger
 * Called by controllers after each significant action to persist a real-time activity entry.
 */
interface TimelineEvent {
    userId: string;
    role: 'student' | 'faculty' | 'admin';
    activityType: string;
    module: string;
    title: string;
    description: string;
    icon?: string;
    color?: string;
    metadata?: Record<string, any>;
}

export const logTimelineEvent = async (event: TimelineEvent): Promise<void> => {
    try {
        await ActivityTimeline.create({
            user: event.userId,
            role: event.role,
            activityType: event.activityType,
            title: event.title,
            description: event.description,
            metadata: {
                module: event.module,
                icon: event.icon || 'activity',
                color: event.color || 'slate',
                ...(event.metadata || {})
            }
        });
    } catch (err) {
        // Silent fail — timeline logging must never block the request
        console.error('[TimelineLogger] Failed to persist event:', (err as Error).message);
    }
};
