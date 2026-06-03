import re
import requests
from bs4 import BeautifulSoup
from typing import Dict, Any, List, Optional

# Mock profiles database for high-fidelity demos
MOCK_PERSONAS = {
    "alex-rivera": {
        "name": "Alex Rivera",
        "role": "Cloud DevOps Intern",
        "company": "FinTech Innovators",
        "emails": ["alex.rivera.dev@gmail.com", "arivera@fintechinnovators.io"],
        "usernames": ["alex-devops", "alex_rivera_sec"],
        "skills": ["Python", "Docker", "Kubernetes", "AWS", "Bash", "Terraform"],
        "technologies": ["AWS", "Docker", "Kubernetes", "Terraform", "GitHub Actions"],
        "social_links": [
            "https://github.com/alex-devops",
            "https://linkedin.com/in/alex-rivera-devops",
            "https://twitter.com/alex_devops_intern"
        ],
        "history": {
            "github_created": "2024",
            "website_created": "2025",
            "linkedin_created": "2026"
        }
    },
    "sarah-jenkins": {
        "name": "Sarah Jenkins",
        "role": "Senior Frontend Engineer",
        "company": "TechCorp",
        "emails": ["s.jenkins@techcorp.io", "sarah.codes.frontend@gmail.com"],
        "usernames": ["sarah-codes", "sjenkins_dev"],
        "skills": ["React", "TypeScript", "Next.js", "Tailwind CSS", "Node.js", "Figma"],
        "technologies": ["React", "Vercel", "Next.js", "Tailwind CSS", "NodeJS"],
        "social_links": [
            "https://github.com/sarah-codes",
            "https://linkedin.com/in/sarah-jenkins-dev",
            "https://portfolio.sarah-jenkins.dev"
        ],
        "history": {
            "github_created": "2021",
            "website_created": "2023",
            "linkedin_created": "2024"
        }
    },
    "marcus-vance": {
        "name": "Marcus Vance",
        "role": "AI Research Engineer",
        "company": "Cognitive AI Lab",
        "emails": ["marcus.vance@vancetech.com", "mvance@cognitiveailab.org"],
        "usernames": ["marcus-v-ai", "marcusvance"],
        "skills": ["Python", "PyTorch", "Docker", "FastAPI", "MongoDB", "OpenAI API"],
        "technologies": ["FastAPI", "MongoDB", "PyTorch", "Docker", "Google Cloud Platform"],
        "social_links": [
            "https://github.com/marcus-v-ai",
            "https://linkedin.com/in/marcus-vance-ai",
            "https://x.com/marcusv_ai"
        ],
        "history": {
            "github_created": "2022",
            "website_created": "2024",
            "linkedin_created": "2025"
        }
    }
}

