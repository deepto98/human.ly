import { ReactNode, useState, useEffect } from "react";
import { Logo } from "@/ui/logo";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, X, LayoutDashboard, Settings, CreditCard } from "lucide-react";
import { cn, useSignOut } from "@/utils/misc";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@cvx/_generated/api";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { data: user } = useQuery(convexQuery(api.app.getCurrentUser, {}));
  const signOut = useSignOut();
  const navigate = useNavigate();
  
  // Persist sidebar state in localStorage
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarOpen');
      // Default to collapsed on mobile, expanded on desktop
      const isMobile = window.innerWidth < 1024;
      return saved === null ? !isMobile : saved === 'true';
    }
    return true;
  });
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      if (isMobile && isSidebarOpen) {
        const saved = localStorage.getItem('sidebarOpen');
        if (saved === null) {
          setIsSidebarOpen(false);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  // Save sidebar state to localStorage when it changes
  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarOpen', String(newState));
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Top Navigation - Neobrutalist */}
      <nav className="sticky top-0 z-50 border-b-[4px] border-black bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
          {/* Left: Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 relative">
            <Logo showText={true} />
            {/* Underline under logo */}
            <div className="absolute left-0 -bottom-1 h-[2px] w-24 bg-orange-400"></div>
          </Link>

          {/* Right: User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 border-[3px] border-black bg-white p-2 hover:bg-gray-50 transition-colors"
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || user.email || "User"}
                  className="h-8 w-8 border-[2px] border-black rounded-full"
                />
              ) : (
                <div className="h-8 w-8 border-[2px] border-black bg-gradient-to-br from-orange-300 to-orange-400 rounded-full flex items-center justify-center font-bold text-black">
                  {(user.name || user.email || "U")[0].toUpperCase()}
                </div>
              )}
            </button>

            {/* User Dropdown - Neobrutalist */}
            {isUserMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-50">
                  <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                  <div className="relative border-[3px] border-black bg-white p-4 min-w-[250px]">
                    <div className="mb-3 pb-3 border-b-[2px] border-black">
                      <p className="font-bold text-black">{user.name || user.username}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>

                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          navigate({ to: "/dashboard/settings" });
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </button>
                      
                      <div className="border-t-[2px] border-black my-2"></div>
                      
                      <button
                        onClick={() => {
                          signOut();
                          setIsUserMenuOpen(false);
                          navigate({ to: "/" });
                        }}
                        className="w-full text-left px-3 py-2 font-medium hover:bg-red-100 transition-colors flex items-center gap-2 text-red-600"
                      >
                        <LogOut className="h-4 w-4" />
                        Log Out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Underline under logo (like homepage) */}
        <div className="mx-auto max-w-7xl px-4">
          <div className="h-[2px] w-24 bg-orange-400"></div>
        </div>
      </nav>

      {/* Main Content with Sidebar */}
      <div className="flex">
        {/* Sidebar - Neobrutalist Collapsible */}
        <aside className={cn(
          "sticky top-[73px] h-[calc(100vh-73px)] border-r-[4px] border-black bg-white transition-all duration-300 hidden lg:block",
          isSidebarOpen ? "w-64" : "w-20"
        )}>
          <div className="p-3">
            {/* Toggle Button */}
            <button
              onClick={toggleSidebar}
              className={cn(
                "mb-4 border-[3px] border-black bg-cyan-200 hover:bg-cyan-300 transition-colors w-full flex items-center justify-center",
                isSidebarOpen ? "p-3" : "p-4"
              )}
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Navigation Items */}
            <nav className="space-y-3">
              <Link
                to="/dashboard"
                className="block"
              >
                <div className="relative group">
                  <div className="absolute -bottom-0.5 -right-0.5 h-full w-full bg-black"></div>
                  <div className={cn(
                    "relative border-[3px] border-black bg-white hover:bg-orange-100 transition-colors",
                    isSidebarOpen ? "p-3" : "p-4"
                  )}>
                    <div className={cn(
                      "flex items-center",
                      isSidebarOpen ? "gap-3" : "justify-center"
                    )}>
                      <LayoutDashboard className={cn("flex-shrink-0", isSidebarOpen ? "h-5 w-5" : "h-6 w-6")} />
                      {isSidebarOpen && <span className="font-bold">Dashboard</span>}
                    </div>
                  </div>
                </div>
              </Link>

              <Link
                to="/dashboard/settings"
                className="block"
              >
                <div className="relative group">
                  <div className="absolute -bottom-0.5 -right-0.5 h-full w-full bg-black"></div>
                  <div className={cn(
                    "relative border-[3px] border-black bg-white hover:bg-lime-100 transition-colors",
                    isSidebarOpen ? "p-3" : "p-4"
                  )}>
                    <div className={cn(
                      "flex items-center",
                      isSidebarOpen ? "gap-3" : "justify-center"
                    )}>
                      <Settings className={cn("flex-shrink-0", isSidebarOpen ? "h-5 w-5" : "h-6 w-6")} />
                      {isSidebarOpen && <span className="font-bold">Settings</span>}
                    </div>
                  </div>
                </div>
              </Link>

              {/* <Link
                to="/dashboard/settings/billing"
                className="block"
              >
                <div className="relative group">
                  <div className="absolute -bottom-0.5 -right-0.5 h-full w-full bg-black"></div>
                  <div className={cn(
                    "relative border-[3px] border-black bg-white hover:bg-pink-100 transition-colors",
                    isSidebarOpen ? "p-3" : "p-4"
                  )}>
                    <div className={cn(
                      "flex items-center",
                      isSidebarOpen ? "gap-3" : "justify-center"
                    )}>
                      <CreditCard className={cn("flex-shrink-0", isSidebarOpen ? "h-5 w-5" : "h-6 w-6")} />
                      {isSidebarOpen && <span className="font-bold">Billing</span>}
                    </div>
                  </div>
                </div>
              </Link> */}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t-[4px] border-black bg-white py-6 px-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Logo showText={true} />
          <p className="text-sm font-medium text-black">
            © 2024 Humanly. Reinventing interviews with AI.
          </p>
        </div>
      </footer>
    </div>
  );
}

