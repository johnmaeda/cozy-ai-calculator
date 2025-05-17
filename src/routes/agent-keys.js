import { LitElement, html, css } from "lit";

export class AgentKeys extends LitElement {
  static properties = {
    storage: { type: Object },
    timers: { type: Object },
    defaultEndpoints: { type: Object },
    selectedProvider: { type: String },
  };

  constructor() {
    super();
    this.storage = {};
    this.timers = {};
    this.defaultEndpoints = {
      OpenAI: "https://api.openai.com/v1/chat/completions",
      "Azure OpenAI": "", // User must provide this
    };
    this.selectedProvider = "OpenAI";

    // Load any existing items from localStorage
    this.loadFromLocalStorage();

    // Start the display update loop
    this.updateDisplay();
    setInterval(() => this.updateDisplay(), 1000); // Update display every second
  }

  static styles = css`
    :host {
      display: block;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        sans-serif;
    }

    .container {
      max-width: 800px;
    }

    h1 {
      color: #e8eaed;
      margin-bottom: 2rem;
    }

    .input-group {
      background: #292a2d;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }

    .input-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    input {
      background: #202124;
      border: 1px solid #3c4043;
      color: #e8eaed;
      padding: 0.5rem;
      border-radius: 4px;
      font-size: 14px;
    }

    input:focus {
      outline: none;
      border-color: #8ab4f8;
    }

    button {
      background: #8ab4f8;
      color: #202124;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    button:hover {
      background: #aecbfa;
    }

    .delete-btn {
      background: #d93025;
      color: white;
    }

    .delete-btn:hover {
      background: #ea4335;
    }

    .copy-btn {
      background: #188038;
      color: white;
    }

    .copy-btn:hover {
      background: #137333;
    }

    .storage-display {
      background: #292a2d;
      border-radius: 8px;
      overflow: hidden;
    }

    .item {
      padding: 1rem;
      border-bottom: 1px solid #3c4043;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .item:last-child {
      border-bottom: none;
    }

    .masked-value {
      font-family: monospace;
      color: #9aa0a6;
    }

    .time-remaining {
      color: #9aa0a6;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .button-group {
      display: flex;
      gap: 0.5rem;
    }

    .no-items {
      padding: 2rem;
      text-align: center;
      color: #9aa0a6;
      font-style: italic;
    }

    .endpoint-info {
      color: #9aa0a6;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    select {
      background: #202124;
      border: 1px solid #3c4043;
      color: #e8eaed;
      padding: 0.5rem;
      border-radius: 4px;
      font-size: 14px;
    }

    select:focus {
      outline: none;
      border-color: #8ab4f8;
    }

    .provider-row {
      margin-bottom: 1rem;
    }

    .provider-row select {
      min-width: 150px;
    }

    .provider-row input {
      flex: 1;
      min-width: 300px;
    }

    /* Update input-row styles to better handle the layout */
    .input-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      align-items: center;
    }

    /* Adjust input widths for better layout */
    #valueInput {
      flex: 1;
      min-width: 300px;
    }

    #durationInput {
      width: 150px;
    }

    .note {
      font-size: 0.875rem;
      color: #9aa0a6;
      margin-bottom: 1rem;
    }

    .note em {
      font-weight: 600;
    }

    .note code {
      display: block;
      color: #fff;
      background-color: #000;
      padding: 0.25rem 0.5rem;
      border-radius: 0.5rem;
      margin-left: 1rem;
    }
  `;

