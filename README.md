Full-Stack Workflow Builder
*Overview
Full-Stack Workflow Builder is a No-Code/Low-Code platform to visually create intelligent AI workflows.
Build, connect, and configure components to handle user queries, extract knowledge from documents, leverage AI, and deliver answers — all without writing a single line of code.

*Highlights

Visual Workflow Creation: Drag, drop, and connect components effortlessly.
Dynamic User Queries: Real-time chat interface handles questions seamlessly.
Smart Knowledge Base: Upload PDFs, Word, Excel, PPTX, TXT; extract text; generate embeddings; retrieve relevant context.
Advanced AI Engine: Integrates OpenAI GPT & Gemini for accurate, context-aware responses.
Integrated Web Search: Augment AI answers with SerpAPI or Brave search results.
Flexible Execution: Execute workflows, validate connections, and handle follow-ups automatically.

* Components
1️⃣ User Query – Entry point; collects user questions.
2️⃣ Knowledge Base – Process documents, generate embeddings, store/retrieve context.
3️⃣ LLM Engine – Receives query + context, calls LLMs (OpenAI GPT / Gemini), optionally enriches via web search.
4️⃣ Output – Displays responses in chat interface; follow-ups reuse workflow logic.

*Workflow Flow:
User Query → Knowledge Base (optional) → LLM Engine → Output

*Tech Stack
Frontend: React.js, React Flow (drag-and-drop canvas)
Backend: FastAPI (REST API)
Database: PostgreSQL (metadata & workflow storage)
Vector Store: ChromaDB (contextual search)
Embeddings: OpenAI, Gemini
LLM: OpenAI GPT, Gemini
Text Extraction: PyMuPDF, python-docx, python-pptx, pandas

Getting Started-
*Frontend:
cd frontend
npm install
npm start

*Backend:
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

*Database:
Configure PostgreSQL and update environment variables in backend.

📁 Project Structure
Full-Stack/
│
├─ frontend/
│   ├─ src/
│   │   ├─ App.js
│   │   ├─ CustomNode.js
│   │   ├─ FileUpload.js
│   │   └─ index.html
│   └─ package.json
│
├─ backend/
│   ├─ app/
│   ├─ models/
│   ├─ services/
│   ├─ routes/
│   ├─ venv/
│   ├─ main.py
│   ├─ query.py
│   └─ requirements.txt
│
└─ README.md

*Impact
No-Code AI Workflows: Build sophisticated workflows visually.
Intelligent Knowledge Handling: Multi-format document ingestion with contextual insights.
Advanced AI Integration: Human-like, accurate responses with OpenAI GPT, Gemini, and embeddings.
Real-Time Interactivity: Immediate answers via chat interface.
Professional & Scalable: Modular architecture for deployment and future expansion.

 *Future Enhancements
Snap-to-grid and alignment tools for canvas precision.
Real-time logs and progress indicators.

Demo Example
1. Build a Workflow
Open the React Flow canvas in the frontend.
Drag the following components onto the workspace:
User Query – collects the user’s question.
Knowledge Base – optional; upload PDFs, Word, Excel, or PPTX files.
LLM Engine – integrates OpenAI GPT or Gemini to process queries.
Output – displays the AI response in a chat interface.

Connect the components in the order:
User Query → Knowledge Base (optional) → LLM Engine → Output

Configure each component:
User Query: no special config needed.
Knowledge Base: upload sample documents, choose embedding model.
LLM Engine: provide API key, select model, optionally add a prompt.
Output: default chat settings.

2. Execute the Workflow
Click Build Stack to validate and prepare the workflow.
Open the Chat Interface.
Enter a question, e.g.,
What are the key points from the uploaded document about AI trends in 2025?

The workflow executes:
Retrieves relevant context from the Knowledge Base (if available).
Sends the query and context to the LLM Engine.
Optionally enriches the response with a web search.
Displays the final response in the Output component.

3. Example Output
User Query:
Explain the main trends in AI for 2025.

AI Response (Output Component):
Based on the uploaded documents and web sources, the main AI trends in 2025 include:
1. Advanced natural language models powering real-time business analytics.
2. Integration of AI in healthcare for diagnostics and personalized treatment.
3. Increased use of AI in autonomous vehicles and smart mobility.
4. Growth of multimodal AI combining text, image, and audio understanding.
5. Ethical AI frameworks and explainable models gaining prominence.

4. Follow-Up Questions
Type a new question in the chat interface.
The workflow reuses the same logic and context to generate a response.
Kubernetes deployment for enterprise-grade scalability.

Multi-user workflow management and sharing.
