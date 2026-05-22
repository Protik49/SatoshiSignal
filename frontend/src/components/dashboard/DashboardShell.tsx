"use client"

import { motion } from "framer-motion"
import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { ConnectionStatus } from "./ConnectionStatus"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="h-screen flex flex-col bg-midnight-oil">
      <header className="h-14 shrink-0 flex items-center justify-between px-3 sm:px-6 bg-midnight-oil/95 backdrop-blur-sm border-b border-iron-oxide z-10">
        <div className="flex items-center gap-2.5">
          <Zap className="size-5 text-chartreuse-zap" />
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="text-base font-bold text-cloud-white tracking-tight"
          >
            SatoshiSignal
          </motion.span>
        </div>

        <div className="flex items-center gap-4">
          <ConnectionStatus />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3 sm:p-6">
        {children}
      </main>
    </div>
  )
}

export function DashboardGrid({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-4"
    >
      {children}
    </motion.div>
  )
}

export function DashboardRow({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-4", className)}>
      {children}
    </div>
  )
}

export function DashboardFullWidth({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}

export function DashboardTwoCol({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4",
        className
      )}
    >
      {children}
    </div>
  )
}
