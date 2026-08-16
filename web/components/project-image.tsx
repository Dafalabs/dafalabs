export function ProjectImage({
  src,
  alt,
  className = "",
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        aria-hidden
        className={`flex h-full w-full items-center justify-center bg-ink-deep ${className}`}
      >
        <span className="h-8 w-8 rounded-full border border-line-strong" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
