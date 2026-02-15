const fs = require('fs');

const DISPLACEMENT_MAP = fs.readFileSync('liquid-glass-src/displacement-map.txt', 'utf8').trim();

const variants = ['floating-points', 'test-bubble', 'test-dock', 'test-staggered', 'test-pill', 'test-folder'];

const NEW_POPUP_CSS = `
    /* === LIQUID GLASS POPUP === */
    .popup-overlay {
      position: fixed; inset: 0; z-index: 100;
      display: flex; align-items: center; justify-content: center;
      background: transparent;
      visibility: hidden; pointer-events: none;
      transition: visibility 0s linear 0.4s;
    }
    .popup-overlay.active { visibility: visible; pointer-events: auto; transition: visibility 0s linear 0s; }

    .popup {
      width: 90%; max-width: 620px;
      border-radius: 28px; position: relative;
      overflow: hidden;
      box-shadow: 0 12px 40px rgba(0,0,0,0.35), 0 0 80px rgba(142,197,252,0.08);
      transform: scale(0.95) translateY(10px); opacity: 0;
      transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.15s ease;
      will-change: transform, opacity;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
    }
    .popup-overlay.active .popup { transform: scale(1) translateY(0); opacity: 1; }

    .glass-warp {
      position: absolute; inset: 0;
      border-radius: inherit;
      filter: url(#glass-filter);
      backdrop-filter: blur(24px) saturate(150%);
      -webkit-backdrop-filter: blur(24px) saturate(150%);
      z-index: 0;
    }

    .glass-border {
      position: absolute; inset: 0;
      border-radius: inherit;
      pointer-events: none;
      padding: 1.5px;
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      box-shadow: 0 0 0 0.5px rgba(255,255,255,0.5) inset,
                  0 1px 3px rgba(255,255,255,0.25) inset,
                  0 1px 4px rgba(0,0,0,0.35);
      z-index: 3;
    }
    .glass-border--screen {
      mix-blend-mode: screen;
      opacity: 0.3;
      background: linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 33%, rgba(255,255,255,0.45) 66%, rgba(255,255,255,0) 100%);
    }
    .glass-border--overlay {
      mix-blend-mode: overlay;
      background: linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 33%, rgba(255,255,255,0.65) 66%, rgba(255,255,255,0) 100%);
    }

    .popup-scroll {
      position: relative;
      z-index: 1;
      max-height: 75vh;
      overflow-y: auto;
      padding: 2.5rem;
    }
    .popup-scroll::-webkit-scrollbar { width: 4px; }
    .popup-scroll::-webkit-scrollbar-track { background: transparent; }
    .popup-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
`;

const SVG_FILTER = `    <!-- Liquid Glass SVG Filter -->
    <svg style="position:absolute;width:0;height:0;overflow:hidden;" aria-hidden="true">
      <defs>
        <filter id="glass-filter" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
          <feImage width="100%" height="100%" result="DISPLACEMENT_MAP" href="${DISPLACEMENT_MAP}" preserveAspectRatio="xMidYMid slice"/>
          <feDisplacementMap in="SourceGraphic" in2="DISPLACEMENT_MAP" scale="-70" xChannelSelector="R" yChannelSelector="B" result="RED_DISPLACED"/>
          <feColorMatrix in="RED_DISPLACED" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="RED_CHANNEL"/>
          <feDisplacementMap in="SourceGraphic" in2="DISPLACEMENT_MAP" scale="-66.5" xChannelSelector="R" yChannelSelector="B" result="GREEN_DISPLACED"/>
          <feColorMatrix in="GREEN_DISPLACED" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="GREEN_CHANNEL"/>
          <feDisplacementMap in="SourceGraphic" in2="DISPLACEMENT_MAP" scale="-63" xChannelSelector="R" yChannelSelector="B" result="BLUE_DISPLACED"/>
          <feColorMatrix in="BLUE_DISPLACED" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="BLUE_CHANNEL"/>
          <feBlend in="GREEN_CHANNEL" in2="BLUE_CHANNEL" mode="screen" result="GB_COMBINED"/>
          <feBlend in="RED_CHANNEL" in2="GB_COMBINED" mode="screen" result="RGB_COMBINED"/>
          <feGaussianBlur in="RGB_COMBINED" stdDeviation="0.3" result="ABERRATED_BLURRED"/>
          <feColorMatrix in="DISPLACEMENT_MAP" type="matrix" values="0.3 0.3 0.3 0 0  0.3 0.3 0.3 0 0  0.3 0.3 0.3 0 0  0 0 0 1 0" result="EDGE_INTENSITY"/>
          <feComponentTransfer in="EDGE_INTENSITY" result="EDGE_MASK">
            <feFuncA type="discrete" tableValues="0 0.1 1"/>
          </feComponentTransfer>
          <feOffset in="SourceGraphic" dx="0" dy="0" result="CENTER_ORIGINAL"/>
          <feComposite in="ABERRATED_BLURRED" in2="EDGE_MASK" operator="in" result="EDGE_ABERRATION"/>
          <feComponentTransfer in="EDGE_MASK" result="INVERTED_MASK">
            <feFuncA type="table" tableValues="1 0"/>
          </feComponentTransfer>
          <feComposite in="CENTER_ORIGINAL" in2="INVERTED_MASK" operator="in" result="CENTER_CLEAN"/>
          <feComposite in="EDGE_ABERRATION" in2="CENTER_CLEAN" operator="over"/>
        </filter>
      </defs>
    </svg>
`;

