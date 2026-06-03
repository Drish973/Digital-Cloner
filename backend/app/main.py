import json
from fastapi import FastAPI, Depends, HTTPException, Query, status, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.database import create_db_and_tables, get_session, engine
from app.models import Scan, Vulnerability
from app.services.osint import OSINTCollector
from app.services.detector import ExposureDetector
from app.services.scoring import RiskScorer
from app.services.graph import AttackPathGenerator
from app.services.analyst import AISecurityAnalyst
from app.services.pdf_report import PDFReportGenerator
from app.services.resume_parser import ResumeParser
from app.services.breach import BreachIntelligence
from app.services.enum_username import UsernameEnumerator

app = FastAPI(title="Digital Clone: Social Engineering Risk Platform")

# CORS setup for Vite frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    create_db_and_tables()
    with Session(engine) as session:
        statement = select(Scan)
        existing = session.exec(statement).first()
        if not existing:
            print("[-] Database is empty. Seeding database with demo personas...")
            await execute_audit(
                name="Alex Rivera",
                github_url="https://github.com/alex-rivera-devops",
                linkedin_url="https://linkedin.com/in/alex-rivera-devops",
                website_url="https://alex-rivera.dev",
                db=session
            )
            await execute_audit(
                name="Sarah Jenkins",
                github_url="https://github.com/sarah-codes",
                linkedin_url="https://linkedin.com/in/sarah-jenkins-dev",
                website_url="https://portfolio.sarah-jenkins.dev",
                db=session
            )
            await execute_audit(
                name="Marcus Vance",
                github_url="https://github.com/marcus-v-ai",
                linkedin_url="https://linkedin.com/in/marcus-vance-ai",
                website_url="https://vancetech.com",
                db=session
            )
            print("[+] Database successfully seeded with 3 demo personas!")


# Request schemas
class ScanRequest(BaseModel):
    name: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    website_url: Optional[str] = None

# Services instance container
osint_collector = OSINTCollector()
exposure_detector = ExposureDetector()
risk_scorer = RiskScorer()
graph_generator = AttackPathGenerator()
ai_analyst = AISecurityAnalyst()
pdf_generator = PDFReportGenerator()
resume_parser = ResumeParser()
breach_intel = BreachIntelligence()
username_enum = UsernameEnumerator()

@app.post("/api/scan", response_model=Dict[str, Any])
async def trigger_scan(payload: ScanRequest, db: Session = Depends(get_session)):
    """
    Executes the full risk audit lifecycle.
    """
    return await execute_audit(
        name=payload.name,
        github_url=payload.github_url,
        linkedin_url=payload.linkedin_url,
        website_url=payload.website_url,
        db=db
    )

