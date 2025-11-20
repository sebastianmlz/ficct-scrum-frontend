/**
 * Priority Configuration and Utilities
 * Converts priority codes (P0, P1, P2, P3, P4) to human-readable labels
 */

export interface PriorityConfig {
  code: string; // "P0", "P1", "P2", "P3", "P4"
  label: string; // "Critical", "High", "Medium", "Low", "Lowest"
  color: string; // Hex color for visual representation
  bgColor: string; // Background color for badges
  textColor: string; // Text color for badges
  order: number; // For sorting (0 = highest priority)
}

export const PRIORITY_MAP: Record<string, PriorityConfig> = {
  P0: {
    code: 'P0',
    label: 'Critical',
    color: '#BF2600',
    bgColor: '#FFEBE6',
    textColor: '#BF2600',
    order: 0,
  },
  P1: {
    code: 'P1',
    label: 'High',
    color: '#FF5630',
    bgColor: '#FFEBE6',
    textColor: '#FF5630',
    order: 1,
  },
  P2: {
    code: 'P2',
    label: 'Medium',
    color: '#FF8B00',
    bgColor: '#FFF4E6',
    textColor: '#FF8B00',
    order: 2,
  },
  P3: {
    code: 'P3',
    label: 'Low',
    color: '#36B37E',
    bgColor: '#E3FCEF',
    textColor: '#006644',
    order: 3,
  },
  P4: {
    code: 'P4',
    label: 'Lowest',
    color: '#6B778C',
    bgColor: '#F4F5F7',
    textColor: '#42526E',
    order: 4,
  },
};

/**
 * Get human-readable label for priority code
 * @param code Priority code (P0, P1, P2, P3, P4)
 * @returns Human-readable label (Critical, High, Medium, Low, Lowest)
 */
export function getPriorityLabel(code: string | null | undefined): string {
  if (!code) return 'No Priority';
  return PRIORITY_MAP[code]?.label || code;
}

/**
 * Get color for priority code
 * @param code Priority code (P0, P1, P2, P3, P4)
 * @returns Hex color string
 */
export function getPriorityColor(code: string | null | undefined): string {
  if (!code) return '#6B778C';
  return PRIORITY_MAP[code]?.color || '#6B778C';
}

/**
 * Get background color for priority badge
 * @param code Priority code (P0, P1, P2, P3, P4)
 * @returns Hex color string for background
 */
export function getPriorityBgColor(code: string | null | undefined): string {
  if (!code) return '#F4F5F7';
  return PRIORITY_MAP[code]?.bgColor || '#F4F5F7';
}

/**
 * Get text color for priority badge
 * @param code Priority code (P0, P1, P2, P3, P4)
 * @returns Hex color string for text
 */
export function getPriorityTextColor(code: string | null | undefined): string {
  if (!code) return '#42526E';
  return PRIORITY_MAP[code]?.textColor || '#42526E';
}

/**
 * Get full priority configuration
 * @param code Priority code (P0, P1, P2, P3, P4)
 * @returns Full priority configuration or null
 */
export function getPriorityConfig(
    code: string | null | undefined,
): PriorityConfig | null {
  if (!code) return null;
  return PRIORITY_MAP[code] || null;
}

/**
 * Get all priorities sorted by order
 * @returns Array of all priority configurations
 */
export function getAllPriorities(): PriorityConfig[] {
  return Object.values(PRIORITY_MAP).sort((a, b) => a.order - b.order);
}

/**
 * Get Tailwind CSS classes for priority badge
 * @param code Priority code (P0, P1, P2, P3, P4)
 * @returns Tailwind CSS classes string
 */
export function getPriorityTailwindClasses(
    code: string | null | undefined,
): string {
  if (!code) return 'bg-gray-100 text-gray-700';

  const classMap: Record<string, string> = {
    P0: 'bg-red-100 text-red-700',
    P1: 'bg-red-100 text-red-700',
    P2: 'bg-orange-100 text-orange-700',
    P3: 'bg-green-100 text-green-700',
    P4: 'bg-gray-100 text-gray-700',
  };

  return classMap[code] || 'bg-gray-100 text-gray-700';
}
