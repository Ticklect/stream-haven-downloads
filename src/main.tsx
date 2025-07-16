import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Safe DOM mounting with error handling
const rootElement = document.getElementById("root");

if (!rootElement) {
  // Create root element if it doesn't exist
  const newRoot = document.createElement("div");
  newRoot.id = "root";
  document.body.appendChild(newRoot);
  
  console.warn("Root element not found, created new one");
  createRoot(newRoot).render(<App />);
} else {
  createRoot(rootElement).render(<App />);
}
