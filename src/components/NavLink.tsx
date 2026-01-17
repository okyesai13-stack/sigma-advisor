/**
 * NavLink Component
 * @version 1.0.0
 * @updated January 2025
 * 
 * A wrapper around React Router's NavLink that provides
 * enhanced className handling with active and pending states.
 */

import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  /** Base className applied to the link */
  className?: string;
  /** Additional className applied when the link is active */
  activeClassName?: string;
  /** Additional className applied when navigation is pending */
  pendingClassName?: string;
}

/**
 * Enhanced NavLink component with support for active and pending class names.
 * 
 * @example
 * ```tsx
 * <NavLink 
 *   to="/dashboard" 
 *   className="nav-item"
 *   activeClassName="nav-item--active"
 * >
 *   Dashboard
 * </NavLink>
 * ```
 */
const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(
            className,
            isActive && activeClassName,
            isPending && pendingClassName
          )
        }
        {...props}
      />
    );
  }
);

NavLink.displayName = "NavLink";

export { NavLink };
export type { NavLinkCompatProps };
