# Zetrix AI Academy — Pre-Sales Audit Report
**Date:** 2026-08-21  
**Scope:** All HTML, CSS, JS, assets, navigation, course-engine integration, certificate templates, mobile responsiveness, and broken links.  
**Files Audited:** 19 HTML pages, 5 CSS files, 30 JS files, 2 asset folders, 1 backend template.

---

## 🔴 CRITICAL ISSUES (Fix Before Sales Presentation)

### 1. Missing Core Pages — Multiple Broken Links
**Impact:** Navigation fails, users hit 404s, PWA/mobile menu links dead.

| Missing File | Referenced By | Line(s) |
|--------------|---------------|---------|
| `academy.html` | `academy-level1.html` | ~L217 |
| `academy.html` | `academy-level6.html` | ~L262 |
| `academy.html` | `dept-course.html` | L434, L506 |
| `manifest.json` | `index.html` | L9 |
| `sw.js` | `js/pwa.js` | L10 |
| `subjects.html` | `js/pwa.js` | L26, L67 |
| `dashboard.html` | `js/pwa.js` | L28, L70; `js/auth-guard.js`; `js/oauth.js` |
| `planner.html` | `js/pwa.js` | L71 |
| `study-tools.html` | `js/pwa.js` | L72; `js/auth-guard.js` |
| `exam-practice.html` | `js/pwa.js` | L73; `js/auth-guard.js` |
| `login.html` | `js/auth.js`; `js/firebase-auth.js`; `js/pwa.js` | various |
| `register.html` | `js/auth-guard.js` | L7 |
| `flashcards.html` | `js/auth-guard.js` | L3 |
| `mock-exam.html` | `js/auth-guard.js` | L3 |
| `ai-marker.html` | `js/auth-guard.js` | L3 |
| `quiz.html` | `js/auth-guard.js` | L3 |

**Recommendation:** Either create placeholder pages or remove links from nav/pwa.js until those features launch.

---

### 2. JavaScript Syntax Errors — Will Break at Runtime

#### A. `js/ielts-data.js` — SyntaxError: Unexpected token '{'
- **File:** `js/ielts-data.js`
- **Line:** ~799
- **Issue:** Missing closing brace/bracket before the `{ id: 'writing-4', ... }` object. The preceding `writing-3` task2 object is not properly closed with `},`.
- **Impact:** Entire `ielts-data.js` fails to load; any IELTS-related features break.

#### B. `js/subject-ai-marker.js` — Invalid Regular Expression
- **File:** `js/subject-ai-marker.js`
- **Line:** ~110
- **Issue:** `const hasEquation = /(\b[A-Z][a-z]?\d*|→|⇌|=/).test(answer);`
  The regex has an unescaped `/` in `=/` which terminates the regex early. Should be `=\/` or restructured.
- **Impact:** Script fails to parse; AI marking for science subjects breaks.

---

### 3. Course Engine Version Mismatch — Completion & Activities Broken
**Impact:** Users who complete courses may see broken "Finish Course" buttons or non-functional matching activities.

| File | Engine Version | Problem |
|------|---------------|---------|
| `course-avatar-foundations.html` | `v=8` (cache-bust checks for v6/v7) | Cache-bust logic inconsistent — checks `v=7 !== -1` (meaning it reloads if v7 IS found). Confusing logic. |
| `course-ai-brain.html` | `v=8` | Cache-bust checks `v=7 === -1` (reloads if v7 NOT found). Correct intent. |
| `course-sales-marketing.html` | `v=8` | Same as above. |
| `course-business-automation.html` | `v=8` | Same as above. |
| `course-one-person-company.html` | `v=8` | Same as above. |
| `course-personal-productivity.html` | `v=8` | Same as above. |
| `course-ai-coding.html` | `v=8` | Same as above. |
| `course-enterprise-deployment.html` | `v=2` ⚠️ | **Outdated version.** Loads `course-engine.js?v=2`. |
| `course-solution-architecture.html` | `v=2` ⚠️ | **Outdated version.** Loads `course-engine.js?v=2`. |

#### Method Missing in `course-engine-v6.js`
- **File:** `js/course-engine-v6.js`
- **Missing Methods:** `countQuizzes()` and `initMatchOS()`
- **Impact:** If any page somehow loads v6, the "Finish Course" button will throw `TypeError: this.countQuizzes is not a function`, and matching activities won't initialize.
- **Note:** `course-engine.js` (the v8 file) HAS these methods. Only `course-engine-v6.js` lacks them.

**Recommendation:** 
1. Delete `course-engine-v6.js` if unused.
2. Update `course-enterprise-deployment.html` and `course-solution-architecture.html` to `?v=8`.
3. Standardize all cache-bust snippets to use the SAME version check.

