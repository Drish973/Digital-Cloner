from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class Scan(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    target_name: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    website_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    overall_score: int = 0
    exposure_score: int = 0
    social_eng_score: int = 0
    osint_score: int = 0
    
    summary: str = ""
    attacker_perspective: str = ""
    graph_data: str = "{}"          # JSON string of React Flow nodes and edges
    timeline_data: str = "[]"        # JSON string of timeline items
    profile_data: str = "{}"         # JSON string of structured identity builder details
    
    vulnerabilities: List["Vulnerability"] = Relationship(back_populates="scan", cascade_delete=True)

class Vulnerability(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    scan_id: int = Field(foreign_key="scan.id")
    title: str
    description: str
    severity: str                    # Low, Moderate, High, Critical
    source: str                      # GitHub, Website, LinkedIn, General
    category: str                    # Email, Username, Tech, Company, Credentials
    
    scan: Scan = Relationship(back_populates="vulnerabilities")
