# Cozy AI Calculator (🦄 Vibe-Coded)

Welcome to the Cozy AI Calculator! This project is a unique, vibe-coded spreadsheet interface that integrates AI-powered agents to help you perform calculations, generate content, and build simple workflows directly within a familiar grid.

## ✨ Features

*   **Intuitive Spreadsheet Interface:** A familiar grid-based layout for data entry and formulas.
*   **AI-Powered Agents:** Leverage built-in and custom AI agents directly in your cells (e.g., `= @agentname("your prompt")`).
*   **Generative AI Spreadsheet Creation:** Use the "✨Generate" feature to describe what you want your spreadsheet to do, and let AI build it for you!
*   **Customizable Agents:** Define your own agents with specific system prompts and grounding files to tailor their behavior.
*   **File Grounding for Agents:** Attach text-based files (.txt, .md, .json, .csv, .py, .js) to agents to provide them with context for their tasks.
*   **Cell Referencing:** Use standard cell references (e.g., `A1`, `B2`) and range references (e.g. `A1:A4`) in formulas and agent calls.
*   **String Concatenation:** Combine text and cell values easily (e.g., `="Hello " + A1`).
*   **API Key Management:** Securely store and manage your OpenAI or Azure OpenAI API keys in browser local storage.
*   **Import/Export:** Save and load your spreadsheet designs and agent configurations in JSON format.
*   **Templates:** Quickly load pre-defined spreadsheet structures.

## 🚀 Getting Started

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/johnmaeda/cozy-ai-calculator.git
    cd cozy-ai-calculator
    ```

2.  **Open in Browser:**
    ```bash
    npm install
    npm run dev
    ```    
    

3.  **Set API Keys (Important for AI Features):**
    *   Click the **three-dots menu (⋮)** in the toolbar.
    *   Select "Set API Keys".
    *   Choose your provider (OpenAI or Azure OpenAI).
    *   Enter your API Key.
    *   If using Azure OpenAI, also provide your Endpoint URL and ensure you have deployments named `gpt-4.1` and `gpt-4.1-mini`.
    *   Click "Save Key". Keys are stored in your browser's local storage.

## 🛠️ How to Use

### Spreadsheet Basics

*   **Cells:** Click on a cell to select it. Double-click or start typing to edit.
*   **Formula Bar:** The `fx` bar at the top shows the formula or value of the selected cell. You can edit directly here.
*   **Formulas:** Start with `=` (e.g., `=A1+B2`).

### Using AI Agents

1.  **Agent Syntax:**

    *   To use a pre-defined agent: `=@agentname("Your input prompt")`
    *   To use a custom prompt agent: `=@prompt("Your input prompt", "Your custom system prompt for the AI")`
    *   You can concatenate cell values and strings: `=@agentname(A1 + " some text " + B2)`

2.  **Managing Agents:**

    *   Click the "Agents" button in the toolbar.
    *   View existing agents, edit their system prompts, or add new ones.
    *   **Grounding Files:** For each agent, you can upload files (.txt, .md, .json, .csv, .py, .js). The content of these files will be prepended to the agent's system prompt (formatted as XML: `<file><name>filename</name><contents>...</contents></file>`), allowing the agent to use them as context. Refer to these files by their name within the agent's system prompt.

### ✨ Generate with AI

*   Click the "✨Generate" button in the toolbar.
*   Describe the spreadsheet you want to create (e.g., "Create a spreadsheet that converts input into a limerick").
*   The AI will attempt to generate the agents and cell formulas for you. This requires a valid API key.

### Toolbar Menu (⋮)

*   **README:** View in-app help.
*   **Export:** Save your current spreadsheet (data and agent configurations) as a JSON file.
*   **Import:** Load a previously exported JSON file.
*   **Clear All:** Resets the entire spreadsheet and agent configurations.
*   **Set API Keys:** Configure your OpenAI or Azure OpenAI API credentials.
*   **Template:** Load a pre-defined spreadsheet layout.

## 🤖 Available Agents (Examples)

The application allows for the creation of custom agents. By default, you might find examples or can create your own, such as:

*   `@helper`: A general-purpose assistant.
*   `@prompt`: A flexible agent where you define the system prompt directly in the formula.

You can create new agents with specific roles (e.g., `@market_researcher`, `@code_generator`) by defining their name and system prompt in the "Agents" modal.

### Happy Vibing!

Happy vibe-coding with your Cozy AI Calculator! 🦄
