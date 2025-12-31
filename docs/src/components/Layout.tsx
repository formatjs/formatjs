import * as React from 'react'
import {useState} from 'react'
import {Menu} from 'lucide-react'
import {Button} from './ui/button'
import {Sheet, SheetContent, SheetTrigger} from './ui/sheet'
import HomeHeader from './home/HomeHeader'
import Sidebar from './Sidebar'
import Breadcrumbs from './Breadcrumbs'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({children}: LayoutProps): React.ReactNode {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-950 via-background to-gray-950">
      <HomeHeader />

      <div className="flex flex-grow overflow-hidden">
        {/* Mobile Sidebar Toggle Button */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="default"
              size="icon"
              className="fixed top-[68px] left-2.5 z-[1200] md:hidden bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[280px] p-0 top-14 h-[calc(100%-56px)] sm:top-16 sm:h-[calc(100%-64px)] bg-gray-950 border-purple-500/20"
          >
            <Sidebar />
          </SheetContent>
        </Sheet>

        {/* Permanent Sidebar for Desktop */}
        <aside className="hidden md:block w-[280px] shrink-0 border-r border-purple-500/20 top-16 h-[calc(100%-64px)] fixed overflow-auto z-[1000]">
          <Sidebar />
        </aside>

        <main className="flex-grow p-6 md:p-8 lg:p-10 md:ml-[280px] overflow-auto">
          <div className="max-w-4xl mx-auto">
            <Breadcrumbs />
            <div className="prose prose-invert max-w-none">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
