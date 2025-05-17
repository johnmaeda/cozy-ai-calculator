import { LitElement, html, css } from "lit";
import "./file-upload.js";

export class AgentSpreadsheet extends LitElement {
  static properties = {
    data: { type: Object },
    selectedCell: { type: String },
    editingCell: { type: String },
    numRows: { type: Number },
    numCols: { type: Number },
    columnWidths: { type: Object },
    showDevTools: { type: Boolean },
    showAgentsModal: { type: Boolean },
    showReadmeModal: { type: Boolean },
    cellMetrics: { type: Object },
    activeTab: { type: String },
    agentConfigs: { type: Object },
    processingCells: { type: Object, state: true },
    agentCache: { type: Object },
    templates: { type: Object },
    editingAgent: { type: String },
    newAgentName: { type: String },
    newAgentPrompt: { type: String },
    newAgentFileName: { type: String },
    newAgentFileContent: { type: String },
    flowStructure: { type: Object },
    newAgentFiles: { type: Array },
    lastMeasuredCell: { type: String },
    lastMeasuredPerformance: { type: Object },
    activeDevTab: { type: String },
    isResizing: { type: Boolean },
    resizingCol: { type: Number },
    startX: { type: Number },
    startWidth: { type: Number },
    dashboardView: { type: Boolean },
    showGenAIPromptModal: { type: Boolean },
    genAIPrompt: { type: String },
    isGenerating: { type: Boolean },
    showToolbarMenu: { type: Boolean },
    showApiKeysModal: { type: Boolean },
    // Row resizing properties
    rowHeights: { type: Object },
    resizingRow: { type: Number },
    startY: { type: Number },
    startHeight: { type: Number }
  };

  constructor() {
    super();
    this.data = {};
    this.selectedCell = null;
    this.editingCell = null;
    this.numRows = 30;
    this.numCols = 10;
    this.showDevTools = false;
    this.processingCells = {};
    this.columnWidths = {};
    this.agentCache = {};
    this.agentConfigs = {};
    this.showAgentsModal = false;
    this.showReadmeModal = false;
    this.editingAgent = null;
    this.activeDevTab = "console";
    this.dependencyMap = {};
    this.newAgentName = '';
    this.newAgentPrompt = '';
    this.newAgentFiles = [];
    this.showGenAIPromptModal = false;
    this.genAIPrompt = '';
    this.isGenerating = false;
    this.resizing = null;
    this.cellMetrics = {};
    this.activeTab = "metrics";
    this.templates = {};
    this.showToolbarMenu = false;
    this.showApiKeysModal = false;
    this.apiKeyProvider = 'Azure OpenAI';
    this.apiKeyString = '';
    this.apiKeyEndpoint = '';
    this.defaultEndpoints = {
      OpenAI: "https://api.openai.com/v1/chat/completions",
      "Azure OpenAI": "", 
    };
    // Initialize row resizing properties
    this.rowHeights = {};
    this.resizingRow = null;
    this.startY = 0;
    this.startHeight = 0;
  }

  connectedCallback() {
    super.connectedCallback();
    // Check API key status when component mounts
    const apiKey = this.getApiInfo();
    if (apiKey) {
      console.log("✅ OpenAI API key found and valid");
    } else {
      console.warn(
        "⚠️ OpenAI API key not found or expired. Please add a valid API key to p5jsStorage."
      );
      console.info(
        "To add an API key, store it in localStorage under p5jsStorage.MIRAI_OAI_API_KEY.value with an expiration timestamp in p5jsStorage.MIRAI_OAI_API_KEY.expires"
      );
    }
  }

