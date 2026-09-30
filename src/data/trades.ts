export const ALL_TRADES = [
  "3D Digital Game Art",
  "Additive Manufacturing",
  "Aircraft Maintenance",
  "Autobody Repair",
  "Automobile Technology",
  "Autonomous Mobile Robotics",
  "Bakery",
  "Beauty Therapy",
  "Bricklaying",
  "Cabinetmaking",
  "Car Painting",
  "Carpentry",
  "Chemical Laboratory Technology",
  "Cloud Computing",
  "CNC Milling",
  "CNC Turning",
  "Concrete Construction Work",
  "Cooking",
  "Cyber Security",
  "Dental Prosthetics",
  "Digital Construction",
  "Digital Interactive Media",
  "Electrical Installations",
  "Electronics",
  "Fashion Technology",
  "Floristry",
  "Graphic Design Technology",
  "Hairdressing",
  "Health and Social Care",
  "Heavy Vehicle Technology",
  "Hotel Reception",
  "ICT Network Infrastructure",
  "Industrial Control",
  "Industrial Design Technology",
  "Industrial Mechanics",
  "Industry 4.0",
  "Intelligent Security Technology",
  "IT Network Systems Administration",
  "Jewellery",
  "Joinery",
  "Landscape Gardening",
  "Logistics and Freight Forwarding",
  "Mechanical Engineering CAD",
  "Mechatronics",
  "Mobile Applications Development",
  "Optoelectronic Technology",
  "Painting and Decorating",
  "Patisserie and Confectionery",
  "Plastering and Drywall Systems",
  "Plumbing and Heating",
  "Refrigeration and Air Conditioning",
  "Renewable Energy",
  "Restaurant Service",
  "Retail Sales",
  "Robot Systems Integration",
  "Software Application Development",
  "Software Testing",
  "Unmanned Aerial Systems",
  "Visual Merchandising",
  "Wall and Floor Tiling",
  "Water Technology",
  "Web Technologies",
  "Welding"
] as const;

export type TradeName = typeof ALL_TRADES[number];

export const QUESTION_PAPER_OPTIONS = [
  {
    id: "state_centralized",
    label: "State Level Centralized Question Paper (DTE / ITD Standard)",
    description: "Prepared and vetted centrally by the State Examination Directorate"
  },
  {
    id: "institution_vetted",
    label: "Institutionally Prepared Question Paper (Subject Expert Vetted)",
    description: "Prepared by host institution subject matter experts and peer-reviewed"
  },
  {
    id: "bilingual_format",
    label: "Bilingual Question Paper (English & Regional Vernacular)",
    description: "Dual-medium format for comprehensive participant accessibility"
  },
  {
    id: "practical_marking_rubric",
    label: "Confidential Practical Task Blueprint & Objective Marking Rubric",
    description: "Practical skill workshop layout, safety protocols, and scoring rubrics"
  },
  {
    id: "sector_skill_council",
    label: "Sector Skill Council / WorldSkills India Certified Assessment Paper",
    description: "Benchmarked to national and international occupational standards"
  },
  {
    id: "custom_specialized",
    label: "Custom / Specialized Trade Paper Requirement",
    description: "Specialized equipment prerequisites or specific project requirements"
  }
] as const;

export const DEPARTMENTS = [
  {
    id: "DTE",
    name: "Directorate of Technical Education (DTE)",
    short: "DTE",
    scope: "Polytechnics, Engineering Colleges & Autonomous Technical Institutes"
  },
  {
    id: "ITD",
    name: "Industrial Training Department (ITD)",
    short: "ITD",
    scope: "Government & Private Industrial Training Institutes (ITIs)"
  }
] as const;

export const STANDARD_ZONES = [
  "North Zone",
  "Central Zone",
  "South Zone",
  "East Zone",
  "West Zone",
  "State Headquarters / Apex Zone"
] as const;

export const STANDARD_DISTRICTS = [
  "Thiruvananthapuram",
  "Kollam",
  "Pathanamthitta",
  "Alappuzha",
  "Kottayam",
  "Idukki",
  "Ernakulam",
  "Thrissur",
  "Palakkad",
  "Malappuram",
  "Kozhikode",
  "Wayanad",
  "Kannur",
  "Kasaragod",
  "Central District / Metro Division"
] as const;
