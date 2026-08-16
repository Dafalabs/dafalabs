export const inputClass =
  "w-full border border-line bg-ink-deep px-3 py-2.5 text-sm text-bone placeholder:text-ash/60 transition-colors hover:border-line-strong focus:border-brass focus:outline-none";

export const inputClassLarge =
  "w-full border border-line bg-ink-deep px-4 py-3.5 text-bone placeholder:text-ash/60 transition-colors hover:border-line-strong focus:border-brass focus:outline-none";

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const Label = htmlFor ? "label" : "span";

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor} className="label text-bone">
        {label}
        {hint && (
          <span className="ml-2 normal-case tracking-normal text-ash">{hint}</span>
        )}
      </Label>
      {children}
    </div>
  );
}
