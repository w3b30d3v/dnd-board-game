'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { D20Icon } from './DnDIcons';
import { useAuthStore } from '@/stores/authStore';

// Navigation icons
function HomeIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CharacterIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function DmIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function GameIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

function ChevronIcon({ size = 20, color = 'currentColor', direction = 'left' }: { size?: number; color?: string; direction?: 'left' | 'right' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: direction === 'right' ? 'rotate(180deg)' : undefined }}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function MultiplayerIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function LogoutIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function SettingsIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function ProfileIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
  badge?: number | string;
  badgeColor?: 'primary' | 'danger' | 'success' | 'warning';
  subItems?: { label: string; href: string; badge?: number | string }[];
  section?: 'main' | 'bottom';
}

const navigationItems: NavItem[] = [
  // Main navigation
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <HomeIcon />,
    description: 'Your home base',
    section: 'main',
  },
  {
    label: 'Characters',
    href: '/characters/create',
    icon: <CharacterIcon />,
    description: 'Create & manage heroes',
    section: 'main',
  },
  {
    label: 'DM Dashboard',
    href: '/dm',
    icon: <DmIcon />,
    description: 'Dungeon Master tools',
    subItems: [
      { label: 'My Campaigns', href: '/dm/campaigns' },
      { label: 'Campaign Studio', href: '/dm/campaign-studio' },
    ],
    section: 'main',
  },
  {
    label: 'Game Board',
    href: '/game/test',
    icon: <GameIcon />,
    description: 'Play session',
    section: 'main',
  },
  {
    label: 'Multiplayer',
    href: '/multiplayer/test',
    icon: <MultiplayerIcon />,
    description: 'Join games',
    section: 'main',
  },
  // Bottom navigation
  {
    label: 'Profile',
    href: '/profile',
    icon: <ProfileIcon />,
    description: 'Your profile',
    section: 'bottom',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <SettingsIcon />,
    description: 'App settings',
    section: 'bottom',
  },
];

