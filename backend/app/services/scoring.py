from typing import List, Dict, Any

class RiskScorer:
    def calculate(self, profile: Dict[str, Any], vulnerabilities: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculates advanced risk scores, attack probabilities, and reconstruction completeness.
        Returns a dict containing:
        - overall_score
        - exposure_score
        - social_eng_score
        - osint_score
        - reconstruction_score (Identity Reconstruction Completeness)
        - attack_probabilities (dict of specific attack types)
        """
        # 1. OSINT Score: Completeness of public footprint gathered
        osint_base = 0
        if profile.get("emails"):
            osint_base += 25
        if profile.get("usernames"):
            osint_base += 20
        # Give points for each social/website link
        links_count = len(profile.get("social_links", []))
        if links_count > 0:
            osint_base += min(links_count * 15, 45)
        if profile.get("skills"):
            osint_base += 10
            
        osint_score = min(osint_base, 100)

        # 2. Exposure Score: Density of technical/architectural vulnerability exposure
        exposure_base = 0
        has_tech = False
        has_username = False
        
        for vuln in vulnerabilities:
            cat = vuln.get("category")
            sev = vuln.get("severity")
            
            # Severity mapping weights
            weight = 0
            if sev == "Critical":
                weight = 35
            elif sev == "High":
                weight = 25
            elif sev == "Medium":
                weight = 15
            else:
                weight = 5
                
            exposure_base += weight
            
            if cat == "Tech":
                has_tech = True
            if cat == "Username":
                has_username = True
                
        # Additional risk if both tech stack and username reuse are exposed (attacker maps credentials to tech)
        if has_tech and has_username:
            exposure_base += 10
            
        exposure_score = min(exposure_base, 100)

        # 3. Social Engineering Score: Viability and danger of direct human attacks (phishing, impersonation)
        social_base = 0
        has_email = bool(profile.get("emails"))
        has_company = bool(profile.get("company") and profile.get("company") != "Unknown")
        has_leaked = any(v.get("category") == "Credentials" for v in vulnerabilities)
        
        if has_email:
            social_base += 25
        if has_company:
            social_base += 25
        if has_leaked:
            social_base += 40
            
        # Cumulative multiplier if credentials, email, and target employer are all known
        if has_email and has_company and has_leaked:
            social_base += 10
            
        social_eng_score = min(social_base, 100)

        # 4. Overall Score: Weighted calculation
        weighted_score = int(
            (osint_score * 0.25) + 
            (exposure_score * 0.35) + 
            (social_eng_score * 0.40)
        )
        overall_score = max(min(weighted_score, 100), 5)

        # 5. Identity Reconstruction Score: How complete is the clone?
        reconstruction_factors = 0
        reconstruction_details = {
            "email_found": False,
            "employer_found": False,
            "github_found": False,
            "socials_found": False,
            "tech_stack_found": False
        }
        if profile.get("emails"):
            reconstruction_factors += 20
            reconstruction_details["email_found"] = True
        if profile.get("company") and profile.get("company") != "Unknown":
            reconstruction_factors += 20
            reconstruction_details["employer_found"] = True
        if profile.get("github_url") or "github.com" in str(profile.get("social_links")):
            reconstruction_factors += 20
            reconstruction_details["github_found"] = True
        if len(profile.get("social_links", [])) >= 2:
            reconstruction_factors += 20
            reconstruction_details["socials_found"] = True
        if profile.get("technologies"):
            reconstruction_factors += 20
            reconstruction_details["tech_stack_found"] = True
        
        reconstruction_score = max(min(reconstruction_factors, 100), 10)

        # 6. Attack Probability Engine: Likelihood of specific attack types
        prob_phishing = 15
        prob_recruiter = 10
        prob_cloud = 10
        prob_bec = 10

        if has_email:
            prob_phishing += 35
            prob_recruiter += 25
            prob_bec += 25
        if has_company:
            prob_recruiter += 30
            prob_bec += 30
        if has_leaked:
            prob_phishing += 30
            prob_bec += 20
            prob_cloud += 20
        if has_tech:
            prob_cloud += 50
            prob_phishing += 10

        return {
            "overall_score": overall_score,
            "exposure_score": exposure_score,
            "social_eng_score": social_eng_score,
            "osint_score": osint_score,
            "reconstruction_score": reconstruction_score,
            "reconstruction_details": reconstruction_details,
            "attack_probabilities": {
                "credential_phishing": min(prob_phishing, 95),
                "recruiter_scam": min(prob_recruiter, 95),
                "cloud_credential_theft": min(prob_cloud, 95),
                "business_email_compromise": min(prob_bec, 95)
            }
        }
