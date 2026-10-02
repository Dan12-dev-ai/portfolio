import type { Metadata } from 'next'
import AdminDashboard from './AdminDashboard'

export const metadata: Metadata = {
  title: 'Admin console',
  description: 'Token-gated operations console for the portfolio backend.',
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return <AdminDashboard />
}
