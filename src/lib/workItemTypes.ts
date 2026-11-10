import {
  Baby, Bed, Bike, BookOpen, Brain, Briefcase, Bug, Calendar, Camera, Car, Code, Coffee,
  DollarSign, Dog, Dumbbell, Film, Flag, Footprints, Gamepad2, Gift, Globe, GraduationCap,
  Hammer, Heart, Home, Leaf, Lightbulb, Mail, MessageSquare, Mountain, Music, Palette,
  PenTool, Phone, Pill, Plane, ShoppingCart, Sparkles, Star, Sun, Target, Trophy, Users,
  Utensils, Waves, Wrench,
  type LucideIcon,
} from 'lucide-react';
import { WorkItemTypeDefinition } from '@/types';

/**
 * Icons a work item type can use, keyed by the name stored in work_item_types.icon.
 */
export const TYPE_ICONS: Record<string, LucideIcon> = {
  'book-open': BookOpen,
  'dumbbell': Dumbbell,
  'gamepad': Gamepad2,
  'footprints': Footprints,
  'film': Film,
  'sparkles': Sparkles,
  'briefcase': Briefcase,
  'code': Code,
  'music': Music,
  'palette': Palette,
  'camera': Camera,
  'heart': Heart,
  'home': Home,
  'shopping-cart': ShoppingCart,
  'utensils': Utensils,
  'coffee': Coffee,
  'plane': Plane,
  'car': Car,
  'bike': Bike,
  'users': Users,
  'message': MessageSquare,
  'phone': Phone,
  'mail': Mail,
  'calendar': Calendar,
  'dollar': DollarSign,
  'graduation-cap': GraduationCap,
  'brain': Brain,
  'lightbulb': Lightbulb,
  'wrench': Wrench,
  'hammer': Hammer,
  'leaf': Leaf,
  'sun': Sun,
  'bed': Bed,
  'pill': Pill,
  'baby': Baby,
  'dog': Dog,
  'gift': Gift,
  'trophy': Trophy,
  'target': Target,
  'flag': Flag,
  'star': Star,
  'bug': Bug,
  'pen': PenTool,
  'globe': Globe,
  'mountain': Mountain,
  'waves': Waves,
};

/**
 * Colours a work item type can use. The class names are written out in full so
 * Tailwind keeps them in the build.
 */
export const TYPE_COLORS: Record<string, { text: string; swatch: string }> = {
  'blue':   { text: 'text-blue-500',   swatch: 'bg-blue-500' },
  'purple': { text: 'text-purple-500', swatch: 'bg-purple-500' },
  'green':  { text: 'text-green-500',  swatch: 'bg-green-500' },
  'orange': { text: 'text-orange-500', swatch: 'bg-orange-500' },
  'pink':   { text: 'text-pink-500',   swatch: 'bg-pink-500' },
  'yellow': { text: 'text-yellow-500', swatch: 'bg-yellow-500' },
  'red':    { text: 'text-red-500',    swatch: 'bg-red-500' },
  'teal':   { text: 'text-teal-500',   swatch: 'bg-teal-500' },
  'cyan':   { text: 'text-cyan-500',   swatch: 'bg-cyan-500' },
  'indigo': { text: 'text-indigo-500', swatch: 'bg-indigo-500' },
  'lime':   { text: 'text-lime-500',   swatch: 'bg-lime-500' },
  'slate':  { text: 'text-slate-400',  swatch: 'bg-slate-400' },
};

/**
 * The built-in types. Used until the work_item_types table exists or when it is empty.
 * 'Other' is the fallback type and can't be deleted.
 */
export const FALLBACK_TYPE = 'Other';

export const DEFAULT_WORK_ITEM_TYPES: WorkItemTypeDefinition[] = [
  { name: 'Study',         icon: 'book-open',  color: 'blue',   createdAt: 1 },
  { name: 'Gym',           icon: 'dumbbell',   color: 'purple', createdAt: 2 },
  { name: 'Sports',        icon: 'gamepad',    color: 'green',  createdAt: 3 },
  { name: 'Running',       icon: 'footprints', color: 'orange', createdAt: 4 },
  { name: 'Entertainment', icon: 'film',       color: 'pink',   createdAt: 5 },
  { name: 'Other',         icon: 'sparkles',   color: 'yellow', createdAt: 6 },
];

export function getTypeIcon(icon?: string): LucideIcon {
  return (icon && TYPE_ICONS[icon]) || Sparkles;
}

export function getTypeColorClass(color?: string): string {
  return (color && TYPE_COLORS[color]?.text) || 'text-muted-foreground';
}
