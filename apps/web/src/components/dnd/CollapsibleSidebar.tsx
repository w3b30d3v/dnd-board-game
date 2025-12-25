'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { D20Icon } from './DnDIcons';

// Navigation icons as SVG components
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

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
  subItems?: { label: string; href: string }[];
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <HomeIcon />,
    description: 'Your home base',
  },
  {
    label: 'Characters',
    href: '/characters/create',
    icon: <CharacterIcon />,
    description: 'Create & manage heroes',
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
  },
  {
    label: 'Game Board',
    href: '/game/test',
    icon: <GameIcon />,
    description: 'Play session',
  },
];

// Sidebar animation variants
const sidebarVariants = {
  expanded: {
    width: 280,
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

interface CollapsibleSidebarProps {
  defaultExpanded?: boolean;
}

export function CollapsibleSidebar({ defaultExpanded = true }: CollapsibleSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const pathname = usePathname();

  // Persist collapsed state in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-expanded');
    if (stored !== null) {
      setIsExpanded(stored === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('sidebar-expanded', String(newState));
    if (!newState) {
      setExpandedMenu(null);
    }
  };

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

  return (
    <motion.aside
      variants={sidebarVariants}
      initial={isExpanded ? 'expanded' : 'collapsed'}
      animate={isExpanded ? 'expanded' : 'collapsed'}
      className="fixed left-0 top-0 h-full z-40 flex flex-col"
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

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <ul className="space-y-1 px-2">
            {navigationItems.map((item) => {
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
                        <span className={`flex-shrink-0 ${active ? 'text-primary' : 'text-text-muted group-hover:text-primary'}`}>
                          {item.icon}
                        </span>
                        <motion.div variants={textVariants} className="flex-1 text-left">
                          <div className="font-medium truncate">{item.label}</div>
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
                                    className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                                      pathname === subItem.href
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                                    }`}
                                  >
                                    {subItem.label}
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
                        <span className={`flex-shrink-0 ${active ? 'text-primary' : 'text-text-muted group-hover:text-primary'}`}>
                          {item.icon}
                        </span>
                        <motion.div variants={textVariants} className="flex-1">
                          <div className="font-medium truncate">{item.label}</div>
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
        </nav>

        {/* Collapse Toggle Button */}
        <div className="p-4 border-t border-border/50">
          <motion.button
            onClick={toggleSidebar}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
            title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
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
        </div>
      </div>
    </motion.aside>
  );
}

// Wrapper component to add proper padding to page content when sidebar is used
interface SidebarLayoutProps {
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export function SidebarLayout({ children, defaultExpanded = true }: SidebarLayoutProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Sync with localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('sidebar-expanded');
      if (stored !== null) {
        setIsExpanded(stored === 'true');
      }
    };

    // Check initial state
    handleStorageChange();

    // Listen for changes (from sidebar toggle)
    window.addEventListener('storage', handleStorageChange);

    // Custom event for same-tab updates
    const handleCustomEvent = () => handleStorageChange();
    window.addEventListener('sidebar-toggle', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebar-toggle', handleCustomEvent);
    };
  }, []);

  return (
    <div className="flex min-h-screen">
      <CollapsibleSidebar defaultExpanded={defaultExpanded} />
      <motion.main
        animate={{
          marginLeft: isExpanded ? 280 : 64,
        }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex-1 min-h-screen"
      >
        {children}
      </motion.main>
    </div>
  );
}

export default CollapsibleSidebar;
