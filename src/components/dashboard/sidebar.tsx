"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home01Icon, InboxIcon, Search01Icon, PlusSignIcon, SidebarLeft01Icon } from "hugeicons-react";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { AccountMenu } from "./account-menu";
import { SIDEBAR_SPRING, type Conversation } from "./shared";

const NAV = [
  { icon: Home01Icon,   label: "Home"   },
  { icon: InboxIcon,    label: "Inbox"  },
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
  email?: string;
  initials: string;
  onSignOut: () => void;
  onProfile?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
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
  email,
  initials,
  onSignOut,
  onProfile,
  onSettings,
  onHelp,
}: SidebarProps) {
  const router = useRouter();
  const [accountOpen, setAccountOpen] = useState(false);
  const [nameVisible, setNameVisible] = useState(!collapsed);
  const accountAnchorRef = useRef<HTMLButtonElement>(null);
  const noop = () => {};

  useEffect(() => {
    if (collapsed) { setNameVisible(false); }
  }, [collapsed]);
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 288 }}
      transition={SIDEBAR_SPRING}
      onAnimationComplete={() => { if (!collapsed) setNameVisible(true); }}
      className="hidden md:flex flex-col shrink-0 bg-[#f8fafc] rounded-[2rem] overflow-hidden"
    >
      <div className="flex flex-col flex-1 min-h-0 pt-3 px-3 gap-1 overflow-hidden">

        {/* Branding + toggle */}
        <div className="flex items-center px-1 pt-1 pb-3">
          <motion.button
            onClick={() => router.push("/")}
            initial={false}
            animate={{ width: collapsed ? 0 : "auto", opacity: collapsed ? 0 : 1 }}
            transition={SIDEBAR_SPRING}
            className="text-slate-900 leading-none whitespace-nowrap overflow-hidden"
            style={{ fontFamily: '"Junicode", ui-serif, Georgia, serif', fontSize: "1.75rem" }}
          >
            Flash
          </motion.button>
          <div className="flex-1" />
          <button
            onClick={onToggle}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 active:scale-[0.97] transition-transform shrink-0"
          >
            <SidebarLeft01Icon size={16} />
          </button>
        </div>

        {/* New chat */}
        <LiquidGlassButton
          onClick={onNewChat}
          magnetic={false}
          scale={0.28}
          background="rgba(15,23,42,0.92)"
          wrapperClassName="mb-2 shrink-0 w-full"
          className="w-full h-10 text-[0.9375rem] font-medium overflow-hidden"
        >
          <motion.span
            initial={false}
            animate={{ paddingLeft: collapsed ? 12 : 16, paddingRight: collapsed ? 12 : 16 }}
            transition={SIDEBAR_SPRING}
            className="w-full flex items-center overflow-hidden"
          >
            <PlusSignIcon size={16} className="shrink-0" />
            <motion.span
              initial={false}
              animate={{ width: collapsed ? 0 : "auto", opacity: collapsed ? 0 : 1, paddingLeft: collapsed ? 0 : 10 }}
              transition={SIDEBAR_SPRING}
              className="overflow-hidden whitespace-nowrap"
            >
              New chat
            </motion.span>
          </motion.span>
        </LiquidGlassButton>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 shrink-0">
          {NAV.map(({ icon: Icon, label }) => (
            <motion.button
              key={label}
              onClick={() => onNavSelect(label)}
              title={collapsed ? label : undefined}
              initial={false}
              animate={{ paddingLeft: collapsed ? 11.5 : 16, paddingRight: collapsed ? 11.5 : 16 }}
              transition={SIDEBAR_SPRING}
              className={`w-full flex items-center h-10 rounded-full text-[0.9375rem] font-medium active:scale-[0.97] transition-transform overflow-hidden ${activeNav === label ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-700"}`}
            >
              <Icon size={17} className="shrink-0" />
              <motion.span
                initial={false}
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

      </div>

      {/* Account — full width, outside padding, flush with bottom rounded edge */}
      <div className="shrink-0">
        <LiquidGlass
          scale={0.28}
          radius="2rem"
          hoverable
          static
          background="rgba(255,255,255,0.7)"
          className="w-full"
          whileTap={{ scale: 0.99 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
        >
          <motion.button
            ref={accountAnchorRef}
            initial={false}
            animate={{ paddingLeft: collapsed ? 12 : 16, paddingRight: collapsed ? 12 : 16 }}
            transition={SIDEBAR_SPRING}
            className="w-full flex items-center h-14 overflow-hidden"
            onClick={() => setAccountOpen(o => !o)}
            title={collapsed ? displayName : undefined}
          >
            <motion.div
              initial={false}
              animate={{ width: collapsed ? 36 : 28, height: collapsed ? 36 : 28, fontSize: collapsed ? "0.875rem" : "0.75rem" }}
              transition={SIDEBAR_SPRING}
              className="rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold shrink-0"
            >
              {initials}
            </motion.div>
            <motion.span
              initial={false}
              animate={{ width: collapsed ? 0 : "auto", paddingLeft: collapsed ? 0 : 12 }}
              transition={SIDEBAR_SPRING}
              className="overflow-hidden whitespace-nowrap text-[0.9375rem] font-medium text-slate-700"
              style={{ opacity: nameVisible ? 1 : 0, transition: "opacity 100ms" }}
            >
              {displayName}
            </motion.span>
          </motion.button>
        </LiquidGlass>
        <AccountMenu
            open={accountOpen}
            onClose={() => setAccountOpen(false)}
            anchorRef={accountAnchorRef}
            onProfile={onProfile ?? noop}
            onSettings={onSettings ?? noop}
            onHelp={onHelp ?? noop}
            onSignOut={onSignOut}
            displayName={displayName}
            email={email}
          />
      </div>
    </motion.aside>
  );
}
