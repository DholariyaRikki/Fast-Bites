import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar"
import { Outlet } from "react-router-dom"
import { Toaster } from "sonner"

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navbar */}
      <header>
        <Navbar/>
      </header>
      
      {/* Main content */} 
      <main className="flex-1">
        <Outlet/>
      </main>

      {/* Footer */}
      <Footer/>
      
      {/* Toast notifications */}
      <Toaster position="top-center" richColors closeButton />
    </div>
  )
}

export default MainLayout