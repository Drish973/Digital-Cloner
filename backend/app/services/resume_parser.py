import re
from pypdf import PdfReader
from io import BytesIO
from typing import Dict, Any, List

class ResumeParser:
    def parse(self, file_content: bytes) -> Dict[str, Any]:
        """
        Parses resume text from raw PDF bytes.
        Extracts contact info, skills, companies, and certifications.
        """
        try:
            reader = PdfReader(BytesIO(file_content))
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        except Exception as e:
            print(f"Failed to extract PDF text: {e}")
            text = ""

        # Normalize text spacing and casing for extraction matching
        clean_text = re.sub(r'\s+', ' ', text)
        clean_text_lower = clean_text.lower()

        # 1. Extract Emails
        email_pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
        emails = list(set(re.findall(email_pattern, clean_text)))

        # 2. Extract Phone Numbers
        phone_pattern = r"\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}"
        phones = list(set(re.findall(phone_pattern, clean_text)))
        # Filter out numbers that are too short to be actual phone numbers
        phones = [p for p in phones if len(re.sub(r'\D', '', p)) >= 7]

        # 3. Extract Links
        linkedin = ""
        github = ""
        website = ""
        
        # LinkedIn Match
        linkedin_match = re.search(r"(linkedin\.com/in/[a-zA-Z0-9-_]+)", clean_text_lower)
        if linkedin_match:
            linkedin = "https://" + linkedin_match.group(1)
            
        # GitHub Match
        github_match = re.search(r"(github\.com/[a-zA-Z0-9-_]+)", clean_text_lower)
        if github_match:
            github = "https://" + github_match.group(1)

        # Personal Web Matches (excluding generic platforms)
        urls = re.findall(r"([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[/a-zA-Z0-9-_]*)", clean_text_lower)
        ignored_domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "linkedin.com", "github.com", "google.com", "microsoft.com", "amazon.com", "facebook.com", "twitter.com", "x.com"]
        for url in urls:
            if not any(domain in url for domain in ignored_domains):
                # Clean up punctuation at the end of urls
                clean_url = url.rstrip('.,/ ')
                if clean_url:
                    website = "https://" + clean_url
                    break

        # 4. Extract Skills
        known_skills = [
            "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "ruby", "php", "sql",
            "react", "angular", "vue", "next.js", "node.js", "django", "fastapi", "flask", "spring boot",
            "docker", "kubernetes", "aws", "gcp", "azure", "terraform", "ansible", "jenkins", "git",
            "mongodb", "postgresql", "mysql", "redis", "elasticsearch", "pytorch", "tensorflow"
        ]
        skills = []
        for skill in known_skills:
            # Match whole word to avoid partial matching (e.g., 'go' inside 'google')
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, clean_text_lower):
                skills.append(skill.title() if skill not in ["aws", "gcp", "sql", "next.js", "node.js"] else skill.upper())

        # 5. Extract Companies
        known_companies = [
            "google", "microsoft", "amazon", "meta", "apple", "netflix", "uber", "airbnb",
            "strive", "tcs", "infosys", "wipro", "cognizant", "accenture", "ibm", "oracle"
        ]
        companies = []
        for company in known_companies:
            pattern = r'\b' + re.escape(company) + r'\b'
            if re.search(pattern, clean_text_lower):
                companies.append(company.title())

        # 6. Extract Certifications
        known_certs = [
            "aws certified", "aws solutions architect", "security+", "ceh", "oscp", "cissp",
            "ccna", "azure fundamentals", "google cloud architect", "ckad", "cka"
        ]
        certs = []
        for cert in known_certs:
            if cert in clean_text_lower:
                certs.append(cert.upper() if cert in ["ceh", "oscp", "cissp", "ccna", "ckad", "cka"] else cert.title())

        # Extract name hint from the top line of the text
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        candidate_name = lines[0] if lines else ""
        if len(candidate_name) > 30 or not re.match(r"^[a-zA-Z\s]+$", candidate_name):
            candidate_name = ""

        return {
            "name": candidate_name,
            "emails": emails,
            "phones": phones,
            "linkedin_url": linkedin,
            "github_url": github,
            "website_url": website,
            "skills": skills,
            "companies": companies,
            "certifications": certs
        }
