const styleCache = new Map();

export const AdoptableStyles = Object.freeze({
  for(cssText) {
    let sheet = styleCache.get(cssText);
    if (!sheet) {
      sheet = new CSSStyleSheet();
      sheet.replaceSync(cssText);
      styleCache.set(cssText, sheet);
    }
    return sheet;
  },
});

export function css(strings, ...values) {
  let cssString = "";
  for (let i = 0, ii = strings.length - 1; i < ii; ++i) {
    cssString += strings[i];
    cssString += values[i];
  }
  cssString += strings[strings.length - 1];
  return AdoptableStyles.for(cssString.trim());
}

export function html(strings, ...values) {
  let htmlString = "";
  for (let i = 0, ii = strings.length - 1; i < ii; ++i) {
    htmlString += strings[i];
    htmlString += values[i];
  }
  htmlString += strings[strings.length - 1];
  return htmlString.trim();
}
