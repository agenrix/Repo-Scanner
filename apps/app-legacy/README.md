# Agenrix Frontend: Unified Agent Registry Dashboard

Premium, high-performance web dashboard for the Agenrix agent management system. Provides a unified interface for exploring, searching, and auditing autonomous agents across repositories with real-time registry synchronization and advanced filtering capabilities.

## ✨ Design System

Professional dark-mode dashboard, featuring light/dark theme toggle and persistent navbar.

---

## 🚀 Core Features

### 1. Unified Registry Dashboard

Consolidated view for simultaneous exploration of:

- **Registry Identity (SQL):** Repository links, owners, agent classifications, and metadata
- **Audit Intelligence (NoSQL):** Agent signals, AI reasoning, framework detection, and activity events

### 2. Advanced Search & Filtering

- **Fuzzy Search:** Parallel queries across both SQL and NoSQL layers for comprehensive results
- **Classification Filters:** Quick filtering by agent classification (`AGENT`, `POSSIBLE_AGENT`, `NOT_AGENT`)
- **Field Visibility:** Customizable column display to focus on relevant audit data

### 3. Data Export

- **One-Click CSV Export:** Export current dashboard state or filtered results to CSV
- **Client-Side Processing:** Uses PapaParse for high-speed ingestion and export

### 4. Real-Time Updates

- **Live Registry Sync:** Automatic polling for new agent registrations and updates
- **Audit Trail:** Complete visibility into when and how agents were registered

---

## 🛠 Tech Stack

| Technology          | Version | Purpose                                          |
| ------------------- | ------- | ------------------------------------------------ |
| **React**           | 19      | UI framework and state management                |
| **Vite**            | Latest  | Fast build tool and dev server                   |
| **Tailwind CSS**    | 4.0     | Utility-first styling                            |
| **Axios**           | Latest  | HTTP client with interceptors and error handling |
| **PapaParse**       | Latest  | CSV parsing and generation                       |
| **Lucide React**    | Latest  | Icon library                                     |
| **Sonner**          | Latest  | Toast notifications                              |
| **React Hot Toast** | Latest  | Feedback notifications                           |

---

## 📁 Project Structure

```
apps/app-legacy/
├── public/                  # Branding assets and SVG logos
├── src/
│   ├── api/
│   │   └── axiosInstance.js    # Pre-configured HTTP client with interceptors
│   ├── components/
│   │   ├── Layout.jsx          # Main application wrapper
│   │   ├── Navbar.jsx          # Top-fixed persistent navigation and theme toggle
│   │   └── ui/                 # Reusable UI component library
│   ├── context/
│   │   └── ThemeContext.jsx    # Light/Dark mode state management
│   ├── pages/
│   │   └── Registry.jsx        # Main dashboard (Primary View)
│   ├── lib/
│   │   └── utils.js            # Utility functions
│   ├── index.css               # Global design system (CSS variables)
│   ├── App.jsx                 # Root component and routing
│   └── main.jsx                # Entry point
├── index.html                # HTML template
├── package.json              # Dependencies and scripts
├── vite.config.js            # Vite configuration
└── tailwind.config.js        # Tailwind CSS configuration
```

---

## 🚀 Development Setup

### Prerequisites

- **Node.js:** 16.x or higher
- **npm:** 8.x or higher
- **Backend API:** Running on configured URL (default: `http://localhost:8000`)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Environment Configuration

Create a `.env` file in the `apps/app-legacy/` directory:

```bash
cp .env.example .env
```

**Environment Variables:**

| Variable                | Description                         | Example                 | Default                 |
| ----------------------- | ----------------------------------- | ----------------------- | ----------------------- |
| `VITE_API_BASE_URL`     | Backend API base URL                | `http://localhost:8000` | `http://localhost:8000` |
| `VITE_APP_TITLE`        | Application title shown in navbar   | `Agenrix Registry`      | `Agenrix Registry`      |
| `VITE_THEME_MODE`       | Default theme (`light` or `dark`)   | `dark`                  | `dark`                  |
| `VITE_POLLING_INTERVAL` | Registry data polling interval (ms) | `30000`                 | `30000`                 |

### Step 3: Run Development Server