class OSINTCollector:
    def __init__(self, github_token: Optional[str] = None):
        self.headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        if github_token:
            self.github_headers = {"Authorization": f"token {github_token}"}
        else:
            self.github_headers = {}

    def collect(self, name: Optional[str] = None, github_url: Optional[str] = None, 
                linkedin_url: Optional[str] = None, website_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Coordinates collection from multiple OSINT channels.
        If a username matches a mock persona, retrieves high-fidelity mock data.
        Otherwise, attempts real scraping and API queries.
        """
        # 1. Check if we are running a demo persona
        for key, persona in MOCK_PERSONAS.items():
            # Match if the name or any URLs contain the key
            if (name and key in name.lower()) or \
               (github_url and key in github_url.lower()) or \
               (linkedin_url and key in linkedin_url.lower()) or \
               (website_url and key in website_url.lower()):
                return persona

        # 2. Real Scraping & API resolution
        profile = {
            "name": name or "Target Profile",
            "role": "Software Professional",
            "company": "Unknown",
            "emails": [],
            "usernames": [],
            "skills": [],
            "technologies": [],
            "social_links": [],
            "history": {
                "github_created": "2023",
                "website_created": "2024",
                "linkedin_created": "2025"
            }
        }

        # Collect social links
        for url in [github_url, linkedin_url, website_url]:
            if url:
                profile["social_links"].append(url)

        # Scrape Github
        if github_url:
            gh_data = self._scrape_github(github_url)
            if gh_data:
                profile["usernames"].append(gh_data["username"])
                if gh_data.get("email"):
                    profile["emails"].append(gh_data["email"])
                if gh_data.get("name") and not name:
                    profile["name"] = gh_data["name"]
                if gh_data.get("company"):
                    profile["company"] = gh_data["company"]
                
                profile["skills"].extend(gh_data.get("languages", []))
                profile["technologies"].extend(gh_data.get("technologies", []))
                profile["history"]["github_created"] = gh_data.get("created_at", "2023")[:4]

        # Scrape Website
        if website_url:
            web_data = self._scrape_website(website_url)
            if web_data:
                profile["emails"].extend(web_data.get("emails", []))
                profile["technologies"].extend(web_data.get("technologies", []))
                for link in web_data.get("social_links", []):
                    if link not in profile["social_links"]:
                        profile["social_links"].append(link)
                profile["history"]["website_created"] = "2024" # Default fallback for scraped sites

        # Mock LinkedIn processing (since direct scraping of LinkedIn is blocked/unreliable)
        if linkedin_url:
            # Extract name/company hints from the LinkedIn URL structure
            match = re.search(r"linkedin\.com/in/([^/]+)", linkedin_url)
            if match:
                username = match.group(1).replace("-", " ").title()
                profile["usernames"].append(match.group(1))
                if profile["name"] == "Target Profile":
                    profile["name"] = username

        # Clean duplicates
        profile["emails"] = list(set(profile["emails"]))
        profile["usernames"] = list(set(profile["usernames"]))
        profile["skills"] = list(set(profile["skills"]))
        profile["technologies"] = list(set(profile["technologies"]))

        return profile

    def _scrape_github(self, url: str) -> Optional[Dict[str, Any]]:
        """Queries the public GitHub REST API for profile and repository information."""
        # Extract username
        match = re.search(r"github\.com/([^/]+)", url)
        if not match:
            return None
        username = match.group(1)

        result = {
            "username": username,
            "name": "",
            "company": "",
            "email": "",
            "languages": [],
            "technologies": [],
            "created_at": "2023"
        }

        try:
            # Get User Details
            user_res = requests.get(f"https://api.github.com/users/{username}", headers=self.github_headers, timeout=5)
            if user_res.status_code == 200:
                user_info = user_res.json()
                result["name"] = user_info.get("name") or ""
                result["company"] = user_info.get("company") or ""
                result["email"] = user_info.get("email") or ""
                result["created_at"] = user_info.get("created_at") or "2023"

            # Get Repositories for languages and infrastructure keywords
            repos_res = requests.get(f"https://api.github.com/users/{username}/repos?sort=updated&per_page=10", headers=self.github_headers, timeout=5)
            if repos_res.status_code == 200:
                repos = repos_res.json()
                languages = set()
                tech_keywords = set()
                
                # Keywords indicating backend infrastructure exposure
                infra_keywords = {
                    "aws": "AWS",
                    "docker": "Docker",
                    "kubernetes": "Kubernetes",
                    "k8s": "Kubernetes",
                    "terraform": "Terraform",
                    "ansible": "Ansible",
                    "firebase": "Firebase",
                    "postgres": "PostgreSQL",
                    "mongodb": "MongoDB",
                    "redis": "Redis",
                    "github-actions": "GitHub Actions",
                    "vercel": "Vercel",
                    "heroku": "Heroku",
                    "gcp": "Google Cloud Platform",
                    "google-cloud": "Google Cloud Platform",
                    "azure": "Azure",
                    "cloudflare": "Cloudflare",
                    "lambda": "AWS Lambda",
                    "jenkins": "Jenkins",
                    "gitlab": "GitLab CI",
                    "django": "Django",
                    "flask": "Flask",
                    "fastapi": "Fastapi",
                    "mysql": "MySQL",
                    "sqlite": "SQLite",
                    "elasticsearch": "Elasticsearch"
                }

                for repo in repos:
                    # Collect programming language
                    if repo.get("language"):
                        languages.add(repo.get("language"))
                    
                    # Search repo name & description for tech keywords
                    desc = (repo.get("description") or "").lower()
                    name_lower = (repo.get("name") or "").lower()
                    
                    for keyword, normalized in infra_keywords.items():
                        if keyword in desc or keyword in name_lower:
                            tech_keywords.add(normalized)

                result["languages"] = list(languages)
                result["technologies"] = list(tech_keywords)

            return result
        except Exception as e:
            # Gracefully fail (e.g. rate limit, network down)
            print(f"GitHub API Error: {e}")
            return {"username": username}

    def _scrape_website(self, url: str) -> Optional[Dict[str, Any]]:
        """Scrapes a personal website to find exposed emails, social handles, and libraries."""
        if not url.startswith("http"):
            url = "https://" + url

        result = {
            "emails": [],
            "social_links": [],
            "technologies": []
        }

        try:
            res = requests.get(url, headers=self.headers, timeout=5)
            if res.status_code != 200:
                return None

            soup = BeautifulSoup(res.text, "html.parser")
            text_content = soup.get_text()

            # Find emails via regex
            email_pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
            found_emails = re.findall(email_pattern, text_content)
            result["emails"].extend(found_emails)

            # Check mailto links
            for mailto in soup.select('a[href^="mailto:"]'):
                email = mailto.get("href", "").replace("mailto:", "").strip()
                if "?" in email:
                    email = email.split("?")[0]
                result["emails"].append(email)

            # Find social links
            social_domains = ["github.com", "linkedin.com/in", "twitter.com", "x.com", "instagram.com", "medium.com"]
            for a in soup.find_all("a", href=True):
                href = a["href"]
                for domain in social_domains:
                    if domain in href:
                        result["social_links"].append(href)

            # Detect website technologies
            html_lower = res.text.lower()
            tech_signatures = {
                "react": "React",
                "next.js": "Next.js",
                "vue": "Vue.js",
                "gatsby": "Gatsby",
                "wordpress": "WordPress",
                "jquery": "jQuery",
                "tailwind": "Tailwind CSS",
                "bootstrap": "Bootstrap"
            }
            for signature, tech_name in tech_signatures.items():
                if signature in html_lower:
                    result["technologies"].append(tech_name)

            return result
        except Exception as e:
            print(f"Website Scraping Error: {e}")
            return None
