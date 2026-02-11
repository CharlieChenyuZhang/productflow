import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban,
  PanelLeft,
  Compass,
  Home,
  LogOut,
  LogIn,
  Loader2,
  CreditCard,
  Crown,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";

const menuItems = [
  { icon: FolderKanban, label: "Projects", path: "/projects" },
  { icon: CreditCard, label: "Billing", path: "/billing" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAuthenticated } = useAuth();

  // Redirect to landing page if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = "/";
    }
  }, [loading, isAuthenticated]);

  // Show skeleton while checking auth or redirecting
  if (loading || !isAuthenticated) {
    return <DashboardLayoutSkeleton />;
  }

  return (
    <SidebarProviderWrapper>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProviderWrapper>
  );
}

function SidebarProviderWrapper({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      {children}
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const activeMenuItem = menuItems.find((item) =>
    location.startsWith(item.path)
  );

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft =
        sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        const rootStyle = document.documentElement.style;
        rootStyle.setProperty("--sidebar-width", `${newWidth}px`);
      }
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "";

  // Fetch current plan
  const { data: currentPlan } = trpc.billing.currentPlan.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const planName = currentPlan?.planName || "Starter";
  const isPaid = currentPlan?.planId === "pro" || currentPlan?.planId === "team";

  const handleLogout = async () => {
    await logout();
    // Use hard navigation to escape DashboardLayout's auth redirect
    window.location.href = "/";
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
                    <Compass className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <span className="font-semibold tracking-tight truncate text-sm">
                    ProductFlow
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map((item) => {
                const isActive = location.startsWith(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-10 transition-all font-normal"
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 space-y-2">
            {/* User info */}
            <div className="flex items-center gap-3 rounded-lg px-1 py-1 w-full text-left group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-9 w-9 border shrink-0">
                <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate leading-none">
                    {displayName}
                  </p>
                  <Badge
                    variant={isPaid ? "default" : "secondary"}
                    className={`text-[10px] px-1.5 py-0 h-4 shrink-0 cursor-pointer ${
                      isPaid ? "bg-primary/90" : ""
                    }`}
                    onClick={() => setLocation("/billing")}
                  >
                    {isPaid && <Crown className="h-2.5 w-2.5 mr-0.5" />}
                    {planName}
                  </Badge>
                </div>
                {displayEmail && (
                  <p className="text-xs text-muted-foreground truncate mt-1.5">
                    {displayEmail}
                  </p>
                )}
              </div>
            </div>

            <Separator className="group-data-[collapsible=icon]:hidden" />

            {/* Home & Logout buttons */}
            <div className="flex flex-col gap-1 group-data-[collapsible=icon]:items-center">
              {isCollapsed ? (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setLocation("/")}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <Home className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Homepage</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleLogout}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Logout</TooltipContent>
                  </Tooltip>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setLocation("/")}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 w-full text-left text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <Home className="h-4 w-4 shrink-0" />
                    <span>Homepage</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 w-full text-left text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span>Logout</span>
                  </button>
                </>
              )}
            </div>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (!isCollapsed) setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <span className="tracking-tight text-foreground">
                {activeMenuItem?.label ?? "ProductFlow"}
              </span>
            </div>
          </div>
        )}
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