@app.post("/api/upload-resume", response_model=Dict[str, Any])
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_session)):
    """
    POST /api/upload-resume
    Extracts text from PDF, builds search footprint, and starts the full OSINT audit.
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF format resumes are supported."
        )
    try:
        content = await file.read()
        parsed_data = resume_parser.parse(content)

        # Correlate findings: trigger audit using extracted endpoints
        # Provide fallback name if none is extracted from resume text
        target_name = parsed_data.get("name") or file.filename.replace(".pdf", "").replace("_", " ").title()

        return await execute_audit(
            name=target_name,
            github_url=parsed_data.get("github_url"),
            linkedin_url=parsed_data.get("linkedin_url"),
            website_url=parsed_data.get("website_url"),
            emails_extracted=parsed_data.get("emails", []),
            skills_extracted=parsed_data.get("skills", []),
            db=db
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Resume processing failed: {str(e)}"
        )

@app.get("/api/check-username", response_model=List[Dict[str, Any]])
async def check_username(username: str):
    """
    GET /api/check-username
    Passive/Active username enumeration across 6 developers/social hubs.
    """
    if not username:
         raise HTTPException(status_code=400, detail="Username parameter is required.")
    return username_enum.enumerate(username)

@app.get("/api/compare", response_model=Dict[str, Any])
async def compare_scans(scan_a_id: int, scan_b_id: int, db: Session = Depends(get_session)):
    """
    GET /api/compare
    Side-by-side exposure comparisons between Person A and Person B.
    """
    scan_a = db.get(Scan, scan_a_id)
    scan_b = db.get(Scan, scan_b_id)
    
    if not scan_a or not scan_b:
        raise HTTPException(status_code=404, detail="One or both scan records not found.")

    vulns_a = scan_a.vulnerabilities
    vulns_b = scan_b.vulnerabilities

    profile_a = json.loads(scan_a.profile_data)
    profile_b = json.loads(scan_b.profile_data)

    scores_a = risk_scorer.calculate(profile_a, [{"category": v.category, "severity": v.severity} for v in vulns_a])
    scores_b = risk_scorer.calculate(profile_b, [{"category": v.category, "severity": v.severity} for v in vulns_b])

    return {
        "person_a": {
            "name": scan_a.target_name,
            "overall_score": scan_a.overall_score,
            "emails_count": len(profile_a.get("emails", [])),
            "socials_count": len(profile_a.get("social_links", [])),
            "breaches_count": sum(1 for v in vulns_a if v.category == "Credentials"),
            "techs_count": len(profile_a.get("technologies", []))
        },
        "person_b": {
            "name": scan_b.target_name,
            "overall_score": scan_b.overall_score,
            "emails_count": len(profile_b.get("emails", [])),
            "socials_count": len(profile_b.get("social_links", [])),
            "breaches_count": sum(1 for v in vulns_b if v.category == "Credentials"),
            "techs_count": len(profile_b.get("technologies", []))
        }
    }

async def execute_audit(name: Optional[str], github_url: Optional[str], linkedin_url: Optional[str], 
                        website_url: Optional[str], emails_extracted: List[str] = None, 
                        skills_extracted: List[str] = None, phones_extracted: List[str] = None,
                        companies_extracted: List[str] = None, certifications_extracted: List[str] = None,
                        db: Session = Depends(get_session)):
    """Generic engine that runs the analysis pipeline."""
    emails_extracted = emails_extracted or []
    skills_extracted = skills_extracted or []
    phones_extracted = phones_extracted or []
    companies_extracted = companies_extracted or []
    certifications_extracted = certifications_extracted or []

    # Module 1: OSINT Collection
    profile = osint_collector.collect(
        name=name,
        github_url=github_url,
        linkedin_url=linkedin_url,
        website_url=website_url
    )

    # Merge resume-extracted profiles
    profile["emails"] = list(set(profile["emails"] + emails_extracted))
    profile["skills"] = list(set(profile["skills"] + skills_extracted))
    profile["phones"] = list(set(profile.get("phones", []) + phones_extracted))
    profile["companies"] = list(set(profile.get("companies", []) + companies_extracted))
    profile["certifications"] = list(set(profile.get("certifications", []) + certifications_extracted))
    
    # Override corporate target if discovered in resume but unknown in collection
    if profile.get("company") == "Unknown" and companies_extracted:
        profile["company"] = companies_extracted[0]

    # Module 3: Exposure Detection
    detected_vulns = exposure_detector.detect(profile)

    # HAVEIBEENPWNED API Integration check (adds breach alerts to vulnerability lists)
    profile["breaches"] = []
    for email in profile["emails"]:
        breaches = breach_intel.check_email(email)
        if breaches:
            profile["breaches"].extend(breaches)
            for b in breaches:
                classes = b.get("data_classes", [])
                has_passwords = any("pass" in c.lower() or "hash" in c.lower() for c in classes)
                severity = "Critical" if has_passwords else "High"
                detected_vulns.append({
                    "title": f"Breach Intelligence: Account Exposed in {b['name']}",
                    "description": f"Exposed Data: {', '.join(classes)}. {b.get('description', '')}",
                    "severity": severity,
                    "source": f"HaveIBeenPwned ({b.get('domain', 'N/A')})",
                    "category": "Credentials"
                })

    # Module 6: Risk Scoring Engine (Advanced Scoring with probabilities and reconstruction)
    advanced_scores = risk_scorer.calculate(profile, detected_vulns)

    # Module 4: Attack Path Generator
    graph_data = graph_generator.generate(profile, detected_vulns)

    # Module 5: AI Security Analyst
    analysis_data = ai_analyst.analyze(profile, detected_vulns, advanced_scores["overall_score"])

    # Timeline creation
    timeline_items = [
        {"year": profile["history"].get("github_created", "2023"), "platform": "GitHub", "event": "Profile created & developer repositories initialized."},
        {"year": profile["history"].get("website_created", "2024"), "platform": "Personal Website", "event": "Domain registered & personal metadata exposed."},
        {"year": profile["history"].get("linkedin_created", "2025"), "platform": "LinkedIn", "event": "Professional network established & corporate employer listed."}
    ]
    timeline_items = sorted(timeline_items, key=lambda x: x["year"])

    # Save to SQLite DB
    db_scan = Scan(
        target_name=profile["name"],
        github_url=github_url,
        linkedin_url=linkedin_url,
        website_url=website_url,
        overall_score=advanced_scores["overall_score"],
        exposure_score=advanced_scores["exposure_score"],
        social_eng_score=advanced_scores["social_eng_score"],
        osint_score=advanced_scores["osint_score"],
        summary=analysis_data["executive_summary"],
        attacker_perspective=json.dumps(analysis_data["attacker_observations"]),
        graph_data=json.dumps(graph_data),
        timeline_data=json.dumps(timeline_items),
        profile_data=json.dumps({
            **profile,
            "reconstruction_score": advanced_scores["reconstruction_score"],
            "reconstruction_details": advanced_scores["reconstruction_details"],
            "attack_probabilities": advanced_scores["attack_probabilities"],
            "simulated_phishing": analysis_data.get("simulated_phishing"),
            "recomm_list": analysis_data.get("recomm_list")
        })
    )
    
    db.add(db_scan)
    db.commit()
    db.refresh(db_scan)

    for v in detected_vulns:
        db_vuln = Vulnerability(
            scan_id=db_scan.id,
            title=v["title"],
            description=v["description"],
            severity=v["severity"],
            source=v["source"],
            category=v["category"]
        )
        db.add(db_vuln)
    
    db.commit()

    return {
        "scan_id": db_scan.id,
        "profile": {
            **profile,
            "reconstruction_score": advanced_scores["reconstruction_score"],
            "reconstruction_details": advanced_scores["reconstruction_details"],
            "attack_probabilities": advanced_scores["attack_probabilities"]
        },
        "vulnerabilities": detected_vulns,
        "scores": advanced_scores,
        "graph": graph_data,
        "timeline": timeline_items,
        "attacker_perspective": analysis_data["attacker_observations"],
        "simulated_phishing": analysis_data["simulated_phishing"]
    }

@app.get("/api/scan/{scan_id}", response_model=Dict[str, Any])
async def get_scan_result(scan_id: int, db: Session = Depends(get_session)):
    db_scan = db.get(Scan, scan_id)
    if not db_scan:
        raise HTTPException(status_code=404, detail="Scan record not found.")

    vulnerabilities = db_scan.vulnerabilities
    vuln_list = [{
        "title": v.title,
        "description": v.description,
        "severity": v.severity,
        "source": v.source,
        "category": v.category
    } for v in vulnerabilities]

    profile = json.loads(db_scan.profile_data)
    advanced_scores = risk_scorer.calculate(profile, vuln_list)
    
    simulated_phishing = profile.get("simulated_phishing")
    if not simulated_phishing:
        restored_analysis = ai_analyst.analyze(profile, vuln_list, db_scan.overall_score)
        simulated_phishing = restored_analysis["simulated_phishing"]

    return {
        "scan_id": db_scan.id,
        "profile": {
            **profile,
            "reconstruction_score": advanced_scores["reconstruction_score"],
            "reconstruction_details": advanced_scores.get("reconstruction_details"),
            "attack_probabilities": advanced_scores["attack_probabilities"]
        },
        "vulnerabilities": vuln_list,
        "scores": advanced_scores,
        "graph": json.loads(db_scan.graph_data),
        "timeline": json.loads(db_scan.timeline_data),
        "attacker_perspective": json.loads(db_scan.attacker_perspective),
        "simulated_phishing": simulated_phishing
    }

@app.get("/api/scans", response_model=List[Dict[str, Any]])
async def list_scans(db: Session = Depends(get_session)):
    statement = select(Scan).order_by(Scan.created_at.desc())
    results = db.exec(statement).all()
    return [{
        "id": s.id,
        "target_name": s.target_name,
        "overall_score": s.overall_score,
        "created_at": s.created_at
    } for s in results]

@app.delete("/api/scan/{scan_id}")
async def delete_scan(scan_id: int, db: Session = Depends(get_session)):
    db_scan = db.get(Scan, scan_id)
    if not db_scan:
        raise HTTPException(status_code=404, detail="Scan record not found.")
    db.delete(db_scan)
    db.commit()
    return {"message": f"Scan {scan_id} deleted successfully."}

@app.get("/api/admin/stats")
async def get_admin_stats(db: Session = Depends(get_session)):
    """
    GET /api/admin/stats
    Returns overall database statistics for the Administrator view.
    """
    scans = db.exec(select(Scan)).all()
    vulns = db.exec(select(Vulnerability)).all()
    
    total_scans = len(scans)
    total_vulns = len(vulns)
    
    avg_score = 0
    if total_scans > 0:
        avg_score = int(sum(s.overall_score for s in scans) / total_scans)
        
    severity_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for v in vulns:
        severity_counts[v.severity] = severity_counts.get(v.severity, 0) + 1
        
    return {
        "total_scans": total_scans,
        "total_vulnerabilities": total_vulns,
        "average_risk_score": avg_score,
        "vulnerabilities_by_severity": severity_counts
    }

@app.post("/api/admin/reset")
async def reset_database(db: Session = Depends(get_session)):
    """
    POST /api/admin/reset
    Deletes all scans and vulnerabilities to reset the system.
    """
    scans = db.exec(select(Scan)).all()
    for s in scans:
        db.delete(s)
    db.commit()
    return {"message": "All database records purged successfully."}

@app.get("/api/scan/{scan_id}/report")
async def get_pdf_report(scan_id: int, db: Session = Depends(get_session)):
    db_scan = db.get(Scan, scan_id)
    if not db_scan:
        raise HTTPException(status_code=404, detail="Scan record not found.")

    vulnerabilities = db_scan.vulnerabilities
    vuln_list = [{
        "title": v.title,
        "description": v.description,
        "severity": v.severity,
        "source": v.source,
        "category": v.category
    } for v in vulnerabilities]

    profile = json.loads(db_scan.profile_data)
    simulated_phishing = profile.get("simulated_phishing")
    recomm_list = profile.get("recomm_list")

    if simulated_phishing and recomm_list:
        restored_analysis = {
            "executive_summary": db_scan.summary,
            "attacker_observations": json.loads(db_scan.attacker_perspective),
            "simulated_phishing": simulated_phishing,
            "recomm_list": recomm_list
        }
    else:
        restored_analysis = ai_analyst.analyze(profile, vuln_list, db_scan.overall_score)

    scan_dict = {
        "target_name": db_scan.target_name,
        "github_url": db_scan.github_url,
        "linkedin_url": db_scan.linkedin_url,
        "website_url": db_scan.website_url,
        "overall_score": db_scan.overall_score
    }

    pdf_stream = pdf_generator.generate(scan_dict, vuln_list, restored_analysis)
    
    filename = f"Digital_Clone_Report_{db_scan.target_name.replace(' ', '_')}.pdf"
    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

