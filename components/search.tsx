// components/search.tsx
'use client'

import { Search as SearchIcon } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce" // Kalau gada ini, hapus & pake logic manual dibawah

// Kalau lu males install 'use-debounce', pake ini aja (Ganti isi function handleSearch):
export function Search({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  // Logic Debounce Manual (biar gak spam server tiap ketik 1 huruf)
  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams)
    
    if (term) {
      params.set('query', term)
    } else {
      params.delete('query')
    }
    
    // Update URL tanpa reload
    replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-xl border border-slate-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
        placeholder={placeholder}
        onChange={(e) => {
            // Simple debounce: Tunggu user berhenti ngetik 300ms baru search
            const val = e.target.value;
            setTimeout(() => handleSearch(val), 300); 
        }}
        defaultValue={searchParams.get('query')?.toString()}
      />
      <SearchIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 peer-focus:text-blue-500" />
    </div>
  )
}