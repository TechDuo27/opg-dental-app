"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Home, FileImage, History, Settings, User, Menu, LogOut, HelpCircle } from "lucide-react"
import Link from "next/link"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  const navigationItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: FileImage, label: "New Analysis", href: "/dashboard" },
    { icon: History, label: "History", href: "/history" },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Settings, label: "Settings", href: "/settings" },
    { icon: HelpCircle, label: "Help", href: "/help" },
  ]

  return (
    <>
      {/* Mobile Navigation */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-white">
          <div className="flex flex-col h-full">
            <div className="flex items-center space-x-2 mb-8">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileImage className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-blue-900">OPG Analyzer</span>
            </div>

            <nav className="flex-1 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-blue-700 hover:bg-blue-50 hover:text-blue-900 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="border-t border-blue-100 pt-4">
              <Button variant="ghost" className="w-full justify-start text-blue-700 hover:bg-blue-50">
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Navigation - can be used as sidebar */}
      <nav className="hidden md:flex md:flex-col md:w-64 md:bg-white md:border-r md:border-blue-100">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileImage className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-blue-900">OPG Analyzer</span>
          </div>

          <div className="space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-blue-700 hover:bg-blue-50 hover:text-blue-900 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-blue-100">
          <Button variant="ghost" className="w-full justify-start text-blue-700 hover:bg-blue-50">
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </nav>
    </>
  )
}
