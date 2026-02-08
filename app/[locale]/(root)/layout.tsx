import MobileNav from '@/components/shared/MobileNav'
import Sidebar from '@/components/shared/Sidebar'
import { Toaster } from '@/components/ui/toaster'
import AgeVerificationModal from '@/components/shared/AgeVerificationModal'

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex min-h-screen w-full flex-col bg-background lg:flex-row font-IBMPlex">
      <Sidebar />
      <MobileNav />

      <div className="flex-1 overflow-auto py-8 lg:py-10 px-5 lg:px-10 lg:ml-72 mt-16 lg:mt-0">
        <div className="mx-auto w-full max-w-7xl animate-fade-in-up">
          {children}
        </div>
      </div>
      
      <AgeVerificationModal />
      <Toaster />
    </main>
  )
}

export default Layout