const MOUSE_JS = `
    // Liquid glass border mouse tracking
    document.querySelectorAll('.popup').forEach(function(popup) {
      var borders = popup.querySelectorAll('.glass-border');
      if (borders.length < 2) return;
      popup.addEventListener('mousemove', function(e) {
        var rect = popup.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var ox = ((e.clientX - cx) / rect.width) * 100;
        var oy = ((e.clientY - cy) / rect.height) * 100;
        var angle = 135 + ox * 1.2;
        var s1 = Math.max(10, 33 + oy * 0.3);
        var s2 = Math.min(90, 66 + oy * 0.4);
        borders[0].style.background = 'linear-gradient(' + angle + 'deg, rgba(255,255,255,0) 0%, rgba(255,255,255,' + (0.15 + Math.abs(ox) * 0.008).toFixed(3) + ') ' + s1.toFixed(1) + '%, rgba(255,255,255,' + (0.45 + Math.abs(ox) * 0.012).toFixed(3) + ') ' + s2.toFixed(1) + '%, rgba(255,255,255,0) 100%)';
        borders[1].style.background = 'linear-gradient(' + angle + 'deg, rgba(255,255,255,0) 0%, rgba(255,255,255,' + (0.35 + Math.abs(ox) * 0.008).toFixed(3) + ') ' + s1.toFixed(1) + '%, rgba(255,255,255,' + (0.65 + Math.abs(ox) * 0.012).toFixed(3) + ') ' + s2.toFixed(1) + '%, rgba(255,255,255,0) 100%)';
      });
    });`;

function findMatchingCloseDiv(html, openPos) {
  // Starting right after a <div ...> tag, find the matching </div>
  let depth = 1;
  let i = openPos;
  while (i < html.length && depth > 0) {
    const nextOpen = html.indexOf('<div', i);
    const nextClose = html.indexOf('</div>', i);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      // Check if it's actually a div tag (not e.g. <divider>)
      const afterTag = html[nextOpen + 4];
      if (afterTag === ' ' || afterTag === '>' || afterTag === '\n') {
        depth++;
      }
      i = nextOpen + 4;
    } else {
      depth--;
      if (depth === 0) return nextClose;
      i = nextClose + 6;
    }
  }
  return -1;
}

variants.forEach(function(variant) {
  const filePath = `${variant}-glass/index.html`;
  let html = fs.readFileSync(filePath, 'utf8');

  // 1. Replace popup CSS block
  // Match from ".popup-overlay {" through scrollbar styles, including optional comment header
  const cssRegex = /(\s*\/\*[\s=]*LIQUID GLASS POPUP[\s=]*\*\/\n)?\s*\.popup-overlay \{[\s\S]*?\.popup::-webkit-scrollbar-thumb \{[^}]*\}/;
  html = html.replace(cssRegex, NEW_POPUP_CSS);

  // 2. Remove .popup::before shine line (it's replaced by glass-border)
  html = html.replace(/\s*\.popup::before \{[\s\S]*?\}\n/g, '\n');

  // 3. Remove old .popup scrollbar styles (already in new CSS as .popup-scroll)
  // Already replaced in step 1

  // 4. Add SVG filter before first popup-overlay div
  const firstPopupOverlay = html.indexOf('<div class="popup-overlay"');
  if (firstPopupOverlay !== -1) {
    html = html.slice(0, firstPopupOverlay) + SVG_FILTER + '\n' + html.slice(firstPopupOverlay);
  }

  // 5. Restructure each popup: add glass layers + popup-scroll wrapper
  const glassLayers = `<span class="glass-warp"></span>\n        <span class="glass-border glass-border--screen"></span>\n        <span class="glass-border glass-border--overlay"></span>\n        <div class="popup-scroll">`;

  // Find each <div class="popup"> and restructure
  let searchFrom = 0;
  while (true) {
    const popupOpen = html.indexOf('<div class="popup">', searchFrom);
    if (popupOpen === -1) break;

    const tagEnd = popupOpen + '<div class="popup">'.length;

    // Find the matching </div> for this popup
    const closePos = findMatchingCloseDiv(html, tagEnd);
    if (closePos === -1) break;

    // Insert glass layers after <div class="popup"> and before content
    // and insert </div> (closing popup-scroll) before the popup's </div>

    // Find the indent of content (usually 8 spaces)
    const afterTag = html.slice(tagEnd, tagEnd + 20);
    const indentMatch = afterTag.match(/\n(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '        ';

    // Insert closing </div> for popup-scroll before the popup's closing </div>
    html = html.slice(0, closePos) + indent + '</div>\n      ' + html.slice(closePos);

    // Insert glass layers after <div class="popup">\n
    const insertPos = tagEnd;
    html = html.slice(0, insertPos) + '\n' + indent + glassLayers + html.slice(insertPos);

    // Move past this popup to find the next one
    searchFrom = closePos + 100; // skip past the modifications
  }

  // 6. Add mouse tracking JS before closing </script>
  // Find the last </script> tag
  const lastScript = html.lastIndexOf('</script>');
  if (lastScript !== -1) {
    html = html.slice(0, lastScript) + MOUSE_JS + '\n  ' + html.slice(lastScript);
  }

  // 7. Update page title to indicate glass variant
  html = html.replace(/<title>([^<]*)<\/title>/, '<title>$1 (Glass)</title>');

  fs.writeFileSync(filePath, html);
  console.log(`Transformed ${filePath}`);
});

console.log('All variants transformed!');
