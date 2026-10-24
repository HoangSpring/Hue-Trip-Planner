import { Outlet } from 'react-router-dom'
import { BrandMark } from '@/components/BrandMark'

export function AuthLayout() {
  return <main className="grid min-h-screen place-items-center bg-bg px-4 py-10"><div className="w-full max-w-md"><div className="mb-8 text-center"><BrandMark /></div><div className="rounded-card border border-line bg-surface p-6 shadow-card md:p-8"><Outlet /></div></div></main>
}
