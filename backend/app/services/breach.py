import os
import requests
from typing import List, Dict, Any, Optional

# Pre-packaged breach indexes for offline mock demonstration
BREACH_CATALOG = {
    "alex.rivera.dev@gmail.com": [
        {
            "name": "Canva",
            "domain": "canva.com",
            "breach_date": "2019-05-24",
            "description": "In May 2019, the graphic design tool Canva suffered a data breach. The exposure included email addresses, usernames, real names, and passwords stored as bcrypt hashes.",
            "data_classes": ["Emails", "Passwords", "Usernames", "Names"]
        },
        {
            "name": "LinkedIn Breach (2021 Scraping)",
            "domain": "linkedin.com",
            "breach_date": "2021-04-08",
            "description": "An archive containing scraped data from 500 million LinkedIn profiles was posted for sale on a hacker forum. It contained professional names, titles, email addresses, and social links.",
            "data_classes": ["Emails", "Names", "Professional Skills", "Social Profiles"]
        }
    ],
    "sarah.codes.frontend@gmail.com": [
        {
            "name": "Adobe",
            "domain": "adobe.com",
            "breach_date": "2013-10-04",
            "description": "In October 2013, Adobe suffered a massive database exposure. Exposed data included email addresses, password hints, and encrypted passwords.",
            "data_classes": ["Emails", "Passwords", "Password Hints"]
        }
    ],
    "marcus.vance@vancetech.com": [
        {
            "name": "Dropbox",
            "domain": "dropbox.com",
            "breach_date": "2016-08-31",
            "description": "In 2012, Dropbox suffered a security breach resulting in the compromise of millions of user credentials. The leak included email addresses and salted bcrypt hashes.",
            "data_classes": ["Emails", "Passwords"]
        },
        {
            "name": "Wattpad",
            "domain": "wattpad.com",
            "breach_date": "2020-06-20",
            "description": "Wattpad suffered a breach exposing over 260 million unique email records, including passwords stored as bcrypt hashes, IP addresses, and registration dates.",
            "data_classes": ["Emails", "Passwords", "IP Addresses", "Usernames"]
        }
    ]
}

class BreachIntelligence:
    def __init__(self):
        # HIBP requires paid key settings
        self.api_key = os.getenv("HIBP_API_KEY")
        self.headers = {
            "hibp-api-key": self.api_key or "",
            "user-agent": "DigitalClone-Security-Audit"
        }

    def check_email(self, email: str) -> List[Dict[str, Any]]:
        """
        Queries breaches for an email.
        Falls back to local mock records if no API key is specified.
        """
        # If API key is configured, execute real HaveIBeenPwned lookup
        if self.api_key:
            try:
                url = f"https://haveibeenpwned.com/api/v3/breachedaccount/{email}"
                res = requests.get(url, headers=self.headers, timeout=5)
                if res.status_code == 200:
                    raw_breaches = res.json()
                    breaches = []
                    for b in raw_breaches:
                        breaches.append({
                            "name": b.get("Name", "Unknown"),
                            "domain": b.get("Domain", "N/A"),
                            "breach_date": b.get("BreachDate", "N/A"),
                            "description": b.get("Description", "No description available."),
                            "data_classes": b.get("DataClasses", [])
                        })
                    return breaches
                elif res.status_code == 404:
                    return [] # Clean record
            except Exception as e:
                print(f"HIBP API failed: {e}. Defaulting to catalog lookups.")

        # Catalog lookup fallback
        email_clean = email.strip().lower()
        if email_clean in BREACH_CATALOG:
            return BREACH_CATALOG[email_clean]

        # Return empty list or generate a generic mock breach for custom input emails
        # to ensure the dashboard remains highly interactive
        if "@" in email_clean and not email_clean.endswith("@example.com"):
            # Generates a standard simulated warning for custom user testing
            return [
                {
                    "name": "Simulated Breach Index Leak",
                    "domain": "unknown-leak.net",
                    "breach_date": "2023-11-12",
                    "description": "Simulated leak indicator: The email address is associated with general breach indexes. Reused professional passwords could be exposed to automated stuffing lists.",
                    "data_classes": ["Emails", "Password Hashes"]
                }
            ]
            
        return []
