import {
  Sparkles,
  Bug,
  Wrench,
  FlaskConical,
  Palette,
  Rocket,
  BookOpen,
  Shield,
  Zap,
  Target,
  Layers,
  Gem,
  type LucideIcon,
} from "lucide-react";

// Curated icon set for work item types. The database stores the lucide name,
// this map resolves it to a component with a safe fallback.
export const TYPE_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  bug: Bug,
  wrench: Wrench,
  "flask-conical": FlaskConical,
  palette: Palette,
  rocket: Rocket,
  "book-open": BookOpen,
  shield: Shield,
  zap: Zap,
  target: Target,
  layers: Layers,
  gem: Gem,
};

export const TYPE_ICON_NAMES = Object.keys(TYPE_ICONS);

export function resolveTypeIcon(name: string | null | undefined): LucideIcon {
  return (name && TYPE_ICONS[name]) || Sparkles;
}
