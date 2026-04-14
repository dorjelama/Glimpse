export interface FontOption {
  /** CSS font-family value including fallback (stored in element.styles.fontFamily) */
  family: string;
  /** Human-readable label shown in the picker */
  label: string;
  /** Exact name sent to Google Fonts API */
  googleName: string;
  category: 'serif' | 'sans-serif' | 'display' | 'script' | 'monospace' | 'slab';
}

export interface FontCategory {
  id: FontOption['category'];
  label: string;
}

export const FONT_CATEGORIES: FontCategory[] = [
  { id: 'serif',      label: 'Serif' },
  { id: 'sans-serif', label: 'Sans-Serif' },
  { id: 'display',    label: 'Display' },
  { id: 'script',     label: 'Script' },
  { id: 'slab',       label: 'Slab' },
  { id: 'monospace',  label: 'Monospace' },
];

export const FONTS: FontOption[] = [
  // ── Serif ──────────────────────────────────────────────────────────────────
  { family: "'Playfair Display', serif",    label: 'Playfair Display',    googleName: 'Playfair Display',    category: 'serif' },
  { family: "'Cormorant Garamond', serif",  label: 'Cormorant Garamond',  googleName: 'Cormorant Garamond',  category: 'serif' },
  { family: "'Lora', serif",                label: 'Lora',                googleName: 'Lora',                category: 'serif' },
  { family: "'Merriweather', serif",        label: 'Merriweather',        googleName: 'Merriweather',        category: 'serif' },
  { family: "'EB Garamond', serif",         label: 'EB Garamond',         googleName: 'EB Garamond',         category: 'serif' },
  { family: "'Libre Baskerville', serif",   label: 'Libre Baskerville',   googleName: 'Libre Baskerville',   category: 'serif' },
  { family: "'Crimson Text', serif",        label: 'Crimson Text',        googleName: 'Crimson Text',        category: 'serif' },
  { family: "'Bitter', serif",              label: 'Bitter',              googleName: 'Bitter',              category: 'serif' },
  { family: "'PT Serif', serif",            label: 'PT Serif',            googleName: 'PT Serif',            category: 'serif' },
  { family: "'Noto Serif', serif",          label: 'Noto Serif',          googleName: 'Noto Serif',          category: 'serif' },

  // ── Sans-Serif ─────────────────────────────────────────────────────────────
  { family: "'Inter', sans-serif",          label: 'Inter',               googleName: 'Inter',               category: 'sans-serif' },
  { family: "'Poppins', sans-serif",        label: 'Poppins',             googleName: 'Poppins',             category: 'sans-serif' },
  { family: "'Raleway', sans-serif",        label: 'Raleway',             googleName: 'Raleway',             category: 'sans-serif' },
  { family: "'Montserrat', sans-serif",     label: 'Montserrat',          googleName: 'Montserrat',          category: 'sans-serif' },
  { family: "'Nunito', sans-serif",         label: 'Nunito',              googleName: 'Nunito',              category: 'sans-serif' },
  { family: "'DM Sans', sans-serif",        label: 'DM Sans',             googleName: 'DM Sans',             category: 'sans-serif' },
  { family: "'Josefin Sans', sans-serif",   label: 'Josefin Sans',        googleName: 'Josefin Sans',        category: 'sans-serif' },
  { family: "'Outfit', sans-serif",         label: 'Outfit',              googleName: 'Outfit',              category: 'sans-serif' },
  { family: "'Roboto', sans-serif",         label: 'Roboto',              googleName: 'Roboto',              category: 'sans-serif' },
  { family: "'Open Sans', sans-serif",      label: 'Open Sans',           googleName: 'Open Sans',           category: 'sans-serif' },
  { family: "'Lato', sans-serif",           label: 'Lato',                googleName: 'Lato',                category: 'sans-serif' },
  { family: "'Noto Sans', sans-serif",      label: 'Noto Sans',           googleName: 'Noto Sans',           category: 'sans-serif' },

  // ── Display ────────────────────────────────────────────────────────────────
  { family: "'Cinzel', serif",                    label: 'Cinzel',               googleName: 'Cinzel',               category: 'display' },
  { family: "'Cinzel Decorative', cursive",        label: 'Cinzel Decorative',    googleName: 'Cinzel Decorative',    category: 'display' },
  { family: "'Abril Fatface', cursive",            label: 'Abril Fatface',        googleName: 'Abril Fatface',        category: 'display' },
  { family: "'Yeseva One', cursive",               label: 'Yeseva One',           googleName: 'Yeseva One',           category: 'display' },
  { family: "'Philosopher', serif",                label: 'Philosopher',          googleName: 'Philosopher',          category: 'display' },
  { family: "'Uncial Antiqua', cursive",           label: 'Uncial Antiqua',       googleName: 'Uncial Antiqua',       category: 'display' },
  { family: "'UnifrakturMaguntia', cursive",       label: 'UnifrakturMaguntia',   googleName: 'UnifrakturMaguntia',   category: 'display' },
  { family: "'Bebas Neue', cursive",               label: 'Bebas Neue',           googleName: 'Bebas Neue',           category: 'display' },
  { family: "'Righteous', cursive",                label: 'Righteous',            googleName: 'Righteous',            category: 'display' },

  // ── Script ─────────────────────────────────────────────────────────────────
  { family: "'Dancing Script', cursive",    label: 'Dancing Script',      googleName: 'Dancing Script',      category: 'script' },
  { family: "'Great Vibes', cursive",       label: 'Great Vibes',         googleName: 'Great Vibes',         category: 'script' },
  { family: "'Pacifico', cursive",          label: 'Pacifico',            googleName: 'Pacifico',            category: 'script' },
  { family: "'Parisienne', cursive",        label: 'Parisienne',          googleName: 'Parisienne',          category: 'script' },
  { family: "'Sacramento', cursive",        label: 'Sacramento',          googleName: 'Sacramento',          category: 'script' },
  { family: "'Satisfy', cursive",           label: 'Satisfy',             googleName: 'Satisfy',             category: 'script' },
  { family: "'Allura', cursive",            label: 'Allura',              googleName: 'Allura',              category: 'script' },
  { family: "'Pinyon Script', cursive",     label: 'Pinyon Script',       googleName: 'Pinyon Script',       category: 'script' },
  { family: "'Alex Brush', cursive",        label: 'Alex Brush',          googleName: 'Alex Brush',          category: 'script' },
  { family: "'Kaushan Script', cursive",    label: 'Kaushan Script',      googleName: 'Kaushan Script',      category: 'script' },

  // ── Slab ───────────────────────────────────────────────────────────────────
  { family: "'Roboto Slab', serif",         label: 'Roboto Slab',         googleName: 'Roboto Slab',         category: 'slab' },
  { family: "'Alfa Slab One', cursive",     label: 'Alfa Slab One',       googleName: 'Alfa Slab One',       category: 'slab' },
  { family: "'Zilla Slab', serif",          label: 'Zilla Slab',          googleName: 'Zilla Slab',          category: 'slab' },
  { family: "'Arvo', serif",                label: 'Arvo',                googleName: 'Arvo',                category: 'slab' },
  { family: "'Crete Round', serif",         label: 'Crete Round',         googleName: 'Crete Round',         category: 'slab' },

  // ── Monospace ──────────────────────────────────────────────────────────────
  { family: "'JetBrains Mono', monospace",  label: 'JetBrains Mono',      googleName: 'JetBrains Mono',      category: 'monospace' },
  { family: "'Fira Code', monospace",       label: 'Fira Code',           googleName: 'Fira Code',           category: 'monospace' },
  { family: "'Space Mono', monospace",      label: 'Space Mono',          googleName: 'Space Mono',          category: 'monospace' },
  { family: "'Source Code Pro', monospace", label: 'Source Code Pro',     googleName: 'Source Code Pro',     category: 'monospace' },
];
