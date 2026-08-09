import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";

const doc = new jsPDF();

// Title Header
doc.setFont("helvetica", "bold");
doc.setFontSize(18);
doc.text("MASTER SERVICES AGREEMENT & SCOPE OF WORK", 14, 20);

doc.setFontSize(10);
doc.setFont("helvetica", "normal");
doc.text("Date: August 9, 2026 | Contract ID: SG-2026-8841", 14, 28);
doc.text("Client: Atlas Retail Group (Contact: Sarah Jenkins)", 14, 34);
doc.text("Contractor: ScopeGuard Studio (Freelance Agency)", 14, 40);
doc.text("Project Name: E-Commerce Storefront Rebuild & Mobile Checkout", 14, 46);
doc.text("Fixed Project Budget: INR 48,000 | Out-of-Scope Hourly Rate: INR 150/hr", 14, 52);

// Section 1: Agreed Scope
doc.setFont("helvetica", "bold");
doc.setFontSize(12);
doc.text("SECTION 1: AGREED DELIVERABLES & IN-SCOPE WORK", 14, 64);

doc.setFont("helvetica", "normal");
doc.setFontSize(10);
doc.text("1.1 User Authentication System: Signup, Login, Password Reset, and JWT sessions.", 16, 72);
doc.text("1.2 Product Catalog & Search: Filter products by category, sort by price, search bar.", 16, 78);
doc.text("1.3 Single-Currency Shopping Cart: INR cart calculations, promo codes, order summary.", 16, 84);
doc.text("1.4 Payment Gateway Integration: Razorpay integration for INR credit/debit cards.", 16, 90);
doc.text("1.5 Admin Inventory Panel: Basic view to update stock quantities and view orders.", 16, 96);
doc.text("1.6 Responsive UI Layout: Optimized for Desktop and Mobile browsers.", 16, 102);

// Section 2: Explicit Exclusions
doc.setFont("helvetica", "bold");
doc.setFontSize(12);
doc.text("SECTION 2: EXPLICIT EXCLUSIONS & OUT-OF-SCOPE CLAUSES", 14, 114);

doc.setFont("helvetica", "normal");
doc.setFontSize(10);
doc.text("2.1 Multi-Currency Conversion: Automated currency rates (USD/EUR) is OUT OF SCOPE.", 16, 122);
doc.text("2.2 Cryptocurrency Payments: Bitcoin/USDT/Crypto payment gateways is OUT OF SCOPE.", 16, 128);
doc.text("2.3 Custom Mobile Apps: Native iOS (Swift) and Android (Kotlin) apps are OUT OF SCOPE.", 16, 134);
doc.text("2.4 Automated CSV/PDF Reports: Real-time custom financial exports are OUT OF SCOPE.", 16, 140);
doc.text("2.5 24/7 Phone Support: Emergency 24/7 SLA phone support is OUT OF SCOPE.", 16, 146);

// Section 3: Timeline & Change Order Billing
doc.setFont("helvetica", "bold");
doc.setFontSize(12);
doc.text("SECTION 3: CHANGE ORDER PROCEDURE & OVERAGE BILLING", 14, 158);

doc.setFont("helvetica", "normal");
doc.setFontSize(10);
doc.text("Any feature request not explicitly listed in Section 1 shall be classified as a Change Order.", 16, 166);
doc.text("Change orders will be billed at the contractor's hourly rate of INR 150/hr upon client written", 16, 172);
doc.text("approval. Work on out-of-scope requests will commence only after approval.", 16, 178);

// Signatures
doc.setFont("helvetica", "bold");
doc.text("CLIENT SIGNATURE: ____________________          CONTRACTOR SIGNATURE: ____________________", 14, 195);
doc.setFont("helvetica", "normal");
doc.text("Sarah Jenkins, CEO (Atlas Retail Group)           Bhavya Juneja, Lead Engineer (ScopeGuard)", 14, 202);

const outputPath = path.join(process.cwd(), "public", "sample-contract.pdf");
fs.writeFileSync(outputPath, Buffer.from(doc.output("arraybuffer")));
console.log("Updated high-impact realistic sample-contract.pdf at:", outputPath);
