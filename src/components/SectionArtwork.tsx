import './section-artwork.css'

const illustrations: Record<string, string> = {
  studio: 'studio', tools: 'studio', projects: 'studio', guide: 'studio',
  chords: 'chords', melody: 'melody', bass: 'bass', drums: 'drums',
  lyrics: 'lyrics', arrangement: 'arrangement', agent: 'arrangement', knowledge: 'lyrics',
}

/** Decorative, non-interactive artwork; explicit dimensions prevent layout shifts. */
export function SectionArtwork({ section, variant = 'heading' }: {
  section: string
  variant?: 'heading' | 'card' | 'hero'
}) {
  return <img key={section} className={`section-artwork section-artwork--${variant}`}
    src={`${import.meta.env.BASE_URL}images/sections/${illustrations[section] ?? 'studio'}.jpg`}
    alt="" aria-hidden="true" width={640} height={640} draggable={false}
    loading={variant === 'card' ? 'lazy' : 'eager'} decoding="async" />
}