// Notification Badge Component
function NotificationBadge({
  count,
  color = 'primary'
}: {
  count: number | string;
  color?: 'primary' | 'danger' | 'success' | 'warning';
}) {
  const colorClasses = {
    primary: 'bg-primary text-bg-primary',
    danger: 'bg-danger text-white',
    success: 'bg-success text-bg-primary',
    warning: 'bg-amber-500 text-bg-primary',
  };

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full ${colorClasses[color]} shadow-glow`}
    >
      {typeof count === 'number' && count > 99 ? '99+' : count}
    </motion.span>
  );
}

// Sidebar context for sharing state
interface SidebarContextValue {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    return { isExpanded: true, setIsExpanded: () => {}, toggleSidebar: () => {} };
  }
  return context;
}

// Mobile breakpoint
const MOBILE_BREAKPOINT = 768;

// Animation variants
const sidebarVariants = {
  expanded: {
    width: 260,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
  collapsed: {
    width: 64,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

const textVariants = {
  expanded: {
    opacity: 1,
    x: 0,
    display: 'block',
    transition: { duration: 0.2, delay: 0.1 },
  },
  collapsed: {
    opacity: 0,
    x: -10,
    transitionEnd: { display: 'none' },
    transition: { duration: 0.15 },
  },
};

const subMenuVariants = {
  hidden: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2 }
  },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.3 }
  },
};

interface AppShellProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export function AppShell({ children, showSidebar = true }: AppShellProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Get user and logout from auth store
  const { user, logout } = useAuthStore((state) => ({
    user: state.user,
    logout: state.logout,
  }));

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      // Auto-collapse on mobile
      if (mobile && isExpanded) {
        setIsExpanded(false);
        localStorage.setItem('sidebar-expanded', 'false');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isExpanded]);

  // Load persisted state (only on desktop)
  useEffect(() => {
    if (!isMobile) {
      const stored = localStorage.getItem('sidebar-expanded');
      if (stored !== null) {
        setIsExpanded(stored === 'true');
      }
    }
  }, [isMobile]);

  const toggleSidebar = useCallback(() => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('sidebar-expanded', String(newState));
    if (!newState) {
      setExpandedMenu(null);
    }
  }, [isExpanded]);

  // Keyboard shortcut: Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const toggleSubMenu = (label: string) => {
    if (isExpanded) {
      setExpandedMenu(expandedMenu === label ? null : label);
    }
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href) ?? false;
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Pages that shouldn't show sidebar
  const hideSidebarPaths = ['/', '/login', '/register'];
  const shouldShowSidebar = showSidebar && pathname !== null && !hideSidebarPaths.includes(pathname);

  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded, toggleSidebar }}>
      <div className="flex min-h-screen">
        {/* Mobile overlay */}
        <AnimatePresence>
          {isMobile && isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
              onClick={toggleSidebar}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.aside
          variants={sidebarVariants}
          initial={isExpanded ? 'expanded' : 'collapsed'}
          animate={isExpanded ? 'expanded' : 'collapsed'}
          className={`fixed left-0 top-0 h-full z-40 flex flex-col ${isMobile && !isExpanded ? '-translate-x-full' : ''}`}
          style={isMobile && !isExpanded ? { transform: 'translateX(-100%)' } : undefined}
        >
          {/* Glass background */}
          <div className="absolute inset-0 bg-bg-card/95 backdrop-blur-md border-r border-border/50" />

          {/* Magical gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 via-transparent to-primary/5 pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full">
            {/* Logo / Header */}
            <div className="p-4 border-b border-border/50">
              <Link href="/dashboard" className="flex items-center gap-3 group">
                <motion.div
                  whileHover={{ rotate: 20, scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="flex-shrink-0"
                >
                  <D20Icon size={32} color="#F59E0B" animate={false} />
                </motion.div>
                <motion.span
                  variants={textVariants}
                  className="dnd-heading-epic text-xl pb-0 logo-glow-pulse truncate"
                >
                  D&D Board
                </motion.span>
              </Link>
            </div>

            {/* Navigation - Main Section */}
            <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              <ul className="space-y-1 px-2">
                {navigationItems.filter(item => item.section !== 'bottom').map((item) => {
                  const active = isActive(item.href);
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isSubMenuOpen = expandedMenu === item.label;

                  return (
                    <li key={item.href}>
                      {hasSubItems ? (
                        <>
                          <motion.button
                            onClick={() => toggleSubMenu(item.label)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                              active
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'hover:bg-white/5 text-text-secondary hover:text-text-primary'
                            }`}
                            title={!isExpanded ? item.label : undefined}
                          >
                            <span className={`relative flex-shrink-0 ${active ? 'text-primary' : 'text-text-muted group-hover:text-primary'}`}>
                              {item.icon}
                              {item.badge !== undefined && !isExpanded && (
                                <NotificationBadge count={item.badge} color={item.badgeColor} />
                              )}
                            </span>
                            <motion.div variants={textVariants} className="flex-1 text-left">
                              <div className="font-medium truncate text-sm flex items-center gap-2">
                                {item.label}
                                {item.badge !== undefined && isExpanded && (
                                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                                    item.badgeColor === 'danger' ? 'bg-danger text-white' :
                                    item.badgeColor === 'success' ? 'bg-success text-bg-primary' :
                                    item.badgeColor === 'warning' ? 'bg-amber-500 text-bg-primary' :
                                    'bg-primary text-bg-primary'
                                  }`}>
                                    {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <div className="text-xs text-text-muted truncate">{item.description}</div>
                              )}
                            </motion.div>
                            <motion.span
                              variants={textVariants}
                              animate={{ rotate: isSubMenuOpen ? -90 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronIcon size={16} />
                            </motion.span>
                          </motion.button>
                          <AnimatePresence>
                            {isExpanded && isSubMenuOpen && (
                              <motion.ul
                                variants={subMenuVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                className="ml-8 mt-1 space-y-1 overflow-hidden"
                              >
                                {item.subItems?.map((subItem) => (
                                  <li key={subItem.href}>
                                    <Link href={subItem.href}>
                                      <motion.span
                                        whileHover={{ scale: 1.02, x: 4 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`block px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                                          pathname === subItem.href
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                                        }`}
                                      >
                                        {subItem.label}
                                        {subItem.badge !== undefined && (
                                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary text-bg-primary">
                                            {typeof subItem.badge === 'number' && subItem.badge > 99 ? '99+' : subItem.badge}
                                          </span>
                                        )}
                                      </motion.span>
                                    </Link>
                                  </li>
                                ))}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <Link href={item.href}>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                              active
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'hover:bg-white/5 text-text-secondary hover:text-text-primary'
                            }`}
                            title={!isExpanded ? item.label : undefined}
                          >
                            <span className={`relative flex-shrink-0 ${active ? 'text-primary' : 'text-text-muted group-hover:text-primary'}`}>
                              {item.icon}
                              {item.badge !== undefined && !isExpanded && (
                                <NotificationBadge count={item.badge} color={item.badgeColor} />
                              )}
                            </span>
                            <motion.div variants={textVariants} className="flex-1">
                              <div className="font-medium truncate text-sm flex items-center gap-2">
                                {item.label}
                                {item.badge !== undefined && isExpanded && (
                                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                                    item.badgeColor === 'danger' ? 'bg-danger text-white' :
                                    item.badgeColor === 'success' ? 'bg-success text-bg-primary' :
                                    item.badgeColor === 'warning' ? 'bg-amber-500 text-bg-primary' :
                                    'bg-primary text-bg-primary'
                                  }`}>
                                    {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <div className="text-xs text-text-muted truncate">{item.description}</div>
                              )}
                            </motion.div>
                          </motion.div>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Divider before bottom section */}
              <div className="my-4 mx-2 border-t border-border/30" />

              {/* Bottom Section (Profile, Settings) */}
              <ul className="space-y-1 px-2">
                {navigationItems.filter(item => item.section === 'bottom').map((item) => {
                  const active = isActive(item.href);

                  return (
                    <li key={item.href}>
                      <Link href={item.href}>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                            active
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'hover:bg-white/5 text-text-secondary hover:text-text-primary'
                          }`}
                          title={!isExpanded ? item.label : undefined}
                        >
                          <span className={`relative flex-shrink-0 ${active ? 'text-primary' : 'text-text-muted group-hover:text-primary'}`}>
                            {item.icon}
                            {item.badge !== undefined && !isExpanded && (
                              <NotificationBadge count={item.badge} color={item.badgeColor} />
                            )}
                          </span>
                          <motion.div variants={textVariants} className="flex-1">
                            <div className="font-medium truncate text-sm flex items-center gap-2">
                              {item.label}
                              {item.badge !== undefined && isExpanded && (
                                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                                  item.badgeColor === 'danger' ? 'bg-danger text-white' :
                                  item.badgeColor === 'success' ? 'bg-success text-bg-primary' :
                                  item.badgeColor === 'warning' ? 'bg-amber-500 text-bg-primary' :
                                  'bg-primary text-bg-primary'
                                }`}>
                                  {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        </motion.div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* User Section */}
            {user && (
              <div className="p-3 border-t border-border/50">
                <div className="flex items-center gap-3 px-2 py-2">
                  {/* User Avatar */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-bg-primary font-bold text-sm shadow-glow flex-shrink-0 cursor-pointer"
                    title={user.displayName}
                  >
                    {user.displayName.charAt(0).toUpperCase()}
                  </motion.div>

                  {/* User Info */}
                  <motion.div variants={textVariants} className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-text-primary truncate">
                      {user.displayName}
                    </div>
                    <div className="text-xs text-text-muted truncate">
                      @{user.username}
                    </div>
                  </motion.div>

                  {/* Logout Button */}
                  <motion.button
                    variants={textVariants}
                    onClick={handleLogout}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
                    title="Logout"
                  >
                    <LogoutIcon size={18} />
                  </motion.button>
                </div>
              </div>
            )}

            {/* Collapse Toggle Button */}
            <div className="p-3 border-t border-border/50">
              <motion.button
                onClick={toggleSidebar}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
                title={isExpanded ? 'Collapse sidebar (Ctrl+B)' : 'Expand sidebar (Ctrl+B)'}
              >
                <motion.span
                  animate={{ rotate: isExpanded ? 0 : 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronIcon size={20} />
                </motion.span>
                <motion.span variants={textVariants} className="text-sm font-medium">
                  Collapse
                </motion.span>
              </motion.button>

              {/* Keyboard shortcut hint */}
              <motion.div
                variants={textVariants}
                className="text-center mt-2"
              >
                <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-white/5 font-mono">
                  Ctrl+B
                </span>
              </motion.div>
            </div>
          </div>
        </motion.aside>

        {/* Mobile toggle button (when sidebar is collapsed) */}
        {isMobile && !isExpanded && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={toggleSidebar}
            className="fixed top-4 left-4 z-50 w-10 h-10 rounded-lg bg-bg-card/90 backdrop-blur-md border border-border/50 flex items-center justify-center text-text-primary shadow-lg"
          >
            <D20Icon size={24} color="#F59E0B" />
          </motion.button>
        )}

        {/* Main content with margin */}
        <motion.main
          animate={{
            marginLeft: isMobile ? 0 : (isExpanded ? 260 : 64),
          }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          className="flex-1 min-h-screen w-full"
        >
          {children}
        </motion.main>
      </div>
    </SidebarContext.Provider>
  );
}

export default AppShell;
