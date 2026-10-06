import { BookOpen, Map as MapIcon, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router';
import { cx } from '../components/cx.ts';
import { APP_NAME } from '../config/app.ts';
import styles from './TopBar.module.css';

function NavItem({ to, icon, children }: { to: string; icon: ReactNode; children: string }) {
  return (
    <NavLink to={to} className={({ isActive }) => cx(styles.navLink, isActive && styles.active)}>
      <span aria-hidden="true">{icon}</span>
      <span className={styles.navLabel}>{children}</span>
    </NavLink>
  );
}

export function TopBar() {
  return (
    <header className={styles.bar} data-print="hide">
      <Link to="/" className={styles.logo}>
        <svg viewBox="0 0 32 32" aria-hidden="true" className={styles.mark}>
          <path d="M9 11l-4 5 4 5M23 11l4 5-4 5M18 8l-4 16" />
        </svg>
        <span className={styles.name}>{APP_NAME}</span>
      </Link>
      <nav aria-label="Main" className={styles.nav}>
        <NavItem to="/map" icon={<MapIcon />}>
          Map
        </NavItem>
        <NavItem to="/cheatsheets" icon={<BookOpen />}>
          Cheat sheets
        </NavItem>
        <NavItem to="/profile" icon={<UserRound />}>
          Profile
        </NavItem>
      </nav>
    </header>
  );
}
