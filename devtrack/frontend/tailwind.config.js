/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Semantic tokens rather than raw palette classes. Every component
      // references these names, so the theme is defined here once instead of
      // being spelled out as bg-gray-50/border-gray-200 across two dozen
      // files. The darks are tinted toward violet rather than neutral grey —
      // that tint is most of what separates this look from a plain inversion.
      colors: {
        app: '#08080F',          // page background
        panel: '#0B0B14',        // sidebar / topbar
        card: '#13131E',         // raised surface
        'card-hover': '#191926',
        tile: '#1C1C2B',         // icon squares, inputs
        line: '#1E1E2D',         // hairline borders
        'line-strong': '#2E2E42',
        fg: {
          DEFAULT: '#F2F2F7',    // primary text
          muted: '#8A8AA3',      // labels, secondary text
          faint: '#5A5A70',      // axis ticks, disabled
        },
        accent: {
          DEFAULT: '#7C5CFF',
          hover: '#8E76FF',
          soft: '#191333',
        },
        // Status hues re-tuned for a dark background: saturated foreground
        // over a very dark fill. The light theme's -100/-800 pairs go muddy.
        ok: { fg: '#6EE7A0', bg: '#0E2419' },
        warn: { fg: '#FFC46B', bg: '#2A1E0B' },
        bad: { fg: '#FF8A8A', bg: '#2A1315' },
        info: { fg: '#8AB4FF', bg: '#111C33' },
        mute: { fg: '#9A9AB4', bg: '#1A1A28' },
      },
    },
  },
  plugins: [],
}
