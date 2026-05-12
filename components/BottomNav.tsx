"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items: { href: string; label: string; icon: string }[] = [
  { href: "/", label: "Home", icon: "◎" },
  { href: "/workout", label: "Train", icon: "⛌" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(8,8,8,0.92)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid #161616",
        display: "flex",
        zIndex: 50,
        padding: "8px 6px max(8px, env(safe-area-inset-bottom))",
      }}
    >
      {items.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "6px 4px",
              textDecoration: "none",
              color: active ? "#fff" : "#444",
              transition: "color 0.15s",
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 2 }}>{item.icon}</div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.1em",
              }}
            >
              {item.label.toUpperCase()}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
