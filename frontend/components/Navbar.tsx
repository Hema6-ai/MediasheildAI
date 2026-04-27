"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/detection", label: "Detections" },
  { href: "/graph", label: "Graph" },
  { href: "/insights", label: "Insights" },
];

export function Navbar() {
  const path = usePathname();
  return (
    <nav className="border-b border-white/10 px-4 md:px-6 py-4 flex items-center justify-between bg-gray-950/70 backdrop-blur-xl sticky top-0 z-40">
      <Link href="/" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 soft-ring">
        <Shield className="w-5 h-5 text-cyan-400" />
        <span className="font-semibold gradient-text">MediaShield AI</span>
      </Link>
      <div className="flex items-center gap-1 flex-wrap justify-end">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              path === n.href
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/8 border border-transparent"
            }`}>
            {n.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
