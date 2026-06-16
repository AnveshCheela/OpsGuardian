"use client";

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/hooks/useSocket";
import { IncidentCard, IncidentData } from "@/components/IncidentCard";
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";


type ServiceOption = {
  id: string;
  name: string;
};

export default function Dashboard() {
  const { socket, isConnected } = useSocket();
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const { user, token, isLoading, isLeader } = useAuth();
  const router = useRouter();

  // Leader-only state
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [triggerForm, setTriggerForm] = useState({
    serviceId: '',
    title: '',
    description: '',
    severity: 'Medium' as string,
  });
  const [triggerLoading, setTriggerLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Fetch incidents
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/incidents`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIncidents(data.incidents || []);
        }
      } catch (err) {
        console.error("Failed to fetch incidents:", err);
      }
    };
    if (user && token) fetchIncidents();
  }, [user, token]);

  // WebSocket: join team room + listen for new incidents
  useEffect(() => {
    if (!socket || !user) return;

    if (user.teams && user.teams.length > 0) {
      socket.emit('join:team', { teamId: user.teams[0].id });
    }

    socket.on("new-incident", (newIncident: IncidentData) => {
      setIncidents((prev) => [newIncident, ...prev]);
    });

    return () => {
      socket.off("new-incident");
    };
  }, [socket, user]);



  // Leader: fetch services for trigger modal
  const fetchServices = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/services`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const svcs = data.services || [];
        setServices(svcs);
        if (svcs.length === 1) {
          setTriggerForm(prev => ({ ...prev, serviceId: svcs[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch services:", err);
    }
  }, [token]);



  const handleTriggerAlert = async () => {
    if (!triggerForm.serviceId || !triggerForm.title) return;
    setTriggerLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/incidents/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(triggerForm)
      });
      if (res.ok) {
        setShowTriggerModal(false);
        setTriggerForm({ serviceId: services.length === 1 ? services[0].id : '', title: '', description: '', severity: 'Medium' });
      }
    } catch (err) {
      console.error("Failed to trigger alert:", err);
    } finally {
      setTriggerLoading(false);
    }
  };

  const openTriggerModal = () => {
    fetchServices();
    setShowTriggerModal(true);
  };

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
      <main className="flex-1 w-full p-8 max-w-5xl mx-auto">



        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-cream tracking-tight">
              Active Incidents
            </h1>
            <p className="text-cream/60 mt-1">Real-time alert monitoring</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Leader: Trigger Alert Button */}
            {isLeader && (
              <button
                onClick={openTriggerModal}
                className="px-5 py-2.5 bg-mocha hover:bg-mocha/80 text-cream font-semibold rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-mocha/20 flex items-center gap-2"
              >
                <span className="text-lg">🚨</span>
                Trigger Alert
              </button>
            )}

            {/* Connection Status */}
            <div className="flex items-center gap-2 bg-espresso-dark px-4 py-2 rounded-full border border-mocha/50 shadow-sm">
              <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium text-cream/80">
                {isConnected ? 'Live Feed Active' : 'Disconnected'}
              </span>
            </div>
          </div>
        </header>

        {/* Main Feed */}
        <div className="space-y-6">
          {incidents.filter(i => i.status === 'Triggered').length === 0 ? (
            <div className="text-center py-20 glass-panel">
              <h2 className="text-xl font-medium text-cream">All systems operational</h2>
              <p className="text-cream/50 mt-2">Waiting for incoming alerts...</p>
            </div>
          ) : (
            incidents.filter(i => i.status === 'Triggered').map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))
          )}
        </div>
      </main>

      {/* Trigger Alert Modal */}
      {showTriggerModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-8 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-cream flex items-center gap-2">
                <span>🚨</span> Trigger Alert
              </h2>
              <button
                onClick={() => setShowTriggerModal(false)}
                className="text-cream/50 hover:text-cream text-xl transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              {/* Templates */}
              <div className="space-y-1 mb-2 pb-4 border-b border-mocha/30">
                <label className="text-sm font-medium text-cream/80 pl-1">Quick Templates</label>
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      setTriggerForm(prev => ({ ...prev, title: '', description: '', severity: 'Medium' }));
                    } else if (val === 'cpu') {
                      setTriggerForm(prev => ({ ...prev, title: 'High CPU Usage Detected', description: 'CPU usage exceeded 95% for more than 5 minutes on app-server-01.', severity: 'High' }));
                    } else if (val === 'db') {
                      setTriggerForm(prev => ({ ...prev, title: 'Database Connection Latency', description: 'Average query response time is over 500ms.', severity: 'Medium' }));
                    } else if (val === 'api') {
                      setTriggerForm(prev => ({ ...prev, title: 'API Gateway 502 Errors', description: 'Increased rate of 502 Bad Gateway errors on /api/v1/auth endpoints.', severity: 'Critical' }));
                    } else if (val === 'memory') {
                      setTriggerForm(prev => ({ ...prev, title: 'Memory Leak Warning', description: 'Process memory usage is steadily increasing and approaching 90% capacity.', severity: 'High' }));
                    } else if (val === 'disk') {
                      setTriggerForm(prev => ({ ...prev, title: 'Disk Space Critical', description: 'Volume /dev/sda1 is at 98% capacity. Imminent risk of write failures.', severity: 'Critical' }));
                    } else if (val === 'network') {
                      setTriggerForm(prev => ({ ...prev, title: 'Network Packet Loss', description: 'Detected 15% packet loss to the primary database replica.', severity: 'Medium' }));
                    }
                  }}
                  className="w-full px-4 py-3 bg-espresso-dark border border-mocha/50 rounded-xl text-cream focus:outline-none focus:ring-2 focus:ring-mocha/50 focus:border-mocha transition-all appearance-none"
                  defaultValue="custom"
                >
                  <option value="custom" className="bg-espresso-dark">✍️ Custom (Write your own)</option>
                  <option value="cpu" className="bg-espresso-dark">⚡ High CPU Usage Detected</option>
                  <option value="db" className="bg-espresso-dark">💾 Database Connection Latency</option>
                  <option value="api" className="bg-espresso-dark">⚠️ API Gateway 502 Errors</option>
                  <option value="memory" className="bg-espresso-dark">🧠 Memory Leak Warning</option>
                  <option value="disk" className="bg-espresso-dark">💽 Disk Space Critical</option>
                  <option value="network" className="bg-espresso-dark">🌐 Network Packet Loss</option>
                </select>
              </div>

              {/* Service Dropdown */}
              {services.length !== 1 && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-cream/80 pl-1">Service</label>
                  <select
                    value={triggerForm.serviceId}
                    onChange={(e) => setTriggerForm(prev => ({ ...prev, serviceId: e.target.value }))}
                    className="w-full px-4 py-3 bg-espresso-dark border border-mocha/50 rounded-xl text-cream focus:outline-none focus:ring-2 focus:ring-mocha/50 focus:border-mocha transition-all appearance-none"
                  >
                    <option value="" className="bg-espresso-dark">Select a service...</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id} className="bg-espresso-dark">{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-cream/80 pl-1">Title</label>
                <input
                  type="text"
                  value={triggerForm.title}
                  onChange={(e) => setTriggerForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-espresso-dark border border-mocha/50 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:ring-2 focus:ring-mocha/50 focus:border-mocha transition-all"
                  placeholder="Brief description of the incident"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-cream/80 pl-1">Description</label>
                <textarea
                  value={triggerForm.description}
                  onChange={(e) => setTriggerForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-espresso-dark border border-mocha/50 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:ring-2 focus:ring-mocha/50 focus:border-mocha transition-all resize-none"
                  placeholder="Detailed description..."
                />
              </div>

              {/* Severity */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-cream/80 pl-1">Severity</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Low', 'Medium', 'High', 'Critical'].map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setTriggerForm(prev => ({ ...prev, severity: sev }))}
                      className={`py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${
                        triggerForm.severity === sev
                          ? sev === 'Critical'
                            ? 'bg-red-900/40 text-red-400 border-red-900/70 shadow-[0_0_12px_rgba(220,38,38,0.3)]'
                            : sev === 'High'
                              ? 'bg-orange-900/40 text-orange-400 border-orange-900/70 shadow-[0_0_12px_rgba(234,88,12,0.3)]'
                              : sev === 'Medium'
                                ? 'bg-yellow-900/40 text-yellow-400 border-yellow-900/70 shadow-[0_0_12px_rgba(202,138,4,0.3)]'
                                : 'bg-blue-900/40 text-blue-400 border-blue-900/70 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                          : 'bg-espresso-dark/50 text-cream/50 border-mocha/30 hover:border-mocha/60'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleTriggerAlert}
                disabled={triggerLoading || !triggerForm.serviceId || !triggerForm.title}
                className="w-full py-3 bg-mocha hover:bg-mocha/80 text-cream font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:hover:transform-none flex justify-center items-center h-12"
              >
                {triggerLoading ? (
                  <div className="w-5 h-5 border-2 border-cream/30 border-t-cream rounded-full animate-spin"></div>
                ) : (
                  'Trigger Incident'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
