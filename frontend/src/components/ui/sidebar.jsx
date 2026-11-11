import React, { createContext, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { IconX } from '@tabler/icons-react';
import { cn } from '../../lib/utils';

export const SidebarNavContext = createContext(null);

export function Sidebar({ open, setOpen, isMobile, children }) {
  return (
    <div
      className={cn(
        'sidebar-wrap fixed left-0 top-0 flex h-screen flex-shrink-0 bg-slate-950 text-slate-100 border-r border-slate-800/80',
        isMobile
          ? cn('z-50 w-64 transition-transform duration-300 ease-in-out', open ? 'translate-x-0' : '-translate-x-full')
          : cn('z-40', open ? 'w-64' : 'w-20'),
      )}
    >
      <motion.div
        initial={false}
        animate={{ width: isMobile ? 256 : open ? 256 : 80 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className="flex h-full w-full flex-col"
      >
        <div className="flex items-center justify-between px-3 py-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/webapplogo.png" alt="101 HRMgmt" className="h-7 w-7 shrink-0 rounded-lg object-cover shadow-md" />
            {(open || isMobile) && (
              <span className="text-sm font-semibold tracking-wide text-military-pale truncate">
                101HRMgmt
              </span>
            )}
          </div>
          {isMobile ? (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-700/80 bg-slate-900/60 text-slate-300 hover:bg-slate-800/80 focus:outline-none"
              aria-label="Close menu"
            >
              <IconX className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-700/80 bg-slate-900/60 text-slate-300 hover:bg-slate-800/80 focus:outline-none"
              aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <span className="sr-only">{open ? 'Collapse sidebar' : 'Expand sidebar'}</span>
              <div
                className={cn(
                  'h-3 w-3 border-l-2 border-b-2 border-slate-300 transition-transform',
                  open ? 'rotate-45 translate-x-[1px]' : '-rotate-135 -translate-x-[1px]',
                )}
              />
            </button>
          )}
        </div>
        {children}
      </motion.div>
    </div>
  );
}

export function SidebarBody({ className, children }) {
  return (
    <div className={cn('flex flex-1 min-h-0 flex-col justify-between px-3 py-4 gap-4', className)}>
      {children}
    </div>
  );
}

export function SidebarLink({ link, className }) {
  const { label, icon, href, badge } = link;
  const to = href ?? '#';
  const onNavigate = useContext(SidebarNavContext);

  return (
    <NavLink
      to={to}
      onClick={() => onNavigate?.()}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors',
          'hover:bg-slate-800/80 hover:text-military-pale',
          isActive && 'bg-slate-800 text-military-pale border border-military-light/40 shadow-sm',
          className,
        )
      }
      end
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-900/70 text-slate-200 group-hover:bg-military-base/90 group-hover:text-white">
        {icon}
      </span>
      <span className="truncate flex-1">{label}</span>
      {badge > 0 && (
        <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </NavLink>
  );
}