  static styles = css`
    :host {
      display: block;
      height: 100%;
      width: 100%;
      position: relative;
      overflow: hidden;
    }

    .app-logo-icon {
      width: 24px; /* Adjust size as needed */
      height: 24px; /* Adjust size as needed */
      fill: #c0c0c0; /* A light grey color, adjust as needed */
      margin-right: 8px; /* Optional: if you want some space next to it */
    }

    .content-wrapper {
      display: flex;
      position: relative;
      height: 100%;
      width: 100%;
      overflow: hidden;
    }

    .spreadsheet-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #292a2d;
      color: #e8eaed;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
        Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
      position: relative;
      overflow: hidden;
    }

    .spreadsheet-container.with-dev-tools {
      margin-right: 300px; /* Replaced margin-inline-end with margin-right */
    }

    .toolbar {
      display: flex;
      justify-content: space-between; /* This will push left and right items to the ends */
      align-items: center; /* Vertically align items in the toolbar */
      padding: 8px 12px; /* Adjusted padding for a bit more space */
      background: #1e1e1e;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      position: relative; /* Keep for popup positioning context */
      height: 48px; /* Slightly taller toolbar */
    }

    .toolbar-left-items {
      display: flex;
      align-items: center;
      gap: 8px; /* Space between items on the left */
    }

    .toolbar-left-items h4 {
      margin: 0;
      font-size: 1.1em; /* Slightly larger title */
      font-weight: 600; /* Bolder title */
      color: #e0e0e0; /* Lighter title color */
    }

    .toolbar-right-items {
      position: relative; /* For anchoring the popup menu */
      display: flex;
      align-items: center;
      gap: 8px; /* Added gap for spacing between buttons */
    }

    .toolbar-menu-button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 4px;
      display: flex; /* Helps to center SVG if needed */
      align-items: center;
    }

    .toolbar-menu-button svg {
      width: 20px;
      height: 20px;
    }

    .toolbar-popup-menu {
      position: absolute;
      top: calc(100% + 4px); /* Position below the button with a small gap */
      right: 0; /* Align to the right of the toolbar-right-items container */
      background-color: #2c2c2c; /* Slightly lighter than toolbar for distinction */
      border: 1px solid #444;
      border-radius: 4px;
      padding: 8px;
      z-index: 1000; /* High z-index to appear on top */
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 200px; /* Adjust as needed */
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    .toolbar-popup-menu .template-selector-popup {
      display: flex; /* Allow select and other items to be separate if needed */
      flex-direction: column;
      gap: 6px;
    }
    
    .toolbar-popup-menu .template-select {
      width: 100%;
      background-color: #3c3c3c;
      color: white;
      border: 1px solid #555;
      padding: 6px;
      border-radius: 3px;
    }

    .toolbar-popup-menu .popup-button {
      background-color: transparent; /* Remove background */
      color: #e0e0e0; /* Lighter text */
      border: none; /* Remove border */
      padding: 8px 12px; /* Adjust padding */
      border-radius: 0; /* No border radius for flat menu items */
      text-align: left;
      width: 100%;
      cursor: pointer;
      display: block;
    }

    .toolbar-popup-menu .popup-button:hover {
      background-color: #3c3c3c; /* Subtle hover background */
      color: white;
    }

    .popup-divider {
      height: 1px;
      background-color: #444; /* Divider color */
      margin: 4px 0; /* Vertical spacing for the divider */
    }

    .spreadsheet-grid {
      display: grid;
      flex: 1;
      min-width: 0; /* Replaced min-inline-size with min-width */
      overflow: auto;
      background: var(--surface-color, #1e1e1e);
      grid-template-columns: 40px repeat(10, minmax(180px, 1fr));
      grid-auto-rows: 32px;
      min-height: 0; /* Replaced min-block-size with min-height */
      gap: 0;
      border-collapse: collapse;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .header-cell {
      position: sticky;
      top: 0;
      z-index: 2;
      background: rgb(107, 47, 103);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 0.5rem;
      text-align: center;
      font-weight: 600;
      box-sizing: border-box;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .row-header {
      position: sticky;
      left: 0;
      z-index: 2;
      background:rgb(107, 47, 103);
      color: white;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.3);
      font-weight: 600;
      box-sizing: border-box;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      margin: 0;
      isolation: isolate;
    }

    .resize-handle {
      position: absolute;
      right: -3px;
      top: 0;
      width: 6px;
      height: 100%;
      cursor: col-resize;
      z-index: 3;
    }

    .resize-handle:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .resize-handle-row {
      position: absolute;
      bottom: -3px; /* Position at the bottom of the cell */
      left: 0;
      width: 100%;
      height: 6px; /* Make it a bit thicker for easier grabbing */
      cursor: row-resize; /* Cursor for row resizing */
      z-index: 3; /* Ensure it's above other elements */
    }

    .resize-handle-row:hover {
      background: rgba(255, 255, 255, 0.2); /* Highlight on hover */
    }

    .resizing {
      user-select: none;
      cursor: col-resize;
    }

    .resizing * {
      cursor: col-resize !important;
    }

    .cell {
      background: var(--surface-color, #1e1e1e);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 0.5rem;
      min-width: 0;
      overflow: auto;
      white-space: normal;
      text-align: left;
      vertical-align: top;
      height: 100%;
      box-sizing: border-box;
    }

    .cell.selected {
      background: rgba(255, 255, 255, 0.1);
      outline: 2px solid var(--primary-color, #0066ff);
      outline-offset: -2px;
      z-index: 1;
    }

    .cell.editing {
      padding: 0;
      background: var(--surface-color, #1e1e1e);
      border: 2px solid var(--primary-color, #0066ff);
      cursor: text;
      z-index: 2;
    }

    .cell input {
      width: 100%;
      height: 100%;
      background: var(--surface-color, #1e1e1e);
      color: white;
      border: none;
      padding: 0.5rem;
      font-size: inherit;
      font-family: inherit;
      outline: none;
      box-sizing: border-box;
    }

    .cell input:focus {
      outline: none;
    }

    .error {
      color: #ff4444;
      font-style: italic;
    }

    .function {
      color: #00aaff;
      font-family: var(--font-mono, monospace);
    }
    
    /* Dev Inspector CSS */
    .dev-tools-panel {
      position: fixed;
      right: 1rem;
      top: 1rem;
      bottom: 0;
      width: 350px;
      background: #202124;
      border-radius: 8px 8px 0 0;
      border: 1px solid #3c4043;
      border-bottom: none;
      display: flex;
      flex-direction: column;
      transform: translateX(calc(100% + 1rem));
      transition: transform 0.3s linear;
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    }

    .dev-tools-panel.show {
      transform: translateX(0);
    }

    .dev-tools-header {
      padding: 8px 12px;
      background: #292a2d;
      color: #e8eaed;
      font-weight: 500;
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      border-bottom: 1px solid #3c4043;
      border-radius: 7px 7px 0 0;
      height: 32px;
    }

    .dev-tools-tabs {
      display: flex;
      background: #202124;
      border-bottom: 1px solid #3c4043;
      padding: 0 6px;
      height: 28px;
      align-items: flex-end;
      flex-shrink: 0;
      overflow-x: auto;
      user-select: none;
    }

    .dev-tools-tab {
      padding: 4px 8px;
      color: #9aa0a6;
      font-size: 11px;
      cursor: pointer;
      border: none;
      background: none;
      margin: 0;
      height: 28px;
      border-radius: 6px 6px 0 0;
      white-space: nowrap;
    }

    .dev-tools-tab:hover {
      background: #3c4043;
    }

    .dev-tools-tab.active {
      color: #e8eaed;
      background: #292a2d;
      border: 1px solid #3c4043;
      border-bottom: none;
    }

    /* Button CSS Styling */
    .export-button, .clear-button, .dev-tools-toggle, .readme-button, .show-agents-button {
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    }

    .export-button:hover, .clear-button:hover, .dev-tools-toggle:hover, .readme-button:hover, .show-agents-button:hover {
      background: #1557b0;
    }

    .template-select, button {
      height: 32px;
      border-radius: 4px;
      padding: 0 8px;
      font-size: 13px;
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      cursor: pointer;
    }

    button:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }

    .dev-tools-close {
      background: none;
      border: none;
      color: #9aa0a6;
      cursor: pointer;
      font-size: 20px;
      padding: 4px;
      transition: color 0.2s;
    }

    .dev-tools-close:hover {
      color: #e8eaed;
    }

    .delete-file-button {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      font-size: 16px;
    }
    
    /* Formula Bar Styling */
    .formula-bar {
      display: flex;
      align-items: center;
      padding: 4px 8px;
      background: var(--surface-color, #1e1e1e);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      gap: 8px;
    }

    .formula-bar-label {
      color: #9aa0a6;
      font-size: 14px;
      white-space: nowrap;
    }

    .formula-bar-input {
      flex: 1;
      background: #292a2d;
      color: #e8eaed;
      border: 1px solid #3c4043;
      border-radius: 4px;
      padding: 6px 8px;
      font-family: inherit;
      font-size: 14px;
      outline: none;
    }

    .formula-bar-input:focus {
      border-color: var(--primary-color, #0066ff);
    }
    
    /* Processing indicator for LLM API */
    .processing-indicator {
      position: absolute;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(0,255,0,1);
      border-radius: 50%;
      border-top-color: #FFFF00;
      left: 50%;
      top: 50%;
      margin-left: -7px; /* Half of width */
      margin-top: -7px; /* Half of height */
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .tab-content {
      display: none;
      flex: 1;
      overflow-y: auto;
      background: #202124;
    }

    .tab-content.active {
      display: block;
    }

    .dev-tools-content {
      flex: 1;
      overflow: auto;
      padding: 16px;
      background: #202124;
      color: #e8eaed;
      font-size: 13px;
    }

    .dev-tools-section {
      margin-bottom: 16px;
    }

    .dev-tools-section-title {
      text-transform: uppercase;
      color: #9aa0a6;
      font-size: 11px;
      font-weight: 500;
      margin-bottom: 8px;
      letter-spacing: 0.8px;
    }

    .metric-group {
      margin: 0;
      border-bottom: 1px solid #3c4043;
    }

    .metric-group h3 {
      color: #e8eaed;
      margin: 0;
      padding: 10px 12px;
      font-size: 12px;
      font-weight: 500;
      background: #292a2d;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .metric-item {
      margin: 4px 0;
      max-height: none;
      overflow: visible;
    }

    .metric-item:last-child {
      border-bottom: none;
    }

    .metric-label {
      color: #9aa0a6;
    }

    .metric-value {
      display: block;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 400px;
      width: 100%;
      max-width: 100%;
      overflow-y: auto;
      overflow-x: auto;
      padding: 4px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 4px;
    }

    .performance-bar {
      height: 3px;
      background: #3c4043;
      border-radius: 1.5px;
      margin: 8px 12px 12px;
    }

    .performance-bar-fill {
      height: 100%;
      background: #8ab4f8;
      border-radius: 1.5px;
      transition: width 0.3s ease-in-out;
    }

    .console-content {
      padding: 8px;
      font-family: "Roboto Mono", monospace;
      font-size: 12px;
      color: #e8eaed;
      white-space: pre-wrap;
    }

    .console-log {
      padding: 4px 0;
      border-bottom: 1px solid #3c4043;
    }

    .console-log:last-child {
      border-bottom: none;
    }

    .log-timestamp {
      color: #9aa0a6;
      margin-right: 8px;
    }

    .log-level {
      padding: 2px 4px;
      border-radius: 3px;
      margin-right: 8px;
      font-size: 10px;
    }

    .log-level.info {
      background: #1a73e8;
      color: white;
    }

    .log-level.debug {
      background: #188038;
      color: white;
    }

    .log-level.trace {
      background: #9334e6;
      color: white;
    }

    .log-level.error {
      background: #d93025;
      color: white;
    }

    .log-content {
      color: #e8eaed;
    }

    .log-json {
      color: #9aa0a6;
      padding-left: 16px;
    }

    .performance-timeline {
      padding: 12px;
      background: #292a2d;
      border-radius: 4px;
      margin: 8px 0;
    }

    .timeline-row {
      display: flex;
      align-items: center;
      margin: 4px 0;
      height: 24px;
    }

    .timeline-label {
      width: 120px;
      font-size: 11px;
      color: #9aa0a6;
      flex-shrink: 0;
    }

    .timeline-track {
      flex: 1;
      height: 16px;
      position: relative;
      background: #202124;
      border-radius: 3px;
      margin-left: 8px;
    }

    .timeline-segment {
      position: absolute;
      height: 100%;
      border-radius: 3px;
    }

    .segment-llm {
      background: #1a73e8;
    }

    .segment-reasoning {
      background: #188038;
    }

    .segment-tool {
      background: #9334e6;
    }

    .segment-io {
      background: #d93025;
    }

    .timeline-tooltip {
      position: absolute;
      background: #202124;
      border: 1px solid #3c4043;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      color: #e8eaed;
      pointer-events: none;
      display: none;
    }

    .timeline-segment:hover .timeline-tooltip {
      display: block;
    }

    .performance-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-top: 16px;
    }

    .stat-card {
      background: #292a2d;
      padding: 8px;
      border-radius: 4px;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 500;
      color: #e8eaed;
    }

    .stat-label {
      font-size: 11px;
      color: #9aa0a6;
      margin-top: 4px;
    }

    .console-placeholder {
      color: #9aa0a6;
      font-style: italic;
      padding: 8px;
      text-align: center;
    }

    .performance-content {
      padding: 8px;
    }

    .chart-placeholder {
      height: 100px;
      background: #292a2d;
      border-radius: 4px;
      margin: 8px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9aa0a6;
      font-size: 12px;
    }

    .network-content {
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        sans-serif;
      font-size: 11px;
      color: #e8eaed;
    }

    .network-header {
      display: grid;
      grid-template-columns: minmax(200px, 2fr) 80px 80px 100px 80px 80px;
      padding: 6px 8px;
      background: #292a2d;
      border-bottom: 1px solid #3c4043;
      position: sticky;
      top: 0;
      font-weight: 500;
      color: #9aa0a6;
      user-select: none;
    }

    .network-row {
      display: grid;
      grid-template-columns: minmax(200px, 2fr) 80px 80px 100px 80px 80px;
      padding: 4px 8px;
      border-bottom: 1px solid #3c4043;
      align-items: center;
      font-size: 11px;
      cursor: pointer;
    }

    .network-row:hover {
      background: #292a2d;
    }

    .resource-name {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .resource-icon {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: #9aa0a6;
    }

    .status-success {
      color: #81c995;
    }

    .status-redirect {
      color: #ffa348;
    }

    .waterfall-bar {
      position: relative;
      height: 16px;
      background: #202124;
      border-radius: 3px;
      margin: 2px 0;
    }

    .waterfall-segment {
      position: absolute;
      height: 100%;
      background: #1a73e8;
      border-radius: 2px;
      opacity: 0.7;
    }

    .waterfall-segment.waiting {
      background: #9334e6;
    }

    .waterfall-segment.receiving {
      background: #188038;
    }

    .agents-modal {
      display: none;
      position: fixed;
      z-index: 1000;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      justify-content: center;
      align-items: center;
    }
    .agents-modal.show {
      display: flex;
    }
    .agents-modal-content {
      background-color: #1e1e1e;
      color: #f0f0f0;
      border-radius: 6px;
      padding: 20px;
      width: 80%;
      max-width: 800px;
      max-height: 80vh;
      overflow-y: auto;
    }
    .agents-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .agents-modal-close {
      background: none;
      border: none;
      color: #f0f0f0;
      font-size: 24px;
      cursor: pointer;
    }
    .agent-card {
      background-color: #272727;
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .agent-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .agent-name {
      margin: 0;
      font-size: 18px;
      font-weight: bold;
    }
    .button-group {
      display: flex;
      gap: 8px;
    }
    .agent-model {
      margin: 4px 0;
      font-size: 14px;
      opacity: 0.7;
    }
    .agent-prompt {
      margin-top: 12px;
      white-space: pre-wrap;
      font-family: monospace;
      border-left: 3px solid #555;
      padding-left: 10px;
    }


    .agent-prompt-editor {
      width: 100%;
      min-height: 120px;
      background-color: #2a2a2a;
      color: #f0f0f0;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 8px;
      font-family: monospace;
      margin-top: 12px;
      resize: vertical;
    }
    .edit-button,
    .delete-button {
      background-color: #333;
      color: #f0f0f0;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
    }
    .edit-button:hover {
      background-color: #444;
    }
    .delete-button {
      background-color: #4a2c2c;
    }
    .delete-button:hover {
      background-color: #5e3535;
    }
    .add-agent-card {
      background-color: #272727;
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .add-agent-card h3 {
      margin-top: 0;
      margin-bottom: 12px;
    }
    .add-agent-card input,
    .add-agent-card textarea {
      width: 100%;
      background-color: #2a2a2a;
      color: #f0f0f0;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 8px;
      margin-bottom: 12px;
    }
    .add-agent-card textarea {
      min-height: 50px;
      font-family: monospace;
      resize: vertical;
    }
    .add-agent-card button {
      background-color: #2a5885;
      color: #f0f0f0;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      cursor: pointer;
    }
    .add-agent-card button:hover {
      background-color: #366da8;
    }
    
    /* Agent Files Styles */
    .agent-files-section {
      margin-bottom: 20px;
    }
    
    .agent-files-section h4, 
    .agent-files-display h4 {
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 16px;
      color: #aaa;
    }
    
    .agent-files-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .agent-file-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: #333;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: monospace;
    }
    
    .agent-file-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .delete-file-button {
      background: none;
      border: none;
      color: #f0f0f0;
      font-size: 16px;
      cursor: pointer;
      opacity: 0.7;
    }
    
    .delete-file-button:hover {
      opacity: 1;
      color: #ff6b6b;
    }
    
    .no-files-message {
      color: #888;
      font-style: italic;
      margin: 8px 0 16px;
    }
    
    .add-file-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .add-file-form input,
    .add-file-form textarea {
      width: 100%;
      background-color: #2a2a2a;
      color: #f0f0f0;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 8px;
    }
    
    .file-content-input {
      min-height: 100px;
      font-family: monospace;
      resize: vertical;
    }
    
    .add-file-form button {
      align-self: flex-start;
      background-color: #2a5885;
      color: #f0f0f0;
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      cursor: pointer;
    }
    
    .add-file-form button:hover {
      background-color: #366da8;
    }
    
    .agent-files-display {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #444;
    }
    
    /* README Modal Styles */
    .readme-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 2000; /* Higher than other elements */
    }
    
    .readme-modal.show {
      display: flex;
    }
    
    .readme-modal-content {
      background-color: #1e1e1e;
      color: #f0f0f0;
      border-radius: 6px;
      padding: 20px;
      width: 80%;
      max-width: 800px;
      max-height: 80vh;
      overflow-y: auto;
      position: relative; /* Ensures stacking context */
    }
    
    .readme-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .readme-modal-title {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
    }
    
    .readme-modal-close {
      background: none;
      border: none;
      color: #f0f0f0;
      font-size: 24px;
      cursor: pointer;
    }
    
    .readme-section {
      margin-bottom: 24px;
    }
    
    .readme-section h2 {
      color: #4a9eff;
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 18px;
    }
    
    .readme-section p {
      margin: 0 0 12px 0;
      line-height: 1.5;
    }
    
    .readme-section ul {
      margin: 0 0 12px 0;
      padding-left: 24px;
    }
    
    .readme-section li {
      margin: 4px 0;
    }
    
    .readme-code {
      background-color: #272727;
      padding: 12px;
      border-radius: 4px;
      font-family: monospace;
      margin: 12px 0;
      overflow-x: auto;
    }

    .agent-indicator {
      position: absolute;
      top: 50%;
      right: 2px;
      transform: translateY(-50%);
      font-size: 0.7em;
      padding: 1px 3px;
      background: rgba(0, 102, 255, 0.8);
      border: 1px solid rgba(0, 102, 255, 0.3);
      border-radius: 3px;
      color: rgb(243, 246, 247);
      pointer-events: none;
    }

    .cell.editing .agent-indicator {
      display: none;
    }

    .cell .value {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: visible;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-start;
    }

    .upload-file-button {
      background-color: rgba(255, 255, 255, 0.1) !important;
      border: 1px solid #444;
    }

    .upload-file-button:hover {
      background-color: rgba(255, 255, 255, 0.1) !important;
    }

    .full-value {
      white-space: pre-wrap;
      word-break: break-word;
      width: 100%;
      max-width: 100%;
      font-family: monospace;
      margin: 0;
      padding: 8px;
      background: rgba(0, 0, 0, 0.1);
      font-size: 14px;
      line-height: 1.4;
      overflow-x: auto;
    }
    .genai-button {
      background-color:#9553ff;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      cursor: pointer;
      font-weight: bold;
      margin-left: 5px;
    }

    .genai-button:hover {
      background-color: #7a35e6;
    }
    
    .genai-prompt-modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(0, 0, 0, 0.5);
    }
    
    .genai-prompt-modal.show {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .genai-prompt-modal-content {
      background-color: #252525;
      margin: auto;
      padding: 0;
      border: 1px solid #555;
      border-radius: 8px;
      width: 60%;
      max-width: 800px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      animation-name: animatetop;
      animation-duration: 0.4s;
    }
    
    .genai-prompt-modal-header {
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #444;
    }
    
    .genai-prompt-modal-title {
      margin: 0;
      color: var(--text-color);
      font-size: 18px;
    }
    
    .genai-prompt-modal-close {
      color: var(--text-color);
      font-size: 28px;
      font-weight: bold;
      background: none;
      border: none;
      cursor: pointer;
    }
    
    .genai-prompt-modal-body {
      padding: 20px;
    }
    
    .genai-prompt-textarea {
      width: 100%;
      height: 150px;
      padding: 12px;
      border: 1px solid #444;
      border-radius: 4px;
      background-color: var(--input-bg-color);
      color: var(--text-color);
      font-family: inherit;
      font-size: 14px;
      resize: vertical;
      margin-bottom: 15px;
      box-sizing: border-box; /* Add this to include padding in width calculation */
      max-width: 100%; /* Ensure it never exceeds container width */
      overflow: auto; /* Add scrollbars when needed */
    }
    
    .genai-prompt-modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    
    .genai-prompt-modal-cancel,
    .genai-prompt-modal-submit {
      padding: 8px 16px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-weight: 500;
    }
    
    .genai-prompt-modal-cancel {
      background-color: #444;
      color: white;
    }
    
    .genai-prompt-modal-submit {
      background-color: #9553ff;
      color: white;
    }
    
    .genai-prompt-modal-submit:hover {
      background-color: #7a35e6;
    }
    
    .api-key-note {
      background-color: rgba(149, 83, 255, 0.1);
      border-left: 3px solid #9553ff;
      padding: 10px;
      margin-bottom: 15px;
      border-radius: 0 4px 4px 0;
    }
    
    .api-key-note p {
      margin: 5px 0;
      font-size: 13px;
      color: #ccc;
    }
    
    .api-key-note strong {
      color: #fff;
    }
    
    .genai-prompt-modal-submit {
      background-color: #9553ff;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .genai-prompt-modal-submit:hover {
      background-color: #7a35e6;
    }
    
    .genai-prompt-modal-submit:disabled,
    .genai-prompt-modal-cancel:disabled,
    .genai-prompt-textarea:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* API Keys Modal Styles */
    .api-keys-modal {
      display: none; /* Hidden by default */
      position: fixed;
      z-index: 2000; /* Higher than other modals if needed */
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(0, 0, 0, 0.6);
      justify-content: center;
      align-items: center;
    }

    .api-keys-modal.show {
      display: flex; /* Show when .show class is added */
    }

    .api-keys-modal-content {
      background-color: #292a2d;
      color: #e8eaed;
      margin: auto;
      padding: 20px;
      border: 1px solid #3c4043;
      border-radius: 8px;
      width: 90%;
      max-width: 600px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #3c4043;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }

    .modal-header h3 {
      margin: 0;
      color: #e8eaed;
      font-size: 18px;
      font-weight: 500;
    }

    .close-button {
      background: none;
      border: none;
      color: #9aa0a6;
      cursor: pointer;
      font-size: 24px;
      transition: color 0.2s;
    }

    .close-button:hover {
      color: #e8eaed;
    }

    .modal-description {
      margin-bottom: 20px;
      color: #9aa0a6;
      font-size: 14px;
      line-height: 1.5;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      color: #e8eaed;
      font-size: 14px;
      font-weight: 500;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      background: #202124;
      border: 1px solid #3c4043;
      color: #e8eaed;
      padding: 8px 10px;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #8ab4f8;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 25px;
      padding-top: 15px;
      border-top: 1px solid #3c4043;
    }

    .button {
      padding: 8px 16px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    .primary-button {
      background-color: #8ab4f8;
      color: #202124;
    }

    .primary-button:hover {
      background-color: #aecbfa;
    }

    .secondary-button {
      background-color: #3c4043;
      color: #e8eaed;
    }

    .secondary-button:hover {
      background-color: #4a4e51;
    }

    .note {
      background-color: rgba(138, 180, 248, 0.1);
      border-left: 3px solid #8ab4f8;
      padding: 12px;
      margin: 16px 0;
      border-radius: 0 4px 4px 0;
      color: #e8eaed;
      font-size: 13px;
      line-height: 1.5;
    }

    .note em {
      font-weight: bold;
      color: #aecbfa;
    }
    
    .note code {
      display: block;
      background-color: #202124;
      border: 1px solid #3c4043;
      border-radius: 4px;
      padding: 8px;
      margin: 8px 0;
      font-family: monospace;
      color: #8ab4f8;
      font-size: 12px;
    }
  `;

  getCellId(row, col) {
    const colLetter = String.fromCharCode(65 + col - 1);
    return `${colLetter}${row}`;
  }

  parseCellId(cellId) {
    const match = cellId.match(/([A-Z])(\d+)/);
    if (match) {
      const col = match[1].charCodeAt(0) - 64;
      const row = parseInt(match[2]);
      return [col, row];
    }
    return [1, 1]; // Default to A1 if parsing fails
  }

  evaluateFormula(formula, cellId) {
    // Remove the '=' at the start
    const expression = formula.substring(1);

    // Handle our new special functions
    if (expression.startsWith('date()')) {
        const today = new Date();
        return today.toLocaleDateString();
    }

    if (expression.startsWith('time()')) {
        const now = new Date();
        return now.toLocaleTimeString();
    }

    if (expression.startsWith('weather()')) {
        const weatherOptions = [
            'sunny', 'rainy', 'cloudy', 'foggy', 'snowy',
            'windy', 'stormy', 'tornado', 'hail', 'sleet',
            'partly cloudy', 'thunderstorm'
        ];
        const randomIndex = Math.floor(Math.random() * weatherOptions.length);
        return weatherOptions[randomIndex];
    }

    // Handle cell references (e.g., "A4")
    const cellReferenceMatch = expression.match(/^([A-Z])(\d+)$/);
    if (cellReferenceMatch) {
        const [_, col, row] = cellReferenceMatch;
        const referencedCellId = `${col}${row}`;
        // Return the value from the referenced cell
        return this.data[referencedCellId]?.value || '';
    }
    
    // Handle string concatenation with + operator
    if (expression.includes('+')) {
        try {
            // First, replace all cell references with their values
            const cellRefRegex = /\b([A-Z]\d+)\b/g;
            let processedExpression = expression;
            
            let match;
            let dependencies = [];
            while ((match = cellRefRegex.exec(expression)) !== null) {
                const refCellId = match[0];
                const cellValue = this.data[refCellId]?.value || '';
                
                // Add to dependencies for tracking
                dependencies.push(refCellId);
                
                // Replace with the cell's actual value, properly quoted
                processedExpression = processedExpression.replace(
                    new RegExp('\\b' + refCellId + '\\b', 'g'), 
                    JSON.stringify(cellValue)
                );
            }
            
            // Store dependencies for future updates
            if (!this.data[cellId]) {
                this.data[cellId] = { value: "", formula: "" };
            }
            this.data[cellId].dependencies = dependencies;
            
            // Evaluate the expression after resolving cell references
            return eval(processedExpression);
        } catch (error) {
            console.error('Error evaluating string concatenation:', error);
            return '#ERROR in concatenation!';
        }
    }

    // Handle other formulas (if any)
    try {
        // ... rest of the existing evaluation code ...
        return eval(expression);
    } catch (error) {
        console.error('Error evaluating formula:', error);
        return '#ERROR!';
    }
}

