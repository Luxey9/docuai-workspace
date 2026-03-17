import { forwardRef } from "react";
import { FileText, Languages, MessageSquare, LayoutDashboard, X } from "lucide-react";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const NavItem = forwardRef<HTMLDivElement, NavItemProps>(
  ({ icon, label, active = false }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-smooth cursor-pointer ${
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
            : "text-sidebar-foreground hover:bg-muted"
        }`}
      >
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
    );
  }
);
NavItem.displayName = "NavItem";

interface AppSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function AppSidebar({ open, onClose }: AppSidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-border bg-sidebar hidden lg:flex flex-col p-6 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-sidebar border-r border-border flex flex-col p-6 shadow-xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                  <LayoutDashboard size={18} />
                </div>
                <span className="font-bold text-lg tracking-tight text-foreground">
                  DocuAI
                </span>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-smooth">
                <X size={20} />
              </button>
            </div>
            <nav className="space-y-1">
              <NavItem icon={<FileText size={18} />} label="Dokumen Saya" active />
              <NavItem icon={<Languages size={18} />} label="Riwayat Terjemahan" />
              <NavItem icon={<MessageSquare size={18} />} label="Sesi Chat" />
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}

function SidebarContent() {
  return (
    <>
      <div className="flex items-center gap-3 mb-10">
        <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
          <LayoutDashboard size={18} />
        </div>
        <span className="font-bold text-lg tracking-tight text-foreground">
          DocuAI
        </span>
      </div>

      <nav className="space-y-1">
        <NavItem icon={<FileText size={18} />} label="Dokumen Saya" active />
        <NavItem icon={<Languages size={18} />} label="Riwayat Terjemahan" />
        <NavItem icon={<MessageSquare size={18} />} label="Sesi Chat" />
      </nav>
    </>
  );
}
