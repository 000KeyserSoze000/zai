"use client"

import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

export function LogoutButton() {
  const handleLogout = () => {
    // Direct window location change for a clean logout
    window.location.href = '/api/auth/signout'
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-neutral-800 rounded cursor-pointer"
    >
      <LogOut className="w-4 h-4" />
      <span>Se déconnecter</span>
    </button>
  )
}