  saveData() {
    const valueInput = this.shadowRoot.querySelector("#valueInput");
    const durationInput = this.shadowRoot.querySelector("#durationInput");
    const providerSelect = this.shadowRoot.querySelector("#providerSelect");
    const endpointInput = this.shadowRoot.querySelector("#endpointInput");

    const key = "MIRAI_OAI_API_KEY"; // Hardcoded key name
    const value = valueInput.value;
    const duration = parseInt(durationInput.value);
    const provider = providerSelect.value;
    let endpoint =
      provider === "OpenAI"
        ? this.defaultEndpoints.OpenAI
        : endpointInput.value.trim().replace(/['"]/g, "").replace(/\/$/, ""); // Remove quotes and trailing slash

    if (!value || isNaN(duration) || !endpoint) {
      alert("Please fill all required fields");
      return;
    }

    // Calculate expiration time
    const expirationTime = Date.now() + duration * 1000;

    // Store the API key
    this.storage[key] = {
      value: value,
      expires: expirationTime,
      provider: provider, // Also store the provider type
    };

    // Store the endpoint with the same expiration
    this.storage[key + "_ENDPOINT"] = {
      value: endpoint,
      expires: expirationTime,
    };

    // Set timers for auto-deletion
    if (this.timers[key]) {
      clearTimeout(this.timers[key]);
    }

    this.timers[key] = setTimeout(() => {
      this.deleteItem(key);
    }, duration * 1000);

    // Save to localStorage
    this.saveToLocalStorage();

    // Clear the input fields
    valueInput.value = "";
    if (provider === "Azure OpenAI") {
      endpointInput.value = "";
    }

    // Request update
    this.requestUpdate();
  }

  deleteItem(key) {
    if (this.storage[key]) {
      delete this.storage[key];
      delete this.storage[key + "_ENDPOINT"];
      if (this.timers[key]) {
        clearTimeout(this.timers[key]);
        delete this.timers[key];
      }
      this.saveToLocalStorage();
      this.requestUpdate();
    }
  }

  clearAllData() {
    // Clear all timers
    for (const key in this.timers) {
      clearTimeout(this.timers[key]);
    }

    // Reset storage and timers
    this.storage = {};
    this.timers = {};

    // Clear localStorage
    localStorage.removeItem("p5jsStorage");

    // Request update
    this.requestUpdate();
  }

  updateDisplay() {
    // Request update to refresh the display
    this.requestUpdate();
  }

  async copyValue(key) {
    const value = this.storage[key]?.value;
    if (value) {
      try {
        await navigator.clipboard.writeText(value);
        const buttons = this.shadowRoot.querySelectorAll("button");
        const copyBtn = Array.from(buttons).find(
          (btn) =>
            btn.getAttribute("data-key") === key &&
            btn.classList.contains("copy-btn")
        );
        if (copyBtn) {
          const originalText = copyBtn.textContent;
          copyBtn.textContent = "Copied!";
          setTimeout(() => {
            copyBtn.textContent = originalText;
          }, 1500);
        }
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  }

  formatTime(seconds) {
    if (seconds < 60) {
      return `${seconds} seconds`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes} min ${remainingSeconds} sec`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours} hr ${minutes} min`;
    }
  }

  saveToLocalStorage() {
    localStorage.setItem("p5jsStorage", JSON.stringify(this.storage));
  }

  loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem("p5jsStorage");
      if (savedData) {
        this.storage = JSON.parse(savedData);

        // Set up timers for existing items
        const now = Date.now();
        for (const key in this.storage) {
          const item = this.storage[key];
          const timeRemaining = item.expires - now;

          if (timeRemaining <= 0) {
            // Item has expired, remove it
            delete this.storage[key];
          } else {
            // Set timer for auto-deletion
            this.timers[key] = setTimeout(() => {
              this.deleteItem(key);
            }, timeRemaining);
          }
        }

        // Save filtered storage back
        this.saveToLocalStorage();
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      this.storage = {};
    }
  }

  render() {
    const now = Date.now();
    const items = Object.entries(this.storage)
      .filter(([key]) => !key.endsWith("_ENDPOINT")) // Filter out endpoint entries from display
      .map(([key, item]) => {
        const timeRemaining = Math.max(
          0,
          Math.floor((item.expires - now) / 1000)
        );
        if (timeRemaining <= 0) {
          this.deleteItem(key);
          return null;
        }
        const endpoint = this.storage[key + "_ENDPOINT"]?.value || "N/A";
        return html`
          <div class="item">
            <div>
              <strong>${key}: </strong>
              <span class="masked-value">${"*".repeat(item.value.length)}</span>
              <div class="endpoint-info">Endpoint: ${endpoint}</div>
              <div class="time-remaining">
                Time remaining: ${this.formatTime(timeRemaining)}
              </div>
            </div>
            <div class="button-group">
              <button
                class="copy-btn"
                data-key=${key}
                @click=${() => this.copyValue(key)}
              >
                Copy
              </button>
              <button class="delete-btn" @click=${() => this.deleteItem(key)}>
                Delete
              </button>
            </div>
          </div>
        `;
      })
      .filter(Boolean);

    return html`
      <div class="container">
        ${this.selectedProvider === "Azure OpenAI" ? html`
          <p class="note">
            <em>Note:</em> If you use an Azure OpenAI key and endpoint, make sure
            your endpoint follows this format:
            <code
              >https://{your-resource-name}.{openai or
              cognitiveservices}.azure.com/</code
            >Ex:
            <code
              >https://ai-alias3459033649998473.cognitiveservices.azure.com/</code
            >
          </p>
        ` : ''}

        <div class="input-group">
          <!-- First row for provider selection and endpoint -->
          <div class="input-row provider-row">
            <select id="providerSelect" @change=${this.handleProviderChange}>
              <option value="OpenAI">OpenAI</option>
              <option value="Azure OpenAI">Azure OpenAI</option>
            </select>
            <input
              type="text"
              id="endpointInput"
              placeholder="Azure OpenAI Endpoint"
              style="display: none"
            />
          </div>

          <!-- Second row for API key and duration -->
          <div class="input-row">
            <input
              type="password"
              id="valueInput"
              placeholder="OpenAI API Key"
            />
            <input
              type="number"
              id="durationInput"
              placeholder="Duration (seconds)"
              value="10000"
            />
            <button @click=${this.saveData}>Save</button>
          </div>
          <button class="delete-btn" @click=${this.clearAllData}>
            Clear All
          </button>
        </div>

        <div class="storage-display">
          ${items.length
            ? items
            : html`<div class="no-items">No items stored</div>`}
        </div>
        ${this.selectedProvider === "Azure OpenAI" ? html`
          <hr style="margin-top: 2rem; margin-bottom: 2rem;" />
          <div>
            <p>
              To use Azure OpenAI: <br />1. Select "Azure OpenAI" from the
              dropdown <br />2. Paste your Azure OpenAI endpoint URL from Azure AI
              Foundry <br />3. Make sure you have a deployment named "gpt-4.1-mini"
              in your Azure OpenAI service <br />4. Paste your Azure OpenAI API
              key from Azure AI Foundry
            </p>
            <img src="assets/getendpointkeys.png" width="700" />
          </div>
        ` : ''}
      </div>
    `;
  }

  handleProviderChange(e) {
    const endpointInput = this.shadowRoot.querySelector("#endpointInput");
    const valueInput = this.shadowRoot.querySelector("#valueInput");
    this.selectedProvider = e.target.value;

    if (e.target.value === "Azure OpenAI") {
      endpointInput.style.display = "block";
      valueInput.placeholder = "Azure OpenAI API Key";
    } else {
      endpointInput.style.display = "none";
      valueInput.placeholder = "OpenAI API Key";
    }
    this.requestUpdate();
  }
}

customElements.define("agent-keys", AgentKeys);
