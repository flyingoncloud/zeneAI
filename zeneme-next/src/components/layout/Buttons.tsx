import { cn } from "@/lib/utils"

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>

export function PrimaryButton({ className, ...rest }: Props) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "flex h-11 flex-1 items-center justify-center rounded-[21px] bg-brand-dark text-base font-semibold text-white disabled:opacity-50",
        className,
      )}
    />
  )
}

export function SecondaryButton({ className, ...rest }: Props) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "flex h-11 flex-1 items-center justify-center rounded-[21px] border border-[#99999980] bg-white text-base text-ink-muted",
        className,
      )}
    />
  )
}