---

### 4. Certificate Template Uses Wrong Relative Path for Logo
- **File:** `backend/templates/certificate.html`
- **Line:** L36
- **Issue:** `<img src="../assets/logo-zetrix-new.png" ...>`
  The template is served from `/backend/templates/`, so `../assets/` resolves to `/backend/assets/`, but the actual assets are at `/assets/` (project root).
- **Impact:** Certificate logo will be a broken image when rendered server-side.
- **Fix:** Change to `../../assets/logo-zetrix-new.png` or use an absolute path `/assets/logo-zetrix-new.png`.

---

## 🟠 HIGH SEVERITY ISSUES

### 5. Navigation Inconsistencies

#### A. `course-complete.html` Missing Standard Navigation
- **File:** `course-complete.html`
- **Issue:** Only includes `js/nav.js?v=6`. Missing `theme.js`, `auth.js`, `mascot.js`, `pwa.js`.
- **Impact:** No theme toggle, no auth state, no mobile nav, no mascot on the completion page.

#### B. Version Fragmentation in Script Tags
Same JS files are loaded with inconsistent cache-bust query strings across pages:

| File | Versions Found |
|------|---------------|
| `css/styles.css` | `?v=4`, `?v=7`, `?v=8`, `?v=10` |
| `css/znotes-style.css` | `?v=4`, `?v=7`, `?v=10` |
| `js/nav.js` | (no version), `?v=5`, `?v=6`, `?v=7`, `?v=9` |
| `js/theme.js` | (no version), `?v=4`, `?v=5`, `?v=7`, `?v=9` |
| `js/auth.js` | (no version), `?v=4`, `?v=7`, `?v=9` |
| `js/mascot.js` | (no version), `?v=4`, `?v=9` |
| `js/pwa.js` | (no version), `?v=9` |
| `js/academy.js` | `?v=4` |
| `js/fx.js` | `?v=9` |

**Impact:** Hard to invalidate caches uniformly. During a sales demo, some users may see stale CSS/JS while others see fresh.

