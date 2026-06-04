import type { MessageCategory, MessageThread, MessageType } from '@/lib/types';

export type MessageTopicFilter = 'all' | MessageCategory;

export const MESSAGE_TOPIC_FILTERS: {
  value: MessageTopicFilter;
  label: string;
  tag: string;
}[] = [
  { value: 'all', label: 'All', tag: 'ALL' },
  { value: 'leasing', label: 'Leasing', tag: 'LEASING' },
  { value: 'maintenance', label: 'Maintenance', tag: 'MAINTENANCE' },
  { value: 'inspection', label: 'Inspection', tag: 'INSPECTION' },
  { value: 'accounting', label: 'Accounting', tag: 'ACCOUNTING' },
  { value: 'other', label: 'Other', tag: 'OTHER' },
];

export const MESSAGE_CATEGORY_TAG: Record<MessageCategory, string> = {
  leasing: 'LEASING',
  maintenance: 'MAINTENANCE',
  inspection: 'INSPECTION',
  accounting: 'ACCOUNTING',
  other: 'OTHER',
};

export function categoryFromMessageType(type: MessageType): MessageCategory {
  switch (type) {
    case 'maintenance':
      return 'maintenance';
    case 'inspection':
      return 'inspection';
    case 'accounting':
      return 'accounting';
    case 'rent_review':
    case 'vacating':
      return 'leasing';
    default:
      return 'other';
  }
}

export function threadCategory(thread: MessageThread): MessageCategory {
  return thread.category ?? categoryFromMessageType(thread.type);
}

export function threadMatchesFilter(
  thread: MessageThread,
  filter: MessageTopicFilter,
): boolean {
  if (filter === 'all') return true;
  return threadCategory(thread) === filter;
}

export function categoryToMessageType(category: MessageCategory): MessageType {
  switch (category) {
    case 'maintenance':
      return 'maintenance';
    case 'inspection':
      return 'inspection';
    case 'accounting':
      return 'accounting';
    case 'leasing':
      return 'general';
    default:
      return 'general';
  }
}
