# cutty-x - Function as a Service Platform

A modern FaaS (Function as a Service) platform built for the SoftBank Hackathon 2025 in Seoul. Create, deploy, and manage serverless functions with a playful, visual interface.

## 🎨 Features

### Visual Function Canvas

- **Draw.io-like Interface**: Drag, drop, and arrange functions on an infinite canvas
- **Zoom & Pan**: Full navigation control with React Flow and viewport persistence
- **Node Types**: Functions, text annotations, and border/grouping rectangles
- **Status Indicators**: Visual feedback for function states (idle, running, error, not-deployed, unavailable)
- **Auto-Save**: Workspace state automatically saved to DynamoDB with 1-second debounce
- **Persistent Workspace**: Canvas position, zoom level, and all nodes/edges are preserved
- **Delete Key Support**: Remove selected nodes with Delete or Backspace (smart detection prevents accidental deletion while editing text)

### Function Management

- **Multiple Runtimes**: Support for Node.js (18, 20) and Python (3.9, 3.10, 3.11)
- **Environment Variables**: Configure runtime environment per function with sensitive value masking
- **HTTP Routes**: Custom API endpoints for each function
- **Code Editor**: Full-featured Monaco editor with file tree navigation
- **File Management**: Create files/folders, organize code with directory structure
- **Batch Save**: All file changes tracked in memory and saved together with metadata
- **Modified Indicator**: Visual feedback showing unsaved changes in the editor
- **Smart Suggestions**: Monaco autocomplete with proper positioning (no clipping)

### Observability Dashboard

- **Real-time Metrics**: CPU and memory usage tracking during execution
- **Execution Time**: Detailed performance metrics for each run
- **Run History**: Complete log of all function executions
- **Visual Charts**: Interactive graphs powered by Recharts

### Security & Vulnerability Checks

- **AI-Powered Analysis**: OpenAI-based code vulnerability detection
- **Security Scanning**: Check for infinite loops, filesystem access, DDoS risks, and more
- **Severity Levels**: Categorized vulnerability reports (low, medium, high, critical)

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn
- AWS Account (for production deployment)
- OpenAI API Key (optional, for vulnerability checks)

### Installation

```bash
# Clone the repository
git clone https://github.com/Softbank-Hackathon-2025-Team-Green/web.git
cd web

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local

# Edit .env.local with your credentials:
# - AWS credentials for S3, DynamoDB, and Lambda
# - OpenAI API key for vulnerability checking

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the platform.

## 📁 Project Structure

```
web/
├── app/
│   ├── page.tsx                          # Landing page
│   ├── home/
│   │   └── page.tsx                      # Visual canvas page (main interface)
│   ├── function/
│   │   ├── create/
│   │   │   └── page.tsx                  # Function creation form
│   │   └── [id]/
│   │       ├── page.tsx                  # Function detail & observability
│   │       └── edit/
│   │           └── page.tsx              # Function editor with CodeEditor
│   ├── editor/                           # Legacy code editor
│   └── api/
│       ├── functions/
│       │   ├── list/                     # Get all functions
│       │   ├── get/                      # Get single function
│       │   ├── create/                   # Create new function
│       │   ├── update/                   # Update function metadata
│       │   ├── deploy/                   # Deploy to Lambda
│       │   ├── run/                      # Execute function
│       │   ├── logs/                     # Get run history
│       │   └── vulnerability-check/      # Security analysis
│       ├── workspace/
│       │   ├── save/                     # Save canvas state
│       │   └── load/                     # Load canvas state
│       └── vscode/
│           ├── list/                     # List files in project
│           ├── read/                     # Read file content
│           ├── write/                    # Write file content
│           ├── create/                   # Create file/folder
│           └── delete/                   # Delete file
├── components/
│   ├── FunctionNode.tsx                  # Canvas function block component
│   ├── TextNode.tsx                      # Editable text annotation node
│   ├── BorderNode.tsx                    # Resizable border/grouping node
│   ├── CodeEditor.tsx                    # Monaco editor with file tree
│   ├── InputDialog.tsx                   # Modal input dialog
│   └── CreateFunctionDialog.tsx          # Function creation modal
├── lib/
│   ├── function-utils.ts                 # Client-side utilities
│   ├── filesystem-utils.ts               # File tree utilities
│   ├── s3-utils.ts                       # S3 operations
│   ├── dynamodb-utils.ts                 # DynamoDB operations
│   └── lambda-utils.ts                   # Lambda operations
└── types/
    └── function.ts                       # TypeScript interfaces
