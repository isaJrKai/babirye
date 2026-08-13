"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="flex items-center justify-center h-screen bg-black text-emerald-400 font-mono">Initializing BABIRYE v10.0.0...</div>;

  return (
    <div className="min-h-screen bg-black text-white font-mono p-8">
      <h1 className="text-2xl font-bold text-emerald-400">BABIRYE v10.0.0</h1>
      <p className="text-gray-400 mt-2">Security Operations Platform — Online</p>
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-emerald-400">9</div>
          <div className="text-xs text-gray-500">Active Agents</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-amber-400">3</div>
          <div className="text-xs text-gray-500">Critical Alerts</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-sky-400">31</div>
          <div className="text-xs text-gray-500">Sensors Online</div>
        </div>
      </div>
    </div>
  );
}