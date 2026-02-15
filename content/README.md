# How to Edit Your Website Content

All the text on your website is stored in simple text files in this `content/` folder. You can edit them directly on GitHub — no coding needed!

## How to edit a file on GitHub

1. Go to the `content/` folder on GitHub
2. Click the file you want to edit (e.g. `about.md`)
3. Click the pencil icon (top right) to edit
4. Make your changes
5. Click **Commit changes** at the bottom
6. Your site will update automatically within a few minutes

---

## File Guide

### `about.md` — About section

Write paragraphs of text. Separate paragraphs with a blank line.

```
This is the first paragraph about me.

This is the second paragraph. Just write naturally.
```

---

### `research.md` — Research section

Each research block has three parts:
1. **Tag** (e.g. "Current", "Methods") — first line
2. **Title** — line starting with `# `
3. **Description** — remaining text

Separate blocks with `---` on its own line.

```
Current
# My Research Project Title
Description of this research project goes here.

---

Methods
# Another Project
Description of another project.
```

---

### `cv.md` — CV / Resume section

Same format as research — tag, title, description, separated by `---`.

```
Education
# PhD Neuroscience
University of Cambridge, 2020-2024. Details about your PhD.

---

Experience
# Research Assistant
MRC Laboratory of Molecular Biology. What you did there.

---

Skills
# Computational & Experimental
List your skills here.
```

---

### `contact.md` — Contact links

One link per line. Format: `type | url | display text`

Available types: `scholar`, `web`, `email`

```
scholar | https://scholar.google.com/citations?user=YOUR_ID | Google Scholar Profile
web | https://your-lab-website.com | Lab Website
email | mailto:your@email.com | your@email.com
```

---

### Publications

Publications load automatically from your ORCID profile — no editing needed! When you add a new paper to ORCID, it will appear on your website automatically.

Your ORCID: `0009-0001-3527-6782`
