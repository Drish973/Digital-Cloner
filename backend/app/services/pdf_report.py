from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from io import BytesIO
from typing import Dict, Any, List

class PDFReportGenerator:
    def generate(self, scan_data: Dict[str, Any], vulnerabilities: List[Dict[str, Any]], analyst_data: Dict[str, Any]) -> BytesIO:
        """
        Generates a professional executive risk assessment PDF in memory.
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )
        
        styles = getSampleStyleSheet()
        
        # Define Custom Color Palette (Modern Cybersecurity Dark Accent)
        primary_color = colors.HexColor("#0f172a") # Slate 900
        accent_color = colors.HexColor("#ef4444")  # Red 500
        secondary_color = colors.HexColor("#3b82f6") # Blue 500
        light_bg = colors.HexColor("#f8fafc") # Slate 50
        border_color = colors.HexColor("#cbd5e1") # Slate 300

        # Custom Styles
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=24,
            textColor=primary_color,
            spaceAfter=15
        )
        
        section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=16,
            textColor=primary_color,
            spaceBefore=15,
            spaceAfter=10,
            keepWithNext=True
        )

        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            textColor=colors.HexColor("#334155"), # Slate 700
            leading=14
        )

        bullet_style = ParagraphStyle(
            'Bullet',
            parent=body_style,
            leftIndent=15,
            firstLineIndent=-10
        )

        code_style = ParagraphStyle(
            'Code',
            parent=body_style,
            fontName='Courier',
            fontSize=9,
            textColor=colors.HexColor("#0f172a"),
            leading=12
        )

        story = []

        # 1. Document Title
        story.append(Paragraph("DIGITAL CLONE: Threat Exposure Assessment", title_style))
        story.append(Paragraph("Passive OSINT Profile & Social Engineering Risk Analysis", body_style))
        story.append(Spacer(1, 15))

        # 2. Risk Level Banner
        score = scan_data.get("overall_score", 0)
        if score >= 76:
            risk_level = "CRITICAL RISK"
            banner_bg = colors.HexColor("#fee2e2") # Light Red
            banner_text_color = colors.HexColor("#991b1b") # Dark Red
        elif score >= 51:
            risk_level = "HIGH RISK"
            banner_bg = colors.HexColor("#ffedd5") # Light Orange
            banner_text_color = colors.HexColor("#9a3412") # Dark Orange
        elif score >= 26:
            risk_level = "MODERATE RISK"
            banner_bg = colors.HexColor("#fef9c3") # Light Yellow
            banner_text_color = colors.HexColor("#854d0e") # Dark Yellow
        else:
            risk_level = "LOW RISK"
            banner_bg = colors.HexColor("#dcfce7") # Light Green
            banner_text_color = colors.HexColor("#166534") # Dark Green

        banner_text = f"<b>Risk Score: {score}/100 - {risk_level}</b>"
        banner_p = Paragraph(banner_text, ParagraphStyle('BannerText', parent=body_style, fontSize=12, textColor=banner_text_color, alignment=1))
        
        banner_table = Table([[banner_p]], colWidths=[530])
        banner_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), banner_bg),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (0,0), (-1,-1), 10),
            ('BOX', (0,0), (-1,-1), 1, banner_text_color),
        ]))
        story.append(banner_table)
        story.append(Spacer(1, 15))

        # 3. Executive Summary
        story.append(Paragraph("Executive Summary", section_heading))
        story.append(Paragraph(analyst_data.get("executive_summary", "No summary generated."), body_style))
        story.append(Spacer(1, 15))

        # 4. Target Identity details
        story.append(Paragraph("Exposed Assets & Target Profile", section_heading))
        profile_text = f"<b>Target Name:</b> {scan_data.get('target_name') or 'N/A'}<br/>" \
                       f"<b>GitHub Profile:</b> {scan_data.get('github_url') or 'Not provided'}<br/>" \
                       f"<b>LinkedIn Profile:</b> {scan_data.get('linkedin_url') or 'Not provided'}<br/>" \
                       f"<b>Personal Website:</b> {scan_data.get('website_url') or 'Not provided'}"
        story.append(Paragraph(profile_text, body_style))
        story.append(Spacer(1, 15))

        # 5. Vulnerability Findings Table
        story.append(Paragraph("Exposure & Vulnerability Findings", section_heading))
        
        table_data = [[
            Paragraph("<b>Severity</b>", body_style),
            Paragraph("<b>Category</b>", body_style),
            Paragraph("<b>Vulnerability Details</b>", body_style)
        ]]
        
        for vuln in vulnerabilities:
            sev_color = "#ef4444" if vuln['severity'] == "Critical" else ("#f97316" if vuln['severity'] == "High" else ("#eab308" if vuln['severity'] == "Medium" else "#22c55e"))
            sev_p = Paragraph(f"<font color='{sev_color}'><b>{vuln['severity']}</b></font>", body_style)
            cat_p = Paragraph(vuln['category'], body_style)
            details_p = Paragraph(f"<b>{vuln['title']}</b><br/>{vuln['description']}", body_style)
            table_data.append([sev_p, cat_p, details_p])

        vuln_table = Table(table_data, colWidths=[70, 80, 380])
        vuln_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), light_bg),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('GRID', (0,0), (-1,-1), 0.5, border_color),
            ('PADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(vuln_table)
        story.append(Spacer(1, 20))

        # 6. Attacker's Perspective
        story.append(Paragraph("Attacker's Perspective (Observations)", section_heading))
        for obs in analyst_data.get("attacker_observations", []):
            story.append(Paragraph(f"• {obs}", bullet_style))
            story.append(Spacer(1, 5))
        story.append(Spacer(1, 10))

        # 7. Phishing Attack Simulation
        story.append(Paragraph("Simulated Social Engineering Exploit Vector", section_heading))
        story.append(Paragraph("Below is a simulated spear-phishing scenario constructed using the target's public details, demonstrating how an attacker could exploit the exposed profile:", body_style))
        story.append(Spacer(1, 8))
        
        phish = analyst_data.get("simulated_phishing", {})
        phish_text = f"<b>From:</b> {phish.get('sender', 'hr@attacker-domain.com')}<br/>" \
                     f"<b>Subject:</b> {phish.get('subject', 'Action Required')}<br/><br/>" \
                     f"{phish.get('body', '').replace('\n', '<br/>')}"
        
        phish_box = Table([[Paragraph(phish_text, code_style)]], colWidths=[530])
        phish_box.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), light_bg),
            ('PADDING', (0,0), (-1,-1), 10),
            ('BOX', (0,0), (-1,-1), 1, border_color),
        ]))
        story.append(phish_box)
        story.append(Spacer(1, 8))
        
        triggers = ", ".join(phish.get("psychological_triggers", []))
        story.append(Paragraph(f"<b>Key Psychological Triggers Employed:</b> {triggers}", body_style))
        story.append(Spacer(1, 15))

        # 8. Recommendations
        story.append(Paragraph("Actionable Recommendations", section_heading))
        for rec in analyst_data.get("recomm_list", []):
            story.append(Paragraph(f"<b>[ ]</b> {rec}", bullet_style))
            story.append(Spacer(1, 5))

        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer
