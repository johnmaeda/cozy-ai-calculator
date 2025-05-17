import "./style.css";
import "./components/agent-spreadsheet.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Get reference to the layout component
  const layout = document.querySelector("foundry-layout");

  // Set up agent playground if it exists
  const agentPlayground = document.querySelector("agent-playground");
  if (agentPlayground) {
    console.log("Agent playground initialized");
  }

  // Fetch templates and populate the spreadsheet component
  try {
    const response = await fetch('/templates.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const templates = await response.json();
    const spreadsheet = document.querySelector('agent-spreadsheet');
    if (spreadsheet) {
      spreadsheet.templates = templates;
    } else {
      console.error('agent-spreadsheet component not found in the DOM.');
    }
  } catch (error) {
    console.error("Could not load templates:", error);
  }
});
