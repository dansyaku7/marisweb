'use client'

import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

export function Pagination({ totalPages }: { totalPages: number }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get('page')) || 1

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', pageNumber.toString())
    return `${pathname}?${params.toString()}`
  }

  return (
    // Tambahin border-t biar misah sama tabel
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 sm:px-6 bg-white">
      
      {/* Tampilan Mobile */}
      <div className="flex flex-1 justify-between sm:hidden">
        <PaginationButton 
            href={createPageURL(currentPage - 1)} 
            disabled={currentPage <= 1} 
            direction="left"
        >
            Previous
        </PaginationButton>
        <PaginationButton 
            href={createPageURL(currentPage + 1)} 
            disabled={currentPage >= totalPages} 
            direction="right"
        >
            Next
        </PaginationButton>
      </div>

      {/* Tampilan Desktop */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-700">
            Halaman <span className="font-bold">{currentPage}</span> dari <span className="font-bold">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            {/* Tombol Previous */}
            <Link
              href={createPageURL(currentPage - 1)}
              aria-disabled={currentPage <= 1}
              className={`relative inline-flex items-center rounded-l-md px-2 py-2 ring-1 ring-inset ring-slate-300 focus:z-20 focus:outline-offset-0 
                ${currentPage <= 1 
                    ? 'bg-slate-100 text-slate-300 pointer-events-none' // Style kalau Disabled
                    : 'bg-white text-slate-500 hover:bg-slate-50'       // Style kalau Aktif
                }`}
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
            
            {/* Indikator Angka */}
            <span className="relative inline-flex items-center px-4 py-2 text-sm font-bold text-blue-600 ring-1 ring-inset ring-slate-300 focus:outline-offset-0 bg-blue-50">
                {currentPage}
            </span>

            {/* Tombol Next */}
            <Link
              href={createPageURL(currentPage + 1)}
              aria-disabled={currentPage >= totalPages}
              className={`relative inline-flex items-center rounded-r-md px-2 py-2 ring-1 ring-inset ring-slate-300 focus:z-20 focus:outline-offset-0 
                ${currentPage >= totalPages 
                    ? 'bg-slate-100 text-slate-300 pointer-events-none' // Style kalau Disabled
                    : 'bg-white text-slate-500 hover:bg-slate-50'       // Style kalau Aktif
                }`}
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </div>
    </div>
  )
}

function PaginationButton({ href, disabled, children, direction }: any) {
    return (
        <Link 
            href={href}
            className={`relative inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium
                ${disabled 
                    ? 'bg-slate-100 text-slate-400 border-slate-200 pointer-events-none' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
        >
            {direction === 'left' && <ChevronLeft className="mr-2 h-4 w-4" />}
            {children}
            {direction === 'right' && <ChevronRight className="ml-2 h-4 w-4" />}
        </Link>
    )
}