import os
import json
import google.generativeai as genai
from typing import Dict, Any, List

class AISecurityAnalyst:
    def __init__(self):
        # Read API key if available
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None

    def analyze(self, profile: Dict[str, Any], vulnerabilities: List[Dict[str, Any]], risk_score: int) -> Dict[str, Any]:
        """
        Creates AI-grade social engineering scenario analysis.
        Falls back to rule-based generation if no API key is active.
        """
        if self.model:
            try:
                # Prepare prompt for Gemini
                prompt = f"""
                You are an expert Cybersecurity Red Teamer and Social Engineering Specialist.
                Analyze the following public footprint data:
                Profile: {json.dumps(profile)}
                Vulnerabilities Identified: {json.dumps(vulnerabilities)}
                Calculated Risk Score: {risk_score}/100

                Generate a JSON object with the exact keys:
                - "attacker_observations": List of 3 brief observations of how an attacker views this target (e.g. "Public GitHub reveals cloud expertise").
                - "simulated_phishing": A mockup of a realistic spear-phishing email or social engineering attempt targeting this user. Include keys: "subject", "sender", "body", "psychological_triggers" (e.g., urgency, authority, trust).
                - "recomm_list": List of 3 actionable remediation steps.
                - "executive_summary": A professional, 2-3 sentence assessment of the user's social engineering vulnerability.

                Return ONLY the valid JSON, no markdown wrapper or backticks.
                """
                response = self.model.generate_content(prompt)
                
                # Try parsing response
                cleaned_text = response.text.strip()
                if cleaned_text.startswith("```json"):
                    cleaned_text = cleaned_text[7:]
                if cleaned_text.endswith("```"):
                    cleaned_text = cleaned_text[:-3]
                
                return json.loads(cleaned_text.strip())
            except Exception as e:
                print(f"Gemini API generation failed: {e}. Falling back to template analysis.")

        # Fallback Template Generation
        return self._generate_fallback(profile, vulnerabilities, risk_score)

    def _generate_fallback(self, profile: Dict[str, Any], vulnerabilities: List[Dict[str, Any]], risk_score: int) -> Dict[str, Any]:
        """High-fidelity rule-based fallback when Gemini API is not configured."""
        name = profile.get("name", "Target")
        company = profile.get("company", "their current employer")
        emails = profile.get("emails", [])
        email_str = emails[0] if emails else f"{name.lower().replace(' ', '.')}@gmail.com"
        
        # Determine dominant tech
        techs = profile.get("technologies", [])
        tech_ref = techs[0] if techs else "Docker and cloud workflows"

        # Attacker observations based on actual metadata
        observations = [
            f"Public footprint reveals {name}'s career trajectory, skills, and affiliations.",
        ]
        if emails:
            observations.append(f"Direct connection point established: Public email address is accessible ({email_str}).")
        else:
            observations.append("Indirect connection points exist via social platforms and web portfolios.")

        if techs:
            observations.append(f"Target discloses tech stack dependency, specifically referencing: {', '.join(techs[:3])}.")
        else:
            observations.append("Target advertises software engineering capabilities and repository history.")

        # Phishing scenario based on target's profile
        if "intern" in profile.get("role", "").lower():
            subject = "URGENT: Review Your Internship Placement & Contract Details"
            sender = "hr-onboarding@fintech-innovators-contracts.com"
            body = f"Hi {name},\n\nHope you are having a productive week. We are finalizing the summer cohort contracts for the Devops team at {company}.\n\nOur system shows that your background verification is pending. Please log in to our secure employee portal below within 24 hours to review your contract terms and submit your onboarding documents, otherwise your start date may be delayed:\n\n[Verify Contract & Sign In]\n\nBest regards,\n\nHR Onboarding Services\n{company}"
            triggers = ["Urgency (24-hour deadline)", "Trust (Impersonating HR)", "Relevance (Matches role & company)"]
        else:
            subject = f"Security Alert: Action Required for {company} Repository Access"
            sender = "security-alerts@github-enterprise-ops.com"
            body = f"Hello {name},\n\nWe detected a login attempt to your {company} GitHub workspace using an unrecognized device. Because your profile indicates you manage infrastructure assets using {tech_ref}, we have temporarily restricted your write access to protect project pipelines.\n\nTo restore your profile permissions, please verify your credentials here immediately:\n\n[Verify Device & Unlock Write Access]\n\nRegards,\n\n{company} DevSecOps Team"
            triggers = ["Fear / Anxiety (Account Lock)", "Authority (Corporate Security Team)", "High Relevance (Refers to target's tech dependencies)"]

        recomms = [
            "Enable multi-factor authentication (MFA) on all developer portals and corporate profiles.",
            "Remove exposed personal email addresses from public git config metadata and resumes.",
            "Exercise extreme caution with inbound recruiter offers or security warnings that demand logging in through external links."
        ]

        exec_summary = f"The target exhibits an overall risk profile of {risk_score}/100. Due to public information exposure linking their identity, employer, and developer tools, an attacker could orchestrate a targeted social engineering campaign (such as credential harvesting or fake HR onboarding) with a high probability of success."

        return {
            "attacker_observations": observations,
            "simulated_phishing": {
                "subject": subject,
                "sender": sender,
                "body": body,
                "psychological_triggers": triggers
            },
            "recomm_list": recomms,
            "executive_summary": exec_summary
        }