```

## 🎯 User Flow

1. **Home Canvas**: Start on the visual canvas where you can see all your functions
2. **Add Elements**: Click to add functions, text annotations, or border boxes for organization
3. **Create Function**: Place a new function on the canvas and configure its name/runtime
4. **Edit Code**: Click function node to navigate to editor with file tree and Monaco
5. **Organize Files**: Create folders and files to structure your function code
6. **Track Changes**: See modified indicators as you edit, all changes saved in memory
7. **Security Check**: Run AI-powered vulnerability analysis (coming soon)
8. **Save All**: Click "Save Changes" to batch save all modified files and metadata to S3/DynamoDB
9. **Deploy**: Deploy your function to AWS Lambda (coming soon)
10. **Monitor**: Check real-time metrics, CPU/memory usage, and execution logs (coming soon)
11. **Workspace Persistence**: Pan, zoom, and arrange - your canvas state auto-saves and restores

## 🛠 Technology Stack

- **Framework**: Next.js 16 with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Canvas**: React Flow (@xyflow/react)
- **Charts**: Recharts
- **Code Editor**: Monaco Editor
- **Cloud**: AWS (S3, DynamoDB, Lambda, API Gateway)
- **AI**: OpenAI GPT-4 for vulnerability detection

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
# AWS Configuration
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# S3 Bucket for function code
S3_BUCKET_NAME=cutty-x-functions

# DynamoDB Tables
DYNAMODB_TABLE_NAME=cutty-x-functions
# Workspace state table: sbht-user-progress

# OpenAI API Key (optional, for vulnerability checks)
OPENAI_API_KEY=your_openai_key
```

## 🎨 Design Philosophy

- **Playful Theme**: Vibrant purple and pink gradients
- **Visual First**: Draw.io-inspired interface for intuitive function management
- **Developer Friendly**: Full-featured code editor with file tree and batch saving
- **State Persistence**: Everything auto-saves - workspace state, viewport position, and code changes
- **No Data Loss**: Smart change tracking prevents losing edits when switching files
- **Security Conscious**: Built-in AI-powered vulnerability detection (coming soon)

## 📊 Observability Features

Each function provides:

- **CPU Usage Graph**: Real-time CPU utilization during execution
- **Memory Usage Graph**: Memory consumption tracking
- **Execution Time**: Total runtime in milliseconds
- **Status Indicators**: Success/error states
- **Historical Data**: Complete run log with timestamps

## 🔒 Security Features

- AI-powered code analysis using OpenAI GPT-4
- Detection of:
  - Infinite loops
  - Filesystem access vulnerabilities
  - Potential DDoS attack vectors
  - Command injection risks
  - SQL injection patterns
- Severity categorization
- Line-level issue reporting

## 📝 API Routes

### Function Management

- `GET /api/functions/list` - List all functions
- `GET /api/functions/get?id={id}&userId={userId}` - Get function details
- `POST /api/functions/create` - Create new function
- `PUT /api/functions/update` - Update function metadata
- `DELETE /api/functions/delete` - Delete function

### Workspace State

- `POST /api/workspace/save` - Save canvas state (nodes, edges, viewport)
- `GET /api/workspace/load?userId={userId}` - Load canvas state

### File Operations

- `POST /api/vscode/list` - List files in function directory (recursive)
- `POST /api/vscode/read` - Read file content from S3
- `POST /api/vscode/write` - Write file content to S3
- `POST /api/vscode/create` - Create file or folder
- `POST /api/vscode/delete` - Delete file

### Operations (Coming Soon)

- `POST /api/functions/deploy` - Deploy function to Lambda
- `POST /api/functions/run` - Execute function
- `GET /api/functions/logs?functionId={id}` - Get run history
- `POST /api/functions/vulnerability-check` - Check for vulnerabilities

## 🚧 Future Enhancements

- GitHub OAuth authentication
- Multi-user support with user isolation
- Function deployment to AWS Lambda
- Function execution and testing
- Real-time observability dashboard with CPU/memory metrics
- AI-powered vulnerability checking with OpenAI
- Function connections and data flow visualization on canvas
- WebSocket support for real-time updates
- Custom runtime container support
- Collaborative editing
- Cost tracking and budgets

## ✅ Current Implementation Status

**Completed:**

- ✅ Visual canvas with React Flow
- ✅ Multiple node types (function, text, border)
- ✅ Workspace persistence (auto-save to DynamoDB)
- ✅ Viewport state preservation
- ✅ Function CRUD operations
- ✅ Monaco editor with file tree
- ✅ File/folder management (S3)
- ✅ Batch save for code changes
- ✅ Modified file tracking
- ✅ Smart delete key handling
- ✅ Environment variable configuration
- ✅ Runtime selection (Node.js, Python)

**In Progress:**

- 🚧 Function deployment
- 🚧 Function execution
- 🚧 Observability dashboard
- 🚧 AI vulnerability checks

## 👥 Team

Team Green - SoftBank Hackathon 2025

## 📄 License

This project is created for the SoftBank Hackathon 2025.
