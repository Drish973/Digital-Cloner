from typing import Dict, Any, List

class AttackPathGenerator:
    def generate(self, profile: Dict[str, Any], vulnerabilities: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Builds a React Flow compatible graph of nodes and edges based on exposure findings.
        """
        nodes = []
        edges = []

        # Track layouts
        x_center = 350
        y_step = 130

        # 1. Source Nodes (Entry points)
        source_nodes = []
        if profile.get("social_links"):
            for idx, link in enumerate(profile["social_links"]):
                label = "Personal Website"
                if "github.com" in link:
                    label = "GitHub Portfolio"
                elif "linkedin.com" in link:
                    label = "LinkedIn Profile"
                
                node_id = f"src-{idx}"
                source_nodes.append(node_id)
                
                # Position source nodes horizontally at the top
                x_pos = x_center + (idx - (len(profile["social_links"]) - 1) / 2) * 200
                nodes.append({
                    "id": node_id,
                    "type": "input",
                    "data": {"label": label, "description": link},
                    "position": {"x": x_pos, "y": 50},
                    "className": "border border-cyan-500 bg-slate-900/90 text-cyan-400 p-3 rounded-md shadow-lg font-mono text-xs w-48 text-center"
                })
        else:
            # Fallback source node
            nodes.append({
                "id": "src-fallback",
                "type": "input",
                "data": {"label": "OSINT Footprint", "description": "Public Metadata Index"},
                "position": {"x": x_center, "y": 50},
                "className": "border border-cyan-500 bg-slate-900/90 text-cyan-400 p-3 rounded-md shadow-lg font-mono text-xs w-48 text-center"
            })
            source_nodes.append("src-fallback")

        # 2. Exposed Data Nodes (Derived from vulnerabilities)
        data_nodes = []
        y_data = 50 + y_step
        
        # Categorize our vulnerabilities to build data nodes
        vuln_by_cat = {v["category"]: v for v in vulnerabilities}

        idx = 0
        for cat, vuln in vuln_by_cat.items():
            node_id = f"data-{cat.lower()}"
            data_nodes.append((node_id, cat))
            
            # Position data nodes horizontally in row 2
            x_pos = x_center + (idx - (len(vuln_by_cat) - 1) / 2) * 200
            nodes.append({
                "id": node_id,
                "data": {"label": vuln["title"], "description": vuln["source"]},
                "position": {"x": x_pos, "y": y_data},
                "className": "border border-amber-500 bg-slate-900/90 text-amber-400 p-3 rounded-md shadow-lg font-mono text-xs w-48 text-center"
            })
            
            # Link all source nodes to all data nodes
            for src_id in source_nodes:
                edges.append({
                    "id": f"edge-{src_id}-{node_id}",
                    "source": src_id,
                    "target": node_id,
                    "animated": True,
                    "style": {"stroke": "#06b6d4", "strokeWidth": 2}
                })
            idx += 1

        # 3. Attack Simulation/Exploitation Vector Nodes
        exploit_nodes = []
        y_exploit = y_data + y_step
        
        # We determine exploit paths based on what data is available
        has_email = "Email" in vuln_by_cat
        has_company = "Company" in vuln_by_cat
        has_credentials = "Credentials" in vuln_by_cat

        exploit_idx = 0
        
        if has_email and has_company:
            # Spear Phishing Vector
            node_id = "exp-phish"
            exploit_nodes.append(node_id)
            nodes.append({
                "id": node_id,
                "data": {"label": "Targeted Spear-Phishing", "description": "Fake recruiter campaign targeting email"},
                "position": {"x": x_center - 100, "y": y_exploit},
                "className": "border border-rose-500 bg-slate-900/90 text-rose-400 p-3 rounded-md shadow-lg font-mono text-xs w-48 text-center"
            })
            # Connect relevant data to phishing
            if "data-email" in [dn[0] for dn in data_nodes]:
                edges.append({
                    "id": "edge-email-phish",
                    "source": "data-email",
                    "target": node_id,
                    "animated": True,
                    "style": {"stroke": "#f59e0b", "strokeWidth": 2}
                })
            if "data-company" in [dn[0] for dn in data_nodes]:
                edges.append({
                    "id": "edge-company-phish",
                    "source": "data-company",
                    "target": node_id,
                    "animated": True,
                    "style": {"stroke": "#f59e0b", "strokeWidth": 2}
                })
            exploit_idx += 1

        if has_credentials or "Tech" in vuln_by_cat:
            # Credential stuffing or tech target exploit
            node_id = "exp-stuffing"
            exploit_nodes.append(node_id)
            desc_text = "Credential Stuffing" if has_credentials else "Cloud Auth Misconfig Spray"
            nodes.append({
                "id": node_id,
                "data": {"label": desc_text, "description": "Attempting compromised/sprayed keys against logins"},
                "position": {"x": x_center + 100, "y": y_exploit},
                "className": "border border-rose-500 bg-slate-900/90 text-rose-400 p-3 rounded-md shadow-lg font-mono text-xs w-48 text-center"
            })
            # Connect data to stuffing
            if "data-credentials" in [dn[0] for dn in data_nodes]:
                edges.append({
                    "id": "edge-creds-stuffing",
                    "source": "data-credentials",
                    "target": node_id,
                    "animated": True,
                    "style": {"stroke": "#f59e0b", "strokeWidth": 2}
                })
            if "data-tech" in [dn[0] for dn in data_nodes]:
                edges.append({
                    "id": "edge-tech-stuffing",
                    "source": "data-tech",
                    "target": node_id,
                    "animated": True,
                    "style": {"stroke": "#f59e0b", "strokeWidth": 2}
                })

        # Fallback exploit if we had none
        if not exploit_nodes:
            node_id = "exp-generic"
            exploit_nodes.append(node_id)
            nodes.append({
                "id": node_id,
                "data": {"label": "Passive Monitoring", "description": "Long-term OSINT footprint mapping"},
                "position": {"x": x_center, "y": y_exploit},
                "className": "border border-rose-500 bg-slate-900/90 text-rose-400 p-3 rounded-md shadow-lg font-mono text-xs w-48 text-center"
            })
            for dn_id, _ in data_nodes:
                edges.append({
                    "id": f"edge-{dn_id}-generic",
                    "source": dn_id,
                    "target": node_id,
                    "animated": True,
                    "style": {"stroke": "#f59e0b", "strokeWidth": 2}
                })

        # 4. Ultimate Impact Node (Bottom)
        y_impact = y_exploit + y_step
        impact_node_id = "impact-compromise"
        nodes.append({
            "id": impact_node_id,
            "type": "output",
            "data": {"label": "Corporate Account Takeover", "description": "Unauthorized access to internal databases"},
            "position": {"x": x_center, "y": y_impact},
            "className": "border-2 border-red-600 bg-red-950/90 text-red-200 p-3 rounded-md shadow-2xl font-mono text-xs w-56 text-center animate-pulse"
        })

        # Link exploit nodes to ultimate impact
        for exp_id in exploit_nodes:
            edges.append({
                "id": f"edge-{exp_id}-impact",
                "source": exp_id,
                "target": impact_node_id,
                "animated": True,
                "style": {"stroke": "#ef4444", "strokeWidth": 3}
            })

        return {"nodes": nodes, "edges": edges}
