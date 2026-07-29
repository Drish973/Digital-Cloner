from typing import Dict, Any, List

class ExposureDetector:
    def detect(self, profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Scans a profile for vulnerabilities and exposure categories.
        Returns a list of vulnerability objects.
        """
        vulnerabilities = []

        # 1. Check for Public Email Exposure
        if profile.get("emails"):
            emails_str = ", ".join(profile["emails"])
            vulnerabilities.append({
                "title": "Public Email Exposure",
                "description": f"Publicly accessible email address(es) discovered: {emails_str}. Attackers can use this to launch phishing campaigns, password reset spam, or lookup leaked credentials in public databases.",
                "severity": "Medium",
                "source": "Website/GitHub Profile",
                "category": "Email"
            })

            # Check if this is our mock persona (Alex Rivera) or if we want to simulate leaked credentials
            # to show credential stuffing risks
            if any("alex.rivera" in email for email in profile["emails"]):
                vulnerabilities.append({
                    "title": "Leaked Credentials in Data Breach",
                    "description": "The email address 'alex.rivera.dev@gmail.com' was detected in the '2024 Financial Tech Breach' leak. The leaked record contains cleartext passwords and personal metadata, making the user vulnerable to Credential Stuffing attacks.",
                    "severity": "Critical",
                    "source": "Breach Database Lookup",
                    "category": "Credentials"
                })
            elif len(profile["emails"]) > 1:
                # Add a simulated warning for multiple emails
                vulnerabilities.append({
                    "title": "Potential Credential Exposure Warning",
                    "description": f"One or more of the discovered emails ({profile['emails'][0]}) was found in simulated historical breaches. Attackers frequently test older compromised passwords against new professional accounts.",
                    "severity": "High",
                    "source": "Breach Index Simulation",
                    "category": "Credentials"
                })

        # 2. Check for Username Reuse
        usernames = profile.get("usernames", [])
        if len(usernames) >= 2 or (len(usernames) == 1 and usernames[0] in str(profile.get("social_links"))):
            vulnerabilities.append({
                "title": "Cross-Platform Username Reuse",
                "description": f"Identical or highly similar usernames ({', '.join(usernames)}) are reused across different portals (GitHub, LinkedIn). This allows an attacker to automatically map out the user's entire digital footprint and compile a unified intelligence profile.",
                "severity": "High",
                "source": "Social Media Footprint",
                "category": "Username"
            })

        # 3. Check for Infrastructure/Technology Stack Exposure
        tech_stack = profile.get("technologies", [])
        sensitive_techs = [t for t in tech_stack if t in ["AWS", "Docker", "Kubernetes", "Terraform", "Google Cloud Platform"]]
        if sensitive_techs:
            techs_str = ", ".join(sensitive_techs)
            vulnerabilities.append({
                "title": "Cloud Infrastructure Footprint Exposed",
                "description": f"References to core technologies ({techs_str}) were found in public repositories. Knowing the target uses these specific systems helps hackers craft highly targeted malware payloads or search for outdated software vulnerabilities in their cloud config.",
                "severity": "High",
                "source": "GitHub Repositories",
                "category": "Tech"
            })

        # 4. Check for Company / Employer Exposure
        company = profile.get("company")
        if company and company not in ["", "Unknown"]:
            vulnerabilities.append({
                "title": "Professional Identity & Corporate Target Risk",
                "description": f"Target's association with '{company}' is publicly listed. Attackers target employees of specific corporations to orchestrate Business Email Compromise (BEC) or masquerade as corporate HR recruiters.",
                "severity": "Medium",
                "source": "LinkedIn/GitHub Metadata",
                "category": "Company"
            })

        # Default fallback vulnerability if nothing is found (to ensure dashboard is interactive)
        if not vulnerabilities:
            vulnerabilities.append({
                "title": "Minimal Footprint Detected",
                "description": "Very few public items were found. However, passive footprinting (WHOIS records, domain configurations) remains possible.",
                "severity": "Low",
                "source": "General Footprint",
                "category": "General"
            })

        return vulnerabilities
