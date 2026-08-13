"use client";

import dynamic from "next/dynamic";
import { AppShell } from "@/components/layout/app-shell";

const HomeClient = dynamic(() => import("@/pages/home-client"), { ssr: false });

export default function Home() {
  return <HomeClient />;
}
