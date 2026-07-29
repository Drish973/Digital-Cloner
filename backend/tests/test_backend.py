import os
import sys

# Ensure backend directory is in python search path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import create_db_and_tables
from app.services.osint import OSINTCollector
from app.services.detector import ExposureDetector
from app.services.scoring import RiskScorer
from app.services.analyst import AISecurityAnalyst
from app.services.pdf_report import PDFReportGenerator

def test_full_pipeline():
    print("[-] Initializing Database and Tables...")
    create_db_and_tables()
    
    print("[-] Loading audit modules...")
    osint = OSINTCollector()
    detector = ExposureDetector()
    scorer = RiskScorer()
    analyst = AISecurityAnalyst()
    pdf = PDFReportGenerator()

    print("[-] Fetching credentials footprint...")
    profile = osint.collect(name="Alex Rivera", github_url="https://github.com/alex-rivera-devops")
    assert profile["name"] == "Alex Rivera"
    assert "alex.rivera.dev@gmail.com" in profile["emails"]

    print("[-] Extracting exposure vulnerabilities...")
    vulns = detector.detect(profile)
    assert len(vulns) > 0
    categories = [v["category"] for v in vulns]
    assert "Email" in categories
    assert "Credentials" in categories

    print("[-] Computing threat risk scores...")
    scores = scorer.calculate(profile, vulns)
    assert scores["overall_score"] >= 76 # Alex Rivera is critical

    print("[-] Simulating attack perspective & phishing vectors...")
    analysis = analyst.analyze(profile, vulns, scores["overall_score"])
    assert "simulated_phishing" in analysis
    assert "attacker_observations" in analysis

    print("[-] Packaging findings into ReportLab PDF...")
    scan_dict = {
        "target_name": profile["name"],
        "github_url": "https://github.com/alex-rivera-devops",
        "linkedin_url": "",
        "website_url": "",
        "overall_score": scores["overall_score"]
    }
    pdf_buffer = pdf.generate(scan_dict, vulns, analysis)
    
    # Save file to test write output
    test_filename = "test_alex_rivera_report.pdf"
    with open(test_filename, "wb") as f:
        f.write(pdf_buffer.read())
        
    print(f"[+] Dynamic PDF compiled successfully: {test_filename}")
    assert os.path.exists(test_filename)
    os.remove(test_filename)
    print("[+] Integration test completed successfully!")

if __name__ == "__main__":
    test_full_pipeline()