```bash
npm run dev
```

**Expected output:**

```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
```

Access the dashboard at `http://localhost:5173/`

### Step 4: Production Build

```bash
npm run build
```

Output files are placed in `dist/` directory, ready for deployment.

---

## 📡 API Integration

### Axios Instance Configuration

The pre-configured `axiosInstance` provides:

- **Base URL:** Automatically set from `VITE_API_BASE_URL`
- **Error Handling:** Global interceptor for handling `401`, `403`, `500` errors
- **Request/Response Logging:** Optional debug logging in development mode

**Usage:**

```javascript
import api from "./api/axiosInstance";

// Fetch agents
const response = await api.get("/agents", {
  params: { search: "researcher", limit: 50 }
});
const agents = response.data.data;

// POST repository scan
await api.post("/repo_scans", {
  repo: { ... },
  agent: { ... }
});

// Error handling
try {
  await api.get("/protected");
} catch (error) {
  if (error.response?.status === 401) {
    // Handle authentication error
  }
}
```

### Key API Endpoints

| Endpoint             | Method | Purpose                                          |
| -------------------- | ------ | ------------------------------------------------ |
| `/agents`            | GET    | Fetch agents with optional search and pagination |
| `/add_agent`         | POST   | Register new agent                               |
| `/update_agent/{id}` | PATCH  | Update agent configuration                       |
| `/repo_scans`        | GET    | Fetch repository scans with audit data           |
| `/repo_scans`        | POST   | Submit new repository analysis                   |

See [Backend README](../../apps/api-legacy/README.md) for detailed API documentation.

---

## 🎨 Component Documentation

### Theme Context (`ThemeContext.jsx`)

Manages light/dark mode state globally.

```javascript
import { useTheme } from "./context/ThemeContext";

function MyComponent() {
    const { theme, toggleTheme } = useTheme();
    return <button onClick={toggleTheme}>Current: {theme}</button>;
}
```

### Navbar (`Navbar.jsx`)

Top-fixed navigation with branding and theme toggle.

**Features:**

- Persistent positioning (stays at top during scroll)
- Theme toggle button
- Responsive layout for mobile/desktop
- Logo/branding area

### Registry Dashboard (`Registry.jsx`)

Main dashboard component.

**Responsibilities:**

- Fetch and display agent registry data
- Handle search and filtering
- Manage column visibility
- Export to CSV

**Key Functions:**

```javascript
// Search agents
const handleSearch = async (query) => {
    const response = await api.get("/agents", {
        params: { search: query },
    });
    setAgents(response.data.data);
};

// Export to CSV
const handleExport = () => {
    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    // Trigger download
};
```

---

## 🔍 Advanced Features

### CSV Export

Export filtered agent data directly from the dashboard:

1. Apply filters (search, classification)
2. Click "Export to CSV"
3. File downloads as `agents_export_[timestamp].csv`

### Real-Time Sync

The dashboard polls the backend at configurable intervals to stay in sync:

```javascript
// Default: every 30 seconds
useEffect(() => {
    const interval = setInterval(() => {
        fetchAgents();
    }, VITE_POLLING_INTERVAL);
    return () => clearInterval(interval);
}, []);
```

### Custom Hooks

**useAgents:** Manages agent data fetching and caching

```javascript
const { agents, loading, error, search } = useAgents();
```

**useTheme:** Manages theme state

```javascript
const { theme, toggleTheme } = useTheme();
```

---

## 🔐 Security & Accessibility

### Security Measures

- **API Validation:** All inputs are validated by backend Pydantic models
- **No Sensitive Data in localStorage:** API responses are not cached
- **HTTPS Recommended:** For production deployments

### Accessibility Features

- **High Contrast:** Action Yellow on Dark Charcoal meets WCAG AA standards
- **Semantic HTML:** Proper `<button>`, `<table>`, `<form>` elements
- **Keyboard Navigation:** All interactive elements are keyboard accessible
- **Screen Reader Support:** ARIA labels on dynamic content

---

## 📚 Additional Resources

- [Backend API Documentation](../../apps/api-legacy/README.md)
- [Design System Details](#design-system)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [React Documentation](https://react.dev)