  getDependentCells(cellId) {
    const dependents = new Set();

    // Check all cells for formulas that reference this cell
    for (const [otherCellId, cell] of Object.entries(this.data)) {
      // Check stored dependencies
      if (cell.dependencies?.includes(cellId)) {
        dependents.add(otherCellId);
        continue;
      }

      // Check formula references
      if (cell.formula?.startsWith("=")) {
        if (cell.formula.startsWith("=@")) {
          const match = cell.formula.match(/^=@\w+\((.*)\)$/);
          if (match) {
            let paramText = match[1];
            // Remove quoted strings to avoid finding refs inside them
            paramText = paramText.replace(/"([^"]*)"/, '""');
            paramText = paramText.replace(/'([^']*)'/, "''");
            
            // Now find actual cell references
            const refs = paramText.match(/[A-Z]\d+/g) || [];
            if (refs.includes(cellId)) {
              dependents.add(otherCellId);
            }
          }
        } else {
          // For regular formulas or string concatenation, check for direct cell references
          const refs = cell.formula.match(/[A-Z]\d+/g) || [];
          if (refs.includes(cellId)) {
            dependents.add(otherCellId);
          }
        }
      }
    }

    return Array.from(dependents);
  }

  async updateCell(cellId, value) {
    if (!this.data[cellId]) {
      this.data[cellId] = { value: "", formula: "" };
    }

    // Store the old value to check if we actually need to trigger updates
    const oldValue = this.data[cellId].value;
    
    // For regular cells (not formulas), update the value directly
    if (!value.startsWith("=")) {
      this.data[cellId].value = value;
      this.data[cellId].formula = "";
    } else {
      this.data[cellId].formula = value;
      
      // Handle agent functions
      if (value.startsWith("=@")) {
        try {
          const result = await this.evaluateAgentFunction(value, cellId);
          this.data[cellId].value = result;
        } catch (error) {
          this.data[cellId].value = `#ERROR: ${error.message}`;
        }
      } else {
        // Handle regular formulas
        this.data[cellId].value = this.evaluateFormula(value, cellId);
      }
    }

    this.editingCell = null;
    
    // Always evaluate dependent cells when a cell changes
    // This ensures concatenated references get updated
    const processedCells = new Set([cellId]);
    await this.evaluateDependentCells(cellId, processedCells);
    
    this.requestUpdate();
  }

  async evaluateDependentCells(cellId, processedCells = new Set()) {
    processedCells.add(cellId);
    const dependents = this.getDependentCells(cellId);
    console.log(`Evaluating dependents for ${cellId}:`, dependents);

    // Process each dependent cell
    for (const dependentId of dependents) {
        if (processedCells.has(dependentId)) {
            console.log(`Skipping ${dependentId} to prevent circular evaluation`);
            continue;
        }

        const cell = this.data[dependentId];
        if (cell?.formula?.startsWith("=")) {
            // Check if this cell has multiple dependencies and if they're all ready
            const allDeps = this.getAllDependencies(cell.formula);
            const shouldEvaluate = allDeps.every(dep => 
                !this.processingCells[dep] && this.data[dep]?.value !== undefined
            );

            if (!shouldEvaluate) {
                console.log(`Skipping ${dependentId} - waiting for other dependencies`);
                continue;
            }

            try {
                if (cell.formula.startsWith("=@")) {
                    const result = await this.evaluateAgentFunction(
                        cell.formula,
                        dependentId
                    );
                    this.data[dependentId].value = result;
                } else {
                    this.data[dependentId].value = this.evaluateFormula(
                        cell.formula,
                        dependentId
                    );
                }

                await this.evaluateDependentCells(dependentId, processedCells);
            } catch (error) {
                this.data[dependentId].value = `#ERROR: ${error.message}`;
            }
        }
    }
}

