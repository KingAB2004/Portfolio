<div align="center">

<img src="docs/crown.svg" alt="kingAB crown" width="88" />

# kingAB · Portfolio

**Arpit Bhomia** · Competitive Programmer & Problem Solver · CSE @ IIT Bhilai

<a href="https://kingab-portfolio.netlify.app"><img src="https://img.shields.io/badge/live-kingab--portfolio.netlify.app-f2c14e?style=for-the-badge&logo=netlify&logoColor=1a1305&labelColor=0e0d0c" alt="Live site" /></a>

<a href="https://app.netlify.com/projects/kingab-portfolio/deploys"><img src="https://api.netlify.com/api/v1/badges/87f41685-207c-478d-a1ff-9e1ce8f0ec82/deploy-status" alt="Netlify status" /></a>
<img src="https://img.shields.io/badge/HTML5-0e0d0c?style=flat-square&logo=html5&logoColor=E34F26" alt="HTML5" />
<img src="https://img.shields.io/badge/CSS3-0e0d0c?style=flat-square&logo=css3&logoColor=1572B6" alt="CSS3" />
<img src="https://img.shields.io/badge/JavaScript-0e0d0c?style=flat-square&logo=javascript&logoColor=F7DF1E" alt="JavaScript" />
<img src="https://img.shields.io/badge/Three.js-0e0d0c?style=flat-square&logo=threedotjs&logoColor=white" alt="Three.js" />
<img src="https://img.shields.io/badge/no_build_step-0e0d0c?style=flat-square&logo=files&logoColor=f2c14e" alt="No build step" />

<br />

<a href="https://kingab-portfolio.netlify.app">
  <img src="docs/screenshots/hero.webp" alt="Portfolio hero: Arpit Bhomia with a glowing BFS graph in the background" width="100%" />
</a>

<sub>The background is a random graph with a BFS wavefront running through it, rendered with Three.js.</sub>

</div>

<br />

## ✦ At a glance

<table>
  <tr>
    <td align="center"><b>1810</b><br /><sub>Codeforces max · Expert</sub></td>
    <td align="center"><b>2007</b><br /><sub>CodeChef max · 5★</sub></td>
    <td align="center"><b>AIR 40</b><br /><sub>ICPC Kanpur Regional</sub></td>
    <td align="center"><b>2000+</b><br /><sub>problems solved</sub></td>
    <td align="center"><b>9.45</b><br /><sub>CGPA, IIT Bhilai</sub></td>
  </tr>
</table>

## ✦ What's on the site

| Section | What it shows |
| --- | --- |
| **Hero** | Name, typed roles, quick stats, the BFS graph background |
| **A · About me** | Short intro and six count-up stat cards |
| **B · Competitive programming** | Codeforces rating graph (fetched live from the Codeforces API, with a snapshot fallback), problems by tag and by rating, platform cards, contest results with certificates |
| **C · Experience** | Visa SWE internship, Ingenuity CP club coordinator, Inter-IIT Tech Meet, DSAI Club |
| **D · Projects** | TermiChat, Custom OS Scheduler, Warranty Storage, CP Butler, Bomberman AI, with real screenshots |
| **E · Coursework** | IIT Bhilai courses grouped by area, with grades |
| **F · Education & achievements** | IIT Bhilai, JEE Advanced, ATF 2024, IIT Guwahati bootcamp, school |
| **G · Contact** | Email, résumé download and profile links |

## ✦ Screenshots

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/cp.webp" alt="Competitive programming section with Codeforces rating graph" /></td>
    <td width="50%"><img src="docs/screenshots/experience.webp" alt="Experience timeline" /></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/screenshots/projects.webp" alt="Projects section" /></td>
    <td width="50%"><img src="docs/screenshots/contact.webp" alt="Contact section" /></td>
  </tr>
</table>

<p align="center">
  <img src="docs/screenshots/mobile.webp" alt="Mobile view" width="260" />
  <br /><sub>Mobile layout</sub>
</p>

## ✦ How it's built

Plain HTML, CSS and JavaScript. There is no framework and no build step, and the only library is Three.js.

**Animation**
- Short intro screen, then the name rises in letter by letter
- Section titles reveal per letter and their underlines draw in
- Screenshots wipe in and drift slightly as you scroll (CSS scroll-driven animations)
- Experience timeline fills on scroll, plus a scroll progress bar
- Cursor ring, magnetic buttons, 3D tilt and a spotlight on cards
- Rating line draws itself, and the bars and counters animate in

**Performance**
- Animations only touch `transform`, `translate`, `opacity` and `clip-path`. There is no `backdrop-filter` and no animated `box-shadow`.
- `graph.js` (Three.js) is loaded only after the page is idle. It runs at full speed in the hero and at 30 fps behind the content, and it stops when the tab is hidden.
- Adaptive quality: if frames run slow, the background drops resolution, then frame rate, and finally freezes on a still frame.
- Looping hero animations and the marquee pause when they're off screen.
- Images are resized WebP (about 240 KB in total), lazy-loaded with fixed dimensions.
- `prefers-reduced-motion` turns the motion off.

## ✦ Project structure

```text
.
├── netlify.toml            # publish = "site"
├── site/
│   ├── index.html
│   ├── css/style.css
│   ├── js/
│   │   ├── main.js         # reveals, chart, typing, cursor, tilt, fallbacks
│   │   └── graph.js        # Three.js BFS-graph background (lazy-loaded)
│   └── assets/
│       ├── Arpit_Bhomia_Resume.pdf
│       └── img/            # project screenshots (WebP)
└── docs/                   # README images (not deployed)
```

## ✦ Run locally

```bash
git clone https://github.com/KingAB2004/Portfolio.git
cd Portfolio/site
python3 -m http.server 8000
# open http://localhost:8000
```

The page needs to be served over HTTP, because `graph.js` is an ES module.

## ✦ Deploy

The site is hosted on Netlify, and `netlify.toml` publishes the `site/` folder.

```bash
npx netlify-cli deploy --prod --dir site
```

## ✦ Connect

<p>
  <a href="https://kingab-portfolio.netlify.app"><img src="https://img.shields.io/badge/Portfolio-f2c14e?style=for-the-badge&logo=googlechrome&logoColor=1a1305" alt="Portfolio" /></a>
  <a href="https://github.com/KingAB2004"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" /></a>
  <a href="https://www.linkedin.com/in/arpit-bhomia-52783b28a/"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>
  <a href="https://codeforces.com/profile/kingAB"><img src="https://img.shields.io/badge/Codeforces-1F8ACB?style=for-the-badge&logo=codeforces&logoColor=white" alt="Codeforces" /></a>
  <a href="https://www.codechef.com/users/kingab"><img src="https://img.shields.io/badge/CodeChef-5B4638?style=for-the-badge&logo=codechef&logoColor=white" alt="CodeChef" /></a>
  <a href="https://leetcode.com/u/KingAB/"><img src="https://img.shields.io/badge/LeetCode-FFA116?style=for-the-badge&logo=leetcode&logoColor=black" alt="LeetCode" /></a>
  <a href="mailto:arpitbhomia1204@gmail.com"><img src="https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white" alt="Email" /></a>
</p>

<div align="center">
<sub>© 2026 Arpit Bhomia</sub>
</div>
