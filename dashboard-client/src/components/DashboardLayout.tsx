import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  Box,
  Code,
  Cpu,
  Database,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Terminal,
  Users
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/" },
    { icon: Users, label: "Agents", href: "/agents" },
    { icon: Terminal, label: "Tasks", href: "/tasks" },
    { icon: Box, label: "Artifacts", href: "/artifacts" },
    { icon: Database, label: "Knowledge", href: "/knowledge" },
    { icon: Activity, label: "Analytics", href: "/analytics" },
    { icon: Shield, label: "Security", href: "/security" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground font-mono overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 border border-primary flex items-center justify-center">
              <Cpu className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tighter">KAGENT<span className="text-primary">AI</span></h1>
              <p className="text-xs text-muted-foreground">v1.2.0-beta</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className="px-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start gap-3 h-12 rounded-none border-l-2 transition-all duration-200 ${
                      isActive 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "border-transparent hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={isActive ? "font-bold" : "font-normal"}>{item.label}</span>
                    {isActive && <span className="ml-auto w-2 h-2 bg-primary rounded-full animate-pulse" />}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <div className="bg-card border border-border p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">SYSTEM STATUS</span>
              <span className="text-xs text-primary font-bold">ONLINE</span>
            </div>
            <div className="space-y-1">
              <div className="h-1 w-full bg-muted overflow-hidden">
                <div className="h-full bg-primary w-[85%]" />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>CPU: 45%</span>
                <span>MEM: 2.4GB</span>
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start gap-2 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="w-4 h-4" />
            Disconnect
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-background/50 backdrop-blur flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Terminal className="w-4 h-4" />
              <span>root@kagent-ai:~</span>
              <span className="text-primary">$</span>
              <span className="animate-pulse">_</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="gap-2 hidden md:flex">
              <Code className="w-4 h-4" />
              API Docs
            </Button>
            <div className="w-8 h-8 bg-primary/20 border border-primary flex items-center justify-center">
              <span className="font-bold text-primary text-xs">AD</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-7xl mx-auto pb-20">
            {children}
          </div>
        </ScrollArea>

        {/* Background Grid Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
             style={{ 
               backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', 
               backgroundSize: '40px 40px' 
             }} 
        />
      </main>
    </div>
  );
}
