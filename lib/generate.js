const fs = require("fs");
const path = require("path");

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

function cssSize(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return /px$|rem$|em$|%$/.test(text) ? text : text + "px";
}

function textCss(style) {
  if (!style) return "";
  const parts = [];
  if (style.fontFamily) parts.push("font-family:" + style.fontFamily);
  if (style.color) parts.push("color:" + style.color);
  if (style.fontSize) parts.push("font-size:" + cssSize(style.fontSize));
  if (style.fontWeight) parts.push("font-weight:" + style.fontWeight);
  if (style.textAlign) parts.push("text-align:" + style.textAlign);
  if (style.background) parts.push("background:" + style.background);
  return parts.join(";");
}

function boxCss(style) {
  if (!style) return "";
  const parts = [];
  ["margin", "padding"].forEach((prop) => {
    ["Top", "Right", "Bottom", "Left"].forEach((side) => {
      const value = style[prop + side];
      if (value === undefined || value === null || String(value).trim() === "") return;
      parts.push(prop + "-" + side.toLowerCase() + ":" + cssSize(value));
    });
  });
  const hasPaddingSide = ["Top", "Right", "Bottom", "Left"].some((side) => String(style["padding" + side] || "").trim() !== "");
  if (style.padding && !hasPaddingSide) parts.push("padding:" + style.padding);
  if (style.textAlign) parts.push("text-align:" + style.textAlign);
  return parts.join(";");
}

function mergeStyle(attr, extra) {
  if (!extra) return attr || "";
  if (attr && attr.indexOf('style="') !== -1) return attr.replace('style="', 'style="' + extra + ";");
  return ' style="' + extra + '"' + (attr || "");
}

function styleCss(style) {
  return [textCss(style), boxCss(style)].filter(Boolean).join(";");
}

function mark(style, edit, mode, extraCss) {
  const css = mode === "text" ? textCss(style) : mode === "box" ? boxCss(style) : styleCss(style);
  const all = [extraCss, css].filter(Boolean).join(";");
  let flags = "";
  if (edit && mode !== "box") flags += ' data-styled="1"';
  if (edit && mode !== "text") flags += ' data-box="1"';
  return (all ? ' style="' + esc(all) + '"' : "") + flags;
}

function spaceInputs(prop, label) {
  return '<span class="ve-space">' + label +
    [["Top", "上"], ["Bottom", "下"], ["Left", "左"], ["Right", "右"]].map(([side, name]) => {
      return '<label>' + name + '<input data-style-key="' + prop + side + '" type="number" min="-200" max="400"></label>';
    }).join("") + "</span>";
}

