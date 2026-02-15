/**
 * Content loader for isabellabeckett.com
 * Loads content from markdown files + publications from ORCID API.
 * Bella can edit the .md files on GitHub without touching HTML.
 */

var SEMANTIC_SCHOLAR_ID = '2305591080';

// Papers with co-first authorship (DOI → list of co-first author last names)
var CO_FIRST_AUTHORS = {
  '10.1101/2025.10.09.680999': ['Berg', 'Beckett', 'Costa', 'Schlegel', 'Januszewski', 'Marin', 'Nern', 'Preibisch', 'Qiu', 'Takemura']
};

// SVG icons for contact section
var CONTACT_ICONS = {
  scholar: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M5.242 13.769L0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/></svg>',
  web: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>',
  email: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>'
};

/**
 * Process inline markdown formatting:
 *   [text](url)  → hyperlink
 *   **text**     → bold
 *   *text*       → italic
 */
function formatInline(text) {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

/**
 * Parse about.md — paragraphs separated by blank lines
 */
function parseAbout(text) {
  return text.trim().split(/\n\s*\n/).map(function(p) {
    return '<p>' + formatInline(p.trim()) + '</p>';
  }).join('\n');
}

/**
 * Parse research.md / cv.md — blocks separated by ---
 * Format: tag\n# title\nbody
 */
function parseBlocks(text) {
  return text.trim().split(/\n---\n/).map(function(block) {
    var lines = block.trim().split('\n');
    var tag = lines[0].trim();
    var title = '';
    var body = [];
    for (var i = 1; i < lines.length; i++) {
      if (lines[i].trim().indexOf('# ') === 0) {
        title = lines[i].trim().substring(2);
      } else if (lines[i].trim()) {
        body.push(lines[i].trim());
      }
    }
    return '<div class="research-block">' +
      '<span class="research-tag">' + tag + '</span>' +
      '<h3>' + formatInline(title) + '</h3>' +
      '<p>' + formatInline(body.join(' ')) + '</p>' +
      '</div>';
  }).join('\n');
}

/**
 * Parse contact.md — lines of "type | url | label"
 */
function parseContact(text) {
  return text.trim().split('\n').filter(function(line) {
    return line.trim();
  }).map(function(line) {
    var parts = line.split('|').map(function(s) { return s.trim(); });
    var type = parts[0] || 'web';
    var url = parts[1] || '#';
    var label = parts[2] || url;
    var icon = CONTACT_ICONS[type] || CONTACT_ICONS.web;
    var target = type === 'email' ? '' : ' target="_blank" rel="noopener"';
    return '<div class="contact-item">' +
      '<span class="contact-icon">' + icon + '</span>' +
      '<a href="' + url + '"' + target + '>' + label + '</a>' +
      '</div>';
  }).join('\n');
}

/**
 * Fetch and render markdown content into popup containers
 */
function loadContent(basePath) {
  var sections = [
    { file: 'about.md', id: 'popup-about', parser: parseAbout, label: 'About' },
    { file: 'research.md', id: 'popup-research', parser: parseBlocks, label: 'Research' },
    { file: 'cv.md', id: 'popup-cv', parser: parseBlocks, label: 'Curriculum Vitae' },
    { file: 'contact.md', id: 'popup-contact', parser: parseContact, label: 'Contact' }
  ];

  sections.forEach(function(section) {
    var overlay = document.getElementById(section.id);
    if (!overlay) return;
    var popup = overlay.querySelector('.popup');
    if (!popup) return;

    fetch(basePath + section.file)
      .then(function(res) {
        if (!res.ok) throw new Error('Failed to load ' + section.file);
        return res.text();
      })
      .then(function(text) {
        var content = section.parser(text);
        // Keep close button and label, replace content
        popup.innerHTML =
          '<button class="popup-close">&times;</button>' +
          '<p class="popup-label">' + section.label + '</p>' +
          content;
        // Re-attach close handler
        popup.querySelector('.popup-close').addEventListener('click', function() {
          overlay.classList.remove('active');
        });
      })
      .catch(function(err) {
        console.warn('Content load error:', err);
      });
  });

  // Load publications from ORCID
  loadPublications();
}

/**
 * Fetch publications from Semantic Scholar API
 */
function loadPublications() {
  var overlay = document.getElementById('popup-publications');
  if (!overlay) return;
  var popup = overlay.querySelector('.popup');
  if (!popup) return;

  // Show loading state
  popup.innerHTML =
    '<button class="popup-close">&times;</button>' +
    '<p class="popup-label">Publications</p>' +
    '<p style="color: rgba(255,255,255,0.3); font-size: 0.85rem;">Loading publications...</p>';
  popup.querySelector('.popup-close').addEventListener('click', function() {
    overlay.classList.remove('active');
  });

  fetch('https://api.semanticscholar.org/graph/v1/author/' + SEMANTIC_SCHOLAR_ID + '/papers?fields=title,year,venue,externalIds,authors&limit=50')
    .then(function(res) {
      if (!res.ok) throw new Error('Failed to fetch from Semantic Scholar');
      return res.json();
    })
    .then(function(data) {
      var papers = data.data || [];
      if (papers.length === 0) {
        popup.querySelector('p:last-child').textContent = 'No publications found.';
        return;
      }

      // Deduplicate papers that share a DOI (e.g. preprint + published version)
      var seen = {};
      var publications = [];
      papers.forEach(function(p) {
        var doi = (p.externalIds && p.externalIds.DOI) || null;
        var key = doi || p.title;
        if (!seen[key]) {
          seen[key] = true;
          publications.push({
            title: p.title || 'Untitled',
            year: p.year || '',
            venue: p.venue || 'Preprint',
            doi: doi,
            authors: (p.authors || []).map(function(a) { return a.name; })
          });
        }
      });

      // Sort by year descending
      publications.sort(function(a, b) { return (b.year || 0) - (a.year || 0); });

      var html =
        '<button class="popup-close">&times;</button>' +
        '<p class="popup-label">Publications</p>';

      publications.forEach(function(pub) {
        // Shorten names to initials + last name, bold Isabella, add co-first-author stars
        var coFirst = pub.doi ? CO_FIRST_AUTHORS[pub.doi] || [] : [];
        var authorsHtml = '';
        if (pub.authors.length > 0) {
          var formatted = pub.authors.map(function(name) {
            var parts = name.trim().split(/\s+/);
            if (parts.length < 2) return name;
            var lastName = parts[parts.length - 1];
            var initials = parts.slice(0, -1).map(function(p) { return p[0] + '.'; }).join(' ');
            var short = initials + ' ' + lastName;
            // Append * for co-first authors
            for (var c = 0; c < coFirst.length; c++) {
              if (lastName === coFirst[c]) { short += '*'; break; }
            }
            return short;
          });
          // Truncate after Isabella's name
          var bellaIdx = -1;
          for (var b = 0; b < formatted.length; b++) {
            if (/Beckett/i.test(formatted[b])) { bellaIdx = b; break; }
          }
          if (bellaIdx >= 0 && bellaIdx < formatted.length - 3) {
            var lastTwo = formatted.slice(-2);
            formatted = formatted.slice(0, bellaIdx + 1);
            formatted.push('...', lastTwo[0], lastTwo[1]);
          }
          authorsHtml = formatted.join(', ')
            .replace(/(I\.\s*(?:R\.\s*)?Beckett\*?)/gi, '<span class="me">$1</span>');
        }

        var link = pub.doi ? 'https://doi.org/' + pub.doi : '';
        html += '<div class="pub-item">' +
          '<p class="pub-year">' + pub.year + '</p>' +
          '<p class="pub-title">' + (link ? '<a href="' + link + '" target="_blank" rel="noopener">' + pub.title + '</a>' : pub.title) + '</p>' +
          (authorsHtml ? '<p class="pub-authors">' + authorsHtml + '</p>' : '') +
          '<p class="pub-journal">' + pub.venue + '</p>' +
          '</div>';
      });

      popup.innerHTML = html;
      popup.querySelector('.popup-close').addEventListener('click', function() {
        overlay.classList.remove('active');
      });
    })
    .catch(function(err) {
      console.error('Error loading publications:', err);
      popup.querySelector('p:last-child').textContent = 'Unable to load publications. Please try again later.';
    });
}

// Auto-initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  loadContent('../content/');
});
