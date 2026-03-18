// app/components/ui/skeleton.tsx
import { cn } from "@/lib/utils" // Pastikan punya utils clsx, kalau gak ada pake string biasa aja

// Kalau belum punya lib/utils.ts, hapus import cn dan pake template literal biasa:
// className={`animate-pulse rounded-md bg-slate-200 ${className}`}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/80 ${className}`}
      {...props}
    />
  )
}