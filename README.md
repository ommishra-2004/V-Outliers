# SuryaEase

An integrated clean-energy intelligence platform bridging residential solar feasibility and institutional EV charging infrastructure discovery across India.

**Live Deployment:** [https://staging.d3fmc9iv4ssi2i.amplifyapp.com](https://staging.d3fmc9iv4ssi2i.amplifyapp.com)

---

## Executive Summary

SuryaEase addresses two critical friction points in India's clean energy transition:

1. **For Homeowners & Residential Consumers:** High information asymmetry around rooftop solar sizing, policy subsidies, net metering, and installer transparency. SuryaEase automates engineering sizing, central subsidy calculations (PM Surya Ghar Muft Bijli Yojana), financial ROI forecasting, and reverse-auction installer bidding.
2. **For Commercial Developers & Energy Investors:** Lack of ground-truth demand intelligence for locating commercial EV charging stations. SuryaEase integrates Ministry of Road Transport & Highways (VAHAN) registration data, regional charging deficit indices, and solar irradiation datasets to identify high-yield charging hub locations.

---

## Core System Architecture

The platform operates as a modern Single Page Application (SPA) backed by a high-throughput Python API service:

```
[ Client Browser / Mobile ]
           │
           ▼
[ AWS Amplify / CloudFront (HTTPS CDN) ]
           │
     ┌─────┴────────────────────────┐
     │                              │
[ React 19 Frontend SPA ]     [ FastAPI Backend Service ]
  - Interactive Leaflet GIS     - Indian Solar Economics Engine
  - Real-time Sizing Engine     - RTO Regional Analytics
  - Financial Modeling Canvas   - Amazon Bedrock (Claude 3 Haiku RAG)
  - Reverse-Auction Engine      - DynamoDB Persistence
```

---

## Key Modules & Capabilities

### 1. Consumer Rooftop Solar Feasibility Engine
- **Spatial Rooftop Identification:** Interactive map interface for locating property boundaries and calculating usable rooftop surface areas.
- **State-Specific Solar Irradiation Database:** Integrated generation yield database for all 28 Indian States and 8 Union Territories based on Ministry of New and Renewable Energy (MNRE) benchmarks (e.g., Rajasthan: 165 units/kW/month, Karnataka: 144 units/kW/month).
- **Automated Subsidy Ledger:** Calculates central Direct Benefit Transfer (DBT) subsidy slabs under the PM Surya Ghar scheme (₹30,000/kW up to 2 kW; ₹78,000 max for ≥3 kW) alongside state utility DISCOM incentives.
- **10-Year Cumulative Cashflow Model:** Compares ongoing grid power escalation against self-generation payback milestones with annual cashflow visualization.
- **Installer Marketplace:** Reverse-auction bidding marketplace showcasing certified regional vendors, tier-1 panel specifications (Mono-PERC / TopCon), smart inverter ratings, and warranties.
- **RAG Policy Assistant:** Natural-language AI advisor trained on Indian DISCOM regulations, net metering standards, and SBI Surya Ghar solar loan policies.

### 2. Investor EV Charging Hotspot Discovery
- **Live VAHAN Ground Registry Integration:** Aggregates regional electric vehicle penetration across Regional Transport Office (RTO) jurisdictions.
- **Charging Gap Index:** Quantifies infrastructure deficits (EVs per public charger) across municipal clusters.
- **Multi-Factor Opportunity Scoring:** Proprietary scoring model factoring EV density, public charger deficit, regional solar yield, and grid stability.
- **CAPEX Tier Modeling:** Classifies investment hubs by capital requirements:
  - Compact Quick-Charge Plaza (₹25L – ₹50L)
  - Standard Commercial Hub (₹50L – ₹1.2Cr)
  - Flagship Transit Plaza (> ₹1.2Cr)
- **Financial Projections & Reporting:** Detailed 10-year internal rate of return (IRR), estimated payback horizon, and one-click PDF investment memorandum generation.

---

## Technology Stack

### Frontend
- **Framework:** React 19, TypeScript
- **Bundler & Tooling:** Vite, Tailwind CSS v4
- **Spatial Mapping:** Leaflet, React-Leaflet
- **State Management:** Zustand with persistent hydration
- **Animations & Interaction:** Framer Motion
- **Icons:** Lucide React

### Backend
- **Framework:** FastAPI (Python 3.12)
- **Validation:** Pydantic v2, Pydantic-Settings
- **Server:** Uvicorn, Mangum (AWS Lambda / Serverless adapter)
- **Cloud SDK:** Boto3 (Amazon DynamoDB, Amazon S3, Amazon Bedrock)
- **AI / LLM:** Anthropic Claude 3 Haiku via Amazon Bedrock

### Cloud Infrastructure
- **Hosting & CDN:** AWS Amplify Hosting (Free Tier, automatic HTTPS, CI/CD pipeline)
- **Storage:** Amazon S3 (Rooftop site imagery and contracts)
- **Database:** Amazon DynamoDB (Analyses, user profiles, pipeline trackers)
- **Security:** AWS Identity and Access Management (IAM), TLS 1.3 encryption

---

## Local Development Setup

### Prerequisites
- Node.js 18.x or higher
- Python 3.11 or higher
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/ommishra-2004/V-Outliers.git
cd V-Outliers
```

### 2. Frontend Setup
```bash
# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```
The client will be accessible at `http://localhost:5173/` (or next available port).

### 3. Backend Setup (Optional for local API development)
```bash
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Run FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
API documentation will be available at `http://localhost:8000/docs`.

---

## Build and Testing

```bash
# Run TypeScript type verification
npx tsc --noEmit

# Create optimized production build
npm run build
```
Build output is generated into the `dist/` directory.

---

## Cloud Deployment

### AWS Amplify Hosting (Current Production Deployment)
1. Connect the GitHub repository to AWS Amplify Console.
2. Configure build settings in `amplify.yml`:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```
3. Set the Single Page Application (SPA) rewrite rule under **Hosting > Rewrites and redirects**:
   ```json
   [
     {
       "source": "/<*>",
       "target": "/index.html",
       "status": "404-200"
     }
   ]
   ```
4. Automatic continuous deployment triggers on each push to the `main` branch.

---

## Repository Structure

```
├── backend/
│   ├── routers/            # FastAPI route controllers
│   ├── schemas/            # Pydantic data validation models
│   ├── services/           # Solar math engine, AWS integrations, Bedrock RAG
│   ├── Dockerfile          # Container specification
│   ├── main.py             # Application entrypoint
│   └── requirements.txt    # Python dependencies
├── public/
│   └── favicon.svg         # High-resolution application favicon
├── src/
│   ├── assets/             # 3D models and static assets
│   ├── components/         # Common UI, 3D Hero, authentication
│   │   ├── auth/           # Login & registration forms
│   │   └── solar/          # Consumer solar assessment & dashboard
│   ├── investor/           # EV charging investor intelligence module
│   │   ├── components/     # GIS map, filter drawer, opportunity cards
│   │   ├── data/           # VAHAN registration and RTO datasets
│   │   ├── pages/          # Investor workspace
│   │   └── services/       # Opportunity ranking algorithms
│   ├── services/           # Client-side API and calculation layer
│   ├── store/              # Zustand global state stores
│   ├── types/              # TypeScript interface definitions
│   ├── App.tsx             # Main client router
│   └── index.css           # Global stylesheet and Tailwind v4 themes
├── DEPLOYMENT_AWS.md       # Detailed AWS cloud provisioning instructions
├── index.html              # HTML document template
├── package.json            # Node.js project manifest
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build configuration
```

---

## License

This project is licensed under the MIT License.
