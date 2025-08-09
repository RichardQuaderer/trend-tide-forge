import { Link, useLocation } from "react-router-dom";
import { Button } from "./button";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge } from "./badge";
import { 
  Home, 
  Zap, 
  Library, 
  BarChart3, 
  Bell, 
  Sparkles,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: Zap, label: "Generate", path: "/generate" },
  { icon: Library, label: "Library", path: "/library" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
];

export function TopAppBar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/home" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gradient">ViralMaker</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-2">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} icon={item.icon}>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="default" size="sm" className="gradient-primary text-white font-semibold shadow-creator">
            <Sparkles className="w-4 h-4 mr-2" />
            Create
          </Button>
          
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <Badge className="absolute -top-1 -right-1 w-2 h-2 p-0 bg-creator-pink"></Badge>
          </Button>
          
          <Avatar className="w-8 h-8">
            <AvatarImage src="/api/placeholder/32/32" />
            <AvatarFallback className="gradient-secondary text-white text-sm">JD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

export function BottomNavigation() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t md:hidden">
      <div className="grid grid-cols-4 gap-1 p-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className={cn("w-5 h-5 mb-1", isActive && "text-primary")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function NavLink({ 
  to, 
  icon: Icon, 
  children, 
  className 
}: { 
  to: string; 
  icon: any; 
  children: React.ReactNode; 
  className?: string;
}) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
        isActive 
          ? "bg-primary/10 text-primary" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        className
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{children}</span>
    </Link>
  );
}