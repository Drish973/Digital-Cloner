import React, { useState, useEffect } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Shield, Eye, Terminal, FileText, 
  Activity, Download, ArrowRight, User, Trash2,
  RefreshCw, Layers, Upload, Users, Play
} from 'lucide-react';

const API_BASE = "http://localhost:8000/api";

type RoleMode = 'analyst' | 'manager' | 'admin';

export default function App() {
  // Input states
  const [formData, setFormData] = useState({
    name: '',
    github_url: '',
    linkedin_url: '',
    website_url: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Scan state
  const [activeScan, setActiveScan] = useState<any>(null);
  const [scanCache, setScanCache] = useState<Record<number, any>>({});
  const [pastScans, setPastScans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'graph' | 'timeline' | 'attacker' | 'username' | 'compare'>('dashboard');
  const [showHistory, setShowHistory] = useState(false);
  const [roleMode, setRoleMode] = useState<RoleMode>('analyst');

  // Admin dashboard stats & Replay states
  const [adminStats, setAdminStats] = useState<any>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [replayStep, setReplayStep] = useState<number>(0);

  // Username enum state
  const [enumInput, setEnumInput] = useState('');
  const [enumResults, setEnumResults] = useState<any[]>([]);
  const [isEnumLoading, setIsEnumLoading] = useState(false);

  // Compare scans state
  const [compareA, setCompareA] = useState<string>('');
  const [compareB, setCompareB] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  // Risk Reduction Simulator state
  const [mitigations, setMitigations] = useState({
    removeEmail: false,
    enableMfa: false,
    removeSecrets: false,
    hideEmployer: false
  });

  // Attack Replay Mode state
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayLogs, setReplayLogs] = useState<string[]>([]);

  // Predefined Demo Personas for Quick Scan Simulation
  const demoPersonas = [
    {
      name: "Alex Rivera",
      role: "Cloud DevOps Intern",
      github: "https://github.com/alex-rivera-devops",
      linkedin: "https://linkedin.com/in/alex-rivera-devops",
      website: "https://alex-rivera.dev",
      risk: "Critical",
      riskScore: 88,
      desc: "Junior devops seeking internship with public configs."
    },
    {
      name: "Sarah Jenkins",
      role: "Senior Frontend Dev",
      github: "https://github.com/sarah-codes",
      linkedin: "https://linkedin.com/in/sarah-jenkins-dev",
      website: "https://portfolio.sarah-jenkins.dev",
      risk: "Moderate",
      riskScore: 42,
      desc: "Front-end engineer with typical personal portfolio links."
    },
    {
      name: "Marcus Vance",
      role: "AI Research Engineer",
      github: "https://github.com/marcus-v-ai",
      linkedin: "https://linkedin.com/in/marcus-vance-ai",
      website: "https://vancetech.com",
      risk: "High",
      riskScore: 65,
      desc: "Freelance dev with active GCP assets and email exposed."
    }
  ];

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (roleMode === 'admin') {
      fetchAdminStats();
    }
  }, [roleMode]);

  const fetchAdminStats = async () => {
    setIsAdminLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/stats`);
      if (res.ok) {
        const data = await res.json();
        setAdminStats(data);
      }
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm("CRITICAL WARNING: Are you sure you want to purge all scanned target footprints, vulnerabilities, and records from the database? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/reset`, { method: 'POST' });
      if (res.ok) {
        alert("Database successfully reset.");
        setActiveScan(null);
        setScanCache({});
        fetchHistory();
        fetchAdminStats();
      }
    } catch (err) {
      alert("Failed to reset database.");
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/scans`);
      if (res.ok) {
        const data = await res.json();
        setPastScans(data);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const selectPersona = (persona: typeof demoPersonas[0]) => {
    setFormData({
      name: persona.name,
      github_url: persona.github,
      linkedin_url: persona.linkedin,
      website_url: persona.website
    });
    setSelectedFile(null);
    triggerScan({
      name: persona.name,
      github_url: persona.github,
      linkedin_url: persona.linkedin,
      website_url: persona.website
    });
  };

  const triggerScan = async (overrideData?: typeof formData) => {
    setIsLoading(true);
    setLogs([]);
    setActiveScan(null);
    setMitigations({
      removeEmail: false,
      enableMfa: false,
      removeSecrets: false,
      hideEmployer: false
    });

    const scanSteps = [
      "[i] Initializing footprint gathering engine...",
      "[i] Resolving URL DNS headers...",
      "[+] Scraping website contact tags (mailto: and socials)...",
      "[+] Querying public GitHub repository schemas...",
      "[+] Extracting exposed repository languages and configs...",
      "[+] Correlating identical user handles across platforms...",
      "[i] Executing credential breach index simulations...",
      "[i] Building Structured Digital Identity Model...",
      "[+] Launching Exposure Auditing Parser...",
      "[+] Executing AI Security Threat Scenario Analysis...",
      "[+] Finalizing OSINT risk calculations..."
    ];

    let step = 0;
    const interval = setInterval(() => {
      if (step < scanSteps.length) {
        setLogs(prev => [...prev, scanSteps[step]]);
        step++;
      } else {
        clearInterval(interval);
      }
    }, 400);

    try {
      let res;
      // If a resume PDF is uploaded, use multipart upload endpoint
      if (selectedFile && !overrideData) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", selectedFile);
        res = await fetch(`${API_BASE}/upload-resume`, {
          method: 'POST',
          body: formDataUpload
        });
      } else {
        const dataToSend = overrideData || formData;
        res = await fetch(`${API_BASE}/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend)
        });
      }

      clearInterval(interval);

      if (res.ok) {
        const data = await res.json();
        setScanCache(prev => ({ ...prev, [data.scan_id]: data }));
        setActiveScan(data);
        setActiveTab('dashboard');
        fetchHistory();
      } else {
        const err = await res.json();
        alert(`Scan Error: ${err.detail || 'Scan failed'}`);
      }
    } catch (err) {
      clearInterval(interval);
      alert("Failed to connect to the backend server. Make sure run.py is active on port 8000.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPastScan = async (id: number) => {
    if (scanCache[id]) {
      setActiveScan(scanCache[id]);
      setActiveTab('dashboard');
      setMitigations({
        removeEmail: false,
        enableMfa: false,
        removeSecrets: false,
        hideEmployer: false
      });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/scan/${id}`);
      if (res.ok) {
        const data = await res.json();
        setScanCache(prev => ({ ...prev, [id]: data }));
        setActiveScan(data);
        setActiveTab('dashboard');
        setMitigations({
          removeEmail: false,
          enableMfa: false,
          removeSecrets: false,
          hideEmployer: false
        });
      }
    } catch (err) {
      alert("Failed to load historical scan.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteScan = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this scan?")) return;
    try {
      const res = await fetch(`${API_BASE}/scan/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchHistory();
        setScanCache(prev => {
          const newCache = { ...prev };
          delete newCache[id];
          return newCache;
        });
        if (activeScan && activeScan.scan_id === id) {
          setActiveScan(null);
        }
      }
    } catch (err) {
      alert("Failed to delete scan.");
    }
  };

  const runUsernameEnum = async () => {
    if (!enumInput) return;
    setIsEnumLoading(true);
    setEnumResults([]);
    try {
      const res = await fetch(`${API_BASE}/check-username?username=${enumInput}`);
      if (res.ok) {
        const data = await res.json();
        setEnumResults(data);
      }
    } catch (err) {
      alert("Username check query failed.");
    } finally {
      setIsEnumLoading(false);
    }
  };

  const runComparison = async () => {
    if (!compareA || !compareB) {
      alert("Please select two different profiles to compare.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/compare?scan_a_id=${compareA}&scan_b_id=${compareB}`);
      if (res.ok) {
        const data = await res.json();
        setComparisonResult(data);
      }
    } catch (err) {
      alert("Failed to compare profiles.");
    }
  };

  const startReplay = () => {
    if (isReplaying || !activeScan) return;
    setIsReplaying(true);
    setReplayLogs([]);
    setReplayStep(0);
    
    const targetName = activeScan.profile.name || "Target";
    const company = activeScan.profile.company || "Unknown";
    const emails = activeScan.profile.emails || [];
    const emailStr = emails[0] || `${targetName.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    const techList = activeScan.profile.technologies || [];
    const tech = techList.length > 0 ? techList.slice(0, 3).join(", ") : "standard tools";
    const breaches = activeScan.vulnerabilities.filter((v: any) => v.category === "Credentials");
    const breachCount = breaches.length;
    const subject = activeScan.simulated_phishing?.subject || "Urgent Security Action Required";

    const hackerSteps = [
      `00:01 [Passive OSINT] Located ${targetName}'s public footprints. Mapped handles & profiles.`,
      `00:04 [Footprint Extract] Decoded personal email address '${emailStr}' from git commit histories.`,
      `00:07 [Target Correlation] Mapped corporate target employer '${company}' from professional networks.`,
      `00:10 [Tech Audit] Scanned repository languages. Found infrastructure signatures: ${tech}.`,
      `00:13 [Breach Correlate] Correlated HaveIBeenPwned index. Mapped email to ${breachCount} public leak(s).`,
      `00:16 [Exploit Construct] Compiled spear-phishing campaign to '${emailStr}' with subject: '${subject}'.`,
      `00:18 [Attack Vector Ready] Exploit simulation prepared. Clone Reconstruction Confidence: ${activeScan.profile.reconstruction_score}%.`
    ];

    let step = 0;
    setReplayStep(1);
    setReplayLogs([hackerSteps[0]]);

    const interval = setInterval(() => {
      step++;
      if (step < hackerSteps.length) {
        setReplayLogs(prev => [...prev, hackerSteps[step]]);
        setReplayStep(step + 1);
      } else {
        clearInterval(interval);
        setIsReplaying(false);
      }
    }, 1500);
  };

  const downloadReport = () => {
    if (!activeScan) return;
    window.open(`${API_BASE}/scan/${activeScan.scan_id}/report`);
  };

  // Mitigation calculator (Local UI state overrides)
  const getSimulatedScores = () => {
    if (!activeScan) return { overall: 0, exposure: 0, social: 0 };
    
    let overall = activeScan.scores.overall_score;
    let exposure = activeScan.scores.exposure_score;
    let social = activeScan.scores.social_eng_score;

    if (mitigations.removeEmail) {
      overall -= 18;
      social -= 25;
    }
    if (mitigations.enableMfa) {
      overall -= 15;
      social -= 20;
      exposure -= 10;
    }
    if (mitigations.removeSecrets) {
      overall -= 22;
      exposure -= 25;
    }
    if (mitigations.hideEmployer) {
      overall -= 10;
      social -= 15;
    }

    return {
      overall: Math.max(overall, 5),
      exposure: Math.max(exposure, 5),
      social: Math.max(social, 5)
    };
  };

  const sim = getSimulatedScores();

  // Helper styles
  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'Critical': return 'text-red-500 border-red-500 bg-red-950/30';
      case 'High': return 'text-orange-500 border-orange-500 bg-orange-950/30';
      case 'Medium': return 'text-yellow-500 border-yellow-500 bg-yellow-950/30';
      default: return 'text-green-500 border-green-500 bg-green-950/30';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 76) return 'text-red-500';
    if (score >= 51) return 'text-orange-500';
    if (score >= 26) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveScan(null)}>
            <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider text-cyan-400 font-mono">DIGITAL CLONE</h1>
              <p className="text-xs text-slate-400 font-mono">See Yourself Through a Hacker's Eyes</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Roles dropdown */}
            {activeScan && (
              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-850 px-2.5 py-1 rounded-lg">
                <span className="text-[10px] text-slate-500 font-mono">ROLE:</span>
                <select
                  value={roleMode}
                  onChange={(e) => setRoleMode(e.target.value as RoleMode)}
                  className="bg-transparent text-xs text-cyan-400 font-mono focus:outline-none cursor-pointer"
                >
                  <option value="analyst" className="bg-slate-900 text-slate-100">Analyst View</option>
                  <option value="manager" className="bg-slate-900 text-slate-100">Security Manager</option>
                  <option value="admin" className="bg-slate-900 text-slate-100">Administrator</option>
                </select>
              </div>
            )}

            <button 
              onClick={() => { setActiveScan(null); setActiveTab('compare'); }}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs font-mono flex items-center space-x-2 transition-all"
            >
              <Users className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Compare</span>
            </button>

            <button 
              onClick={() => { setActiveScan(null); setActiveTab('username'); }}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs font-mono flex items-center space-x-2 transition-all"
            >
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Username Map</span>
            </button>

            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs font-mono flex items-center space-x-2 transition-all"
            >
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Target Index ({pastScans.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Wrapper */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
        
        {/* Past Scans History Sidebar */}
        {showHistory && (
          <aside className="w-full md:w-64 glass-panel p-4 shrink-0 flex flex-col h-[600px] overflow-hidden animate-slide-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-sm font-bold font-mono text-cyan-400">Scan Database</span>
              <button onClick={() => setShowHistory(false)} className="text-xs text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {pastScans.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8 font-mono">No profiles scanned yet.</p>
              ) : (
                pastScans.map(scan => (
                  <div
                    key={scan.id}
                    onClick={() => loadPastScan(scan.id)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all hover:bg-slate-800/80 ${
                      activeScan?.scan_id === scan.id ? 'border-cyan-500 bg-slate-900' : 'border-slate-800 bg-slate-900/30'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold font-mono block truncate max-w-[130px]">{scan.target_name}</span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${getSeverityColor(scan.overall_score >= 76 ? 'Critical' : (scan.overall_score >= 51 ? 'High' : (scan.overall_score >= 26 ? 'Medium' : 'Low')))}`}>
                        {scan.overall_score}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-[10px] text-slate-500 font-mono">
                      <span>ID: #{scan.id}</span>
                      <button 
                        onClick={(e) => deleteScan(scan.id, e)} 
                        className="hover:text-red-400 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}

        {/* Dynamic Center Work Area */}
        <main className="flex-1 flex flex-col">
          
          {/* loading terminal overlay */}
          {isLoading && (
            <div className="flex-1 glass-panel p-6 flex flex-col justify-between font-mono h-[520px]">
              <div className="space-y-2 text-left text-xs md:text-sm">
                <div className="flex items-center space-x-2 text-cyan-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>EXTRACTING FOOTPRINTS & SYNTHESIZING CLONE GRAPH...</span>
                </div>
                <div className="border-b border-slate-800 my-4"></div>
                <div className="space-y-1 text-cyan-500/80">
                  {logs.map((log, i) => (
                    <div key={i} className={log.startsWith('[+') ? "text-cyan-300" : "text-slate-400"}>{log}</div>
                  ))}
                </div>
              </div>
              <div className="text-[10px] text-slate-500 text-center animate-pulse mt-4">
                DO NOT REFRESH - DEPLOYING THREAT CLONING PIPELINES
              </div>
            </div>
          )}

          {/* Setup / Scans Selection Page */}
          {!activeScan && !isLoading && (
            <div className="space-y-6">
              {/* Promo Banner */}
              <div className="glass-panel p-6 text-center space-y-3 relative overflow-hidden bg-gradient-to-r from-cyan-950/20 via-slate-900/60 to-red-950/10">
                <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>
                <h2 className="text-2xl font-bold text-slate-100 font-mono">Digital Identity Footprint Auditor</h2>
                <p className="text-sm text-slate-400 max-w-xl mx-auto">
                  Audit exposure levels across code repositories, resume portfolios, and public email indexes. Map how threat actors build attack pathways to hijack systems.
                </p>
                <div className="flex justify-center space-x-4 pt-3">
                  <button 
                    onClick={() => setActiveTab('compare')}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-mono border border-slate-800 rounded-lg flex items-center space-x-2"
                  >
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>Side-by-Side Comparison</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('username')}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-mono border border-slate-800 rounded-lg flex items-center space-x-2"
                  >
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span>Username Enumerator Map</span>
                  </button>
                </div>
              </div>

              {activeTab === 'compare' ? (
                <div className="glass-panel p-6 space-y-6">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-bold font-mono text-cyan-400 flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>ATTACK SURFACE COMPARISON TOOL</span>
                    </h3>
                    <button onClick={() => setActiveTab('dashboard')} className="text-xs text-slate-400 hover:text-white">Back to Scanner</button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 font-mono mb-1 block">Profile A</label>
                      <select 
                        value={compareA} 
                        onChange={(e) => setCompareA(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="">Select First Profile</option>
                        {pastScans.map(s => (
                          <option key={s.id} value={s.id}>{s.target_name} (Risk: {s.overall_score})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 font-mono mb-1 block">Profile B</label>
                      <select 
                        value={compareB} 
                        onChange={(e) => setCompareB(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="">Select Second Profile</option>
                        {pastScans.map(s => (
                          <option key={s.id} value={s.id}>{s.target_name} (Risk: {s.overall_score})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={runComparison}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono rounded-lg text-xs"
                  >
                    COMPARE PROFILE CLONES
                  </button>

                  {comparisonResult && (
                    <div className="overflow-x-auto border border-slate-800 rounded-lg font-mono text-xs">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
                            <th className="p-3">Metric</th>
                            <th className="p-3 text-cyan-400">{comparisonResult.person_a.name}</th>
                            <th className="p-3 text-pink-400">{comparisonResult.person_b.name}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          <tr>
                            <td className="p-3 font-bold">Overall Risk Score</td>
                            <td className={`p-3 font-bold ${getScoreColor(comparisonResult.person_a.overall_score)}`}>{comparisonResult.person_a.overall_score}/100</td>
                            <td className={`p-3 font-bold ${getScoreColor(comparisonResult.person_b.overall_score)}`}>{comparisonResult.person_b.overall_score}/100</td>
                          </tr>
                          <tr>
                            <td className="p-3">Exposed Emails</td>
                            <td className="p-3">{comparisonResult.person_a.emails_count}</td>
                            <td className="p-3">{comparisonResult.person_b.emails_count}</td>
                          </tr>
                          <tr>
                            <td className="p-3">Breach Intelligence Logs</td>
                            <td className="p-3 text-red-400">{comparisonResult.person_a.breaches_count} detected</td>
                            <td className="p-3 text-red-400">{comparisonResult.person_b.breaches_count} detected</td>
                          </tr>
                          <tr>
                            <td className="p-3">Social Profiles Linked</td>
                            <td className="p-3">{comparisonResult.person_a.socials_count}</td>
                            <td className="p-3">{comparisonResult.person_b.socials_count}</td>
                          </tr>
                          <tr>
                            <td className="p-3">Technology Dependencies</td>
                            <td className="p-3">{comparisonResult.person_a.techs_count}</td>
                            <td className="p-3">{comparisonResult.person_b.techs_count}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : activeTab === 'username' ? (
                <div className="glass-panel p-6 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-bold font-mono text-cyan-400 flex items-center space-x-2">
                      <Terminal className="w-4 h-4" />
                      <span>CROSS-PLATFORM IDENTITY ENUMERATOR</span>
                    </h3>
                    <button onClick={() => setActiveTab('dashboard')} className="text-xs text-slate-400 hover:text-white">Back to Scanner</button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      placeholder="Enter handle e.g. alex-devops"
                      value={enumInput}
                      onChange={(e) => setEnumInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                    <button 
                      onClick={runUsernameEnum}
                      className="px-4 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono rounded-lg text-xs"
                    >
                      {isEnumLoading ? 'Searching...' : 'Scan handle'}
                    </button>
                  </div>

                  {enumResults.length > 0 && (
                    <div className="space-y-3 font-mono text-xs text-left">
                      <span className="text-slate-400 block border-b border-slate-800 pb-1">EXPOSED PROFILES ENUMERATED MAP:</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {enumResults.map((p, idx) => (
                          <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center">
                            <div>
                              <span className="font-bold text-slate-200 block">{p.platform}</span>
                              <a href={p.url} target="_blank" rel="noreferrer" className="text-[10px] text-cyan-500 hover:underline truncate max-w-[190px] block">{p.url}</a>
                            </div>
                            <span className="text-[10px] bg-red-950/20 text-red-400 border border-red-500/10 px-2 py-0.5 rounded-full font-bold">{p.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Form and Persona Grid */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Input URL Form & PDF Upload */}
                  <div className="lg:col-span-5 flex flex-col space-y-6">
                    {/* File Upload card */}
                    <div className="glass-panel p-5 space-y-3 text-left">
                      <h3 className="text-xs font-bold font-mono text-cyan-400 flex items-center space-x-2">
                        <Upload className="w-4 h-4" />
                        <span>INTELLIGENT RESUME EXTRACTION</span>
                      </h3>
                      <div className="border border-dashed border-slate-800 hover:border-cyan-500/40 rounded-lg p-4 bg-slate-950/40 text-center transition-all cursor-pointer relative">
                        <input 
                          type="file" 
                          accept=".pdf" 
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                        <span className="text-xs font-mono block text-slate-400">
                          {selectedFile ? selectedFile.name : "Upload resume.pdf for footprint correlating"}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 block mt-1">Parses emails, phones, skills, LinkedIn, & repos</span>
                      </div>
                    </div>

                    {/* Manual specifications */}
                    <div className="glass-panel p-6 flex flex-col justify-between flex-1">
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold font-mono text-cyan-400 flex items-center space-x-2">
                          <Terminal className="w-4 h-4" />
                          <span>TARGET EXPOSURE SCOPE</span>
                        </h3>
                        
                        <div className="space-y-3 text-left">
                          <div>
                            <label className="text-xs text-slate-400 font-mono mb-1 block">Target Name (Optional)</label>
                            <input
                              type="text"
                              name="name"
                              placeholder="e.g. John Doe"
                              value={formData.name}
                              onChange={handleInputChange}
                              disabled={!!selectedFile}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-40"
                            />
                          </div>
                          
                          <div>
                            <label className="text-xs text-slate-400 font-mono mb-1 block">GitHub Profile URL</label>
                            <input
                              type="text"
                              name="github_url"
                              placeholder="e.g. github.com/username"
                              value={formData.github_url}
                              onChange={handleInputChange}
                              disabled={!!selectedFile}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-40"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-slate-400 font-mono mb-1 block">LinkedIn Profile URL</label>
                            <input
                              type="text"
                              name="linkedin_url"
                              placeholder="e.g. linkedin.com/in/username"
                              value={formData.linkedin_url}
                              onChange={handleInputChange}
                              disabled={!!selectedFile}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-40"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-slate-400 font-mono mb-1 block">Personal Website URL</label>
                            <input
                              type="text"
                              name="website_url"
                              placeholder="e.g. myportfolio.dev"
                              value={formData.website_url}
                              onChange={handleInputChange}
                              disabled={!!selectedFile}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-40"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => triggerScan()}
                        disabled={!formData.github_url && !formData.linkedin_url && !formData.website_url && !formData.name && !selectedFile}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-slate-950 font-bold p-3 rounded-lg text-sm font-mono mt-6 flex items-center justify-center space-x-2 transition-all shadow-lg shadow-cyan-600/15"
                      >
                        <span>EXECUTE ATTACK AUDIT</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Preconfigured Personas Selector */}
                  <div className="lg:col-span-7 space-y-4">
                    <h3 className="text-sm font-bold font-mono text-cyan-400 flex items-center space-x-2 text-left">
                      <User className="w-4 h-4" />
                      <span>DEMO SIMULATION PORTFOLIOS</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {demoPersonas.map((persona, i) => (
                        <div
                          key={i}
                          onClick={() => selectPersona(persona)}
                          className="glass-panel p-4 text-left cursor-pointer border border-slate-800/80 hover:border-cyan-500/50 bg-slate-900/30 hover:bg-slate-900/80 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold font-mono text-slate-100">{persona.name}</span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${
                                persona.risk === 'Critical' ? 'text-red-400 border-red-500/20 bg-red-950/20' : 
                                persona.risk === 'High' ? 'text-orange-400 border-orange-500/20 bg-orange-950/20' : 
                                'text-yellow-400 border-yellow-500/20 bg-yellow-950/20'
                              }`}>{persona.risk}</span>
                            </div>
                            <span className="text-[10px] text-cyan-400 font-mono">{persona.role}</span>
                            <p className="text-[11px] text-slate-400 font-mono mt-3 leading-relaxed">{persona.desc}</p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                            <span>Risk index: {persona.riskScore}</span>
                            <span className="text-cyan-400 flex items-center">Scan Now →</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Educational footer */}
                    <div className="glass-panel p-4 text-xs text-slate-400 font-mono space-y-2 border-slate-800/40 text-left">
                      <p className="font-bold text-slate-300">🛡️ Responsible Disclosure Agreement</p>
                      <p className="leading-relaxed">
                        This platform operates passively and does not run active credential audits, denial of service exploits, or system payloads. It aggregates public OSINT footprint links and evaluates threat vulnerability indices based on custom scoring definitions.
                      </p>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* Active Scan Dashboard Panel */}
          {activeScan && !isLoading && (
            <div className="space-y-6">
              
              {/* Scan Report Title Banner */}
              <div className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                <div>
                  <h2 className="text-lg font-bold font-mono text-cyan-400 flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>REPORT: {activeScan.profile.name} ({activeScan.profile.role})</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
                    Scan ID: #{activeScan.scan_id} | Corporate Employer: {activeScan.profile.company}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={downloadReport}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono flex items-center space-x-2 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF Report</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveScan(null)}
                    className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-xs font-mono text-slate-300"
                  >
                    New Scan
                  </button>
                </div>
              </div>

              {/* Advanced Risk Gauges Row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                
                {/* Overall Score Dial */}
                <div className="glass-panel p-4 text-center flex flex-col justify-between items-center">
                  <span className="text-[10px] font-bold font-mono text-slate-400 block mb-2">OVERALL RISK</span>
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="34" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                      <circle 
                        cx="40" cy="40" r="34" 
                        stroke={sim.overall >= 76 ? "#ef4444" : (sim.overall >= 51 ? "#f97316" : (sim.overall >= 26 ? "#eab308" : "#10b981"))} 
                        strokeWidth="6" 
                        fill="transparent" 
                        strokeDasharray={213.5}
                        strokeDashoffset={213.5 - (213.5 * sim.overall) / 100}
                      />
                    </svg>
                    <span className={`absolute text-lg font-bold font-mono ${getScoreColor(sim.overall)}`}>
                      {sim.overall}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 mt-2">
                    {sim.overall >= 76 ? 'CRITICAL RISK' : (sim.overall >= 51 ? 'HIGH RISK' : (sim.overall >= 26 ? 'MODERATE RISK' : 'LOW RISK'))}
                  </span>
                </div>

                {/* Identity Reconstruction Completeness */}
                <div className="glass-panel p-4 text-center flex flex-col justify-between items-center">
                  <span className="text-[10px] font-bold font-mono text-slate-400 block mb-2">RECONSTRUCTION</span>
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="34" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                      <circle 
                        cx="40" cy="40" r="34" stroke="#a855f7" strokeWidth="6" fill="transparent" 
                        strokeDasharray={213.5}
                        strokeDashoffset={213.5 - (213.5 * activeScan.profile.reconstruction_score) / 100}
                      />
                    </svg>
                    <span className="absolute text-lg font-bold font-mono text-purple-400">
                      {activeScan.profile.reconstruction_score}%
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 mt-2">IDENTITY CLONE CONFIDENCE</span>
                </div>

                {/* Exposure Score */}
                <div className="glass-panel p-4 text-center flex flex-col justify-between items-center">
                  <span className="text-[10px] font-bold font-mono text-slate-400 block mb-2">EXPOSURE</span>
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="34" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                      <circle 
                        cx="40" cy="40" r="34" stroke="#3b82f6" strokeWidth="6" fill="transparent" 
                        strokeDasharray={213.5}
                        strokeDashoffset={213.5 - (213.5 * sim.exposure) / 100}
                      />
                    </svg>
                    <span className="absolute text-lg font-bold font-mono text-blue-400">{sim.exposure}</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 mt-2">TECHNICAL FOOTPRINT</span>
                </div>

                {/* Social Eng Score */}
                <div className="glass-panel p-4 text-center flex flex-col justify-between items-center">
                  <span className="text-[10px] font-bold font-mono text-slate-400 block mb-2">SOCIAL ENGINEERING</span>
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="34" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                      <circle 
                        cx="40" cy="40" r="34" stroke="#ec4899" strokeWidth="6" fill="transparent" 
                        strokeDasharray={213.5}
                        strokeDashoffset={213.5 - (213.5 * sim.social) / 100}
                      />
                    </svg>
                    <span className="absolute text-lg font-bold font-mono text-pink-400">{sim.social}</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 mt-2">HUMAN VECTOR RISK</span>
                </div>

                {/* OSINT Score */}
                <div className="glass-panel p-4 text-center flex flex-col justify-between items-center">
                  <span className="text-[10px] font-bold font-mono text-slate-400 block mb-2">OSINT COMPLETENESS</span>
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="34" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                      <circle 
                        cx="40" cy="40" r="34" stroke="#10b981" strokeWidth="6" fill="transparent" 
                        strokeDasharray={213.5}
                        strokeDashoffset={213.5 - (213.5 * activeScan.scores.osint_score) / 100}
                      />
                    </svg>
                    <span className="absolute text-lg font-bold font-mono text-emerald-400">{activeScan.scores.osint_score}</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 mt-2">CORRELATED DOMAINS</span>
                </div>

              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-800 space-x-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`pb-3 px-4 font-mono text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
                    activeTab === 'dashboard' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Audit Findings</span>
                </button>

                <button
                  onClick={() => setActiveTab('graph')}
                  className={`pb-3 px-4 font-mono text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
                    activeTab === 'graph' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Attack Path Graph</span>
                </button>

                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`pb-3 px-4 font-mono text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
                    activeTab === 'timeline' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Data Timeline</span>
                </button>

                <button
                  onClick={() => setActiveTab('attacker')}
                  className={`pb-3 px-4 font-mono text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
                    activeTab === 'attacker' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>Attacker's Perspective</span>
                </button>
              </div>

              {/* Role-filtered layout viewports */}
              <div className="min-h-[400px]">
                {/* 1. Vulnerability Findings Table & Dashboard view */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Administrator Viewport */}
                    {roleMode === 'admin' && (
                      <div className="space-y-6 text-left">
                        {isAdminLoading ? (
                          <div className="glass-panel p-10 flex flex-col items-center justify-center font-mono text-xs text-cyan-400 space-y-3">
                            <RefreshCw className="w-6 h-6 animate-spin" />
                            <span>LOADING ADMINISTRATIVE METRICS...</span>
                          </div>
                        ) : (
                          <>
                            <div className="glass-panel p-5 space-y-4">
                              <h3 className="text-xs font-bold font-mono text-cyan-400">SYSTEM ADMINISTRATIVE DASHBOARD</h3>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs mt-2">
                                <div className="p-4 bg-slate-950 rounded-lg border border-slate-850">
                                  <span className="text-slate-400 font-bold block mb-1">Total Profiles Audited</span>
                                  <span className="text-2xl font-bold text-cyan-400">{adminStats?.total_scans ?? pastScans.length}</span>
                                </div>
                                <div className="p-4 bg-slate-950 rounded-lg border border-slate-850">
                                  <span className="text-slate-400 font-bold block mb-1">Identified Vulnerabilities</span>
                                  <span className="text-2xl font-bold text-cyan-400">{adminStats?.total_vulnerabilities ?? 12}</span>
                                </div>
                                <div className="p-4 bg-slate-950 rounded-lg border border-slate-850">
                                  <span className="text-slate-400 font-bold block mb-1">Average Risk Coefficient</span>
                                  <span className="text-2xl font-bold text-cyan-400">{adminStats?.average_risk_score ?? 65}/100</span>
                                </div>
                                <div className="p-4 bg-slate-950 rounded-lg border border-slate-850">
                                  <span className="text-slate-400 font-bold block mb-1">Critical Severity Threats</span>
                                  <span className="text-2xl font-bold text-red-500">{adminStats?.vulnerabilities_by_severity?.Critical ?? 3}</span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="glass-panel p-5 space-y-4">
                                <h3 className="text-xs font-bold font-mono text-slate-350">SYSTEM ENGINE CONTEXT</h3>
                                <div className="space-y-3 font-mono text-xs text-slate-400">
                                  <div className="flex justify-between border-b border-slate-850 pb-2">
                                    <span>Risk Assessment Model</span>
                                    <span className="text-cyan-400">OSINT-Risk-V3 (Rule-Based + AI)</span>
                                  </div>
                                  <div className="flex justify-between border-b border-slate-850 pb-2">
                                    <span>Scoring Weights</span>
                                    <span>OSINT (25%) | Tech (35%) | Human (40%)</span>
                                  </div>
                                  <div className="flex justify-between border-b border-slate-850 pb-2">
                                    <span>Integrations</span>
                                    <span className="text-emerald-400 font-bold">HaveIBeenPwned API (Active)</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Database Provider</span>
                                    <span>SQLModel (SQLite Local)</span>
                                  </div>
                                </div>
                              </div>

                              <div className="glass-panel p-5 space-y-4 flex flex-col justify-between">
                                <div>
                                  <h3 className="text-xs font-bold font-mono text-red-400">CRITICAL SYSTEM CONTROLS</h3>
                                  <p className="text-[11px] text-slate-400 font-mono mt-2 leading-relaxed">
                                    Purging database records clears out all target index profiles, compiled graphs, history logs, and vulnerabilities list. This action is irrevocable.
                                  </p>
                                </div>
                                <button
                                  onClick={handleResetDatabase}
                                  className="w-full py-2.5 bg-red-900/60 hover:bg-red-800 border border-red-500/25 text-red-200 font-bold font-mono rounded-lg text-xs tracking-wider transition-all"
                                >
                                  PURGE DATABASE AND SYSTEM LOGS
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Manager Viewport: Attack Probability Engine, Risk Simulator & Mapped Checklist */}
                    {roleMode === 'manager' && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                        {/* Probability cards */}
                        <div className="lg:col-span-6 glass-panel p-5 space-y-4 flex flex-col justify-between">
                          <div>
                            <h3 className="text-xs font-bold font-mono text-slate-350">ATTACK PROBABILITY MAP</h3>
                            <div className="space-y-3 font-mono text-xs mt-3">
                              <div>
                                <div className="flex justify-between text-slate-300 mb-1">
                                  <span>Credential Phishing Risk</span>
                                  <span>{activeScan.profile.attack_probabilities.credential_phishing}%</span>
                                </div>
                                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                                  <div className="bg-red-500 h-full" style={{width: `${activeScan.profile.attack_probabilities.credential_phishing}%`}}></div>
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-slate-300 mb-1">
                                  <span>Recruiter Impersonation Scam</span>
                                  <span>{activeScan.profile.attack_probabilities.recruiter_scam}%</span>
                                </div>
                                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                                  <div className="bg-orange-500 h-full" style={{width: `${activeScan.profile.attack_probabilities.recruiter_scam}%`}}></div>
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-slate-300 mb-1">
                                  <span>Cloud Access / API Key Spray</span>
                                  <span>{activeScan.profile.attack_probabilities.cloud_credential_theft}%</span>
                                </div>
                                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                                  <div className="bg-amber-500 h-full" style={{width: `${activeScan.profile.attack_probabilities.cloud_credential_theft}%`}}></div>
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-slate-300 mb-1">
                                  <span>Business Email Compromise (BEC)</span>
                                  <span>{activeScan.profile.attack_probabilities.business_email_compromise}%</span>
                                </div>
                                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                                  <div className="bg-yellow-500 h-full" style={{width: `${activeScan.profile.attack_probabilities.business_email_compromise}%`}}></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Reconstruction Score checklist */}
                          <div className="border-t border-slate-800/80 pt-4 mt-4">
                            <h3 className="text-xs font-bold font-mono text-purple-400 mb-3">CLONE RECONSTRUCTION CHECKLIST</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono">
                              <div className="flex items-center space-x-2 bg-slate-950 p-2 rounded">
                                <span className={activeScan.profile.reconstruction_details?.email_found ? "text-purple-400 font-bold" : "text-slate-500"}>
                                  {activeScan.profile.reconstruction_details?.email_found ? "✓" : "✗"} Email Found
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 bg-slate-950 p-2 rounded">
                                <span className={activeScan.profile.reconstruction_details?.employer_found ? "text-purple-400 font-bold" : "text-slate-500"}>
                                  {activeScan.profile.reconstruction_details?.employer_found ? "✓" : "✗"} Employer Found
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 bg-slate-950 p-2 rounded">
                                <span className={activeScan.profile.reconstruction_details?.github_found ? "text-purple-400 font-bold" : "text-slate-500"}>
                                  {activeScan.profile.reconstruction_details?.github_found ? "✓" : "✗"} GitHub Mapped
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 bg-slate-950 p-2 rounded">
                                <span className={activeScan.profile.reconstruction_details?.socials_found ? "text-purple-400 font-bold" : "text-slate-500"}>
                                  {activeScan.profile.reconstruction_details?.socials_found ? "✓" : "✗"} Social Mapped
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 bg-slate-950 p-2 rounded col-span-1 md:col-span-2">
                                <span className={activeScan.profile.reconstruction_details?.tech_stack_found ? "text-purple-400 font-bold" : "text-slate-500"}>
                                  {activeScan.profile.reconstruction_details?.tech_stack_found ? "✓" : "✗"} Tech Stack Mapped
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Risk Reduction Simulator */}
                        <div className="lg:col-span-6 glass-panel p-5 space-y-4 flex flex-col justify-between">
                          <div>
                            <h3 className="text-xs font-bold font-mono text-slate-350">RISK MITIGATION SIMULATOR</h3>
                            <p className="text-[11px] text-slate-400 font-mono leading-relaxed mt-1">
                              Simulate how remediating exposures decreases risk metrics:
                            </p>
                            <div className="space-y-2 font-mono text-xs mt-3">
                              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-slate-950">
                                <input 
                                  type="checkbox" 
                                  checked={mitigations.removeEmail} 
                                  onChange={(e) => setMitigations({ ...mitigations, removeEmail: e.target.checked })}
                                  className="accent-cyan-500"
                                />
                                <span>Remove Public Email (-18 Risk)</span>
                              </label>

                              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-slate-950">
                                <input 
                                  type="checkbox" 
                                  checked={mitigations.enableMfa} 
                                  onChange={(e) => setMitigations({ ...mitigations, enableMfa: e.target.checked })}
                                  className="accent-cyan-500"
                                />
                                <span>Enable Multi-Factor Authentication (-15 Risk)</span>
                              </label>

                              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-slate-950">
                                <input 
                                  type="checkbox" 
                                  checked={mitigations.removeSecrets} 
                                  onChange={(e) => setMitigations({ ...mitigations, removeSecrets: e.target.checked })}
                                  className="accent-cyan-500"
                                />
                                <span>Clean Exposed Git Configurations (-22 Risk)</span>
                              </label>

                              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-slate-950">
                                <input 
                                  type="checkbox" 
                                  checked={mitigations.hideEmployer} 
                                  onChange={(e) => setMitigations({ ...mitigations, hideEmployer: e.target.checked })}
                                  className="accent-cyan-500"
                                />
                                <span>Mask Target Corporate Affiliations (-10 Risk)</span>
                              </label>
                            </div>
                          </div>

                          {/* Before vs After comparison widget */}
                          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-850 mt-4 space-y-2 font-mono text-xs">
                            <span className="text-[10px] text-slate-500 font-bold block">RISK MITIGATION FORECAST</span>
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-[9px] text-slate-500 block">BASE RISK</span>
                                <span className="text-lg font-bold text-red-500">{activeScan.scores.overall_score}/100</span>
                              </div>
                              <span className="text-slate-500 text-base">➔</span>
                              <div>
                                <span className="text-[9px] text-slate-500 block">SIMULATED RISK</span>
                                <span className={`text-lg font-bold ${getScoreColor(sim.overall)}`}>{sim.overall}/100</span>
                              </div>
                              <div className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-right">
                                <span className="text-[10px] text-emerald-400 font-bold">-{activeScan.scores.overall_score - sim.overall} pts</span>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Analyst view: Exposure findings, Resume Intel, and Vulnerabilities */}
                    {roleMode === 'analyst' && (
                      <div className="space-y-6 text-left">
                        {/* Resume Intel Card */}
                        {(activeScan.profile.phones?.length > 0 || activeScan.profile.certifications?.length > 0) && (
                          <div className="glass-panel p-5 space-y-4">
                            <h3 className="text-xs font-bold font-mono text-cyan-400 flex items-center space-x-2">
                              <Terminal className="w-4 h-4 text-cyan-400" />
                              <span>RESUME INTELLIGENCE SUMMARY & CORRELATION</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                              {activeScan.profile.phones?.length > 0 && (
                                <div className="p-3 bg-slate-950 rounded border border-slate-850">
                                  <span className="text-slate-500 block mb-1">Phone Number(s) Found</span>
                                  <span className="text-slate-200">{activeScan.profile.phones.join(", ")}</span>
                                </div>
                              )}
                              {activeScan.profile.certifications?.length > 0 && (
                                <div className="p-3 bg-slate-950 rounded border border-slate-850">
                                  <span className="text-slate-500 block mb-1">Certifications parsed</span>
                                  <span className="text-cyan-400 font-bold">{activeScan.profile.certifications.join(", ")}</span>
                                </div>
                              )}
                              {activeScan.profile.companies?.length > 0 && (
                                <div className="p-3 bg-slate-950 rounded border border-slate-850">
                                  <span className="text-slate-500 block mb-1">Corporate Target Employer History</span>
                                  <span className="text-slate-200">{activeScan.profile.companies.join(", ")}</span>
                                </div>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-2 bg-slate-950 p-2.5 rounded">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                              <span>Extracted endpoints aligned and correlated with active profile scan indices. Mapped target handles across public repos.</span>
                            </div>
                          </div>
                        )}

                        {/* Breach Logs index */}
                        {activeScan.vulnerabilities.some((v: any) => v.category === "Credentials") && (
                          <div className="glass-panel p-5 space-y-3">
                            <h3 className="text-xs font-bold font-mono text-red-400 flex items-center space-x-2">
                              <Shield className="w-4 h-4 text-red-500" />
                              <span>BREACH INTELLIGENCE (HAVE I BEEN PWNED INDEX SEARCH)</span>
                            </h3>
                            <div className="space-y-3">
                              {activeScan.vulnerabilities.filter((v: any) => v.category === "Credentials").map((v: any, idx: number) => (
                                <div key={idx} className="p-4 bg-slate-950/80 border border-red-500/20 rounded-lg font-mono text-xs flex justify-between items-start">
                                  <div className="space-y-1 max-w-[80%]">
                                    <span className="font-bold text-red-400 block">{v.title}</span>
                                    <span className="text-slate-400 block leading-relaxed">{v.description}</span>
                                  </div>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold text-red-400 border border-red-500/30 bg-red-950/40 uppercase">
                                    {v.severity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Vulnerability details table */}
                        <div className="glass-panel overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left font-mono text-xs">
                              <thead>
                                <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
                                  <th className="p-4">Severity</th>
                                  <th className="p-4">Category</th>
                                  <th className="p-4">Vulnerability Details</th>
                                  <th className="p-4">Source</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800">
                                {activeScan.vulnerabilities.map((vuln: any, i: number) => (
                                  <tr key={i} className="hover:bg-slate-900/30">
                                    <td className="p-4">
                                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getSeverityColor(vuln.severity)}`}>
                                        {vuln.severity}
                                      </span>
                                    </td>
                                    <td className="p-4 font-bold text-slate-350">{vuln.category}</td>
                                    <td className="p-4 max-w-sm text-left">
                                      <div className="font-bold text-slate-200">{vuln.title}</div>
                                      <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">{vuln.description}</div>
                                    </td>
                                    <td className="p-4 text-slate-450">{vuln.source}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Attack Path Graph (React Flow) */}
                {activeTab === 'graph' && (
                  <div className="glass-panel p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs font-mono text-slate-400 gap-2 border-b border-slate-800 pb-3">
                      <span>INTERACTIVE ATTACK PIPELINE VISUALIZATION</span>
                      <span className="flex flex-wrap items-center gap-4">
                        <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500 block"></span><span>Source</span></span>
                        <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span><span>Exposed Info</span></span>
                        <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 block"></span><span>Exploit Vector</span></span>
                        <span className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600 block"></span><span>Outcome</span></span>
                      </span>
                    </div>

                    {/* Attack Replay Control Center in Graph View */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 animate-slide-in">
                      <div className="flex items-center space-x-3 shrink-0">
                        <button
                          onClick={startReplay}
                          disabled={isReplaying}
                          className="px-3.5 py-1.5 bg-red-900/60 hover:bg-red-800 disabled:opacity-40 text-red-100 font-bold font-mono rounded text-[10px] flex items-center space-x-1.5 transition-all cursor-pointer shadow-lg shadow-red-900/20"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isReplaying ? 'EMULATOR ACTIVE' : 'RUN ATTACK REPLAY'}</span>
                        </button>
                        {isReplaying && (
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                            <span className="text-[10px] text-red-400 font-mono">STEP {replayStep}/7</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 font-mono text-[11px] text-left text-slate-300 truncate max-w-full md:max-w-[480px]">
                        {replayLogs.length > 0 ? (
                          <span className="text-red-400 font-bold">&gt;&gt; {replayLogs[replayLogs.length - 1]}</span>
                        ) : (
                          <span className="text-slate-500 italic">Click simulator button to run timeline replay and watch the graph illuminate.</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="h-[480px] w-full rounded-xl overflow-hidden border border-slate-800">
                      <ReactFlow
                        nodes={activeScan.graph.nodes.map((n: any) => {
                          const stepToHighlightNode: Record<number, string[]> = {
                            1: ['src-0', 'src-1', 'src-2', 'src-fallback'],
                            2: ['data-email'],
                            3: ['data-company'],
                            4: ['data-tech'],
                            5: ['data-credentials'],
                            6: ['exp-phish', 'exp-stuffing', 'exp-generic'],
                            7: ['impact-compromise']
                          };
                          const isHighlighted = isReplaying && stepToHighlightNode[replayStep]?.includes(n.id);
                          let customClass = n.className;
                          if (isHighlighted) {
                            if (n.id.startsWith('src-')) {
                              customClass = "border border-cyan-400 bg-cyan-950/90 text-cyan-200 p-3 rounded-md shadow-lg shadow-cyan-400/50 font-mono text-xs w-48 text-center scale-105 transition-all duration-350";
                            } else if (n.id.startsWith('data-')) {
                              customClass = "border border-amber-400 bg-amber-950/90 text-amber-200 p-3 rounded-md shadow-lg shadow-amber-500/50 font-mono text-xs w-48 text-center scale-105 transition-all duration-350";
                            } else if (n.id.startsWith('exp-')) {
                              customClass = "border border-rose-400 bg-rose-950/90 text-rose-200 p-3 rounded-md shadow-lg shadow-rose-500/50 font-mono text-xs w-48 text-center scale-105 transition-all duration-350 animate-pulse";
                            } else if (n.id.startsWith('impact-')) {
                              customClass = "border-2 border-red-600 bg-red-950/95 text-red-200 p-3 rounded-md shadow-2xl shadow-red-500/80 font-mono text-xs w-56 text-center animate-pulse scale-105 transition-all duration-350";
                            }
                          }
                          return {
                            ...n,
                            className: customClass,
                            data: {
                              label: (
                                <div className="text-center font-mono">
                                  <div className="font-bold text-xs">{n.data.label}</div>
                                  <div className="text-[9px] opacity-75 mt-1 truncate max-w-[170px]">{n.data.description}</div>
                                </div>
                              )
                            }
                          };
                        })}
                        edges={activeScan.graph.edges.map((e: any) => {
                          const stepToHighlightNode: Record<number, string[]> = {
                            1: ['src-0', 'src-1', 'src-2', 'src-fallback'],
                            2: ['data-email'],
                            3: ['data-company'],
                            4: ['data-tech'],
                            5: ['data-credentials'],
                            6: ['exp-phish', 'exp-stuffing', 'exp-generic'],
                            7: ['impact-compromise']
                          };
                          const activeNodes = stepToHighlightNode[replayStep] || [];
                          const isEdgeActive = isReplaying && (activeNodes.includes(e.source) || activeNodes.includes(e.target));
                          return {
                            ...e,
                            style: isEdgeActive ? { stroke: '#ef4444', strokeWidth: 4 } : e.style,
                            animated: isEdgeActive ? true : e.animated
                          };
                        })}
                        fitView
                      >
                        <Background color="#334155" gap={16} />
                        <Controls />
                      </ReactFlow>
                    </div>
                  </div>
                )}

                {/* 3. Timeline View */}
                {activeTab === 'timeline' && (
                  <div className="glass-panel p-6 space-y-6">
                    <h3 className="text-xs font-bold font-mono text-slate-350 text-left">CHRONOLOGICAL DISCOVERY TRAJECTORY</h3>
                    
                    <div className="relative pl-6 border-l border-slate-800 space-y-8 font-mono">
                      {activeScan.timeline.map((item: any, i: number) => (
                        <div key={i} className="relative text-left">
                          <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-slate-950 border-2 border-cyan-500 flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                          </div>
                          
                          <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <span className="text-sm font-bold text-cyan-400">{item.platform} ({item.year})</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">{item.event}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Attacker's Perspective Console */}
                {activeTab === 'attacker' && (
                  <div className="space-y-6">
                    
                    {/* Standout feature: Attack Replay Mode */}
                    <div className="hazard-panel p-4 space-y-3 text-left">
                      <div className="flex justify-between items-center border-b border-red-500/20 pb-2 mb-2">
                        <h4 className="text-xs font-bold font-mono text-red-400 flex items-center space-x-2">
                          <Play className="w-4 h-4 text-red-500" />
                          <span>ATTACK REPLAY MODE: ADVERSARY EMULATOR</span>
                        </h4>
                        <button 
                          onClick={startReplay}
                          disabled={isReplaying}
                          className="px-3 py-1 bg-red-900/60 hover:bg-red-800 disabled:opacity-40 text-red-100 font-bold font-mono rounded text-[10px] flex items-center space-x-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isReplaying ? 'SCANNING...' : 'SIMULATE ATTACKER INVESTIGATION'}</span>
                        </button>
                      </div>
                      
                      <div className="bg-slate-950 rounded-lg p-3 h-48 overflow-y-auto font-mono text-[11px] text-red-500/80 space-y-1">
                        {replayLogs.length === 0 ? (
                          <div className="text-slate-500 italic py-8 text-center">Click the button above to begin timeline replay simulation.</div>
                        ) : (
                          replayLogs.map((log, idx) => (
                            <div key={idx} className="animate-pulse">
                              <span className="text-slate-500 mr-2">&gt;&gt;</span>{log}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Hacker observations */}
                      <div className="lg:col-span-5 hazard-panel p-5 space-y-4 font-mono text-xs flex flex-col justify-between text-left">
                        <div className="space-y-4">
                          <h3 className="text-sm font-bold text-red-400 flex items-center space-x-2">
                            <Terminal className="w-4 h-4 text-red-500" />
                            <span>HACKER OBSERVATION LOG</span>
                          </h3>
                          <div className="border-b border-slate-800/80 my-2"></div>
                          <ul className="space-y-3 text-slate-300">
                            {activeScan.attacker_perspective.map((obs: string, i: number) => (
                              <li key={i} className="leading-relaxed flex items-start space-x-2">
                                <span className="text-red-500 font-bold shrink-0">[-]</span>
                                <span>{obs}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-3 text-[10px] text-red-400 mt-4">
                          <span className="font-bold block mb-1">🔥 Vulnerability Exploitation Vector</span>
                          Leverages structural trust loops built from public engineering repositories.
                        </div>
                      </div>

                      {/* Phishing simulator mockup */}
                      <div className="lg:col-span-7 glass-panel p-5 space-y-4 flex flex-col text-left">
                        <h3 className="text-xs font-bold font-mono text-slate-305 flex items-center space-x-2">
                          <Eye className="w-4 h-4 text-cyan-400" />
                          <span>SIMULATED PHISHING CAMPAIGN PAYLOAD</span>
                        </h3>
                        
                        {/* Fake email client mockup */}
                        <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col font-mono text-xs">
                          <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-slate-400 text-[10px]">
                            <span>INCOMING SIMULATED INBOX</span>
                            <span className="w-3.5 h-3.5 rounded-full bg-red-500 block opacity-75"></span>
                          </div>
                          <div className="p-3 border-b border-slate-800 text-slate-300 space-y-1">
                            <div><span className="text-slate-500">From:</span> {activeScan.simulated_phishing.sender}</div>
                            <div><span className="text-slate-500">Subject:</span> {activeScan.simulated_phishing.subject}</div>
                          </div>
                          <div className="p-4 text-slate-400 whitespace-pre-wrap leading-relaxed min-h-[180px]">
                            {activeScan.simulated_phishing.body}
                          </div>
                        </div>

                        {/* Psychological triggers */}
                        <div className="space-y-1.5 font-mono text-[11px] text-slate-400">
                          <span className="text-slate-300 font-bold">Psychological Triggers Exploited:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {activeScan.simulated_phishing.psychological_triggers.map((trig: string, idx: number) => (
                              <span key={idx} className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-cyan-400">
                                {trig}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/80 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center font-mono text-[10px] text-slate-500">
          Digital Clone © 2026. Designed for Portfolio Showcase. All mock auditing operations are static simulations.
        </div>
      </footer>
    </div>
  );
}