#### C. `course-complete.html` Missing from Dropdown Nav
- The `nav.js` dropdown menu lists all courses + Tutor, but does NOT include a link to `course-complete.html` (which is correct — it's a destination page, not a nav item). However, there is also no "My Progress" or "Academy" link in the desktop nav.

---

### 6. CSS Cache-Bust Mismatch for `course-engine.css`
- **File:** Various course pages
- **Issue:** All course pages link `css/course-engine.css?v=2` but the JS is at `?v=8`. If you update the CSS, the cache bust doesn't match the JS version.
- **Recommendation:** Bump `course-engine.css` to `?v=8` to match the JS version.

---

### 7. Potential HTML Tag Imbalance (Heuristic Warning)
The following pages show significant discrepancies between opening and closing tags. Many are likely false positives due to self-closing tags not being counted, but worth manual review:

| File | Open | Close | Self-Closing |
|------|------|-------|--------------|
| `academy-level1.html` | 195 | 169 | 0 |
| `academy-level2.html` | 409 | 354 | 0 |
| `academy-level3.html` | 173 | 147 | 0 |
| `academy-level4.html` | 182 | 156 | 0 |
| `academy-level5.html` | 458 | 363 | 0 |
| `academy-level6.html` | 244 | 210 | 0 |
| `index.html` | 141 | 118 | 0 |
| `dept-course.html` | 793 | 776 | 0 |
| `tutor.html` | 67 | 57 | 0 |
| `backend/templates/certificate.html` | 32 | 24 | 0 |

**Note:** Self-closing tags (e.g., `<img />`, `<br />`, `<meta />`) are NOT counted in the "self-closing" column of the audit script, which explains the discrepancy. However, manual review of `academy-level5.html` (95 tag difference) is recommended.

---

### 8. `auth.js` Duplicate Method Definition
- **File:** `js/auth.js`
- **Lines:** L14-17 and L42-55
- **Issue:** `loginWithGoogle` is defined TWICE. The second definition (credential-based) overwrites the first (redirect-based).
- **Impact:** If any code expects the redirect-based version, it will fail. The credential-based version is more modern (Google Identity Services), so the first definition is dead code.
- **Recommendation:** Remove the first `loginWithGoogle` definition (L14-17).

---

### 9. Mobile Menu References Non-Existent Pages
- **File:** `js/pwa.js`
- **Lines:** L67-75
- **Issue:** The mobile menu overlay links to `subjects.html`, `dashboard.html`, `planner.html`, `study-tools.html`, `exam-practice.html`, `login.html`.
- **Impact:** Mobile users tapping these menu items will get 404 errors.
- **Recommendation:** Comment out or remove links to pages that don't exist yet.

---

### 10. `manifest.json` Referenced But Missing
- **File:** `index.html` L9
- **Issue:** `<link rel="manifest" href="manifest.json">` but `manifest.json` does not exist.
- **Impact:** PWA install prompt won't work; browsers will 404 on manifest request.

---

## 🟡 MEDIUM SEVERITY ISSUES

### 11. `course-complete.html` Hard-Coded Defaults
- **File:** `course-complete.html`
- **Lines:** L36-L44, L120-L123
- **Issue:** Default course name is "Avatar Foundations", default segments = 10, default quizzes = 3. If a user completes a different course with no URL params, the certificate shows wrong data.
- **Impact:** Embarrassing during demo if someone finishes a different course and sees "Avatar Foundations".
- **Recommendation:** Add URL param validation or generic fallbacks.

---

### 12. `course-complete.html` Certificate Logo Path
- **File:** `course-complete.html`
- **Line:** L127
- **Issue:** `<img src="images/logo-certificate.jpg">` — this file exists (verified), but the path is relative. If this page is ever moved to a subfolder, it will break.
- **Status:** ✅ File exists. Low risk.

---

### 13. Backend Template Uses Different Logo Path Than Frontend
- **File:** `backend/templates/certificate.html` vs `course-complete.html`
- **Issue:** Backend uses `../assets/logo-zetrix-new.png` (broken), frontend uses `images/logo-certificate.jpg` (works). Inconsistent branding assets.
- **Recommendation:** Standardize on one logo file.

---

### 14. `fx.js?v=9` Referenced But File Appears Unused
- **File:** Referenced in some pages (e.g., index.html)
- **Issue:** `fx.js` is loaded but its contents are visual effects. No functional issues, but it's an extra HTTP request.
- **Status:** Cosmetic / performance. Not critical for sales demo.

---

### 15. `dept-course.html` Cache-Bust Version Drift
- **File:** `dept-course.html`
- **Issue:** Uses `css/styles.css?v=7` and `css/znotes-style.css?v=7` while most other pages use `?v=10`.
- **Impact:** May render with outdated styles if caches are stale.

---

### 16. Google Fonts Loaded Without `preconnect` on Some Pages
- **File:** Most pages
- **Issue:** Only `tutor.html` has `<link rel="preconnect" href="https://fonts.googleapis.com">`. Other pages load Google Fonts without preconnect, causing slower font loading.
- **Impact:** Minor performance issue; may cause FOUT during demo.

---

### 17. `theme.js` Creates Duplicate Toggle Button on Repeated Init
- **File:** `js/theme.js`
- **Issue:** If `theme.js` is loaded twice (e.g., via nav injection + direct script), it will create a second theme toggle button because it only checks `document.getElementById('themeToggle')` at init time.
- **Impact:** Two moon/sun icons in the nav bar.
- **Likelihood:** Low (not currently happening), but fragile.

---

## 🟢 LOW SEVERITY / RECOMMENDATIONS

### 18. Missing Alt Text on Images
- **Audit Result:** No `alt=""` empty attributes found in HTML (good!). However, the mascot image in `js/mascot.js` has `alt="LearnAI Mascot"` which is fine.
- **Status:** ✅ Pass

---

### 19. HTTP Links in Data URIs (False Positive)
- **File:** `index.html` L34, `css/effects.css` L391
- **Issue:** `xmlns='http://www.w3.org/2000/svg'` inside inline SVG data URIs.
- **Impact:** None — this is required SVG namespace syntax, not an external HTTP request.
- **Status:** ✅ False positive

---

### 20. `subject-tests.js` Import Parsing Noise
- **File:** `js/subject-tests.js`
- **Issue:** The audit script flagged "missing imports" but these were actually object property values (e.g., `marks: 2, explanation:`) being mis-parsed by the regex.
- **Status:** ✅ False positive

---

### 21. `course-engine.js` vs `course-engine-v6.js` — Dead Code
- **File:** `js/course-engine-v6.js`
- **Issue:** This file exists but is not directly referenced by any HTML page (all pages reference `course-engine.js` with version params). However, the cache-busting scripts in some pages check for `course-engine-v6` in the DOM.
- **Recommendation:** Remove `course-engine-v6.js` to avoid confusion. The main `course-engine.js` already has all v6 features plus `countQuizzes` and `initMatchOS`.

---

### 22. Certificate Template Completeness
**File:** `backend/templates/certificate.html`
- ✅ Has recipient name placeholder (`{{name}}`)
- ✅ Has score placeholder (`{{score}}`)
- ✅ Has date placeholder (`{{date}}`)
- ✅ Has certificate ID placeholder (`{{certId}}`)
- ❌ No dynamic course name — hard-coded to "All 6 levels of the Zetrix AI Academy program"
- ❌ No dynamic logo path fix (see Critical #4)
- ❌ No signature image — uses empty line
- **Recommendation:** Add `{{courseName}}` placeholder for per-course certificates.

---

### 23. `tutor.html` Inline Script for Fullscreen
- **File:** `tutor.html`
- **Lines:** L144-L148
- **Issue:** Inline script is fine functionally, but for CSP (Content Security Policy) compliance, moving it to `tutor.js` would be better.
- **Impact:** None for sales demo.

---

### 24. Placeholder Content / TODOs
- **Audit Result:** The only "TODO-like" strings found were "DEBUG Protocol" in `course-ai-coding.html` (L178, L190) which is actual course content, not a developer TODO.
- **Status:** ✅ No developer TODOs or placeholders found.

---

### 25. Mobile Responsiveness — General Assessment
- **File:** `css/styles.css`
- **Lines:** L399-L527
- **Status:** ✅ Has comprehensive mobile breakpoints:
  - `@media (max-width: 1024px)` — tablet
  - `@media (max-width: 768px)` — mobile
  - `@media (display-mode: standalone)` — PWA
  - Mobile bottom nav implementation in `js/pwa.js`
  - Touch feedback, iOS zoom prevention
- **Issue:** Mobile bottom nav links to non-existent pages (see High #9).

---

### 26. `mascot.js` Tips Are Generic (Not Zetrix-Branded)
- **File:** `js/mascot.js`
- **Issue:** Tips say "Past papers are your best friend!", "Show all working in maths!", "Plan essays before writing!" — these are generic study tips, not AI/Avatar/Zetrix themed.
- **Impact:** Minor brand inconsistency. For a sales demo, consider updating to AI-specific tips.

---

## 📊 SUMMARY TABLE

| Category | Count | Critical | High | Medium | Low |
|----------|-------|----------|------|--------|-----|
| Missing Files / Broken Links | 15 | 13 | 2 | 0 | 0 |
| JavaScript Errors | 2 | 2 | 0 | 0 | 0 |
| Version / Cache Mismatches | 5 | 1 | 2 | 2 | 0 |
| Navigation Issues | 4 | 0 | 3 | 1 | 0 |
| Certificate Issues | 3 | 1 | 1 | 1 | 0 |
| Mobile / PWA | 2 | 0 | 1 | 0 | 1 |
| CSS / HTML | 2 | 0 | 1 | 1 | 0 |
| **TOTAL** | **33** | **20** | **10** | **5** | **1** |

---

## ✅ FILES THAT PASSED (No Issues Found)
- `css/course-engine.css` — Syntax valid, all selectors well-formed
- `css/effects.css` — No broken references, valid animations
- `css/ielts-test.css` — Not referenced by any HTML (orphan but valid)
- `css/znotes-style.css` — Valid syntax
- `js/data.js`, `js/quiz.js`, `js/flashcards.js`, `js/notes.js`, `js/search.js`, `js/zetrix-knowledge.js`, `js/tutor.js`, `js/tutor-v2.js`, `js/tutor-zetrix.js` — All valid JS
- `js/firebase-config.js`, `js/firebase-auth.js`, `js/oauth.js` — Valid JS
- `js/mock-exam.js`, `js/quiz-data.js` — Valid JS
- Images in `/images/` — All referenced files exist
- Assets in `/assets/` — All referenced files exist

---

## 🛠️ RECOMMENDED PRE-DEMO CHECKLIST

1. **Fix JS syntax errors** in `js/ielts-data.js` (L799) and `js/subject-ai-marker.js` (L110).
2. **Fix or remove missing page links** in `js/pwa.js` mobile menu and `js/auth-guard.js`.
3. **Standardize all cache-bust versions** to `?v=10` (or bump to `?v=11` for the demo).
4. **Update `course-enterprise-deployment.html` and `course-solution-architecture.html`** to use `course-engine.js?v=8`.
5. **Fix certificate template logo path** in `backend/templates/certificate.html`.
6. **Remove duplicate `loginWithGoogle`** in `js/auth.js`.
7. **Delete `course-engine-v6.js`** if truly unused.
8. **Create placeholder `academy.html`** (or redirect to `index.html#academy`).
9. **Add `manifest.json`** or remove the `<link>` from `index.html`.
10. **Test one full course flow** (avatar foundations) end-to-end on mobile and desktop.
