"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { IncidentCard, IncidentData } from "@/components/IncidentCard";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Fetch incidents
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/v1/incidents", {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Only keep Acknowledged or Resolved incidents
          const historical = (data.incidents || []).filter((i: IncidentData) => i.status !== 'Triggered');
          setIncidents(historical);
        }
      } catch (err) {
        console.error("Failed to fetch incidents:", err);
      }
    };
    if (user && token) fetchIncidents();
  }, [user, token]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Navbar />
        <main className="flex-1 w-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-mocha/30 border-t-mocha rounded-full animate-spin"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar />
      <main className="flex-1 w-full p-8 max-w-5xl mx-auto mt-8">
        <header className="mb-12 border-b border-mocha/30 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-cream tracking-tight flex items-center gap-4">
              <span>📋</span> Incident History
            </h1>
            <p className="text-cream/60 mt-2">View all acknowledged and resolved incidents for your team.</p>
          </div>
          <div className="px-4 py-2 bg-espresso-dark border border-mocha/50 rounded-xl text-cream font-medium">
            Total History: {incidents.length}
          </div>
        </header>

        {incidents.length === 0 ? (
          <div className="text-center py-20 glass-panel">
            <div className="text-6xl mb-4 opacity-80">🕊️</div>
            <h2 className="text-xl font-medium text-cream">No history yet</h2>
            <p className="text-cream/50 mt-2">When active incidents are acknowledged on the dashboard, they will appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {incidents.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
