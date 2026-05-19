"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Home01Icon, InboxIcon, Mail01Icon, Search01Icon, PlusSignIcon, SidebarLeft01Icon } from "hugeicons-react";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { SIDEBAR_SPRING, SKY_BG, type Conversation } from "./shared";

const NAV = [
  { icon: Home01Icon,   label: "Home"   },
  { icon: InboxIcon,    label: "Inbox"  },
  { icon: Mail01Icon,   label: "Mail"   },
  { icon: Search01Icon, label: "Search" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeNav: string;
  onNavSelect: (label: string) => void;
  conversations: Conversation[];
  activeConv: number | null;
  onConvSelect: (id: number) => void;
  onNewChat: () => void;
  displayName: string;
  initials: string;
  onSignOut: () => void;
}

export function Sidebar({
  collapsed,
  onToggle,
  activeNav,
  onNavSelect,
  conversations,
  activeConv,
  onConvSelect,
  onNewChat,
  displayName,
  initials,
  onSignOut,
}: SidebarProps) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 288 }}
      transition={SIDEBAR_SPRING}
      className="hidden md:flex flex-col shrink-0 bg-[#f8fafc] rounded-[2rem] overflow-hidden"
    >
      <div className="flex flex-col flex-1 min-h-0 p-3 gap-1 overflow-hidden">

        {/* Branding + toggle */}
        <div className="flex items-center px-1 pt-1 pb-3">
          <motion.a
            href="/"
            animate={{ width: collapsed ? 0 : "auto", opacity: collapsed ? 0 : 1 }}
            transition={SIDEBAR_SPRING}
            className="text-slate-900 leading-none whitespace-nowrap overflow-hidden"
            style={{ fontFamily: '"Junicode", ui-serif, Georgia, serif', fontSize: "1.75rem" }}
          >
            Flash
          </motion.a>
          <div className="flex-1" />
          <button
            onClick={onToggle}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 active:scale-[0.97] transition-transform shrink-0"
          >
            <SidebarLeft01Icon size={16} />
          </button>
        </div>

        {/* New chat */}
        <div className="mb-2 rounded-full overflow-hidden shrink-0" style={{ background: SKY_BG }}>
          <LiquidGlass static hoverable={false} className="w-full" radius="9999px">
            <motion.button
              onClick={onNewChat}
              animate={{ paddingLeft: collapsed ? 12 : 16, paddingRight: collapsed ? 12 : 16 }}
              transition={SIDEBAR_SPRING}
              className="w-full flex items-center h-10 text-[0.9375rem] font-medium text-white overflow-hidden"
            >
              <PlusSignIcon size={16} className="shrink-0" />
              <motion.span
                animate={{ width: collapsed ? 0 : "auto", opacity: collapsed ? 0 : 1, paddingLeft: collapsed ? 0 : 10 }}
                transition={SIDEBAR_SPRING}
                className="overflow-hidden whitespace-nowrap"
              >
                New chat
              </motion.span>
            </motion.button>
          </LiquidGlass>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 shrink-0">
          {NAV.map(({ icon: Icon, label }) => (
            <motion.button
              key={label}
              onClick={() => onNavSelect(label)}
              title={collapsed ? label : undefined}
              animate={{ paddingLeft: collapsed ? 11.5 : 16, paddingRight: collapsed ? 11.5 : 16 }}
              transition={SIDEBAR_SPRING}
              className={`w-full flex items-center h-10 rounded-full text-[0.9375rem] font-medium active:scale-[0.97] transition-transform overflow-hidden ${activeNav === label ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-700"}`}
            >
              <Icon size={17} className="shrink-0" />
              <motion.span
                animate={{ width: collapsed ? 0 : "auto", opacity: collapsed ? 0 : 1, paddingLeft: collapsed ? 0 : 10 }}
                transition={SIDEBAR_SPRING}
                className="overflow-hidden whitespace-nowrap"
              >
                {label}
              </motion.span>
            </motion.button>
          ))}
        </nav>

        {/* Conversations */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="mt-3 flex-1 overflow-y-auto min-h-0 flex flex-col gap-0.5"
            >
              <p className="px-3 text-xs text-slate-400 mb-0.5">Recent</p>
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => onConvSelect(conv.id)}
                  className={`w-full flex items-center px-4 h-10 rounded-full text-[0.9375rem] active:scale-[0.97] transition-transform ${activeConv === conv.id ? "bg-slate-100 text-slate-800 font-medium" : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-700"}`}
                >
                  <span className="truncate">{conv.title}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {collapsed && <div className="flex-1" />}

        {/* Account */}
        <motion.button
          animate={{ paddingLeft: collapsed ? 6 : 12, paddingRight: collapsed ? 6 : 12 }}
          transition={SIDEBAR_SPRING}
          className="mt-1 w-full flex items-center h-12 rounded-full hover:bg-slate-50 active:scale-[0.97] transition-transform overflow-hidden"
          onClick={onSignOut}
          title={collapsed ? displayName : undefined}
        >
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {initials}
          </div>
          <motion.span
            animate={{ width: collapsed ? 0 : "auto", opacity: collapsed ? 0 : 1, paddingLeft: collapsed ? 0 : 12 }}
            transition={SIDEBAR_SPRING}
            className="overflow-hidden whitespace-nowrap text-[0.9375rem] font-medium text-slate-700"
          >
            {displayName}
          </motion.span>
        </motion.button>

      </div>
    </motion.aside>
  );
}
