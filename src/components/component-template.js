import { css, html } from "../utils/css-utils";

const template = html` <slot></slot> `;

const styles = css`
  :host {
    display: block;
    contain: content;
    box-sizing: border-box;
  }

  :host([hidden]) {
    display: none;
  }
`;

// Base component template
export class FoundryWcTemplate extends HTMLElement {
  static get observedAttributes() {
    return ["attr-name-here"];
  }

  constructor() {
    super();
    this.attachShadow({
      mode: "open",
    }).innerHTML = template;
    this.shadowRoot.adoptedStyleSheets.push(styles);
  }

  // Set up initial component state when the component is connected to the DOM
  connectedCallback() {
    if (!this.hasAttribute("attr-name-here")) {
      this.heading = "Accordion Header 1";
    }
  }

  get heading() {
    return this.getAttribute("heading");
  }

  set heading(value) {
    if (value) {
      this.setAttribute("heading", value);
    } else {
      this.removeAttribute("heading");
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "heading") {
      const headingSlot = this.shadowRoot.querySelector('[slot="heading"]');
      headingSlot.textContent = newValue;
    }
  }
}

customElements.define("foundry-wc-template", FoundryWcTemplate);
