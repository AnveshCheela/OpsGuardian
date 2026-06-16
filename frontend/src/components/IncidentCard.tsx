import React, { useState } from "react";

export type IncidentData = {
  id: string;
  title: string;
  severity: string;
  status: string;
  aiSummary: string | null;
  aiSuggestedAction: string | null;
  createdAt: string;
  service: {
    name: string;
  };
  logs?: {
    logPreview: string;
  }[];
};

export const IncidentCard = ({ incident }: { incident: IncidentData }) => {
  const [status, setStatus] = useState(incident.status || 'Triggered');
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const handleAcknowledge = async () => {
    setIsAcknowledging(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/incidents/${incident.id}/acknowledge`, {
        method: 'PUT',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setStatus('Acknowledged');
      }
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    } finally {
      setIsAcknowledging(false);
    }
  };

  const logPreview = incident.logs && incident.logs.length > 0 ? incident.logs[0].logPreview : null;

  return (
    <div className={`glass-panel glass-panel-hover p-6 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out ${status === 'Acknowledged' ? 'border-green-900/50 bg-green-900/10' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-cream mb-1">{incident.title}</h3>
          <p className="text-sm text-cream/60">
            Service: <span className="text-cream font-medium">{incident.service?.name || "Unknown Service"}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {status === 'Triggered' && (
            <button 
              onClick={handleAcknowledge}
              disabled={isAcknowledging}
              className="bg-mocha/20 hover:bg-mocha/40 text-cream border border-mocha/50 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase transition-colors"
            >
              {isAcknowledging ? '...' : 'Acknowledge'}
            </button>
          )}
          {status === 'Acknowledged' && (
            <div className="bg-green-900/30 text-green-400 border border-green-900/50 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase flex items-center gap-1">
              ✓ Acknowledged
            </div>
          )}
          <div className={`status-badge ${incident.severity === 'Critical' ? 'status-critical' : 'status-high'}`}>
            <div className={`w-2 h-2 rounded-full bg-current ${status === 'Triggered' ? 'animate-pulse' : ''}`}></div>
            {incident.severity}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-black/40 rounded-xl p-4 border border-mocha/30">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-mocha" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h4 className="font-semibold text-cream">AI Root Cause Analysis</h4>
        </div>
        <p className="text-cream/80 text-sm mb-3">
          {incident.aiSummary || "Analysis pending..."}
        </p>
        
        {incident.aiSuggestedAction && (
          <div className="bg-mocha/10 border border-mocha/30 rounded-lg p-3">
            <p className="text-cream text-sm font-medium">
              💡 Suggested Action: {incident.aiSuggestedAction}
            </p>
          </div>
        )}
      </div>

      {showLogs && logPreview && (
        <div className="mt-4 bg-black/60 rounded-lg p-4 border border-mocha/30 font-mono text-xs text-cream/70 overflow-x-auto">
          <pre>{logPreview}</pre>
        </div>
      )}

      <div className="mt-4 flex justify-between items-center text-xs text-cream/50">
        <span>Detected at {new Date(incident.createdAt).toLocaleTimeString()}</span>
        {logPreview && (
          <button 
            onClick={() => setShowLogs(!showLogs)}
            className="text-mocha hover:text-cream transition-colors font-medium"
          >
            {showLogs ? 'Hide Raw Log \u2191' : 'View Raw Log \u2193'}
          </button>
        )}
      </div>
    </div>
  );
};