// Add this helper method to get all dependencies for a formula
getAllDependencies(formula) {
    const refs = new Set();
    
    // Handle agent functions with concatenated parameters
    if (formula.startsWith("=@")) {
        const match = formula.match(/^=@\w+\((.*)\)$/);
        if (match) {
            let paramText = match[1];
            // Remove quoted strings to avoid finding refs inside them
            paramText = paramText.replace(/"([^"]*)"/, '""');
            paramText = paramText.replace(/'([^']*)'/, "''");
            
            // Find all cell references
            const cellRefs = paramText.match(/[A-Z]\d+/g) || [];
            cellRefs.forEach(ref => refs.add(ref));
        }
    } else if (formula.includes('+')) {
        // For string concatenation formulas
        const cellRefs = formula.match(/[A-Z]\d+/g) || [];
        cellRefs.forEach(ref => refs.add(ref));
    } else {
        // For regular formulas
        const cellRefs = formula.match(/[A-Z]\d+/g) || [];
        cellRefs.forEach(ref => refs.add(ref));
    }
    
    return Array.from(refs);
}

  renderCell(cellId) {
    const cell = this.data[cellId] || {};
    const isEditing = this.editingCell?.cellId === cellId;
    const isProcessing = this.processingCells[cellId];
    const isSelected = this.selectedCell?.cellId === cellId;

    if (isEditing) {
      return html`<input
        type="text"
        id="cell-input-${cellId}"
        name="cell-input-${cellId}"
        data-cell-id="${cellId}"
        .value=${cell.formula || cell.value || ""}
        @blur=${() => this.stopEditing(cellId)}
        @keydown=${(e) => this.handleKeyDown(e, cellId)}
        @input=${(e) => this.handleInput(e, cellId)}
        @click=${(e) => e.stopPropagation()}
        autocomplete="off"
      />`;
    }

    // Check if the cell contains a file upload
    const fileMatch = cell.formula?.match(/=@file\((.*)\)$/);
    if (fileMatch) {
      return html`
        <file-upload
          .fileName=${cell.value || ""}
          .isEditing=${isSelected}
          @file-selected=${(e) => this.handleFileSelected(cellId, e.detail)}
        ></file-upload>
      `;
    }

    // Check if the cell contains an agent reference
    const agentMatch = cell.formula?.match(/=@(\w+)\(/);
    const agentName = agentMatch ? agentMatch[1] : null;

    return html`
      <div class="value">
        ${cell.value || ""}
        ${agentName && !isEditing
          ? html` <span class="agent-indicator">@${agentName}</span> `
          : ""}
        ${isProcessing ? html`<div class="processing-indicator"></div>` : ""}
      </div>
    `;
  }

  selectCell(cellId) {
    this.selectedCell = { cellId };
    
    // Update the formula bar when a cell is selected
    const formulaBar = this.shadowRoot.querySelector('.formula-bar-input');
    if (formulaBar) {
      formulaBar.value = this.data[cellId]?.formula || this.data[cellId]?.value || '';
    }

    if (this.showDevTools) {
      this.updateCellMetrics(cellId);
      // Ensure the dev tools panel is visible and metrics are updated
      const cell = this.data[cellId] || { value: "", formula: "" };
      if (cell.formula?.includes("@")) {
        // If the cell contains an agent formula, show agent-related metrics
        this.setActiveTab("metrics");
      }
    }
    this.requestUpdate();
  }

  startEditing(cellId) {
    this.editingCell = { cellId };
    this.requestUpdate();
    
    // Focus either the cell input or the formula bar
    requestAnimationFrame(() => {
      const input = this.shadowRoot.querySelector(`input[data-cell-id="${cellId}"]`);
      const formulaBar = this.shadowRoot.querySelector('.formula-bar-input');
      
      if (input) {
        input.focus();
        input.select();
      } else if (formulaBar) {
        formulaBar.focus();
        formulaBar.select();
      }
    });
  }

  stopEditing(cellId) {
    if (this.editingCell?.cellId === cellId) {
      const input = this.shadowRoot.querySelector(
        `input[data-cell-id="${cellId}"]`
      );
      if (input) {
        this.updateCell(cellId, input.value);
      }
      this.editingCell = null;
      this.requestUpdate();
    }
  }

  handleInput(event, cellId) {
    const value = event.target.value;
    if (!this.data[cellId]) {
      this.data[cellId] = { value: "", formula: "" };
    }
    this.data[cellId].value = value;
    if (value.startsWith("=")) {
      this.data[cellId].formula = value;
    }
  }

  handleKeyDown(event, cellId) {
    if (event.key === "Enter") {
      event.preventDefault();
      this.stopEditing(cellId);
    } else if (event.key === "Escape") {
      event.preventDefault();
      this.editingCell = null;
      this.requestUpdate();
    } else if (event.key === "Tab") {
      event.preventDefault();
      this.stopEditing(cellId);

      const { col, row } = this.parseCellId(cellId);
      let nextCol = col + 1;
      let nextRow = row;

      if (nextCol > this.numCols) {
        nextCol = 1;
        nextRow++;
      }

      if (nextRow <= this.numRows) {
        const nextCellId = this.getCellId(nextRow, nextCol);
        // First select the cell to update the formula bar
        this.selectCell(nextCellId);
        // Then start editing
        this.startEditing(nextCellId);
      }
    }
    
    // Handle paste event
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
      console.log('Paste attempt detected on cell:', cellId);
      
      // Start editing mode first
      this.startEditing(cellId);
      
      // Let the native paste event handle it through the input element
      return;
    }
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has("viewMode") && this.viewMode === "graph") {
      // Use requestAnimationFrame to ensure the DOM is ready
      requestAnimationFrame(() => {
        this.initializeMermaid();
      });
    }
    if (this.editingCell) {
      const input = this.shadowRoot.querySelector(
        `#cell-input-${this.editingCell.cellId}`
      );
      if (input) {
        input.focus();
        input.select();
      }
    }
  }

  handleResizeStart(col, e) {
    e.preventDefault();
    this.resizing = {
      col,
      startX: e.clientX,
      initialWidth: this.columnWidths[col] || 180,
    };

    document.body.classList.add("resizing");

    document.addEventListener("mousemove", this.handleResizeMove.bind(this));
    document.addEventListener("mouseup", this.handleResizeEnd.bind(this));
  }

  handleResizeMove(e) {
    if (!this.resizing) return;

    const delta = e.clientX - this.resizing.startX;
    const newWidth = Math.max(60, this.resizing.initialWidth + delta);

    this.columnWidths = {
      ...this.columnWidths,
      [this.resizing.col]: newWidth,
    };

    // Update the grid template columns
    const gridElement = this.shadowRoot.querySelector(".spreadsheet-grid");
    if (gridElement) {
      const columns = ["40px"]; // First column for row headers
      for (let i = 1; i <= this.numCols; i++) {
        columns.push(`${this.columnWidths[i] || 180}px`);
      }
      gridElement.style.gridTemplateColumns = columns.join(" ");
    }

    this.requestUpdate();
  }

  handleResizeEnd() {
    document.body.classList.remove("resizing");
    this.resizing = null;

    document.removeEventListener("mousemove", this.handleResizeMove.bind(this));
    document.removeEventListener("mouseup", this.handleResizeEnd.bind(this));
  }

  toggleDevTools() {
    this.showDevTools = !this.showDevTools;
    if (this.showDevTools && this.selectedCell) {
      this.updateCellMetrics(this.selectedCell.cellId);
    }
    this.requestUpdate();
  }

  setActiveTab(tab) {
    this.activeTab = tab;
    if (this.selectedCell) {
      this.updateCellMetrics(this.selectedCell.cellId);
    }
    this.requestUpdate();
  }

  updateCellMetrics(cellId) {
    const cell = this.data[cellId] || {};
    console.log("updateCellMetrics called for cell:", {
      cellId,
      cellFormula: cell.formula,
      cellValue: cell.value,
      cellType: cell.formula?.startsWith("=") ? "formula" : "text",
    });

    const metrics = {
      formula: cell.formula || "none",
      value: cell.value || "empty",
      type: cell.formula?.startsWith("=") ? "formula" : "text",
      evaluationTime: this.measureEvaluationTime(cellId),
      dependencies: this.getCellDependencies(cellId),
      lastUpdated: new Date().toISOString(),
    };

    console.log("Setting metrics:", metrics);
    this.cellMetrics = {
      ...this.cellMetrics,
      [cellId]: metrics,
    };
  }

  measureEvaluationTime(cellId) {
    const cell = this.data[cellId];
    if (!cell?.formula) return 0;

    const start = performance.now();
    this.evaluateFormula(cell.formula, cellId);
    const end = performance.now();
    return end - start;
  }

  getCellDependencies(cellId) {
    const cell = this.data[cellId];
    if (!cell?.formula) return [];

    const cellRefs = cell.formula.match(/[A-Z]\d+/g) || [];
    return cellRefs;
  }

  renderCellMetrics(cellId) {
    const metrics = this.cellMetrics[cellId] || {};
    const cell = this.data[cellId] || {};

    console.log("renderCellMetrics called for cell:", {
      cellId,
      metricsFormula: metrics.formula,
      cellFormula: cell.formula,
      metricsType: metrics.type,
      cellType: cell.formula?.startsWith("=") ? "formula" : "text",
    });

    return html`
      <div class="metric-group">
        <h3>Basic Info</h3>
        <div class="metric-item">
          <span class="metric-label">Cell ID:</span>
          <span class="metric-value">${cellId}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Type:</span>
          <span class="metric-value">${metrics.type || "text"}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Last Updated:</span>
          <span class="metric-value">${metrics.lastUpdated || "never"}</span>
        </div>
      </div>

      <div class="metric-group">
        <h3>Formula</h3>
        <div class="metric-item">
          <span class="metric-value">${metrics.formula || "none"}</span>
        </div>
      </div>

      <div class="metric-group">
        <h3>Value</h3>
        <div class="metric-item value-container">
          <pre class="full-value">${cell.fileContent || cell.value || ""}</pre>
        </div>
      </div>

      <div class="metric-group">
        <h3>Performance</h3>
        <div class="metric-item">
          <span class="metric-label">Evaluation Time:</span>
          <span class="metric-value"
            >${metrics.evaluationTime?.toFixed(2)}ms</span
          >
        </div>
        <div class="performance-bar">
          <div
            class="performance-bar-fill"
            style="width: ${Math.min(100, (metrics.evaluationTime || 0) * 10)}%"
          ></div>
        </div>
      </div>

      <div class="metric-group">
        <h3>Dependencies</h3>
        ${metrics.dependencies?.length
          ? html`
              ${metrics.dependencies.map(
                (dep) => html`
                  <div class="metric-item">
                    <span class="metric-value">${dep}</span>
                  </div>
                `
              )}
            `
          : html` <div class="metric-item">No dependencies</div> `}
      </div>
    `;
  }

  renderDevToolsTabs() {
    return html`
      <div class="dev-tools-tabs">
        <button
          class="dev-tools-tab ${this.activeTab === "metrics" ? "active" : ""}"
          @click=${() => this.setActiveTab("metrics")}
        >
          Info
        </button>
        <button
          class="dev-tools-tab ${this.activeTab === "console" ? "active" : ""}"
          @click=${() => this.setActiveTab("console")}
        >
          Unused-1
        </button>
        <button
          class="dev-tools-tab ${this.activeTab === "performance"
            ? "active"
            : ""}"
          @click=${() => this.setActiveTab("performance")}
        >
          Unused-2
        </button>
        <button
          class="dev-tools-tab ${this.activeTab === "network" ? "active" : ""}"
          @click=${() => this.setActiveTab("network")}
        >
          Unused-3
        </button>
      </div>
    `;
  }

  renderTabContent(cellId) {
    switch (this.activeTab) {
      case "metrics":
        return this.renderCellMetrics(cellId);
      case "console":
        return this.renderConsoleContent(cellId);
      case "performance":
        return this.renderPerformanceContent(cellId);
      case "network":
        return this.renderNetworkContent(cellId);
      default:
        return html`<div>Select a tab to view details</div>`;
    }
  }

  renderConsoleContent(cellId) {
    return html`
      <div class="console-content">
        <div class="console-log">
          <span class="log-timestamp">12:04:23.541</span>
          <span class="log-level info">INFO</span>
          <span class="log-content"
            >Starting cell evaluation for ${cellId}</span
          >
        </div>
        <div class="console-log">
          <span class="log-timestamp">12:04:23.542</span>
          <span class="log-level debug">DEBUG</span>
          <span class="log-content">LLM Agent initialized with context:</span>
          <div class="log-json">
            { "cell": "${cellId}", "formula": "=@evan('analyze market trends')",
            "mode": "function_evaluation" }
          </div>
        </div>
        <div class="console-log">
          <span class="log-timestamp">12:04:23.845</span>
          <span class="log-level trace">TRACE</span>
          <span class="log-content"
            >Agent reasoning: Analyzing function parameters and determining
            required tools</span
          >
        </div>
        <div class="console-log">
          <span class="log-timestamp">12:04:24.102</span>
          <span class="log-level debug">DEBUG</span>
          <span class="log-content">Selected tool: web_search</span>
          <div class="log-json">
            { "query": "current market trends analysis", "limit": 5 }
          </div>
        </div>
        <div class="console-log">
          <span class="log-timestamp">12:04:24.521</span>
          <span class="log-level trace">TRACE</span>
          <span class="log-content"
            >Processing search results through reasoning engine</span
          >
        </div>
        <div class="console-log">
          <span class="log-timestamp">12:04:24.892</span>
          <span class="log-level info">INFO</span>
          <span class="log-content">Generated market analysis summary</span>
        </div>
        <div class="console-log">
          <span class="log-timestamp">12:04:24.893</span>
          <span class="log-level debug">DEBUG</span>
          <span class="log-content">Function execution completed</span>
          <div class="log-json">
            { "duration": "1352ms", "tokens_used": 428, "tool_calls": 2 }
          </div>
        </div>
      </div>
    `;
  }

  renderPerformanceContent(cellId) {
    return html`
      <div class="performance-content">
        <div class="performance-timeline">
          <div class="timeline-row">
            <div class="timeline-label">LLM Processing</div>
            <div class="timeline-track">
              <div
                class="timeline-segment segment-llm"
                style="left: 10%; width: 30%"
              >
                <div class="timeline-tooltip">303ms - Initial reasoning</div>
              </div>
              <div
                class="timeline-segment segment-llm"
                style="left: 60%; width: 25%"
              >
                <div class="timeline-tooltip">271ms - Result synthesis</div>
              </div>
            </div>
          </div>
          <div class="timeline-row">
            <div class="timeline-label">Agent Reasoning</div>
            <div class="timeline-track">
              <div
                class="timeline-segment segment-reasoning"
                style="left: 5%; width: 15%"
              >
                <div class="timeline-tooltip">158ms - Tool selection</div>
              </div>
              <div
                class="timeline-segment segment-reasoning"
                style="left: 45%; width: 20%"
              >
                <div class="timeline-tooltip">219ms - Result processing</div>
              </div>
            </div>
          </div>
          <div class="timeline-row">
            <div class="timeline-label">Tool Execution</div>
            <div class="timeline-track">
              <div
                class="timeline-segment segment-tool"
                style="left: 25%; width: 35%"
              >
                <div class="timeline-tooltip">419ms - web_search</div>
              </div>
            </div>
          </div>
          <div class="timeline-row">
            <div class="timeline-label">I/O Operations</div>
            <div class="timeline-track">
              <div
                class="timeline-segment segment-io"
                style="left: 15%; width: 5%"
              >
                <div class="timeline-tooltip">52ms - Context loading</div>
              </div>
              <div
                class="timeline-segment segment-io"
                style="left: 85%; width: 8%"
              >
                <div class="timeline-tooltip">89ms - Result writing</div>
              </div>
            </div>
          </div>
        </div>

        <div class="performance-stats">
          <div class="stat-card">
            <div class="stat-value">1.35s</div>
            <div class="stat-label">Total Duration</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">428</div>
            <div class="stat-label">Tokens Used</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">2</div>
            <div class="stat-label">Tool Calls</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">574ms</div>
            <div class="stat-label">LLM Processing</div>
          </div>
        </div>
      </div>
    `;
  }

  renderNetworkContent(cellId) {
    return html`
      <div class="network-content">
        <div class="network-header">
          <div>Name</div>
          <div>Status</div>
          <div>Type</div>
          <div>Initiator</div>
          <div>Size</div>
          <div>Time</div>
        </div>
        <div class="network-row">
          <div class="resource-name">
            <div class="resource-icon">⚡</div>
            site-header.json
          </div>
          <div class="status-success">200</div>
          <div>fetch</div>
          <div>index-docs.js:71</div>
          <div>3.1 kB</div>
          <div>23 ms</div>
        </div>
        <div class="network-row">
          <div class="resource-name">
            <div class="resource-icon">⚡</div>
            azure.json
          </div>
          <div class="status-success">200</div>
          <div>fetch</div>
          <div>index-docs.js:71</div>
          <div>3.1 kB</div>
          <div>14 ms</div>
        </div>
        <div class="network-row">
          <div class="resource-name">
            <div class="resource-icon">⚡</div>
            feature-rollout.json
          </div>
          <div class="status-success">200</div>
          <div>fetch</div>
          <div>index-docs.js:71</div>
          <div>0 B</div>
          <div>4 ms</div>
        </div>
        <div class="network-row">
          <div class="resource-name">
            <div class="resource-icon">⚡</div>
            batch
          </div>
          <div class="status-success">200</div>
          <div>fetch</div>
          <div>index-docs.js:71</div>
          <div>1.1 kB</div>
          <div>73 ms</div>
        </div>
        <div class="network-row">
          <div class="resource-name">
            <div class="resource-icon">📄</div>
            toc.json
          </div>
          <div class="status-success">200</div>
          <div>fetch</div>
          <div>index-docs.js:71</div>
          <div>4.6 kB</div>
          <div>20 ms</div>
        </div>
        <div class="network-row">
          <div class="resource-name">
            <div class="resource-icon">🔤</div>
            docons.7a48a0e.507151a.woff2
          </div>
          <div class="status-success">200</div>
          <div>font</div>
          <div>site-ltr.css</div>
          <div>21.6 kB</div>
          <div>13 ms</div>
        </div>
        <div class="network-row">
          <div class="resource-name">
            <div class="resource-icon">🖼️</div>
            banner-build-2025.jpg
          </div>
          <div class="status-success">200</div>
          <div>jpeg</div>
          <div>site-ltr.css</div>
          <div>80.6 kB</div>
          <div>14 ms</div>
        </div>
        <div class="network-row">
          <div class="resource-name">
            <div class="resource-icon">🔄</div>
            c.gif
          </div>
          <div class="status-redirect">302</div>
          <div>/ Redirect</div>
          <div>Id.js:90</div>
          <div>447 B</div>
          <div>583 ms</div>
        </div>
      </div>
    `;
  }

  renderDevTools() {
    if (!this.showDevTools) return "";

    return html`
      <div class="dev-tools-panel ${this.showDevTools ? "show" : ""}">
        <div class="dev-tools-header">
          <span>Dev Tools</span>
          <button class="dev-tools-close" @click=${this.toggleDevTools}>
            ×
          </button>
        </div>
        ${this.renderDevToolsTabs()}
        <div class="dev-tools-content">
          ${this.selectedCell
            ? this.renderTabContent(this.selectedCell.cellId)
            : html`<div class="console-placeholder">
                Select a cell to view details
              </div>`}
        </div>
      </div>
    `;
  }

  renderAgentsModal() {
    return html`
      <div class="agents-modal ${this.showAgentsModal ? "show" : ""}">
        <div class="agents-modal-content">
          <div class="agents-modal-header">
            <h2 class="agents-modal-title">Available Agents</h2>
            <button
              class="agents-modal-close"
              @click=${() => (this.showAgentsModal = false)}
            >
              ×
            </button>
          </div>
          <div class="agents-modal-body">
            ${Object.entries(this.agentConfigs).map(
              ([name, config]) => html`
                <div class="agent-card">
                  <div class="agent-card-header">
                    <h3 class="agent-name">@${name}</h3>
                    <div class="button-group">
                      <button class="edit-button" @click=${() => this.toggleAgentEdit(name)}>
                        ${this.editingAgent === name ? 'Save' : 'Edit'}
                      </button>
                      <button class="delete-button" @click=${() => this.deleteAgent(name)}>
                        Delete
                      </button>
                    </div>
                  </div>
                  <p class="agent-model">${config.model}</p>
                  ${this.editingAgent === name
                    ? html`
                        <textarea
                          class="agent-prompt-editor"
                          .value=${config.systemPrompt}
                          @input=${(e) => this.updateAgentPrompt(name, e.target.value)}
                        ></textarea>
                        
                        <div class="agent-files-section">
                          <h4>Grounding Files</h4>
                          ${config.files && config.files.length > 0 
                            ? html`
                              <div class="agent-files-list">
                                ${config.files.map((file, index) => html`
                                  <div class="agent-file-item">
                                    <span class="agent-file-name" @click=${() => this.previewAgentFile(file)}>${file.name}</span>
                                    <button class="delete-file-button" @click=${() => this.deleteAgentFile(name, index)}>×</button>
                                  </div>
                                `)}
                              </div>
                            ` 
                            : html`<p class="no-files-message">No files attached</p>`
                          }
                          
                          <div class="add-file-form">
                            <input 
                              type="file" 
                              id="file-upload-${name}" 
                              style="display: none;" 
                              @change=${(e) => this.handleAgentFileUpload(e, name)}
                              accept=".txt,.md,.json,.csv,.py,.js"
                            />
                            <button 
                              class="upload-file-button"
                              @click=${() => this.shadowRoot.querySelector(`#file-upload-${name}`).click()}
                            >
                              Upload File
                            </button>
                          </div>
                        </div>
                      `
                    : html`
                        <p class="agent-prompt">${config.systemPrompt}</p>
                        ${config.files && config.files.length > 0 
                          ? html`
                            <div class="agent-files-display">
                              <h4>Attached Files (${config.files.length})</h4>
                              <div class="agent-files-list">
                                ${config.files.map(file => html`
                                  <div class="agent-file-item">
                                    <span class="agent-file-name" @click=${() => this.previewAgentFile(file)}>${file.name}</span>
                                  </div>
                                `)}
                              </div>
                            </div>
                          ` 
                          : ''
                        }
                      `
                  }
                </div>
              `
            )}
            
            <!-- Add New Agent Form -->
            <div class="add-agent-card">
              <h3>Add New Agent</h3>
              <input
                type="text"
                placeholder="Agent Name (start with @ and be short in lowercase)"
                .value=${this.newAgentName || ''}
                @input=${(e) => this.newAgentName = e.target.value}
              />
              <textarea
                placeholder="System Prompt (refer to grounding files by name by the filename)")
                .value=${this.newAgentPrompt || ''}
                @input=${(e) => this.newAgentPrompt = e.target.value}
              ></textarea>
              
              <!-- Add file upload section -->
              <div class="agent-files-section">
                <h4>Grounding Files</h4>
                <div class="add-file-form">
                  <input 
                    type="file" 
                    id="file-upload-new-agent" 
                    style="display: none;" 
                    @change=${(e) => this.handleNewAgentFileUpload(e)}
                    accept=".txt,.md,.json,.csv,.py,.js"
                  />
                  <button 
                    class="upload-file-button"
                    @click=${() => this.shadowRoot.querySelector(`#file-upload-new-agent`).click()}
                  >
                    Upload File
                  </button>
                  
                  ${this.newAgentFiles && this.newAgentFiles.length > 0 
                    ? html`
                      <div class="agent-files-list">
                        ${this.newAgentFiles.map((file, index) => html`
                          <div class="agent-file-item">
                            <span class="agent-file-name" @click=${() => this.previewAgentFile(file)}>${file.name}</span>
                            <button class="delete-file-button" @click=${() => this.removeNewAgentFile(index)}>×</button>
                          </div>
                        `)}
                      </div>
                    ` 
                    : html`<p class="no-files-message">No files attached</p>`
                  }
                </div>
              </div>
              
              <button @click=${this.addNewAgent}>Add Agent</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  toggleAgentEdit(agentName) {
    if (this.editingAgent === agentName) {
      // Save changes
      this.editingAgent = null;
      // Reset file input fields
      this.newAgentFileName = '';
      this.newAgentFileContent = '';
    } else {
      this.editingAgent = agentName;
      // Reset file input fields
      this.newAgentFileName = '';
      this.newAgentFileContent = '';
    }
    this.requestUpdate();
  }

  updateAgentPrompt(agentName, newPrompt) {
    this.agentConfigs = {
      ...this.agentConfigs,
      [agentName]: {
        ...this.agentConfigs[agentName],
        systemPrompt: newPrompt
      }
    };
  }

  deleteAgent(agentName) {
    if (confirm(`Are you sure you want to delete agent @${agentName}?`)) {
      const newConfigs = { ...this.agentConfigs };
      delete newConfigs[agentName];
      this.agentConfigs = newConfigs;
    }
  }

  addNewAgent() {
    if (!this.newAgentName || !this.newAgentPrompt) {
      alert('Please provide both a name and system prompt for the new agent.');
      return;
    }

    const name = this.newAgentName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (this.agentConfigs[name]) {
      alert('An agent with this name already exists.');
      return;
    }

    this.agentConfigs = {
      ...this.agentConfigs,
      [name]: {
        model: "gpt-4.1-mini",
        systemPrompt: this.newAgentPrompt,
        files: [...this.newAgentFiles] // Include the files
      }
    };

    // Clear the form
    this.newAgentName = '';
    this.newAgentPrompt = '';
    this.newAgentFiles = []; // Reset the files array
    this.requestUpdate();
  }

  toggleAgentsModal() {
    this.showAgentsModal = !this.showAgentsModal;
  }

  renderReadmeModal() {
    return html`
      <div class="readme-modal ${this.showReadmeModal ? "show" : ""}">
        <div class="readme-modal-content">
          <div class="readme-modal-header">
            <h2 class="readme-modal-title">README</h2>
            <button
              class="readme-modal-close"
              @click=${() => (this.showReadmeModal = false)}
            >
              ×
            </button>
          </div>
          <div class="readme-modal-body">
            <div class="readme-section">
              <h2>Introduction</h2>
              <p>
                  Stay Cozy!
              </p>
            </div>

            <div class="readme-section">
              <h2>Make An Agent</h2>
              <p>
                Assign a prompt and you're good to go!
              </p>
              <p>
                Agents can have files attached to them as context. These files are included in the agent's system prompt, 
                allowing the agent to reference them when generating responses.
              </p>
              <p>
                You can manage agent files by clicking the "Agents" button and then editing an agent. 
                Files can be uploaded directly or created manually. Click on a file name to preview its contents.
              </p>
            </div>

            <div class="readme-section">
              <h2>Using Agents</h2>
              <p>
                To use an agent, enter a formula starting with @ followed by the agent name and parameters in parentheses:
              </p>
              <div class="readme-code">
                =@evan("analyze market trends")
              </div>
              <p>
                You can also use the @prompt agent for specific tasks:
              </p>
              <div class="readme-code">
                =@prompt("your input", "your system prompt")
              </div>
              <p> And you can combine inputs from other cells </p>
              <div class="readme-code">
                =@prompt("On a scale of 1 (similar) to 10 (different) compare " + A1 + " versus " + B1 + " and just give the score")
              </div>
            </div>

            <div class="readme-section">
              <h2>Cell References</h2>
              <p>
                You can reference other cells in your formulas within a column with notation "A1:A4"
              </p>
            </div>

            <div class="readme-section">
              <h2>File Upload</h2>
              <p>
                Use the file upload function to process .txt or .md files that hydrate when you click on them.
              </p>
              <div class="readme-code">
                =@file()
              </div>
            </div>

            <div class="readme-section">
              <h2>Tips</h2>
              <ul>
                <li>This is not a full spreadsheet, it's a 🦄 vibe-coded POC using <a href="https://github.com/features/copilot">GitHub Copilot</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  toggleReadmeModal() {
    this.showReadmeModal = !this.showReadmeModal;
  }

  render() {
    return html`
      <div class="content-wrapper">
        <div class="spreadsheet-container ${this.showDevTools ? "with-dev-tools" : ""}">
          <div class="toolbar">
            <div class="toolbar-left-items">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-calculator app-logo-icon" viewBox="0 0 16 16">
                <path d="M12 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
                <path d="M4 2.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3-6a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3-6a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z"/>
              </svg>
              <h4><span style="color:rgb(2, 162, 249);">Azure AI Foundry</span><span style="color: grey;">-Powered ...</span> Cozy AI Calculator (🦄 Vibe-Coded)</h4>
            </div>
            <div class="toolbar-right-items">
              <button class="show-agents-button" @click=${this.toggleAgentsModal}>
                Agents
              </button>
              <button class="genai-button" @click=${this.toggleGenAIPromptModal}>
                ✨Generate
              </button>
              <button class="toolbar-menu-button" @click=${this.toggleToolbarMenu}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots" viewBox="0 0 16 16">
                  <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"/>
                </svg>
              </button>
              ${this.showToolbarMenu ? this.renderToolbarMenu() : ""}
            </div>
          </div>

          <div class="formula-bar">
            <span class="formula-bar-label">fx</span>
            <input
              type="text"
              class="formula-bar-input"
              id="formula-input-main"
              name="formula-input-main"
              .value=${this.selectedCell ? (this.data[this.selectedCell.cellId]?.formula || 
                                          this.data[this.selectedCell.cellId]?.value || '') : ''}
              @input=${this.handleFormulaBarInput}
              @keydown=${this.handleFormulaBarKeyDown}
              autocomplete="off"
            />
          </div>

          ${this.renderAgentsModal()} 
          ${this.renderSpreadsheetGrid()}
          ${this.renderGenAIPromptModal()}
          ${this.renderApiKeysModal()} <!-- Add the new modal render call -->
        </div>

        ${this.renderDevTools()}
        ${this.renderReadmeModal()}
      </div>
    `;
  }

  toggleToolbarMenu() {
    this.showToolbarMenu = !this.showToolbarMenu;
  }

  renderToolbarMenu() {
    return html`
      <div class="toolbar-popup-menu">
        <button class="readme-button popup-button" @click=${() => { this.toggleReadmeModal(); this.toggleToolbarMenu(); }}>
          README
        </button>
        <div class="popup-divider"></div>
        <button class="export-button popup-button" @click=${() => { this.exportData(); this.toggleToolbarMenu(); }}>
          Export
        </button>
        <input
          type="file"
          id="import-input-popup"
          @change=${(e) => { this.handleImport(e); this.toggleToolbarMenu(); }}
          accept=".json"
          style="display: none"
        />
        <button class="import-button popup-button" @click=${() => { this.shadowRoot.querySelector('#import-input-popup').click(); /* Keep menu open until file selected or cancelled */ }}>
          Import
        </button>
        <div class="popup-divider"></div>
        <button class="clear-button popup-button" @click=${() => { this.clearSpreadsheet(); this.toggleToolbarMenu(); }}>
          Clear All
        </button>
        <div class="popup-divider"></div>
        <button class="popup-button" @click=${() => { this.toggleApiKeysModal(); this.toggleToolbarMenu(); }}>
          Set API Keys
        </button>
        <div class="template-selector-popup">
          <select 
            class="template-select" 
            @change=${(e) => {
              this.loadTemplate(e.target.value);
              this.toggleToolbarMenu(); // Close menu after selection
            }}
          >
            <option value="">Template</option>
            ${Object.keys(this.templates).map(name => 
              html`<option value="${name}">${name}</option>`
            )}
          </select>
        </div>
      </div>
    `;
  }

  renderSpreadsheetGrid() {
    const gridTemplateColumns = ["40px"]; // First column for row headers
    for (let i = 1; i <= this.numCols; i++) {
      gridTemplateColumns.push(`${this.columnWidths[i] || 180}px`);
    }

    const gridTemplateRows = [];
    for (let i = 1; i <= this.numRows; i++) {
      gridTemplateRows.push(`${this.rowHeights[i] || 32}px`); // Use rowHeights or default 32px
    }

    return html`
      <div
        class="spreadsheet-grid"
        style="grid-template-columns: ${gridTemplateColumns.join(
          " "
        )}; grid-template-rows: ${[
          "32px",
          ...gridTemplateRows.slice(0, this.numRows), // Ensure we only take numRows worth of data row heights
        ].join(" ")}"
      >
        <!-- Top-left corner -->
        <div class="header-cell"></div>

        <!-- Column headers (A, B, C, ...) -->
        ${Array.from(
          { length: this.numCols },
          (_, i) => html`
            <div class="header-cell">
              ${String.fromCharCode(65 + i)}
              <div
                class="resize-handle"
                @mousedown=${(e) => this.handleResizeStart(i + 1, e)}
              ></div>
            </div>
          `
        )}

        <!-- Rows -->
        ${Array.from(
          { length: this.numRows },
          (_, row) => html`
            <!-- Row header (1, 2, 3, ...) -->
            <div class="row-header">
              ${row + 1}
              <div
                class="resize-handle-row"
                @mousedown=${(e) => this.handleRowResizeStart(row + 1, e)}
              ></div>
            </div>

            <!-- Cells -->
            ${Array.from({ length: this.numCols }, (_, col) => {
              const cellId = this.getCellId(row + 1, col + 1);
              const isEditing = this.editingCell?.cellId === cellId;
              const isSelected = this.selectedCell?.cellId === cellId;
              const isAgentCell = this.data[cellId]?.formula?.startsWith('=@');

              return html`
                <div
                  class="cell ${isSelected ? "selected" : ""} ${isEditing
                    ? "editing"
                    : ""}"
                  @click=${() => {
                    this.selectCell(cellId);
                    // Only start editing on single click if it's not an agent cell
                    if (!isAgentCell) {
                      this.startEditing(cellId);
                    }
                  }}
                  @dblclick=${() => {
                    // Allow editing agent cells on double click
                    if (isAgentCell) {
                      this.startEditing(cellId);
                    }
                  }}
                >
                  ${this.renderCell(cellId)}
                </div>
              `;
            })}
          `
        )}
      </div>
    `;
  }

  handleFileSelected(cellId, fileData) {
    console.log("File selected:", {
      cellId,
      fileName: fileData.fileName,
      contentLength: fileData.fileContent.length,
    });

    // Store both the file name and content
    this.data[cellId] = {
      ...this.data[cellId],
      value: fileData.fileName,
      fileContent: fileData.fileContent,
      formula: `=@file('${fileData.fileName}')`,
    };

    // Evaluate the formula to show content
    console.log("Re-evaluating formula to show content...");
    this.evaluateAgentFunction(`=@file('${fileData.fileName}')`, cellId).then(
      (result) => {
        console.log("Formula evaluation result:", result);
        this.data[cellId] = {
          ...this.data[cellId],
          value: result,
          formula: `=@file('${fileData.fileName}')`,
        };

        // Trigger evaluation of dependent cells
        this.evaluateDependentCells(cellId);
        this.requestUpdate();
      }
    );
  }

  clearSpreadsheet() {
    if (confirm('Are you sure you want to clear all data and agents? This cannot be undone.')) {
      // Clear spreadsheet data
      this.data = {};
      this.selectedCell = null;
      this.editingCell = null;
      
      // Reset agent configs to defaults
      this.agentConfigs = {
        
      };
      
      // Clear editing state
      this.editingAgent = null;
      this.newAgentName = '';
      this.newAgentPrompt = '';
      this.newAgentFileName = '';
      this.newAgentFileContent = '';
      this.newAgentFiles = [];
      
      this.requestUpdate();
    }
  }

  loadTemplate(templateName) {
    const template = this.templates[templateName];
    if (template) {
      // Clear current data first, without confirmation
      this.clearSpreadsheetWithoutConfirm();
  
      // Handle old format templates (backward compatibility)
      if (template.type && template.cells) {
        // Convert old format to new format
        this.data = Object.entries(template.cells).reduce((acc, [cellId, content]) => {
          acc[cellId] = {
            value: content.startsWith('=') ? '' : content,
            formula: content.startsWith('=') ? content : ''
          };
          return acc;
        }, {});
      } 
      // Handle new format templates
      else if (template.spreadsheet && template.spreadsheet.data) {
        // Import agents if they exist
        if (template.agents) {
          this.agentConfigs = template.agents;
        }
        
        // Import spreadsheet data
        this.data = template.spreadsheet.data;
        this.numRows = template.spreadsheet.numRows || this.numRows;
        this.numCols = template.spreadsheet.numCols || this.numCols;
        this.columnWidths = template.spreadsheet.columnWidths || {};
      } 
      else {
        console.warn('Invalid template format');
        return;
      }
      
      this.requestUpdate();
    }
  }



  // Add these methods to handle formula bar interactions
  handleFormulaBarInput(e) {
    if (!this.selectedCell) return;
    
    const value = e.target.value;
    if (!this.data[this.selectedCell.cellId]) {
      this.data[this.selectedCell.cellId] = { value: "", formula: "" };
    }
    
    // Update the cell's display value while typing
    this.data[this.selectedCell.cellId].value = value;
    if (value.startsWith("=")) {
      this.data[this.selectedCell.cellId].formula = value;
    }
    
    this.requestUpdate();
  }

  handleFormulaBarKeyDown(e) {
    if (!this.selectedCell) return;

    if (e.key === "Enter") {
      e.preventDefault();
      const value = e.target.value;
      this.updateCell(this.selectedCell.cellId, value);
      // Release focus from the formula bar
      e.target.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      // Revert to the original value
      e.target.value = this.data[this.selectedCell.cellId]?.formula || 
                       this.data[this.selectedCell.cellId]?.value || '';
      e.target.blur();
    }
  }

  exportData() {
    // Prepare the export data with optimized cell structure
    const exportData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      agents: this.agentConfigs,
      spreadsheet: {
        data: Object.entries(this.data).reduce((acc, [cellId, cellData]) => {
          // Only create entries for cells that have content
          if (cellData.formula || cellData.value) {
            // If both formula and non-empty value exist, include both
            if (cellData.formula && cellData.value) {
              acc[cellId] = {
                formula: cellData.formula,
                value: cellData.value
              };
            }
            // If only formula exists
            else if (cellData.formula) {
              acc[cellId] = {
                formula: cellData.formula
              };
            }
            // If only value exists
            else if (cellData.value) {
              acc[cellId] = {
                value: cellData.value
              };
            }
            
            // Include fileContent if it exists (for file cells)
            if (cellData.fileContent) {
              acc[cellId].fileContent = cellData.fileContent;
            }
          }
          return acc;
        }, {}),
        numRows: this.numRows,
        numCols: this.numCols,
        columnWidths: this.columnWidths
      }
    };

    // Create and trigger the download
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `spreadsheet-export-${new Date().toISOString().slice(0,10)}.json`;
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  }

  async handleImport(event) {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const content = await file.text();
      const importData = JSON.parse(content);

      // Validate the import data
      if (!importData.version || !importData.spreadsheet) {
        throw new Error('Invalid import file format: missing version or spreadsheet data');
      }
      
      // Ensure agents property exists
      if (!importData.agents) {
        console.warn('Import warning: missing agents property, using empty object');
        importData.agents = {};
      }

      // Clear current data first
      this.clearSpreadsheet();
      
      // Initialize empty data object
      this.data = {};
      
      // Safely import spreadsheet data with optimized structure
      Object.entries(importData.spreadsheet.data || {}).forEach(([cellId, cellData]) => {
        this.data[cellId] = {};
        
        // If it's just a value, store only that
        if (cellData.value && !cellData.formula) {
          this.data[cellId].value = cellData.value;
        }
        // If it's just a formula, store that and initialize empty value
        else if (cellData.formula && !cellData.value) {
          this.data[cellId].formula = cellData.formula;
          this.data[cellId].value = '';
        }
        // If both exist, store both
        else if (cellData.formula && cellData.value) {
          this.data[cellId].formula = cellData.formula;
          this.data[cellId].value = cellData.value;
        }
        
        // Handle optional fileContent if it exists
        if (cellData.fileContent) {
          this.data[cellId].fileContent = cellData.fileContent;
        }
        
        // Handle optional dependencies if they exist
        if (cellData.dependencies) {
          this.data[cellId].dependencies = cellData.dependencies;
        }
      });
      
      // Import agents with validation and ensure files array exists
      this.agentConfigs = Object.entries(importData.agents).reduce((acc, [name, config]) => {
        // Validate agent configuration
        if (!config || typeof config !== 'object') {
          console.warn(`Import warning: invalid agent configuration for ${name}, skipping`);
          return acc;
        }
        
        // Ensure valid files array with proper structure
        let files = [];
        if (Array.isArray(config.files)) {
          files = config.files.filter(file => {
            const isValid = file && typeof file === 'object' && 
                           typeof file.name === 'string' && 
                           typeof file.content === 'string';
            if (!isValid) {
              console.warn(`Import warning: invalid file in agent ${name}, skipping file`);
            }
            return isValid;
          });
        }
        
        acc[name] = {
          model: config.model || 'gpt-4.1-mini',
          systemPrompt: config.systemPrompt || '',
          files: files
        };
        return acc;
      }, {});
      
      // Import spreadsheet settings with defaults
      this.numRows = importData.spreadsheet.numRows || 20;
      this.numCols = importData.spreadsheet.numCols || 10;
      this.columnWidths = importData.spreadsheet.columnWidths || {};

      // Reset the file input if it exists
      const fileInput = this.shadowRoot.querySelector('#import-input');
      if (fileInput) {
        fileInput.value = '';
      }
      
      console.log('Import successful!', { 
        agents: Object.keys(this.agentConfigs).length,
        cells: Object.keys(this.data).length
      });
      
      // Show success message
      alert(`Import successful!\nLoaded ${Object.keys(this.data).length} cells and ${Object.keys(this.agentConfigs).length} agents.`);
      
      // Trigger update
      this.requestUpdate();
      
    } catch (error) {
      console.error('Import error:', error);
      alert(`Import failed: ${error.message}`);
      
      // Reset the file input on error
      const fileInput = this.shadowRoot.querySelector('#import-input');
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }

  addAgentFile(agentName) {
    if (!this.newAgentFileName || !this.newAgentFileContent) {
      alert('Please provide both a file name and content');
      return;
    }

    // Validate file name
    if (!/^[\w\-. ]+\.(txt|md|json|csv|py|js)$/.test(this.newAgentFileName)) {
      alert('Please provide a valid file name with extension (txt, md, json, csv, py, js)');
      return;
    }
    
    // Check if file with same name already exists
    const existingFileIndex = this.agentConfigs[agentName].files.findIndex(
      file => file.name === this.newAgentFileName
    );
    
    if (existingFileIndex >= 0) {
      if (!confirm(`A file named "${this.newAgentFileName}" already exists. Do you want to replace it?`)) {
        return;
      }
      // Remove the existing file to replace it
      this.agentConfigs[agentName].files.splice(existingFileIndex, 1);
    }

    // Add the new file
    this.agentConfigs = {
      ...this.agentConfigs,
      [agentName]: {
        ...this.agentConfigs[agentName],
        files: [
          ...this.agentConfigs[agentName].files,
          {
            name: this.newAgentFileName,
            content: this.newAgentFileContent
          }
        ]
      }
    };

    // Clear the form
    this.newAgentFileName = '';
    this.newAgentFileContent = '';
    
    // Reset file input if it exists
    const fileInput = this.shadowRoot.querySelector(`#file-upload-${agentName}`);
    if (fileInput) {
      fileInput.value = '';
    }
    
    this.requestUpdate();
  }

  deleteAgentFile(agentName, fileIndex) {
    if (confirm('Are you sure you want to delete this file?')) {
      const newFiles = [...this.agentConfigs[agentName].files];
      newFiles.splice(fileIndex, 1);
      
      this.agentConfigs = {
        ...this.agentConfigs,
        [agentName]: {
          ...this.agentConfigs[agentName],
          files: newFiles
        }
      };
      
      this.requestUpdate();
    }
  }

  handleAgentFileUpload(e, agentName) {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 1MB)
      if (file.size > 1024 * 1024) {
        alert('File size exceeds 1MB limit');
        e.target.value = '';
        return;
      }
      
      // Check file extension
      const extension = file.name.split('.').pop().toLowerCase();
      if (!['txt', 'md', 'json', 'csv', 'py', 'js'].includes(extension)) {
        alert('Only .txt, .md, .json, .csv, .py, and .js files are supported');
        e.target.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        // Store file details for preview
        this.newAgentFileName = file.name;
        this.newAgentFileContent = e.target.result;
        
        // Show confirmation dialog with file preview
        const previewContent = this.newAgentFileContent.length > 500 
          ? this.newAgentFileContent.substring(0, 500) + '...' 
          : this.newAgentFileContent;
          
        if (confirm(`Add file "${file.name}" (${(file.size / 1024).toFixed(1)} KB) to agent "${agentName}"?\n\nPreview:\n${previewContent}`)) {
          this.addAgentFile(agentName);
        } else {
          // Reset if canceled
          this.newAgentFileName = '';
          this.newAgentFileContent = '';
        }
      };
      reader.readAsText(file);
    }
  }

  previewAgentFile(file) {
    // Create a modal dialog to display the file content
    const previewContent = file.content.length > 2000 
      ? file.content.substring(0, 2000) + '...' 
      : file.content;
    
    alert(`File: ${file.name}\n\nContent:\n${previewContent}`);
  }

  handleNewAgentFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 1MB)
      if (file.size > 1024 * 1024) {
        alert('File size exceeds 1MB limit');
        e.target.value = '';
        return;
      }
      
      // Check file extension
      const extension = file.name.split('.').pop().toLowerCase();
      if (!['txt', 'md', 'json', 'csv', 'py', 'js'].includes(extension)) {
        alert('Only .txt, .md, .json, .csv, .py, and .js files are supported');
        e.target.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        // Add file to new agent files array
        this.newAgentFiles = [
          ...this.newAgentFiles,
          {
            name: file.name,
            content: e.target.result
          }
        ];
        this.requestUpdate();
      };
      reader.readAsText(file);
      // Reset file input
      e.target.value = '';
    }
  }

  removeNewAgentFile(index) {
    if (confirm('Are you sure you want to remove this file?')) {
      const newFiles = [...this.newAgentFiles];
      newFiles.splice(index, 1);
      this.newAgentFiles = newFiles;
      this.requestUpdate();
    }
  }

  // Add the renderGenAIPromptModal method
  renderGenAIPromptModal() {
    return html`
      <div class="genai-prompt-modal ${this.showGenAIPromptModal ? "show" : ""}">
        <div class="genai-prompt-modal-content">
          <div class="genai-prompt-modal-header">
            <h2 class="genai-prompt-modal-title">Generate with AI</h2>
            <button
              class="genai-prompt-modal-close"
              @click=${() => (this.showGenAIPromptModal = false)}
            >
              ×
            </button>
          </div>
          <div class="genai-prompt-modal-body">
            <p>
              Describe a goal, and GenAI will create agents and cells to accomplish it.
            </p>
            <div class="api-key-note">
              <p><strong>Note:</strong> This feature requires a model deployment named 'gpt-4.1' in your Azure AI Foundry instance.</p>
            
            </div>
            <textarea
              class="genai-prompt-textarea"
              placeholder="Example: Create a spreadsheet that converts input into a limerick"
              .value=${this.genAIPrompt}
              @input=${(e) => this.genAIPrompt = e.target.value}
              ?disabled=${this.isGenerating}
            ></textarea>
            <div class="genai-prompt-modal-actions">
              <button class="genai-prompt-modal-cancel" @click=${() => (this.showGenAIPromptModal = false)} ?disabled=${this.isGenerating}>
                Cancel
              </button>
              <button class="genai-prompt-modal-submit" @click=${this.generateSpreadsheetFromPrompt} ?disabled=${this.isGenerating}>
                ${this.isGenerating 
                  ? html`<div class="spinner"></div> Generating...` 
                  : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Add the toggle method for GenAI prompt modal
  toggleGenAIPromptModal() {
    this.showGenAIPromptModal = !this.showGenAIPromptModal;
  }

  // Add the method to generate spreadsheet from prompt
  async generateSpreadsheetFromPrompt() {
    // Don't allow multiple generations at once
    if (this.isGenerating) return;
    
    const prompt = this.genAIPrompt.trim();
    if (!prompt) {
      alert('Please provide a description of what you want the spreadsheet to do.');
      return;
    }

    // Get API key
    const apiInfo = this.getApiInfo();
    console.log("API key info for generation:", apiInfo);

    if (!apiInfo || !apiInfo.apiKey) {
      alert('API key not found or invalid. Please set it using the toolbar menu.');
      this.createErrorSpreadsheet('OpenAI API key not found or invalid. Please set it using the toolbar menu.');
      this.isGenerating = false;
      this.requestUpdate();
            return;
          }
          
    if (apiInfo.provider === 'Azure OpenAI' && (!apiInfo.endpoint || apiInfo.endpoint.trim() === '')) {
      alert('Azure OpenAI endpoint not configured. Please set it using the toolbar menu.');
      this.createErrorSpreadsheet('Azure OpenAI endpoint not configured. Please set it using the toolbar menu.');
      this.isGenerating = false;
      this.requestUpdate();
      return;
    }

    // Set generating state to true to show spinner
    this.isGenerating = true;
    this.requestUpdate();

    try {
      // Clear the current spreadsheet and agents
      this.clearSpreadsheetWithoutConfirm();
      
      // Show loading state
      const cellA1 = this.getCellId(1, 1);
      this.data[cellA1] = {
        value: "Generating spreadsheet, please wait...",
        formula: ""
      };
      this.requestUpdate();

      let url;
      let headers;
      let body;

      const messages = [
        {
          role: "system",
          content: `You are an expert spreadsheet designer who creates specialized AI agent-powered spreadsheets.
              
Your task is to design a spreadsheet layout using AI agents to accomplish the user's goal. 

Respond ONLY with valid JSON in the following format:
{
  "title": "Spreadsheet Title",
  "description": "Brief description of what this spreadsheet does",
  "agents": [
    {
      "name": "agent_name",
      "systemPrompt": "Detailed system prompt for this agent",
      "description": "What this agent does"
    }
  ],
  "cells": [
    {
      "cell": "A1",
      "content": "Instructions",
      "description": "Header for instructions"
    },
    {
      "cell": "B1",
      "content": "This spreadsheet helps you accomplish X using AI agents.",
      "description": "Main instruction text"
    },
    {
      "cell": "A2",
      "content": "Step 1:",
      "description": "Label for first step"
    },
    {
      "cell": "B2",
      "content": "Enter your input in cell B5",
      "description": "Description of first step"
    },
    {
      "cell": "A5",
      "content": "Input Label:", 
      "description": "Label for input cell"
    },
    {
      "cell": "B5",
      "content": "",
      "description": "Empty cell for user input"
    },
    {
      "cell": "A6",
      "content": "Output Label:",
      "description": "Label for output cell"
    },
    {
      "cell": "B6",
      "formula": "=@agent_name(B5)",
      "description": "Formula cell that calls an agent with the input"
    },
    {
      "cell": "A7",
      "content": "Combined Input Label:",
      "description": "Label for combined input"
    },
    {
      "cell": "B7",
      "formula": "=@agent_name(B5 + \" and \" + B6)",
      "description": "Formula that combines multiple inputs with string concatenation"
    }
  ]
}

IMPORTANT CONSTRAINTS:
1. A cell can either have static content OR a formula, but not both
2. Labels must be placed in the same row as the input/formula cells they describe
3. Labels are typically in column A, with the corresponding inputs/outputs in column B or C
4. Place instructions and descriptive text in column B, with their labels in column A
5. All agent names must be lowercase, short, and descriptive
6. System prompts must be detailed and specific
7. Cell formulas must be valid (use =@agent_name(params) format for agent calls)
8. Design a logical flow from top to bottom with clear labels
9. Include step-by-step instructions in the first few rows, with labels in column A and descriptions in column B
10. Maintain proper alignment: if a label is at A5, its corresponding input/output should be at B5
11. IMPORTANT: When concatenating strings in formulas, always use "+" instead of "&" (e.g., "B5 + \". \" + B6" not "B5 & \". \" & B6")
12. All JSON fields must be properly escaped`
        },
        {
          role: "user",
          content: prompt
        }
      ];
      const commonBodyParams = {
        messages: messages,
        temperature: 0.7,
        max_tokens: 4000
      };

      if (apiInfo.provider === 'Azure OpenAI') {
        const deploymentName = 'gpt-4.1'; // Using gpt-4.1 deployment as suggested for Azure
        url = `${apiInfo.endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`;
        headers = {
          'Content-Type': 'application/json',
          'api-key': apiInfo.apiKey // Use the key string
        };
        body = JSON.stringify(commonBodyParams); // Azure doesn't take 'model' in body
      } else { // Default to standard OpenAI
        url = apiInfo.endpoint || this.defaultEndpoints.OpenAI; // Usually https://api.openai.com/v1/chat/completions
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiInfo.apiKey}` // Use the key string
        };
        body = JSON.stringify({
          model: "gpt-4.1", // Specify model for standard OpenAI
          ...commonBodyParams
        });
      }
      
      console.log(`Generating spreadsheet with ${apiInfo.provider}. URL: ${url}`);
      // Call OpenAI API to generate the spreadsheet design
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: response.statusText } })); // Graceful fallback for non-JSON error
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const generatedContent = data.choices[0].message.content;
      
      // Extract JSON part from the response (in case the model added non-JSON text)
      let jsonStr = generatedContent;
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      console.log("Generated JSON string:", jsonStr);
      
      let spreadsheetDesign;
      
      try {
        // Parse the JSON response
        spreadsheetDesign = JSON.parse(jsonStr);
        console.log("Parsed spreadsheet design:", spreadsheetDesign);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        throw new Error(`Failed to parse JSON response: ${parseError.message}`);
      }
      
      // Validate the spreadsheet design has the required structure
      if (!spreadsheetDesign || typeof spreadsheetDesign !== 'object') {
        throw new Error('Invalid spreadsheet design: not an object');
      }
      
      // Create a default structure if any required parts are missing
      if (!spreadsheetDesign.agents || !Array.isArray(spreadsheetDesign.agents)) {
        spreadsheetDesign.agents = [];
      }
      
      if (!spreadsheetDesign.cells || !Array.isArray(spreadsheetDesign.cells)) {
        spreadsheetDesign.cells = [];
      }
      
      // Make sure it has a title and description
      if (!spreadsheetDesign.title || typeof spreadsheetDesign.title !== 'string') {
        spreadsheetDesign.title = "Generated Spreadsheet";
      }
      
      if (!spreadsheetDesign.description || typeof spreadsheetDesign.description !== 'string') {
        spreadsheetDesign.description = "Created with GenAI";
      }
      
      // Implement the spreadsheet design with the validated object
      this.implementSpreadsheetDesign(spreadsheetDesign);
      
      // Hide the modal
      this.showGenAIPromptModal = false;
      
    } catch (error) {
      console.error("Error generating spreadsheet:", error);
      
      // Create a simple spreadsheet with the error message
      this.createErrorSpreadsheet(error.message);
    } finally {
      // Set generating state back to false when done
      this.isGenerating = false;
      this.requestUpdate();
    }
  }
  
  // Create a simple spreadsheet with an error message
  createErrorSpreadsheet(errorMessage) {
    // Clear the current data if not already cleared
    this.data = {};
    
    // Add error message and instructions
    const cellA1 = this.getCellId(1, 1);
    this.data[cellA1] = {
      value: "Error Generating Spreadsheet",
      formula: ""
    };
    
    const cellA2 = this.getCellId(2, 1);
    this.data[cellA2] = {
      value: `Error: ${errorMessage}`,
      formula: ""
    };
    
    const cellA4 = this.getCellId(4, 1);
    this.data[cellA4] = {
      value: "Please try again with a more specific prompt.",
      formula: ""
    };
    
    const cellA5 = this.getCellId(5, 1);
    this.data[cellA5] = {
      value: "Tip: Ensure your spreadsheet layout follows these guidelines:",
      formula: ""
    };
    
    const cellA6 = this.getCellId(6, 1);
    this.data[cellA6] = {
      value: "- Labels should be in the same row as their associated inputs/outputs",
      formula: ""
    };
    
    const cellA7 = this.getCellId(7, 1);
    this.data[cellA7] = {
      value: "- Each cell should contain either content OR a formula, not both",
      formula: ""
    };
    
    // Add a default agent so the user can still experiment
    this.agentConfigs = {
      "helper": {
        model: "gpt-4.1",
        systemPrompt: "You are a helpful AI assistant that assists with spreadsheet tasks.",
        files: []
      }
    };
    
    // Add a sample cell with the helper agent
    const cellA9 = this.getCellId(9, 1);
    this.data[cellA9] = {
      value: "Sample:",
      formula: ""
    };
    
    const cellB9 = this.getCellId(9, 2);
    this.data[cellB9] = {
      value: "",
      formula: "=@helper(\"Hello! What can I do in this spreadsheet?\")"
    };
    
    // Evaluate the formula
    this.updateCell(cellB9, "=@helper(\"Hello! What can I do in this spreadsheet?\")");
    
    this.requestUpdate();
  }
  
  // Method to clear spreadsheet without confirmation
  clearSpreadsheetWithoutConfirm() {
    // Clear spreadsheet data
    this.data = {};
    this.selectedCell = null;
    this.editingCell = null;
    
    // Reset agent configs to defaults
    this.agentConfigs = {};
    
    // Clear editing state
    this.editingAgent = null;
    this.newAgentName = '';
    this.newAgentPrompt = '';
    this.newAgentFileName = '';
    this.newAgentFileContent = '';
    this.newAgentFiles = [];
    
    this.requestUpdate();
  }
  
  // Method to implement the generated spreadsheet design
  implementSpreadsheetDesign(design) {
    try {
      // First, create all the agents
      const agents = {};
      
      if (Array.isArray(design.agents)) {
        design.agents.forEach(agent => {
          if (!agent || typeof agent !== 'object' || !agent.name) {
            console.warn("Skipping invalid agent:", agent);
            return;
          }
          
          agents[agent.name] = {
            model: "gpt-4.1-mini", // Update to gpt-4.1
            systemPrompt: agent.systemPrompt || "You are a helpful assistant.",
            files: []
          };
        });
      } else {
        console.warn("No agents array found in design, creating empty agents object");
      }
      
      this.agentConfigs = agents;
      
      // Add title and description in the first rows
      const cellA1 = this.getCellId(1, 1);
      this.data[cellA1] = {
        value: design.title || "Generated Spreadsheet",
        formula: ""
      };
      
      const cellA2 = this.getCellId(2, 1);
      this.data[cellA2] = {
        value: design.description || "Created with GenAI",
        formula: ""
      };
      
      // Add a separator row
      const cellA3 = this.getCellId(3, 1);
      this.data[cellA3] = {
        value: "----------------------------------------",
        formula: ""
      };
      
      // Add cells based on the design
      if (Array.isArray(design.cells)) {
        design.cells.forEach(cell => {
          if (!cell || typeof cell !== 'object' || !cell.cell) {
            console.warn("Skipping invalid cell:", cell);
            return;
          }
          
          try {
            const coords = this.parseCellId(cell.cell);
            const [col, row] = coords;
            const cellId = this.getCellId(row, col);
            
            // Handle different cell types
            if (cell.formula) {
              // It's a formula cell
              this.data[cellId] = {
                value: "",
                formula: cell.formula
              };
            } else if (cell.content) {
              // It's a static content cell
              this.data[cellId] = {
                value: cell.content,
                formula: ""
              };
            } else if (cell.label) {
              // It's a label cell
              this.data[cellId] = {
                value: cell.label + ":",
                formula: ""
              };
            } else {
              // Unknown or empty cell
              this.data[cellId] = {
                value: "",
                formula: ""
              };
            }
            
            // Handle labels from old format (adding them in a separate cell)
            if (cell.label && (cell.formula || cell.content)) {
              console.warn("Cell has both label and content/formula. Moving label to adjacent cell.");
              const labelCol = Math.max(1, col - 1);
              const labelCellId = this.getCellId(row, labelCol);
              
              this.data[labelCellId] = {
                value: cell.label + ":",
                formula: ""
              };
            }
          } catch (cellError) {
            console.error(`Error processing cell ${cell.cell}:`, cellError);
          }
        });
      } else {
        console.warn("No cells array found in design");
        // Add a friendly message
        const cellA5 = this.getCellId(5, 1);
        this.data[cellA5] = {
          value: "Error: The AI generated an invalid spreadsheet design. Please try again with a more specific prompt.",
          formula: ""
        };
      }
      
      // If any cell contains a formula, update it to initialize
      Object.entries(this.data).forEach(async ([cellId, cellData]) => {
        if (cellData.formula && cellData.formula.startsWith('=')) {
          try {
            await this.updateCell(cellId, cellData.formula);
          } catch (error) {
            console.error(`Error updating cell ${cellId}:`, error);
          }
        }
      });
    } catch (error) {
      console.error("Error implementing spreadsheet design:", error);
      this.createErrorSpreadsheet(error.message);
    }
    
    this.requestUpdate();
  }

  getApiInfo() {
    const providerPreference = this._getStoredProviderPreference() || 'Azure OpenAI'; // Default to Azure if no preference
    let apiKey = null;
    let endpoint = null;

    if (providerPreference === 'Azure OpenAI') {
      apiKey = this._getStoredAzureApiKey();
      endpoint = this._getStoredAzureEndpoint();
      // Ensure endpoint is not just whitespace for Azure
      if (endpoint && endpoint.trim() === '') {
        endpoint = null; // Treat whitespace as no endpoint
      }
    } else { // OpenAI
      apiKey = this._getStoredOpenAIApiKey();
      endpoint = this.defaultEndpoints.OpenAI;
    }
    
    return { 
      apiKey: apiKey || null, // Ensure null if empty or undefined
      endpoint: endpoint || null, 
      provider: providerPreference
    };
  }

  toggleApiKeysModal() {
    this.showApiKeysModal = !this.showApiKeysModal;
    if (this.showApiKeysModal) {
      this.apiKeyProvider = this._getStoredProviderPreference() || 'Azure OpenAI'; // Set provider from preference
      this._loadApiKeysForProvider(this.apiKeyProvider); // Load keys for this provider
    }
  }

  // Placeholder for helper, will be fleshed out later
  _getStoredApiKeyData() {
    try {
      const storedData = localStorage.getItem("p5jsStorage");
      if (storedData) {
        const parsed = JSON.parse(storedData);
        return parsed.MIRAI_OAI_API_KEY; // Assuming this structure
      }
    } catch (e) { console.error("Error getting stored API key data", e); }
    return null;
  }

  _getStoredApiEndpoint() {
    try {
      const storedData = localStorage.getItem("p5jsStorage");
      if (storedData) {
        const parsed = JSON.parse(storedData);
        return parsed.MIRAI_OAI_API_KEY_ENDPOINT?.value; // Assuming this structure
      }
    } catch (e) { console.error("Error getting stored API endpoint", e); }
    return null;
  }

  renderApiKeysModal() {
    // The main div itself will be hidden/shown by the 'show' class
    // It also acts as the backdrop
    return html`
      <div 
        class="api-keys-modal ${this.showApiKeysModal ? 'show' : ''}"
        @click=${(e) => {
          // If the click is on the backdrop itself (the element with class 'api-keys-modal'), close the modal.
          // This prevents closing when clicking inside the modal-content.
          if (e.target.classList.contains('api-keys-modal')) {
            this.toggleApiKeysModal();
          }
        }}
      >
        <div class="api-keys-modal-content">
          <div class="modal-header">
            <h3>Set API Keys</h3>
            <button @click=${this.toggleApiKeysModal} class="close-button">×</button>
          </div>
          <div class="modal-body">
            <p class="modal-description">API keys are stored in your browser's local storage and are not sent to any server other than the selected API provider.</p>
            
            <div class="form-group">
              <label for="apiKeyProvider">API Provider:</label>
              <select id="apiKeyProvider" .value=${this.apiKeyProvider} @change=${this._handleApiKeyProviderChangeInModal}>
                <option value="Azure OpenAI">Azure OpenAI</option>
                <option value="OpenAI">OpenAI</option>
              </select>
            </div>

            ${this.apiKeyProvider === 'Azure OpenAI'
              ? html`
                <div class="form-group">
                  <label for="apiKeyEndpoint">Azure Endpoint URL:</label>
                  <input type="text" id="apiKeyEndpoint" .value=${this.apiKeyEndpoint} @input=${(e) => this.apiKeyEndpoint = e.target.value} placeholder="https://your-resource.openai.azure.com">
                </div>
                <div class="note">
                  <em>Important:</em> For Azure OpenAI, ensure your endpoint URL follows this format:
                  <code>https://your-resource-name.openai.azure.com/</code>
                  Be sure to have model deployments named "gpt-4.1-mini" and "gpt-4.1" in your Azure AI Foundry instance.
                </div>
              `
              : ''}

            <div class="form-group">
              <label for="apiKeyString">API Key:</label>
              <input type="password" id="apiKeyString" .value=${this.apiKeyString} @input=${(e) => this.apiKeyString = e.target.value} placeholder="Enter your API key">
            </div>
          </div>
          <div class="modal-footer">
            <button @click=${this.toggleApiKeysModal} class="button secondary-button">Cancel</button>
            <button @click=${this._saveApiKeyFromModal} class="button primary-button">Save Key</button>
          </div>
        </div>
      </div>
    `;
  }

  _handleApiKeyProviderChangeInModal(e) {
    this.apiKeyProvider = e.target.value;
    console.log("API provider changed in modal to:", this.apiKeyProvider);
    this._loadApiKeysForProvider(this.apiKeyProvider); // Load keys for the new provider
    this.requestUpdate(); // Ensure the view updates to show/hide endpoint input
  }

  _saveApiKeyFromModal() {
    const storage = this._getStorage();

    // Save the selected provider as the preference
    storage.API_PROVIDER_PREFERENCE = this.apiKeyProvider;

    if (this.apiKeyProvider === 'Azure OpenAI') {
      if (!this.apiKeyString || !this.apiKeyEndpoint || this.apiKeyEndpoint.trim() === '') {
        alert("For Azure OpenAI, please provide both an API Key and a valid Endpoint URL.");
        return;
      }
      storage.AZURE_OAI_API_KEY = this.apiKeyString;
      storage.AZURE_OAI_ENDPOINT = this.apiKeyEndpoint.trim().replace(/\/$/, "");
      // Clear OpenAI specific key if switching to Azure, to avoid confusion (optional)
      // delete storage.OPENAI_API_KEY;
    } else { // OpenAI Provider
      if (!this.apiKeyString) {
        alert("For OpenAI, please provide an API Key.");
        return;
      }
      storage.OPENAI_API_KEY = this.apiKeyString;
      // Clear Azure specific keys if switching to OpenAI (optional)
      // delete storage.AZURE_OAI_API_KEY;
      // delete storage.AZURE_OAI_ENDPOINT;
    }

    this._setStorage(storage);
    console.log("API Keys and preference saved successfully to localStorage.");
    this.toggleApiKeysModal(); 
    this.connectedCallback(); // Refresh API key status display if any
  }

  async executeAgent(agentConfig, inputs) {
    const apiInfo = this.getApiInfo();
    console.log("API Info for executeAgent:", {
      provider: apiInfo.provider,
      hasKey: !!apiInfo.apiKey,
      hasEndpoint: !!apiInfo.endpoint
    });

    if (!apiInfo || !apiInfo.apiKey) { // Check if apiInfo itself or apiKey string is missing
      throw new Error("API key not found. Please set it via the toolbar menu.");
    }
    // For Azure, also require an endpoint
    if (apiInfo.provider === 'Azure OpenAI' && !apiInfo.endpoint) {
        throw new Error("Azure OpenAI requires an endpoint. Please set it via the toolbar menu.");
    }

    let finalSystemPrompt = agentConfig.systemPrompt;

    if (agentConfig.files && agentConfig.files.length > 0) {
      let fileContentsXML = "";
      for (const file of agentConfig.files) {
        // Basic XML escaping for content
        const escapedContent = (file.content || '').replace(/&/g, '&amp;')
                                          .replace(/</g, '&lt;')
                                          .replace(/>/g, '&gt;')
                                          .replace(/"/g, '&quot;')
                                          .replace(/'/g, '&apos;');
        fileContentsXML += `<file><name>${file.name}</name><contents>${escapedContent}</contents></file>\n`;
      }
      finalSystemPrompt = fileContentsXML + finalSystemPrompt;
      console.log("Augmented system prompt with files:", finalSystemPrompt);
    }

    const messages = [
      { role: "system", content: finalSystemPrompt },
      { role: "user", content: inputs.join("\\n") },
    ];

    const isAzure = apiInfo.provider === 'Azure OpenAI';
    
    let url, headers;
    if (isAzure) {
      const deploymentName = agentConfig.deploymentName || 'gpt-4.1-mini';
      url = `${apiInfo.endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`;
      headers = {
        'Content-Type': 'application/json',
        'api-key': apiInfo.apiKey
      };
    } else {
      url = apiInfo.endpoint || this.defaultEndpoints.OpenAI;
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiInfo.apiKey}`
      };
    }

    console.log("Executing agent with URL:", url);
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        messages: messages,
        ...(isAzure ? {} : { model: agentConfig.model || "gpt-4.1-mini" }),
        max_tokens: agentConfig.max_tokens || 1000,
        temperature: agentConfig.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson = {};
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
         console.error("Failed to parse error response as JSON:", errorText);
      }
      console.error("API Error:", response.status, errorJson.error?.message || errorText);
      throw new Error(errorJson.error?.message || `API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async executeCustomAgent(inputs, systemPrompt = "You are a helpful assistant.", model = "gpt-4.1-mini") {
    const apiInfo = this.getApiInfo();

    console.log("Executing custom agent with API info:", {
      provider: apiInfo.provider,
      hasKey: !!apiInfo.apiKey, 
      hasEndpoint: !!apiInfo.endpoint,
      endpoint: apiInfo.endpoint
    });

    if (!apiInfo || !apiInfo.apiKey) { // Check if apiInfo itself or apiKey string is missing
      return "#ERROR: API key not found. Please set it via the toolbar menu.";
    }
    // For Azure, also require an endpoint
    if (apiInfo.provider === 'Azure OpenAI' && !apiInfo.endpoint) {
        return "#ERROR: Azure OpenAI requires an endpoint. Please set it via the toolbar menu.";
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: inputs.join("\\n") },
    ];

    const isAzure = apiInfo.provider === 'Azure OpenAI';
    
    let url, headers;

    if (isAzure) {
      const deploymentName = 'gpt-4.1-mini'; 
      url = `${apiInfo.endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`;
      headers = {
        'Content-Type': 'application/json',
        'api-key': apiInfo.apiKey
      };
    } else {
      url = apiInfo.endpoint || this.defaultEndpoints.OpenAI;
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiInfo.apiKey}`
      };
    }
    console.log("Executing custom agent with URL:", url);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          messages: messages,
          ...(isAzure ? {} : { model: model }),
          max_tokens: 1000, 
          temperature: 0.7, 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorJson = {};
        try {
            errorJson = JSON.parse(errorText);
        } catch(e) {
            console.error("Failed to parse error response as JSON:", errorText);
        }
        console.error("API error:", response.status, errorJson.error?.message || errorText);
        throw new Error(errorJson.error?.message || `API request failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("API response:", data);
      return data.choices[0].message.content;
    } catch (error) {
      console.error("executeCustomAgent error:", error);
      return `#ERROR: ${error.message}`;
    }
  }

  async evaluateAgentFunction(formula, cellId) {
    console.log("Starting evaluateAgentFunction with:", { formula, cellId });

    const agentMatch = formula.match(/^=@(\w+)\((.*)\)$/);
    if (!agentMatch) {
      console.warn("Invalid agent formula format:", formula);
      return formula; 
    }

    const [_, agentName, paramsString] = agentMatch;
    console.log("Parsed agent function:", { agentName, paramsString });

    this.processingCells = {
      ...this.processingCells,
      [cellId]: true,
    };
    this.requestUpdate();

    try {
        const paramValues = this.parseAgentParams(paramsString, cellId);
        console.log("Parsed parameters for @"+agentName+":", paramValues);

        if (paramValues.some(pv => typeof pv === 'string' && pv.startsWith('#ERROR') || pv === '#CIRCULAR')) {
            const errorParam = paramValues.find(pv => typeof pv === 'string' && pv.startsWith('#ERROR') || pv === '#CIRCULAR');
            console.warn(`Error in parameters for ${formula}: ${errorParam}`);
            return errorParam; 
        }
        
        const allDeps = this.getAllDependencies(formula);
        const depsReady = allDeps.every(dep => {
          const isProcessing = this.processingCells[dep];
          const hasValue = this.data[dep]?.value !== undefined;
          if (dep === cellId) return !isProcessing; 
          return !isProcessing && hasValue;
        });

        if (!depsReady) {
            console.log(`Waiting for dependencies for ${cellId}. Formula: ${formula}. Deps: ${allDeps.join(', ')}`);
            return "..."; 
        }

        if (agentName.toLowerCase() === "file") {
          console.log("Handling @file agent for cell:", cellId);
          const fileNameFromParams = paramValues[0] || "";
          const cellData = this.data[cellId] || {};
      
          if (cellData.fileContent) {
            const truncatedContent =
              cellData.fileContent.length > 100
                ? cellData.fileContent.substring(0, 100) + "..."
                : cellData.fileContent;
            return truncatedContent; 
          }
          return cellData.value || fileNameFromParams || "Click to upload...";
        }

        let result;
        if (agentName.toLowerCase() === "prompt") { 
            const promptText = paramValues[0];
            const systemPrompt = paramValues[1]; 
            result = await this.executeCustomAgent([promptText], systemPrompt);
        } else {
            const agentConfig = this.agentConfigs[agentName];
            if (!agentConfig) {
                console.error(`Unknown agent "${agentName}"`);
                throw new Error(`Unknown agent "@${agentName}"`);
            }

            const cacheKey = `${agentName}:${paramValues.join("|")}`;
            if (this.agentCache[cacheKey]) {
                console.log("Returning cached result for:", cacheKey);
                result = this.agentCache[cacheKey];
            } else {
                console.log("Calling agent via API:", agentName, "with params:", paramValues);
                result = await this.executeAgent(agentConfig, paramValues);
                this.agentCache[cacheKey] = result;
            }
        }
        
        if (this.data[cellId]) {
            this.data[cellId].value = result;
        } else {
            this.data[cellId] = { value: result, formula: formula };
        }
        
        return result;

    } catch (error) {
        console.error(`Error in evaluateAgentFunction for ${formula} in cell ${cellId}:`, error);
        if (this.data[cellId]) {
            this.data[cellId].value = `#ERROR: ${error.message}`;
        } else {
            this.data[cellId] = { value: `#ERROR: ${error.message}`, formula: formula };
        }
        return `#ERROR: ${error.message}`;
    } finally {
        const stillProcessingDeps = (this.getAllDependencies(formula) || []).some(dep => dep !== cellId && this.processingCells[dep]);

        if (!stillProcessingDeps) {
            const newProcessingCells = { ...this.processingCells };
            delete newProcessingCells[cellId];
            this.processingCells = newProcessingCells;
        }
        this.requestUpdate(); 
    }
  }

  parseAgentParams(params, cellId) { 
    console.log("Starting parseAgentParams with:", { params, cellId });

    // Split parameters while respecting quotes and nested parentheses
    const splitParams = [];
    let currentParam = '';
    let inQuotes = false;
    let quoteChar = '';
    let parenCount = 0;

    for (let i = 0; i < params.length; i++) {
      const char = params[i];
      
      // Handle quotes
      if ((char === '"' || char === "'") && params[i-1] !== '\\') {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
        }
      }
      
      // Handle parentheses when not in quotes
      if (!inQuotes) {
        if (char === '(') parenCount++;
        if (char === ')') parenCount--;
      }
      
      // Split on commas that are not in quotes or parentheses
      if (char === ',' && !inQuotes && parenCount === 0) {
        splitParams.push(currentParam.trim());
        currentParam = '';
        continue;
      }
      
      currentParam += char;
    }
    if (currentParam) {
      splitParams.push(currentParam.trim());
    }

    // Process each parameter
    return splitParams.map(param => {
      // Check if this parameter requires JSON format (using json: prefix)
      const isJsonFormat = param.startsWith('json:');
      
      // Remove the json: prefix for further processing if present
      const processedParam = isJsonFormat ? param.substring(5).trim() : param;
      
      // Handle range references (e.g., A1:A4)
      const rangeMatch = processedParam.match(/^([A-Z]\d+):([A-Z]\d+)$/);
      if (rangeMatch) {
        console.log("Found range:", rangeMatch);
        const [_, start, end] = rangeMatch;
        const startCell = this.parseCellId(start);
        const endCell = this.parseCellId(end);

        console.log("Parsed range cells:", { startCell, endCell });

        // Validate that the range is either vertical or horizontal
        if (startCell[0] !== endCell[0] && startCell[1] !== endCell[1]) {
          console.log("Invalid range - must be vertical or horizontal");
          return "#ERROR: Range must be vertical or horizontal";
        }

        // Get all cells in the range
        const values = [];
        const cellIds = []; // Store cell IDs for JSON format
        
        if (startCell[0] === endCell[0]) {
          // Vertical range
          const col = startCell[0];
          const startRow = Math.min(startCell[1], endCell[1]);
          const endRow = Math.max(startCell[1], endCell[1]);

          console.log("Processing vertical range:", { col, startRow, endRow });

          for (let row = startRow; row <= endRow; row++) {
            const currentRefCellId = this.getCellId(row, col);
            const value = this.data[currentRefCellId]?.value || "";
            console.log(`Cell ${currentRefCellId} value:`, value);
            values.push(value);
            cellIds.push(currentRefCellId);
          }
        } else {
          // Horizontal range
          const row = startCell[1];
          const startCol = Math.min(startCell[0], endCell[0]);
          const endCol = Math.max(startCell[0], endCell[0]);

          console.log("Processing horizontal range:", { row, startCol, endCol });

          for (let col = startCol; col <= endCol; col++) {
            const currentRefCellId = this.getCellId(row, col);
            const value = this.data[currentRefCellId]?.value || "";
            console.log(`Cell ${currentRefCellId} value:`, value);
            values.push(value);
            cellIds.push(currentRefCellId);
          }
        }

        // Return as JSON if requested, otherwise as comma-separated values
        if (isJsonFormat) {
          // Create a JSON object with cell IDs as keys and values as values
          const jsonObject = {};
          cellIds.forEach((id, index) => {
            jsonObject[id] = values[index];
          });
          
          // Also include an array version for convenience
          jsonObject.values = values;
          
          // Add metadata about the range
          jsonObject.range = `${start}:${end}`;
          jsonObject.count = values.length;
          
          console.log("Range resolved to JSON:", jsonObject);
          return JSON.stringify(jsonObject);
        } else {
          const result = values.join(", ");
          console.log("Range resolved to:", result);
          return result;
        }
      }

      // Handle string concatenation
      if (processedParam.includes('+')) {
        // Find all cell references in the original parameter before processing
        const refs = processedParam.match(/[A-Z]\d+/g) || [];
        // Also look for ranges like A1:A3
        const ranges = processedParam.match(/[A-Z]\d+:[A-Z]\d+/g) || [];
        
        const parts = processedParam.split('+').map(part => {
          part = part.trim();
          
          // Handle range references (e.g., A1:A4)
          const rangeMatch = part.match(/^([A-Z]\d+):([A-Z]\d+)$/);
          if (rangeMatch) {
            const [_, start, end] = rangeMatch;
            const startCell = this.parseCellId(start);
            const endCell = this.parseCellId(end);
            
            // Validate that the range is either vertical or horizontal
            if (startCell[0] !== endCell[0] && startCell[1] !== endCell[1]) {
              console.log("Invalid range in concatenation - must be vertical or horizontal");
              return "#ERROR: Range must be vertical or horizontal";
            }
            
            // Get all cells in the range
            const values = [];
            
            if (startCell[0] === endCell[0]) {
              // Vertical range
              const col = startCell[0];
              const startRow = Math.min(startCell[1], endCell[1]);
              const endRow = Math.max(startCell[1], endCell[1]);
              
              for (let row = startRow; row <= endRow; row++) {
                const currentRefCellId = this.getCellId(row, col);
                const value = this.data[currentRefCellId]?.value || "";
                values.push(value);
              }
            } else {
              // Horizontal range
              const row = startCell[1];
              const startCol = Math.min(startCell[0], endCell[0]);
              const endCol = Math.max(startCell[0], endCell[0]);
              
              for (let col = startCol; col <= endCol; col++) {
                const currentRefCellId = this.getCellId(row, col);
                const value = this.data[currentRefCellId]?.value || "";
                values.push(value);
              }
            }
            
            return values.join(", ");
          }
          
          // Handle cell references
          if (/^[A-Z]\d+$/.test(part)) {
            if (part === cellId) return "#CIRCULAR";
            return this.data[part]?.value || "";
          }
          
          // Handle string literals
          if ((part.startsWith('"') && part.endsWith('"')) || 
              (part.startsWith("'") && part.endsWith("'"))) {
            return part.slice(1, -1);
          }
          
          return part;
        });
        
        // Join the parts
        const result = parts.join('');
        
        // Add this parameter's cell references to dependencies
        refs.forEach(ref => {
          if (ref !== cellId) {
            const dependents = this.getDependentCells(ref);
            if (!dependents.includes(cellId)) {
              // Create cell data if it doesn't exist yet
              if (!this.data[cellId]) {
                this.data[cellId] = { value: "", formula: "" };
              }
              // Add dependency avoiding duplicates
              this.data[cellId].dependencies = Array.from(new Set([
                ...(this.data[cellId].dependencies || []), 
                ref
              ]));
            }
          }
        });
        
        // Also add dependencies for each cell in any ranges
        ranges.forEach(range => {
          const [start, end] = range.split(':');
          const startCell = this.parseCellId(start);
          const endCell = this.parseCellId(end);
          
          // Make sure we have valid cell references
          if (!startCell || !endCell) return;
          
          if (startCell[0] === endCell[0]) {
            // Vertical range
            const col = startCell[0];
            const startRow = Math.min(startCell[1], endCell[1]);
            const endRow = Math.max(startCell[1], endCell[1]);
            
            for (let row = startRow; row <= endRow; row++) {
              const refCellId = this.getCellId(row, col);
              if (refCellId !== cellId) {
                // Create cell data if it doesn't exist yet
                if (!this.data[cellId]) {
                  this.data[cellId] = { value: "", formula: "" };
                }
                // Add dependency avoiding duplicates
                this.data[cellId].dependencies = Array.from(new Set([
                  ...(this.data[cellId].dependencies || []), 
                  refCellId
                ]));
              }
            }
          } else if (startCell[1] === endCell[1]) {
            // Horizontal range
            const row = startCell[1];
            const startCol = Math.min(startCell[0], endCell[0]);
            const endCol = Math.max(startCell[0], endCell[0]);
            
            for (let col = startCol; col <= endCol; col++) {
              const refCellId = this.getCellId(row, col);
              if (refCellId !== cellId) {
                // Create cell data if it doesn't exist yet
                if (!this.data[cellId]) {
                  this.data[cellId] = { value: "", formula: "" };
                }
                // Add dependency avoiding duplicates
                this.data[cellId].dependencies = Array.from(new Set([
                  ...(this.data[cellId].dependencies || []), 
                  refCellId
                ]));
              }
            }
          }
        });
        
        return result;
      }
      
      // Handle direct cell references
      if (/^[A-Z]\d+$/.test(processedParam)) {
        if (processedParam === cellId) return "#CIRCULAR";
        return this.data[processedParam]?.value || "";
      }
      
      // Handle string literals
      if ((processedParam.startsWith('"') && processedParam.endsWith('"')) || 
          (processedParam.startsWith("'") && processedParam.endsWith("'"))) {
        return processedParam.slice(1, -1);
      }
      
      return processedParam;
    });
  }

  // Row Resizing Handlers
  handleRowResizeStart(row, e) {
    e.preventDefault();
    this.resizingRow = row;
    this.startY = e.clientY;
    this.startHeight = this.rowHeights[row] || 32; // Default to 32px if not set

    document.body.classList.add("resizing"); // Optional: use a generic resizing class or a specific one for rows

    // Bind event listeners correctly
    this.boundHandleRowResizeMove = this.handleRowResizeMove.bind(this);
    this.boundHandleRowResizeEnd = this.handleRowResizeEnd.bind(this);

    document.addEventListener("mousemove", this.boundHandleRowResizeMove);
    document.addEventListener("mouseup", this.boundHandleRowResizeEnd);
  }

  handleRowResizeMove(e) {
    if (this.resizingRow === null) return;

    const deltaY = e.clientY - this.startY;
    const newHeight = Math.max(20, this.startHeight + deltaY); // Minimum row height of 20px

    this.rowHeights = {
      ...this.rowHeights,
      [this.resizingRow]: newHeight,
    };

    // Update the grid template rows directly
    const gridElement = this.shadowRoot.querySelector(".spreadsheet-grid");
    if (gridElement) {
      const rows = [];
      for (let i = 1; i <= this.numRows; i++) {
        rows.push(`${this.rowHeights[i] || 32}px`);
      }
      gridElement.style.gridTemplateRows = [
        "32px", // Fixed height for the column header row
        ...rows,
      ].join(" ");
    }
    // No need for this.requestUpdate() if direct style manipulation is enough and reactive properties are updated.
    // However, if other parts of the component need to react to rowHeights change, 
    // ensure rowHeights is properly updated to trigger Lit's reactivity or call requestUpdate.
    this.requestUpdate(); // Call requestUpdate to ensure Lit re-renders if necessary
  }

  handleRowResizeEnd() {
    document.body.classList.remove("resizing");
    this.resizingRow = null;

    document.removeEventListener("mousemove", this.boundHandleRowResizeMove);
    document.removeEventListener("mouseup", this.boundHandleRowResizeEnd);

    // Clean up bound functions
    delete this.boundHandleRowResizeMove;
    delete this.boundHandleRowResizeEnd;
  }

  // Helper methods for LocalStorage access
  _getStorage() {
    try {
      return JSON.parse(localStorage.getItem("p5jsStorage") || "{}");
    } catch (e) {
      console.error("Error parsing p5jsStorage:", e);
      return {};
    }
  }

  _setStorage(storage) {
    try {
      localStorage.setItem("p5jsStorage", JSON.stringify(storage));
    } catch (e) {
      console.error("Error setting p5jsStorage:", e);
    }
  }

  _getStoredProviderPreference() {
    return this._getStorage().API_PROVIDER_PREFERENCE;
  }

  _getStoredOpenAIApiKey() {
    return this._getStorage().OPENAI_API_KEY;
  }

  _getStoredAzureApiKey() {
    return this._getStorage().AZURE_OAI_API_KEY;
  }

  _getStoredAzureEndpoint() {
    return this._getStorage().AZURE_OAI_ENDPOINT;
  }

  _loadApiKeysForProvider(provider) {
    if (provider === 'Azure OpenAI') {
      this.apiKeyString = this._getStoredAzureApiKey() || '';
      this.apiKeyEndpoint = this._getStoredAzureEndpoint() || '';
    } else { // OpenAI or default
      this.apiKeyString = this._getStoredOpenAIApiKey() || '';
      this.apiKeyEndpoint = this.defaultEndpoints.OpenAI; // Endpoint is fixed for OpenAI
    }
  }
}

// Move this outside the class definition
customElements.define("agent-spreadsheet", AgentSpreadsheet);
