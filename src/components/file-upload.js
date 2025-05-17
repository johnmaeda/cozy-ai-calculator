import { LitElement, html, css } from 'lit';

export class FileUpload extends LitElement {
  static properties = {
    fileName: { type: String },
    fileContent: { type: String },
    isEditing: { type: Boolean }
  };

  static styles = css`
    :host {
      display: inline-block;
      width: 100%;
      height: 100%;
    }
    .file-upload {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px;
      cursor: pointer;
      width: 100%;
      height: 100%;
    }
    .file-upload:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    .file-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .upload-icon {
      width: 16px;
      height: 16px;
      opacity: 0.7;
    }
    input[type="file"] {
      display: none;
    }
  `;

  constructor() {
    super();
    this.fileName = '';
    this.fileContent = '';
    this.isEditing = false;
  }

  handleClick() {
    if (this.isEditing) {
      this.shadowRoot.querySelector('input[type="file"]').click();
    }
  }

  async handleFileChange(event) {
    const file = event.target.files[0];
    if (file) {
      // Check file extension
      const extension = file.name.split('.').pop().toLowerCase();
      if (extension !== 'txt' && extension !== 'md') {
        alert('Only .txt and .md files are supported');
        return;
      }

      try {
        const content = await file.text();
        this.fileName = file.name;
        this.fileContent = content;
        this.dispatchEvent(new CustomEvent('file-selected', {
          detail: { 
            fileName: file.name,
            fileContent: content
          },
          bubbles: true,
          composed: true
        }));
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Error reading file');
      }
    }
  }

  render() {
    return html`
      <div class="file-upload" @click=${this.handleClick}>
        <span class="file-name">${this.fileName || 'Select .md file'}</span>
        <svg class="upload-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        <input type="file" accept=".txt,.md" @change=${this.handleFileChange}>
      </div>
    `;
  }
}

customElements.define('file-upload', FileUpload); 