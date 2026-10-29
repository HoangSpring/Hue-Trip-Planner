import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return <main className="min-h-screen bg-bg px-4 py-6 sm:px-6 sm:py-10"><div className="mx-auto w-full max-w-5xl"><Outlet /></div></main>
}
