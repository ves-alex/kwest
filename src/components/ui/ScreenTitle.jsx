export default function ScreenTitle({ eyebrow, title, subtitle }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      {eyebrow && (
        <p className="text-[10px] uppercase tracking-[0.4em] text-ash">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-4 font-display text-4xl uppercase tracking-[0.15em] text-cream sm:text-5xl sm:tracking-[0.2em]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-6 max-w-xs text-sm leading-relaxed text-ash">
          {subtitle}
        </p>
      )}
    </div>
  )
}
