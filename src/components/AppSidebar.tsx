import { FileText, Languages, MessageSquare, LayoutDashboard } from "lucide-react";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

function NavItem({ icon, label, active = false }: NavItemProps) {
  return (
    <div
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

export default function AppSidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r border-border bg-sidebar hidden lg:flex flex-col p-6 z-20">
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
    </aside>
  );
}
