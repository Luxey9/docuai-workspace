import { Languages, FileText, MessageSquare } from "lucide-react";

interface FeatureTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const tabs = [
  { id: "translate", label: "Penerjemah", icon: <Languages size={18} /> },
  { id: "summary", label: "Ringkasan", icon: <FileText size={18} /> },
  { id: "chat", label: "Chatbot", icon: <MessageSquare size={18} /> },
];

export default function FeatureTabs({ activeTab, setActiveTab }: FeatureTabsProps) {
  return (
    <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-smooth ${
            activeTab === tab.id
              ? "bg-card text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.icon}
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