function abs(src) {
  const value = String(src || "");
  if (!value || /^(?:https?:|data:|\/)/.test(value)) return value;
  return "/" + value.replace(/^\.\//, "");
}

function num(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function useBlock(block, device) {
  if (!block || device !== "mobile" || !block.mobile) return block;
  return Object.assign({}, block, {
    style: Object.assign({}, block.style, block.mobile.style || {}),
    data: Object.assign({}, block.data, block.mobile.data || {})
  });
}

function floatId(block, index) {
  return "cf" + String(block.id || index).replace(/[^a-zA-Z0-9_-]/g, "");
}

function rich(text) {
  return String(text || "")
    .split(/\n{2,}/)
    .map((part) => "<p>" + linkify(esc(part).replace(/\n/g, "<br>")) + "</p>")
    .join("");
}

function linkify(text) {
  return text.replace(/https?:\/\/[^\s<]+/g, (url) => '<a href="' + url + '" target="_blank" rel="noopener">' + url + "</a>");
}

function datedText(item) {
  return item && item.date ? String(item.date) : "";
}

function newsTime(item) {
  const match = String(datedText(item)).match(/(\d{2,4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (!match) return 0;
  let year = Number(match[1]);
  if (year < 1911) year += 1911;
  const time = new Date(year, Number(match[2]) - 1, Number(match[3])).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function orderedNews(site) {
  const items = (site.news || []).map((item, index) => ({ item, index }));
  if (site.settings && site.settings.newsSort === "manual") return items.map((entry) => entry.item);
  return items.sort((a, b) => newsTime(b.item) - newsTime(a.item) || a.index - b.index).map((entry) => entry.item);
}

function coverView(album) {
  const read = (value, fallback, min, max) => {
    if (value == null || value === "") return fallback;
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  };
  return {
    x: read(album && album.coverX, 50, 0, 100),
    y: read(album && album.coverY, 50, 0, 100),
    zoom: read(album && album.coverZoom, 1, 1, 3)
  };
}

function coverVars(view) {
  return "--cx:" + view.x + "%;--cy:" + view.y + "%;--zoom:" + view.zoom;
}

function orderedAlbums(site) {
  const items = (site.albums || []).map((item, index) => ({ item, index }));
  if (site.settings && site.settings.albumSort === "manual") return items.map((entry) => entry.item);
  return items.sort((a, b) => newsTime(b.item) - newsTime(a.item) || a.index - b.index).map((entry) => entry.item);
}

function plainRich(text) {
  return linkify(esc(text).replace(/\n/g, "<br>"));
}

function fileFor(page) {
  return page.slug === "index" ? "index.html" : page.slug + ".html";
}

function hrefFor(page) {
  return fileFor(page);
}

function findPage(site, id) {
  return site.pages.find((page) => page.id === id);
}

function navHtml(site, current) {
  const tops = site.pages.filter((page) => page.showInNav && !page.parentId && page.layout !== "cover");
  return tops.map((page) => {
    const kids = site.pages.filter((child) => child.showInNav && child.parentId === page.id);
    const currentHere = current.slug === page.slug || kids.some((child) => child.slug === current.slug);
    const parent = '<a href="' + esc(hrefFor(page)) + '"' + (currentHere ? ' aria-current="page"' : "") + ">" +
      esc(page.navLabel || page.title) + (page.en ? "<b>" + esc(page.en) + "</b>" : "") + "</a>";
    const sub = kids.length
      ? '<ul class="sub">' + kids.map((child) => {
        return '<li><a href="' + esc(hrefFor(child)) + '"' + (current.slug === child.slug ? ' aria-current="page"' : "") + ">" +
          esc(child.navLabel || child.title) + (child.en ? "<b>" + esc(child.en) + "</b>" : "") + "</a></li>";
      }).join("") + "</ul>"
      : "";
    return '<li class="' + (kids.length ? "has-sub" : "") + '">' + parent + sub + "</li>";
  }).join("");
}

function headerHtml(site, current, editing) {
  const logoSrc = site.settings.logo || "images/logo.png";
  const logo = esc(editing ? abs(logoSrc) : logoSrc);
  const name = esc(site.settings.siteName || "");
  const style = site.settings.headerStyle || {};
  const css = styleCss(style);
  const attrs = (editing ? ' class="site-header ve-block" data-scope="header" data-styled="1" data-box="1" data-style="' + esc(JSON.stringify(style)) + '"' : ' class="site-header"') +
    (css ? ' style="' + esc(css) + '"' : "");
  return "<header" + attrs + ">" + (editing ? chromeBar(style, "頁首") : "") + '<div class="header-inner">' +
    '<a class="brand" href="index.html"><img src="' + logo + '" alt="' + name + '"></a>' +
    '<button class="nav-toggle" type="button" aria-label="開啟選單" aria-expanded="false"><span></span><span></span><span></span></button>' +
    '<nav class="main-nav"><ul>' + navHtml(site, current) + "</ul></nav></div></header>";
}

function footerHtml(site, editing) {
  const s = site.settings;
  const style = s.footerStyle || {};
  const css = styleCss(style);
  const attrs = (editing ? ' class="site-footer ve-block" data-scope="footer" data-styled="1" data-box="1" data-style="' + esc(JSON.stringify(style)) + '"' : ' class="site-footer"') +
    (css ? ' style="' + esc(css) + '"' : "");
  return "<footer" + attrs + ">" + (editing ? chromeBar(style, "頁尾") : "") + '<div class="footer-inner">' +
    '<ul class="footer-info">' +
    "<li>" + esc(s.siteName) + "</li>" +
    "<li>" + esc(s.englishName) + "</li>" +
    "<li>" + esc(s.address) + "</li>" +
    "<li>" + esc(s.addressEn) + "</li>" +
    "<li>" + esc(s.phone) + "</li>" +
    "<li>" + esc(s.email) + "</li>" +
    "</ul>" +
    '<div class="footer-side"><ul class="social">' +
    '<li><a href="contact.html" aria-label="Email"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/></svg></a></li>' +
    '<li><a href="https://maps.google.com/?q=' + encodeURIComponent(s.mapQuery || s.address || "") + '" target="_blank" rel="noopener" aria-label="地圖"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg></a></li>' +
    '<li><a href="' + esc(s.facebook || "#") + '" aria-label="Facebook">f</a></li>' +
    '<li><a href="' + esc(s.instagram || "#") + '" aria-label="Instagram"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/></svg></a></li>' +
    '</ul><p class="copyright">' + esc(s.copyright) + "</p></div></div></footer>";
}

function crumb(site, page) {
  const bits = ['<a href="index.html">首頁</a>'];
  if (page.parentId) {
    const parent = findPage(site, page.parentId);
    if (parent) bits.push('<a href="' + esc(hrefFor(parent)) + '">' + esc(parent.title) + "</a>");
  }
  if (page.slug !== "index") bits.push(esc(page.title));
  return bits.join(" &gt; ");
}

function chromeBar(style, label) {
  return editBar({ type: "chrome", style: style || {} }, '<label>底色<input data-style-key="background" type="color"></label>')
    .replace('<div class="ve-bar" contenteditable="false">', '<div class="ve-bar" contenteditable="false"><span class="ve-note">' + label + "</span>")
    .replace('<button type="button" data-act="up">上移</button><button type="button" data-act="down">下移</button><button type="button" data-act="del">刪除</button>', "");
}

function editBar(block, extra) {
  const fonts = [
    ["Microsoft JhengHei, sans-serif", "微軟正黑體"],
    ["PMingLiU, serif", "新細明體"],
    ["DFKai-SB, serif", "標楷體"],
    ["Arial, sans-serif", "Arial"],
    ["Georgia, serif", "Georgia"]
  ].map(([value, label]) => '<option value="' + esc(value) + '">' + label + "</option>").join("");
  const weights = [["400", "一般"], ["600", "中粗"], ["700", "粗體"], ["900", "特粗"]]
    .map(([value, label]) => '<option value="' + value + '">' + label + "</option>").join("");
  return '<div class="ve-bar" contenteditable="false"><label>字體<select data-style-key="fontFamily">' + fonts +
    '</select></label><label>大小<input data-style-key="fontSize" type="number" min="12" max="96"></label><label>粗細<select data-style-key="fontWeight">' +
    weights + '</select></label><label>顏色<input data-style-key="color" type="color" value="#333333"></label><label>對齊<select data-style-key="textAlign"><option value="left">靠左</option><option value="center">置中</option><option value="right">靠右</option></select></label>' +
    spaceInputs("margin", "間距") + spaceInputs("padding", "內距") +
    (extra || "") +
    '<button type="button" data-act="up">上移</button><button type="button" data-act="down">下移</button><button type="button" data-act="del">刪除</button></div>';
}

function cellTypeSelect(block) {
  return '<label>這個區塊<select data-cell-type="1">' +
    [["heading", "標題"], ["text", "文字"], ["image", "圖片"], ["button", "按鈕"]].map(([id, name]) => {
      return '<option value="' + id + '"' + (block.type === id ? " selected" : "") + ">" + name + "</option>";
    }).join("") + "</select></label>";
}

function wrapEdit(index, block, html, extra, cellIndex) {
  const cell = cellIndex === undefined || cellIndex === null ? "" : ' data-cell="' + cellIndex + '"';
  return '<section class="ve-block" data-index="' + index + '"' + cell + ' data-type="' + esc(block.type) + '" data-style="' + esc(JSON.stringify(block.style || {})) + '">' +
    editBar(block, extra) + '<div class="ve-body">' + html + "</div></section>";
}

function blockHtml(site, block, editIndex, cellIndex, device) {
  const edit = Number.isInteger(editIndex);
  const srcOf = (value) => edit ? abs(value) : String(value || "");
  const attr = mark(block.style, edit, "text");
  const box = mark(block.style, edit, "box");
  const both = mark(block.style, edit, "both");
  const ce = (path, mode) => edit ? ' contenteditable="true" spellcheck="false" data-path="' + path + '" data-mode="' + (mode || "text") + '"' : "";
  const done = (html, extra) => {
    if (!edit) return html;
    const picker = cellIndex === undefined || cellIndex === null ? "" : cellTypeSelect(block);
    return wrapEdit(editIndex, block, html, picker + (extra || ""), cellIndex);
  };
  const data = block.data || {};
  if (block.type === "row") {
    const count = Math.min(6, Math.max(2, Number(data.count) || 3));
    const stored = Array.isArray(data.cells) ? data.cells : [];
    const cells = stored.slice(0, count);
    while (cells.length < count) cells.push({ type: "text", style: {}, data: { text: "在這裡輸入文字" } });
    const gap = Math.max(0, Number(data.gap));
    const boxWidth = Math.max(0, Number(data.boxWidth) || 0);
    const boxHeight = Math.max(0, Number(data.boxHeight) || 0);
    const vars = ["--cols:" + count, "--row-gap:" + (Number.isFinite(gap) && data.gap !== undefined && data.gap !== "" ? gap : 22) + "px"];
    if (boxWidth) vars.push("--cell-w:" + boxWidth + "px");
    if (boxHeight) vars.push("--cell-h:" + boxHeight + "px");
    const sized = boxWidth || boxHeight ? " has-cell-size" : "";
    const inner = cells.map((cell, i) => {
      const shown = cell.type === "row" ? { type: "text", style: {}, data: { text: "" } } : useBlock(cell, device || "desktop");
      const piece = edit ? blockHtml(site, shown, editIndex, i, device) : blockHtml(site, shown);
      const handle = edit ? '<button type="button" class="ve-resize" data-resize aria-label="拖曳調整大小"></button>' : "";
      return '<div class="block-cell"><div class="block-cell-body">' + piece + "</div>" + handle + "</div>";
    }).join("");
    const chip = edit ? '<button type="button" class="row-chip" contenteditable="false">橫排</button>' : "";
    const grid = '<div class="block-row cols-' + count + sized + '"' + mergeStyle(box, vars.join(";")) + ">" + chip + inner + "</div>";
    if (!edit) return grid;
    const choices = [2, 3, 4, 5, 6].map((n) => '<option value="' + n + '"' + (count === n ? " selected" : "") + ">" + n + " 個</option>").join("");
    const gapValue = data.gap === undefined || data.gap === "" ? 22 : gap;
    const bar = '<div class="ve-bar" contenteditable="false"><label>一排幾個<select data-path="data.count" data-mode="value" data-reload="1">' + choices +
      '</select></label><label>中間距<input data-path="data.gap" data-mode="value" type="number" min="0" max="120" value="' + gapValue + '"></label>' +
      spaceInputs("margin", "間距") + spaceInputs("padding", "內距") +
      '<button type="button" data-act="up">上移</button><button type="button" data-act="down">下移</button><button type="button" data-act="del">刪除</button></div>';
    return '<section class="ve-block" data-index="' + editIndex + '" data-type="row" data-style="' + esc(JSON.stringify(block.style || {})) + '">' +
      bar + '<div class="ve-body">' + grid + "</div></section>";
  }
  if (block.type === "heading") {
    return done('<div class="section-head"' + box + "><h2" + attr + ce("data.text", "line") + ">" + esc(data.text) + "</h2></div>");
  }
  if (block.type === "text") {
    return done('<div class="lead-frame"' + box + '><div class="lead"' + attr + ce("data.text") + ">" + rich(data.text) + "</div></div>");
  }
  if (block.type === "image") {
    const upload = edit ? ' data-upload="data.src"' : "";
    const altField = edit ? '<label class="ve-alt">替代文字<input data-path="data.alt" data-mode="value" value="' + esc(data.alt || "") + '"></label>' : "";
    const shape = edit ? '<select data-path="data.shape" data-mode="value" data-reload="1"><option value="normal"' + (data.shape !== "circle" ? " selected" : "") + '>一般</option><option value="circle"' + (data.shape === "circle" ? " selected" : "") + ">圓形</option></select>" : "";
    const picture = data.src
      ? '<img class="block-img" src="' + esc(srcOf(data.src)) + '" alt="' + esc(data.alt) + '"' + upload + ">"
      : (edit ? '<button type="button" class="ve-upload" data-upload="data.src">上傳圖片</button>' : "");
    const inner = data.shape === "circle" && data.src
      ? '<div class="portrait">' + picture + "</div>"
      : picture;
    return done('<div class="block-pic"' + box + ">" + inner + "</div>" + altField, shape);
  }
  if (block.type === "slider") {
    const images = data.images || [];
    const html = '<div class="hero-slider" data-slider' + box + ">" + images.map((image, index) => {
      return '<img src="' + esc(srcOf(image.src)) + '" alt="' + esc(image.alt) + '"' + (edit ? ' data-upload="data.images.' + index + '.src"' : "") + (index ? " hidden" : "") + ">";
    }).join("") +
      '<button class="prev" type="button" aria-label="上一張">‹</button>' +
      '<button class="next" type="button" aria-label="下一張">›</button></div>';
    return done(html, edit ? '<button type="button" data-act="add-item" data-kind="slider">新增圖片</button><button type="button" data-act="del-slide">刪除這張</button>' : "");
  }
  if (block.type === "members") {
    const face = '<svg class="member-silhouette" viewBox="0 0 240 260" aria-hidden="true"><ellipse cx="120" cy="108" rx="48" ry="52" fill="#f6d7a8"/><path d="M74 96c10-52 82-52 92 2-20 10-72 10-92-2z" fill="#2b2b2b"/><path d="M86 150h68l6 18H80z" fill="#f7f7f7"/><path d="M108 150h24l6 28h-36z" fill="#3c3c3c"/><path d="M36 260c10-78 158-78 168 0" fill="#2a2a2a"/></svg>';
    const linesOf = (item) => Array.isArray(item.lines) && item.lines.length ? item.lines : [item.org || ""];
    const note = edit ? '<p class="member-note">每一個人下面都有職稱、姓名、經歷。經歷旁邊按＋，會在下一行再加一列。</p>' : "";
    const html = note + '<div class="member-grid"' + box + ">" + (data.items || []).map((item, index) => {
      const remove = edit ? '<button type="button" class="ve-x" data-act="del-item" data-list="items" data-item="' + index + '">刪除</button>' : "";
      const photo = item.src
        ? '<img src="' + esc(srcOf(item.src)) + '" alt=""' + (edit ? ' data-upload="data.items.' + index + '.src"' : "") + ">"
        : face;
      const lines = linesOf(item);
      const visible = edit ? lines : lines.filter((line) => String(line || "").trim());
      const caption = visible.map((line, lineIndex) => '<p class="member-org"' + (edit ? ' data-member-line="' + lineIndex + '"' : "") + ">" + esc(line) + "</p>").join("");
      const base = "data.items." + index;
      const form = edit
        ? '<div class="member-edit" contenteditable="false"><label>職稱<input data-path="' + base + '.role" data-mode="value" value="' + esc(item.role || "") + '"></label><label>姓名<input data-path="' + base + '.name" data-mode="value" value="' + esc(item.name || "") + '"></label>' +
          lines.map((line, lineIndex) => '<div class="exp-row"><label>' + (lineIndex ? "" : "經歷") + '<input data-path="' + base + ".lines." + lineIndex + '" data-mode="value" value="' + esc(line || "") + '"></label><button type="button" data-act="add-line" data-item="' + index + '" data-line="' + lineIndex + '">＋</button></div>').join("") +
          '<button type="button" data-upload="' + base + '.src">上傳照片</button></div>'
        : "";
      return '<article class="member">' + remove + '<div class="portrait">' + photo + '</div><p class="member-name"><b data-member="role">' + esc(item.role || "") + '</b> <b data-member="name">' + esc(item.name || "") + "</b></p>" + caption + form + "</article>";
    }).join("") + "</div>";
    return done(html, edit ? '<button type="button" data-act="add-item" data-kind="members">新增一人</button>' : "");
  }
  if (block.type === "cards") {
    const html = '<div class="cards"' + box + ">" + (data.items || []).map((item, index) => {
      const remove = edit ? '<button type="button" class="ve-x" data-act="del-item" data-list="items" data-item="' + index + '">刪除</button>' : "";
      return '<article class="card">' + remove + '<span class="num">' + String(index + 1).padStart(2, "0") + "</span><h3" + attr + ce("data.items." + index + ".title", "line") + ">" +
        esc(item.title) + "</h3><p" + attr + ce("data.items." + index + ".text") + ">" + esc(item.text) + "</p></article>";
    }).join("") + "</div>";
    return done(html, edit ? '<button type="button" data-act="add-item" data-kind="cards">新增卡片</button>' : "");
  }
  if (block.type === "logos") {
    const html = '<div class="partners"' + box + ">" + (data.items || []).map((item, index) => {
      const remove = edit ? '<button type="button" class="ve-x" data-act="del-item" data-list="items" data-item="' + index + '">刪除</button>' : "";
      const upload = edit ? ' data-upload="data.items.' + index + '.src"' : "";
      return '<article class="partner">' + remove + '<img src="' + esc(srcOf(item.src)) + '" alt="' + esc(item.name) + '"' + upload + "><h3" + attr + ce("data.items." + index + ".name") + ">" +
        esc(item.name).replace(/\n/g, "<br>") + "</h3></article>";
    }).join("") + "</div>";
    return done(html, edit ? '<button type="button" data-act="add-item" data-kind="logos">新增一項</button>' : "");
  }
  if (block.type === "button") {
    const link = edit ? '<label>連結<input data-path="data.href" data-mode="value" value="' + esc(data.href || "") + '"></label>' : "";
    return done('<p style="text-align:center;margin:0"><a class="enter-home-btn" href="' + esc(data.href || "#") + '"' + both + ce("data.text", "line") + ">" + esc(data.text) + "</a></p>", link);
  }
  if (block.type === "paper") {
    return done('<article class="paper"' + box + '><div class="paper-banner"' + attr + ce("data.banner", "line") + ">" + esc(data.banner || "") + '</div><div class="paper-body"' + attr + ce("data.body") + ">" +
      rich(data.body) + "</div></article>");
  }
  if (block.type === "news-list") {
    const cats = site.newsCategories || [];
    const filters = '<div class="filters" data-filter="#newsList"><button class="is-on" type="button" data-cat="all">全部</button>' +
      cats.map((cat) => '<button type="button" data-cat="' + esc(cat.id) + '">' + esc(cat.name) + "</button>").join("") + "</div>";
    const cards = orderedNews(site).map((item) => {
      const cat = cats.find((entry) => entry.id === item.category);
      const photo = item.image
        ? '<img src="' + esc(edit ? srcOf(item.image) : item.image) + '" alt="">'
        : "";
      const link = String(item.link || "").trim();
      const go = link
        ? '<p class="news-url"><a href="' + esc(link) + '" target="_blank" rel="noopener">' + esc(link) + '</a></p><p class="news-go"><a href="' + esc(link) + '" target="_blank" rel="noopener">前往網址</a></p>'
        : "";
      return '<article class="news-card' + (photo ? "" : " no-photo") + '" data-cat="' + esc(item.category) + '">' + photo +
        '<div class="news-body"><div class="meta"><span class="tag">' + esc(cat ? cat.name : item.category) + "</span><span>" + esc(item.date) + "</span></div>" +
        "<h3" + attr + ">" + esc(item.title) + "</h3><p" + attr + ">" + plainRich(item.summary) + "</p>" +
        '<button type="button" class="more" data-news-open>查看內文</button><div class="news-full">' +
        (item.body ? rich(item.body) : "") + go + "</div></div></article>";
    }).join("");
    return done('<div' + box + ">" + filters + '<div class="news-list" id="newsList">' + cards + "</div></div>", edit ? '<span class="ve-note">文章請到左側「最新消息」改</span>' : "");
  }
  if (block.type === "album-list") {
    const cards = orderedAlbums(site).map((album) => {
      const count = (album.photos || []).length;
      const cover = album.cover || (album.photos[0] && album.photos[0].src) || "";
      const when = datedText(album);
      const view = coverView(album);
      return '<a class="album" href="album-' + esc(album.id) + '.html">' +
        '<div class="album-cover" style="' + coverVars(view) + '"><img src="' + esc(edit ? srcOf(cover) : cover) + '" alt=""></div><figcaption><span class="count">' + count + "P</span>" +
        (when ? '<span class="album-date">' + esc(when) + "</span>" : "") + "<h3" + attr + ">" +
        esc(album.title) + "</h3><p" + attr + ">" + esc(album.summary) + "</p></figcaption></a>";
    }).join("");
    return done('<div' + box + '><div class="albums" id="albumGrid">' + cards + "</div></div>", edit ? '<span class="ve-note">照片請到左側「相簿」改</span>' : "");
  }
  if (block.type === "contact") {
    const html = '<div class="contact-grid"' + box + '><form class="form" id="contactForm" data-email="' + esc(site.settings.email) + '">' +
      '<div class="form-row"><div class="field"><label for="name">※ 姓名</label><input id="name" name="name" type="text" maxlength="50"></div>' +
      '<div class="field"><label for="company">公司或單位名稱</label><input id="company" name="company" type="text" maxlength="50"></div></div>' +
      '<div class="form-row"><div class="field"><label for="email">※ 電子信箱</label><input id="email" name="email" type="email" maxlength="60"></div>' +
      '<div class="field"><label for="tel">※ 聯絡電話</label><input id="tel" name="tel" type="tel" maxlength="32"></div></div>' +
      '<div class="form-row"><div class="field"><label for="address">聯絡地址</label><input id="address" name="address" type="text"></div>' +
      '<div class="field"><label for="subject">※ 項目主旨</label><input id="subject" name="subject" type="text" maxlength="60"></div></div>' +
      '<div class="field"><label for="message">※ 洽詢內容</label><textarea id="message" name="message" rows="7"></textarea></div>' +
      '<div class="form-actions"><button class="send" type="submit">送出</button><button class="reset" type="reset">清除</button></div>' +
      '<p class="form-note" role="status"></p></form>' +
      '<aside class="people"><h2' + attr + ce("data.asideTitle", "line") + ">" + esc(data.asideTitle || site.settings.siteName) + "</h2>" +
      '<div' + ce("data.aside") + ">" + rich(data.aside) + "</div></aside></div>";
    return done(html);
  }
  if (block.type === "map") {
    const query = data.query || site.settings.mapQuery || site.settings.address || "";
    const field = edit ? '<label class="ve-alt">地圖關鍵字<input data-path="data.query" data-mode="value" data-reload="1" value="' + esc(query) + '"></label>' : "";
    return done('<iframe class="map" title="地圖" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=' +
      encodeURIComponent(query) + '&output=embed"' + box + "></iframe>" + field);
  }
  return "";
}

function pageTitle(page) {
  const text = textCss(page.titleStyle);
  const space = boxCss(page.titleStyle);
  return '<div class="page-title"' + (space ? ' style="' + esc(space) + '"' : "") + "><h1" + (text ? ' style="' + esc(text) + '"' : "") + ">" + esc(page.title) +
    (page.en ? "<span>" + esc(page.en) + "</span>" : "") + "</h1></div>";
}

function shell(site, page, bodyClass, main, options) {
  const s = site.settings;
  const footer = options && options.footer === false ? "" : "\n" + footerHtml(site);
  const top = options && options.footer === false ? "" : "\n<button class=\"to-top\" type=\"button\" aria-label=\"回到頂端\">↑</button>";
  return "<!DOCTYPE html>\n<html lang=\"zh-Hant\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<title>" +
    esc(page.slug === "index" ? s.siteName : page.title + " | " + s.siteName) +
    "</title>\n<link rel=\"stylesheet\" href=\"css/style.css?v=exp5\">\n</head>\n<body class=\"" + bodyClass + "\">\n" +
    headerHtml(site, page) + "\n" + main + footer + top +
    "\n<script src=\"js/main.js\"></script>\n</body>\n</html>\n";
}

function captionText(data) {
  if (data.caption) return String(data.caption);
  return [data.title, data.subtitle, data.copyright].filter(Boolean).join("\n");
}

function placeRule(block, index) {
  if (!block) return "";
  if (block.type === "cover") {
    const data = block.data || {};
    const mobile = (block.mobile && block.mobile.data) || {};
    const x = num(data.x, 50);
    const y = num(data.y, 111);
    return "#cfcaption{left:" + x + "%;top:" + y + "%}@media(max-width:640px){#cfcaption{left:" + num(mobile.x, x) + "% !important;top:" + num(mobile.y, y) + "% !important}}";
  }
  const data = block.data || {};
  const mobile = (block.mobile && block.mobile.data) || {};
  const x = num(data.x, 50);
  const y = num(data.y, 96);
  const id = floatId(block, index);
  return "#" + id + "{left:" + x + "%;top:" + y + "%}@media(max-width:640px){#" + id + "{left:" + num(mobile.x, x) + "% !important;top:" + num(mobile.y, y) + "% !important}}";
}

function coverButtonLayer(block, index, edit) {
  const data = block.data || {};
  const id = floatId(block, index);
  const pos = "left:" + num(data.x, 50) + "%;top:" + num(data.y, 96) + "%";
  const css = styleCss(block.style);
  const link = '<div class="enter-home-wrap"><a class="enter-home-btn" draggable="false" href="' + esc(data.href || "about.html") + '"' +
    (css ? ' style="' + esc(css) + '"' : "") +
    (edit ? ' data-styled="1" data-box="1" contenteditable="true" spellcheck="false" data-path="data.text" data-mode="line"' : "") + ">" +
    esc(data.text || "進入主頁") + "</a></div>";
  if (!edit) return '<div class="cover-float" id="' + id + '" style="' + pos + '">' + link + "</div>";
  const extra = '<label>連結<input data-path="data.href" data-mode="value" value="' + esc(data.href || "") + '"></label><button type="button" data-center>置中</button>';
  return '<div class="cover-float ve-block" data-drag="1" id="' + id + '" data-index="' + index + '" data-type="button" data-style="' + esc(JSON.stringify(block.style || {})) + '" style="' + pos + '">' +
    '<div class="float-tools" contenteditable="false"><button type="button" class="drag-handle" data-center>置中</button></div>' +
    editBar(block, extra) + link + "</div>";
}

function coverPiece(site, block, index, edit) {
  const data = block.data || {};
  const id = floatId(block, index);
  const pos = "left:" + num(data.x, 50) + "%;top:" + num(data.y, 50) + "%";
  const inner = blockHtml(site, block, edit ? index : undefined);
  if (!edit) return '<div class="cover-float cover-piece" id="' + id + '" style="' + pos + '">' + inner + "</div>";
  return '<div class="cover-float cover-piece" data-drag="1" id="' + id + '" data-index="' + index + '" data-type="' + esc(block.type) + '" style="' + pos + '">' +
    '<div class="float-tools" contenteditable="false"><button type="button" class="drag-handle" data-drag-handle>拖移</button><button type="button" class="drag-handle" data-center>置中</button></div>' +
    inner + "</div>";
}

function coverMain(site, page, edit, device) {
  const blocks = page.blocks || [];
  const view = (block) => useBlock(block, device || "desktop");
  const coverIndex = blocks.findIndex((block) => block.type === "cover");
  const cover = view(coverIndex >= 0 ? blocks[coverIndex] : { data: {}, style: {} });
  const data = cover.data || {};
  const buttons = [];
  const rest = [];
  blocks.forEach((block, index) => {
    if (block.type === "cover") return;
    const shown = view(block);
    if (block.type === "button") buttons.push(coverButtonLayer(shown, index, edit));
    else rest.push(coverPiece(site, shown, index, edit));
  });
  if (!buttons.length) {
    buttons.push(coverButtonLayer({
      id: "enter",
      type: "button",
      style: {},
      data: { text: data.buttonText || "進入主頁", href: data.buttonHref || "about.html", x: 50, y: 96 }
    }, "enter", edit));
  }
  const text = captionText(data);
  const pos = "left:" + num(data.x, 50) + "%;top:" + num(data.y, 111) + "%" + (boxCss(cover.style) ? ";" + boxCss(cover.style) : "");
  const textStyle = textCss(cover.style);
  const caption = '<div class="cover-caption-text"' + (textStyle ? ' style="' + esc(textStyle) + '"' : "") +
    (edit ? ' data-styled="1" contenteditable="true" spellcheck="false" data-path="data.caption"' : "") + ">" +
    esc(text).replace(/\n/g, "<br>") + "</div>";
  const bar = edit && coverIndex >= 0 ? editBar(cover, '<button type="button" data-center>置中</button><button type="button" data-upload-btn="data.background">換電腦版封面</button><button type="button" data-upload-btn="data.backgroundMobile">換手機版封面</button>') : "";
  const foot = '<div class="cover-float cover-caption' + (edit ? " ve-block" : "") + '" id="cfcaption"' +
    (edit ? ' data-drag="1" data-box="1" data-index="' + coverIndex + '" data-type="cover" data-style="' + esc(JSON.stringify(cover.style || {})) + '"' : "") +
    ' style="' + esc(pos) + '">' +
    (edit ? '<div class="float-tools" contenteditable="false"><button type="button" class="drag-handle" data-drag-handle>拖移</button><button type="button" class="drag-handle" data-center>置中</button></div>' : "") +
    bar + caption + "</div>";
  return {
    main: '<div class="cover-art"><main class="cover-stage">' + rest.join("\n") + "</main>\n" + buttons.join("\n") + "\n" + foot + "</div>",
    rules: blocks.map((block, index) => placeRule(block, index)).join(""),
    data
  };
}

function renderPage(site, page) {
  if (page.layout === "cover") {
    const built = coverMain(site, page, false, "desktop");
    const data = built.data;
    const bg = esc(data.background || "images/cover-desktop.png");
    const mobile = esc(data.backgroundMobile || data.background || "images/cover-mobile.png");
    let html = shell(site, page, "cover", built.main, { footer: false });
    html = html.replace("</head>", "<style>.cover-art{background-image:url(\"" + bg + "\") !important}@media(max-width:640px){.cover-art{background-image:url(\"" + mobile + "\") !important;top:16%;width:min(100vw,460px);aspect-ratio:1080/1920;transform:translate(-50%,-16%)}}" + built.rules + "</style>\n</head>");
    return html;
  }
  const inner = (page.blocks || []).map((block) => blockHtml(site, block)).join("\n");
  const wrapped = page.layout === "panel"
    ? '<article class="paper"><div class="paper-banner">' + esc(page.title) + "</div><div class=\"paper-body\">" + inner + "</div></article>"
    : inner;
  const main = '<main class="page">' + pageTitle(page) + '<p class="crumb">' + crumb(site, page) + "</p>" + wrapped + "</main>";
  return shell(site, page, "", main);
}

function renderArticle(site, item) {
  const cat = (site.newsCategories || []).find((entry) => entry.id === item.category);
  const page = { slug: "news-" + item.id, title: item.title, en: "", parentId: "", showInNav: false, blocks: [] };
  const newsPage = site.pages.find((entry) => (entry.blocks || []).some((block) => block.type === "news-list"));
  const main = '<main class="page"><div class="page-title"><h1>最新消息<span>News</span></h1>' +
    '<p class="crumb"><a href="index.html">首頁</a> &gt; <a href="' + esc(newsPage ? hrefFor(newsPage) : "news.html") + '">最新消息</a> &gt; ' + esc(cat ? cat.name : "") + "</p></div>" +
    '<article class="article">' + (item.image ? '<img src="' + esc(item.image) + '" alt="">' : "") + '<div class="article-body"><div class="meta"><span class="tag">' +
    esc(cat ? cat.name : "") + "</span><span>" + esc(item.date) + "</span></div><h2>" + esc(item.title) + "</h2>" +
    rich(item.body || item.summary) + (item.link ? '<p class="news-url"><a href="' + esc(item.link) + '" target="_blank" rel="noopener">' + esc(item.link) + '</a></p><p class="news-go"><a href="' + esc(item.link) + '" target="_blank" rel="noopener">前往網址</a></p>' : "") + '<p><a class="more" href="' + esc(newsPage ? hrefFor(newsPage) : "news.html") + '">返回最新消息</a></p></div></article></main>';
  return shell(site, page, "", main);
}

function renderAlbum(site, album) {
  const page = { slug: "album-" + album.id, title: album.title, en: "", showInNav: false, blocks: [] };
  const eventsPage = site.pages.find((entry) => (entry.blocks || []).some((block) => block.type === "album-list"));
  const photos = (album.photos || []).map((photo) => {
    return '<a class="js-photo" href="' + esc(photo.src) + '"><img src="' + esc(photo.src) + '" alt=""></a>';
  }).join("");
  const when = datedText(album);
  const main = '<main class="page"><div class="page-title"><h1>' + esc(album.title) + "</h1>" +
    '<p class="crumb"><a href="index.html">首頁</a> &gt; <a href="' + esc(eventsPage ? hrefFor(eventsPage) : "events.html") + '">活動花絮</a> &gt; ' + esc(album.title) + "</p></div>" +
    (when ? '<p class="meta"><span>' + esc(when) + "</span></p>" : "") +
    "<p class=\"lead\">" + esc(album.summary) + "</p>" +
    '<div class="photo-grid">' + photos + "</div></main>" +
    '<div class="lightbox"><button type="button" aria-label="關閉">×</button><img alt=""></div>';
  return shell(site, page, "", main);
}

function generate(site, root) {
  const manifestPath = path.join(root, "data", ".generated.json");
  const previous = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : [];
  const written = [];
  for (const page of site.pages) {
    const name = fileFor(page);
    fs.writeFileSync(path.join(root, name), renderPage(site, page), "utf8");
    written.push(name);
  }
  for (const item of site.news || []) {
    const name = "news-" + item.id + ".html";
    fs.writeFileSync(path.join(root, name), renderArticle(site, item), "utf8");
    written.push(name);
  }
  for (const album of site.albums || []) {
    const name = "album-" + album.id + ".html";
    fs.writeFileSync(path.join(root, name), renderAlbum(site, album), "utf8");
    written.push(name);
  }
  const stale = new Set(previous);
  for (const name of fs.readdirSync(root)) {
    if (/^(news|album|article)-.+\.html$/.test(name)) stale.add(name);
  }
  for (const name of stale) {
    if (written.includes(name)) continue;
    if (!/^[a-z0-9-]+\.html$/i.test(name)) continue;
    const full = path.join(root, name);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  }
  fs.writeFileSync(manifestPath, JSON.stringify(written, null, 2));
  return written;
}

function previewTitle(page) {
  const text = textCss(page.titleStyle);
  const space = boxCss(page.titleStyle);
  return '<div class="page-title ve-block" data-scope="page" data-box="1" data-style="' + esc(JSON.stringify(page.titleStyle || {})) + '"' +
    (space ? ' style="' + esc(space) + '"' : "") + ">" +
    editBar({ type: "title", style: page.titleStyle }, "") .replace('<button type="button" data-act="up">上移</button><button type="button" data-act="down">下移</button><button type="button" data-act="del">刪除</button>', "") +
    '<h1' + (text ? ' style="' + esc(text) + '"' : "") + ' data-styled="1"><span class="ve-title" contenteditable="true" spellcheck="false" data-scope="page" data-path="title" data-mode="line">' + esc(page.title) +
    '</span><span class="ve-en" contenteditable="true" spellcheck="false" data-scope="page" data-path="en" data-mode="line">' + esc(page.en || "") + "</span></h1></div>";
}

function previewDocument(site, page, device) {
  const types = [
    ["heading", "標題"], ["text", "文字"], ["image", "圖片"], ["row", "橫排"], ["slider", "圖片輪播"], ["members", "人物"], ["cards", "卡片"],
    ["logos", "圖文格"], ["button", "按鈕"], ["paper", "長文區塊"], ["news-list", "最新消息列表"],
    ["album-list", "相簿列表"], ["contact", "聯絡表單"], ["map", "地圖"], ["cover", "封面"]
  ];
  const addBar = '<div class="ve-add" contenteditable="false"><select id="veType">' +
    types.map(([id, name]) => '<option value="' + id + '">' + name + "</option>").join("") +
    '</select><button type="button" id="veAdd">增加區塊</button></div>';
  const mode = device === "mobile" ? "mobile" : "desktop";
  let main = "";
  let bodyClass = "";
  let headExtra = "";
  if (page.layout === "cover") {
    const built = coverMain(site, page, true, mode);
    main = built.main;
    bodyClass = "cover";
    const picture = mode === "mobile"
      ? built.data.backgroundMobile || built.data.background || "images/cover-mobile.png"
      : built.data.background || "images/cover-desktop.png";
    headExtra = "<style>html,body.cover{height:100%}body.cover{min-height:100%;background-image:none !important}.cover-art{background-image:url(\"" + esc(abs(picture)) + "\") !important;background-size:100% 100% !important}</style>";
  } else {
    const shownPage = mode === "mobile" && page.mobileTitleStyle
      ? Object.assign({}, page, { titleStyle: Object.assign({}, page.titleStyle, page.mobileTitleStyle) })
      : page;
    const inner = (page.blocks || []).map((block, index) => blockHtml(site, useBlock(block, mode), index, undefined, mode)).join("\n");
    const wrapped = page.layout === "panel"
      ? '<article class="paper"><div class="paper-banner" contenteditable="true" spellcheck="false" data-scope="page" data-path="title" data-mode="line">' + esc(shownPage.title) + "</div><div class=\"paper-body\">" + inner + "</div></article>"
      : inner;
    main = '<main class="page">' + previewTitle(shownPage) + '<p class="crumb">' + crumb(site, page) + "</p>" + wrapped + "</main>";
  }
  const s = site.settings;
  return "<!DOCTYPE html>\n<html lang=\"zh-Hant\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<title>" +
    esc(page.title || s.siteName) + "</title>\n<link rel=\"stylesheet\" href=\"/css/style.css?v=exp5\">\n<link rel=\"stylesheet\" href=\"/admin/visual.css?v=exp3\">\n" +
    headExtra + "</head>\n<body class=\"" + bodyClass + "\">\n" +
    headerHtml(site, page, true) + "\n" + main +
    (page.layout === "cover" ? "" : "\n" + footerHtml(site, true)) +
    (page.layout === "cover" ? "" : "\n" + addBar) +
    "\n<script src=\"/js/main.js\"></script>\n<script src=\"/admin/visual.js?v=exp3\"></script>\n</body>\n</html>\n";
}

module.exports = { generate, previewDocument };
