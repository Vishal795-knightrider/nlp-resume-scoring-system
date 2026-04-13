"""
Sample Dataset
==============
3 sample resume + job description pairs for testing.
Run this file directly: python sample_data.py
"""

# ── Sample 1: Data Scientist Resume vs ML Engineer JD ───────────────────────
RESUME_1 = """
John Doe | Data Scientist
Email: john@email.com | LinkedIn: linkedin.com/in/johndoe

SUMMARY
Experienced Data Scientist with 3 years of expertise in machine learning,
Python programming, and statistical analysis. Skilled in building predictive
models and data pipelines.

SKILLS
Python, Pandas, NumPy, Scikit-learn, TensorFlow, SQL, Machine Learning,
Deep Learning, Data Visualization, Matplotlib, Seaborn, NLP, Git, Docker

EXPERIENCE
Data Scientist – ABC Corp (2021–Present)
- Built and deployed 5+ machine learning models for customer churn prediction
- Performed EDA and feature engineering on datasets with 1M+ records
- Created dashboards using Tableau and PowerBI for business insights
- Collaborated with engineering teams to productionize ML pipelines

EDUCATION
B.Tech Computer Science – XYZ University, 2021
Relevant courses: Machine Learning, Statistics, Linear Algebra, Data Mining

PROJECTS
- Sentiment Analysis using NLP and BERT transformer model
- House Price Prediction using Random Forest and XGBoost
- Customer Segmentation using K-Means Clustering
"""

JD_1 = """
Job Title: Machine Learning Engineer

We are looking for a skilled Machine Learning Engineer to join our AI team.

Requirements:
- 2+ years of experience in machine learning or data science
- Proficiency in Python, scikit-learn, TensorFlow or PyTorch
- Strong understanding of ML algorithms: regression, classification, clustering
- Experience with pandas, NumPy, and data preprocessing
- Knowledge of NLP techniques and deep learning
- Familiarity with model deployment and MLOps pipelines
- Experience with Git version control
- SQL and database knowledge

Responsibilities:
- Develop and train machine learning models
- Perform data analysis and feature engineering
- Collaborate with product teams to deliver AI solutions
- Write clean, well-documented Python code
"""

# ── Sample 2: Frontend Dev Resume vs Backend JD (low match expected) ─────────
RESUME_2 = """
Jane Smith | Frontend Developer
Email: jane@email.com

SKILLS
HTML, CSS, JavaScript, React, Vue.js, Bootstrap, Tailwind CSS, Figma,
UI/UX Design, Responsive Design, SASS, TypeScript, Webpack, Node.js

EXPERIENCE
Frontend Developer – Startup XYZ (2022–Present)
- Built responsive web applications using React and TypeScript
- Designed UI components using Figma and implemented with CSS animations
- Integrated REST APIs with frontend using Axios and Fetch

EDUCATION
B.Sc. Information Technology – City College, 2022
"""

JD_2 = """
Job Title: Backend Python Developer

We are hiring a Backend Developer with strong Python expertise.

Requirements:
- Strong Python programming skills (Django, FastAPI, or Flask)
- Database design: PostgreSQL, MySQL, Redis
- REST API development and microservices architecture
- Docker, Kubernetes, CI/CD pipelines
- Cloud platforms: AWS, GCP, or Azure
- Knowledge of machine learning model serving is a plus
- 2+ years of backend development experience
"""

# ── Sample 3: DevOps Resume vs DevOps JD (high match expected) ───────────────
RESUME_3 = """
Alex Kumar | DevOps Engineer
Email: alex@email.com

SUMMARY
DevOps Engineer with 4 years of experience in cloud infrastructure,
CI/CD automation, and containerization. AWS Certified Solutions Architect.

SKILLS
AWS, Azure, Docker, Kubernetes, Jenkins, Terraform, Ansible, Linux,
Bash Scripting, Python, Git, GitHub Actions, CI/CD, Nginx, Monitoring

EXPERIENCE
DevOps Engineer – Tech Solutions Ltd (2020–Present)
- Managed AWS infrastructure for 50+ microservices using Terraform
- Built CI/CD pipelines with Jenkins and GitHub Actions
- Containerized applications using Docker and orchestrated with Kubernetes
- Set up monitoring with Prometheus and Grafana
- Automated server provisioning with Ansible

EDUCATION
B.E. Computer Science – State University, 2020
Certifications: AWS Certified Solutions Architect, CKA (Kubernetes)
"""

JD_3 = """
Job Title: DevOps / Cloud Engineer

We are looking for a DevOps Engineer to manage our cloud infrastructure.

Requirements:
- Experience with AWS or Azure cloud services
- Strong Docker and Kubernetes skills
- CI/CD pipeline creation using Jenkins, GitHub Actions, or GitLab CI
- Infrastructure as Code: Terraform or CloudFormation
- Scripting skills: Bash and Python
- Linux system administration
- Monitoring tools: Prometheus, Grafana, ELK Stack
- Ansible or Chef for configuration management
- 3+ years of DevOps experience
"""

SAMPLES = [
    {
        "name": "Data Scientist vs ML Engineer JD",
        "resume": RESUME_1,
        "jd": JD_1,
        "expected": "High Match"
    },
    {
        "name": "Frontend Developer vs Backend Python JD",
        "resume": RESUME_2,
        "jd": JD_2,
        "expected": "Low Match"
    },
    {
        "name": "DevOps Engineer vs DevOps JD",
        "resume": RESUME_3,
        "jd": JD_3,
        "expected": "Very High Match"
    }
]
