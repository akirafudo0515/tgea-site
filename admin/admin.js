(function () {
  const TYPES = [
    ["heading", "標題"],
    ["text", "文字"],
    ["image", "圖片"],
    ["row", "橫排"],
    ["slider", "圖片輪播"],
    ["members", "人物"],
    ["cards", "卡片"],
    ["logos", "圖文格"],
    ["button", "按鈕"],
    ["paper", "長文區塊"],
    ["news-list", "最新消息列表"],
    ["album-list", "相簿列表"],
    ["contact", "聯絡表單"],
    ["map", "地圖"],
    ["cover", "封面"]
  ];
  const FONTS = [
    ["Microsoft JhengHei, sans-serif", "微軟正黑體"],
    ["PMingLiU, serif", "新細明體"],
    ["DFKai-SB, serif", "標楷體"],
    ["Arial, sans-serif", "Arial"],
    ["Georgia, serif", "Georgia"]
  ];
  const WEIGHTS = [
    ["400", "一般"],
    ["600", "中粗"],
    ["700", "粗體"],
    ["900", "特粗"]
  ];

  let site = null;
  let tab = "pages";
  let pageId = "index";
  let albumId = "";
  let newsId = "";
  let dirty = false;
  let device = "desktop";

  const $ = (sel) => document.querySelector(sel);
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));

  function uid(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  }

  async function api(url, options) {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "操作失敗");
    return data;
  }

  function dateInputValue(text) {
    const match = String(text || "").match(/(\d{2,4})[./-](\d{1,2})[./-](\d{1,2})/);
    if (!match) return "";
    let year = Number(match[1]);
    if (year < 1911) year += 1911;
    return year + "-" + String(match[2]).padStart(2, "0") + "-" + String(match[3]).padStart(2, "0");
  }

  function dateDisplayValue(iso) {
    const match = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return iso || "";
    return Number(match[1]) + "/" + Number(match[2]) + "/" + Number(match[3]);
  }

  function fieldValue(target) {
    if (target.type === "checkbox") return target.checked;
    if (target.type === "date") return dateDisplayValue(target.value);
    return target.value;
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

  let crop = null;

  function paintCrop() {
    const frame = $("#cropFrame");
    if (!frame || !crop) return;
    frame.style.setProperty("--cx", crop.x + "%");
    frame.style.setProperty("--cy", crop.y + "%");
    frame.style.setProperty("--zoom", String(crop.zoom));
  }

  function openCrop(src, view) {
    crop = { src, x: view.x, y: view.y, zoom: view.zoom };
    const img = $("#cropImg");
    img.src = "/" + String(src).replace(/^\//, "");
    $("#cropZoom").value = String(view.zoom);
    paintCrop();
    $("#cropper").hidden = false;
  }

  function albumDateText(item) {
    return item && item.date ? String(item.date) : "";
  }

  function orderedAlbums() {
    const items = (site.albums || []).map((item, index) => ({ item, index }));
    if (site.settings && site.settings.albumSort === "manual") return items.map((entry) => entry.item);
    return items.sort((a, b) => newsTime({ date: albumDateText(b.item) }) - newsTime({ date: albumDateText(a.item) }) || a.index - b.index).map((entry) => entry.item);
  }

  function moveAlbum(dir) {
    const list = orderedAlbums();
    const index = list.findIndex((item) => item.id === albumId);
    const next = index + dir;
    if (index < 0 || next < 0 || next >= list.length) return;
    const moved = list[index];
    list[index] = list[next];
    list[next] = moved;
    site.albums = list;
    site.settings.albumSort = "manual";
    dirty = true;
    render();
  }

  function newsTime(item) {
    const match = String(item.date || "").match(/(\d{2,4})[./-](\d{1,2})[./-](\d{1,2})/);
    if (!match) return 0;
    let year = Number(match[1]);
    if (year < 1911) year += 1911;
    const time = new Date(year, Number(match[2]) - 1, Number(match[3])).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  function orderedNews() {
    const items = (site.news || []).map((item, index) => ({ item, index }));
    if (site.settings && site.settings.newsSort === "manual") return items.map((entry) => entry.item);
    return items.sort((a, b) => newsTime(b.item) - newsTime(a.item) || a.index - b.index).map((entry) => entry.item);
  }

  function moveNews(dir) {
    const list = orderedNews();
    const index = list.findIndex((item) => item.id === newsId);
    const next = index + dir;
    if (index < 0 || next < 0 || next >= list.length) return;
    const moved = list[index];
    list[index] = list[next];
    list[next] = moved;
    site.news = list;
    site.settings.newsSort = "manual";
    dirty = true;
    render();
  }

  function setPath(path, value) {
    const parts = path.split(".");
    let cur = site;
    for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
    cur[parts[parts.length - 1]] = value;
    dirty = true;
  }

  function styleDefaults(kind) {
    const font = "Microsoft JhengHei, sans-serif";
    const map = {
      title: ["30", "600"],
      heading: ["28", "700"],
      text: ["18", "400"],
      cover: ["15", "700"],
      button: ["18", "700"],
      cards: ["18", "400"],
      logos: ["16", "400"],
      "news-list": ["20", "400"],
      "album-list": ["17", "400"],
      contact: ["16", "700"]
    };
    const pair = map[kind] || ["16", "400"];
    return { fontFamily: font, fontSize: pair[0], fontWeight: pair[1] };
  }

  function styleBox(prefix, style, kind) {
    const s = style || {};
    const base = styleDefaults(kind);
    const fontFamily = s.fontFamily || base.fontFamily;
    const fontSize = s.fontSize || base.fontSize;
    const fontWeight = String(s.fontWeight || base.fontWeight);
    const fonts = FONTS.map(([value, label]) => '<option value="' + esc(value) + '"' + (fontFamily === value ? " selected" : "") + ">" + label + "</option>").join("");
    const weight = WEIGHTS.map(([value, label]) => {
      return '<option value="' + value + '"' + (fontWeight === value ? " selected" : "") + ">" + label + "</option>";
    }).join("");
    const align = ["", "left", "center", "right"].map((value) => {
      const label = { "": "預設", left: "靠左", center: "置中", right: "靠右" }[value];
      return '<option value="' + value + '"' + ((s.textAlign || "") === value ? " selected" : "") + ">" + label + "</option>";
    }).join("");
    return '<div class="style-grid">' +
      '<label>字體<select data-bind="' + prefix + '.fontFamily">' + fonts + "</select></label>" +
      '<label>大小<input data-bind="' + prefix + '.fontSize" type="number" min="12" max="96" value="' + esc(fontSize) + '"></label>' +
      '<label>粗細<select data-bind="' + prefix + '.fontWeight">' + weight + "</select></label>" +
      '<label>對齊<select data-bind="' + prefix + '.textAlign">' + align + "</select></label>" +
      '<label>文字顏色<input data-bind="' + prefix + '.color" type="text" value="' + esc(s.color || "") + '" placeholder="#333333"><input type="color" data-pick="' + prefix + '.color" value="' + esc(s.color || "#333333") + '"></label>' +
      '<label>底色<input data-bind="' + prefix + '.background" type="text" value="' + esc(s.background || "") + '" placeholder="透明"><input type="color" data-pick="' + prefix + '.background" value="' + esc(s.background || "#ffffff") + '"></label>' +
      "</div>";
  }

  function imageField(prefix, src) {
    return '<div class="item-head"><div>' + (src ? '<img class="thumb" src="/' + esc(src) + '" alt="">' : "<span class=\"hint\">尚未上傳</span>") +
      '</div><label class="ghost-btn">上傳圖片<input data-upload="' + prefix + '" type="file" accept="image/*" hidden></label></div>';
  }

  function newBlock(type) {
    if (type === "row") {
      return { id: uid("b"), type: "row", style: {}, data: { count: 3, cells: [newBlock("text"), newBlock("image"), newBlock("text")] } };
    }
    const data = {
      heading: { text: "新標題" },
      text: { text: "在這裡輸入文字" },
      image: { src: "", alt: "", shape: "normal" },
      slider: { images: [{ src: "", alt: "" }] },
      members: { items: [{ role: "職稱", name: "姓名", lines: ["XXX"], src: "" }] },
      cards: { items: [{ title: "標題", text: "說明" }] },
      logos: { items: [{ src: "", name: "名稱" }] },
      button: { text: "看更多", href: "about.html" },
      paper: { banner: "標題", body: "內文" },
      "news-list": {},
      "album-list": {},
      contact: { asideTitle: "聯絡資訊", aside: "" },
      map: { query: site.settings.mapQuery || "" },
      cover: { background: "", backgroundMobile: "", buttonText: "進入主頁", buttonHref: "about.html", title: site.settings.siteName, subtitle: site.settings.englishName, copyright: "" }
    }[type] || {};
    return { id: uid("b"), type, style: {}, data };
  }

  function blockFields(block, path) {
    const d = block.data || {};
    const p = path + ".data";
    if (block.type === "heading") return '<label>標題<input data-bind="' + p + '.text" value="' + esc(d.text) + '"></label>';
    if (block.type === "text" || block.type === "paper") {
      const banner = block.type === "paper" ? '<label>橫幅標題<input data-bind="' + p + '.banner" value="' + esc(d.banner) + '"></label>' : "";
      const key = block.type === "paper" ? "body" : "text";
      return banner + '<label>內容<textarea data-bind="' + p + "." + key + '">' + esc(d[key]) + "</textarea></label>";
    }
    if (block.type === "image") {
      return imageField(p + ".src", d.src) +
        '<label>替代文字<input data-bind="' + p + '.alt" value="' + esc(d.alt) + '"></label>' +
        '<label>形狀<select data-bind="' + p + '.shape"><option value="normal"' + (d.shape !== "circle" ? " selected" : "") + '>一般</option><option value="circle"' + (d.shape === "circle" ? " selected" : "") + ">圓形</option></select></label>";
    }
    if (block.type === "button") {
      return '<div class="row"><label>文字<input data-bind="' + p + '.text" value="' + esc(d.text) + '"></label><label>連結<input data-bind="' + p + '.href" value="' + esc(d.href) + '"></label></div>';
    }
    if (block.type === "cover") {
      return imageField(p + ".background", d.background) + '<p class="hint">上面是電腦版封面，下面是手機版封面。</p>' +
        imageField(p + ".backgroundMobile", d.backgroundMobile) +
        '<div class="row"><label>按鈕文字<input data-bind="' + p + '.buttonText" value="' + esc(d.buttonText) + '"></label><label>按鈕連結<input data-bind="' + p + '.buttonHref" value="' + esc(d.buttonHref) + '"></label></div>' +
        '<label>主標題<input data-bind="' + p + '.title" value="' + esc(d.title) + '"></label>' +
        '<label>英文名<input data-bind="' + p + '.subtitle" value="' + esc(d.subtitle) + '"></label>' +
        '<label>版權列<input data-bind="' + p + '.copyright" value="' + esc(d.copyright) + '"></label>';
    }
    if (block.type === "map") return '<label>地圖關鍵字<input data-bind="' + p + '.query" value="' + esc(d.query) + '"></label>';
    if (block.type === "contact") {
      return '<label>側欄標題<input data-bind="' + p + '.asideTitle" value="' + esc(d.asideTitle) + '"></label><label>側欄內容<textarea data-bind="' + p + '.aside">' + esc(d.aside) + "</textarea></label>";
    }
    if (block.type === "news-list" || block.type === "album-list") {
      return '<p class="hint">這個區塊會自動帶出' + (block.type === "news-list" ? "最新消息" : "相簿") + "。請到左側對應選單新增或修改內容。</p>";
    }
    if (block.type === "cards" || block.type === "logos" || block.type === "slider") {
      const key = block.type === "slider" ? "images" : "items";
      const list = d[key] || [];
      return list.map((item, index) => {
        const base = p + "." + key + "." + index;
        let inner = "";
        if (block.type === "cards") {
          inner = '<label>標題<input data-bind="' + base + '.title" value="' + esc(item.title) + '"></label><label>說明<textarea data-bind="' + base + '.text">' + esc(item.text) + "</textarea></label>";
        } else if (block.type === "logos") {
          inner = imageField(base + ".src", item.src) + '<label>名稱<textarea data-bind="' + base + '.name">' + esc(item.name) + "</textarea></label>";
        } else {
          inner = imageField(base + ".src", item.src) + '<label>說明<input data-bind="' + base + '.alt" value="' + esc(item.alt) + '"></label>';
        }
        return '<div class="block"><div class="item-head"><strong>項目 ' + (index + 1) + '</strong><span class="mini"><button type="button" data-move-item="' + path + "." + key + "." + index + '" data-dir="-1">上移</button><button type="button" data-move-item="' + path + "." + key + "." + index + '" data-dir="1">下移</button><button type="button" class="danger" data-del-item="' + path + "." + key + "." + index + '">刪除</button></span></div>' + inner + "</div>";
      }).join("") + '<button type="button" class="ghost-btn" data-add-item="' + path + "." + key + '" data-kind="' + block.type + '">新增一項</button>';
    }
    return "";
  }

  function pageRows() {
    const rows = [];
    site.pages.forEach((page) => {
      if (page.parentId && site.pages.some((item) => item.id === page.parentId && !item.parentId)) return;
      rows.push({ page, depth: 0 });
      site.pages.filter((child) => child.parentId === page.id).forEach((child) => rows.push({ page: child, depth: 1 }));
    });
    return rows;
  }

  function renderPages() {
    const index = Math.max(0, site.pages.findIndex((page) => page.id === pageId));
    pageId = site.pages[index].id;
    const page = site.pages[index];
    const base = "pages." + index;
    const tops = site.pages.filter((item) => !item.parentId);
    const list = pageRows().map((row) => {
      const item = row.page;
      let nest = "";
      if (row.depth === 1) nest = '<button type="button" class="nest" data-outdent="' + esc(item.id) + '" title="回到主選單">↖</button>';
      else if (item.slug !== "index" && tops.findIndex((top) => top.id === item.id) > 0) nest = '<button type="button" class="nest" data-indent="' + esc(item.id) + '" title="放到上面那一頁裡面">↳</button>';
      return '<div class="page-row depth-' + row.depth + '" data-row="' + esc(item.id) + '"><span class="grip" draggable="true" data-drag-page="' + esc(item.id) + '" title="上下拖改順序，拖到右半邊放進這一頁底下">⠿</span><button type="button" class="item' + (item.id === page.id ? " is-on" : "") + '" data-page="' + esc(item.id) + '">' + esc(item.title) + "</button>" + nest + "</div>";
    }).join("") + '<button type="button" class="item" id="addPage">＋ 新增分頁</button>';
    const types = TYPES.map(([id, name]) => '<option value="' + id + '">' + name + "</option>").join("");
    return '<div class="stage"><div class="list page-list">' + list + '</div><div class="stage-main' + (page.layout === "cover" ? " is-cover" : "") + (device === "mobile" ? " is-phone" : "") + '"><div class="page-meta">' +
      '<div class="device-switch"><button type="button" id="deviceDesktop" class="' + (device === "desktop" ? "is-on" : "") + '">電腦</button><button type="button" id="deviceMobile" class="' + (device === "mobile" ? "is-on" : "") + '">手機</button><button type="button" id="deviceSync">同步</button></div>' +
      '<label>選單名稱<input data-bind="' + base + '.navLabel" value="' + esc(page.navLabel || "") + '"></label>' +
      '<label>網址<input data-bind="' + base + '.slug" value="' + esc(page.slug) + '"' + (page.slug === "index" ? " readonly" : "") + "></label>" +
      '<label>版型<select data-bind="' + base + '.layout"><option value="inner"' + (page.layout === "inner" ? " selected" : "") + '>一般內頁</option><option value="panel"' + (page.layout === "panel" ? " selected" : "") + '>卡片內頁</option><option value="cover"' + (page.layout === "cover" ? " selected" : "") + ">封面</option></select></label>" +
      '<label class="check"><input data-bind="' + base + '.showInNav" type="checkbox"' + (page.showInNav ? " checked" : "") + ">顯示在選單</label>" +
      '<label>增加區塊<select id="newType">' + types + '</select></label><button type="button" class="primary" id="addBlock">增加區塊</button>' +
      (page.slug === "index" ? "" : '<button type="button" class="ghost-btn danger" id="delPage">刪除這個分頁</button>') +
      '<p class="hint">拖左邊的把手可以改順序。拖到某一頁的右半邊，會放進那一頁底下；封面不能放進別的分頁。增加「橫排」可以在同一排放 2、3 或 4 個區塊，每一格可以各自換成標題、文字、圖片或按鈕。電腦／手機可分開改，按同步會讓兩邊變成一樣。</p></div><iframe id="preview" title="分頁畫面"></iframe></div></div>';
  }

  function renderAlbums() {
    if (!site.albums.length) albumId = "";
    if (albumId && !site.albums.some((album) => album.id === albumId)) albumId = site.albums[0] ? site.albums[0].id : "";
    const index = site.albums.findIndex((album) => album.id === albumId);
    const album = index >= 0 ? site.albums[index] : null;
    const list = '<div class="list">' + orderedAlbums().map((item) => '<button type="button" class="item' + (item.id === albumId ? " is-on" : "") + '" data-album="' + esc(item.id) + '">' + esc((albumDateText(item) || "未填日期") + "　" + item.title) + "</button>").join("") + '<button type="button" class="item" id="addAlbum">＋ 新增相簿</button></div>';
    if (!album) return '<div class="split">' + list + '<div class="panel"><p>還沒有相簿。</p></div></div>';
    const base = "albums." + index;
    const photos = (album.photos || []).map((photo, photoIndex) => {
      const cover = album.cover === photo.src ? " is-cover" : "";
      return '<article class="photo' + cover + '"><img src="/' + esc(photo.src) + '" alt=""><div class="mini"><button type="button" data-cover="' + photoIndex + '">設為封面</button><label class="ghost-btn">換圖<input data-replace="' + photoIndex + '" type="file" accept="image/*" hidden></label><button type="button" class="danger" data-del-photo="' + photoIndex + '">刪除</button></div></article>';
    }).join("");
    const mode = site.settings.albumSort === "manual" ? "目前用你排的順序。" : "目前依日期排列，越新越上面。";
    return '<div class="split">' + list + '<div class="editor"><section class="panel"><h2>相簿</h2><p class="hint">' + mode + '日期只看你選的日期，跟名稱無關。改完要按右上角「儲存並更新網站」。</p><label>名稱<input data-bind="' + base + '.title" value="' + esc(album.title) + '"></label><div class="row"><label>日期<input data-bind="' + base + '.date" type="date" value="' + esc(dateInputValue(albumDateText(album))) + '"></label></div><label>簡介<textarea data-bind="' + base + '.summary">' + esc(album.summary) + '</textarea></label><p class="hint">目前封面。點封面，或按「裁切封面」，就可以拖曳、放大。</p>' + (album.cover ? '<div class="cover-preview" id="cropCover" style="' + coverVars(coverView(album)) + '" title="點這裡裁切封面"><img src="/' + esc(album.cover) + '" alt=""></div><button type="button" class="primary" id="cropCoverBtn">裁切封面</button>' : '<p class="hint">先上傳封面，或在下面照片按「設為封面」。</p>') + '<div class="mini"><label class="ghost-btn">上傳封面<input id="coverFile" type="file" accept="image/*" hidden></label><label class="ghost-btn">一次上傳多張照片<input id="photoFiles" type="file" accept="image/*" multiple hidden></label><button type="button" id="albumUp">上移</button><button type="button" id="albumDown">下移</button><button type="button" id="albumByDate">依日期排序</button><button type="button" class="ghost-btn danger" id="delAlbum">刪除相簿</button></div></section><section class="panel"><h2>照片</h2><div class="photos">' + photos + "</div></section></div></div>";
  }

  function renderNews() {
    if (newsId && !site.news.some((item) => item.id === newsId)) newsId = site.news[0] ? site.news[0].id : "";
    if (!newsId && site.news[0]) newsId = site.news[0].id;
    const index = site.news.findIndex((item) => item.id === newsId);
    const item = index >= 0 ? site.news[index] : null;
    const list = '<div class="list">' + orderedNews().map((entry) => '<button type="button" class="item' + (entry.id === newsId ? " is-on" : "") + '" data-news="' + esc(entry.id) + '">' + esc((entry.date || "未填日期") + "　" + entry.title) + "</button>").join("") + '<button type="button" class="item" id="addNews">＋ 新增消息</button></div>';
    if (!item) return '<div class="split">' + list + '<div class="panel"><p>還沒有消息。</p></div></div>';
    const base = "news." + index;
    const cats = site.newsCategories.map((cat) => '<option value="' + esc(cat.id) + '"' + (item.category === cat.id ? " selected" : "") + ">" + esc(cat.name) + "</option>").join("");
    const mode = site.settings.newsSort === "manual" ? "目前用你排的順序。" : "目前依日期排列，越新越上面。";
    return '<div class="split">' + list + '<div class="editor"><section class="panel"><h2>消息</h2><p class="hint">' + mode + '換行會照你打的換行顯示。按查看內文會展開內文；內文裡的網址可以點。網址有填，展開後會先顯示網址，底下才是「前往網址」。改完要按右上角「儲存並更新網站」。</p><label>標題<input data-bind="' + base + '.title" value="' + esc(item.title) + '"></label><div class="row"><label>日期<input data-bind="' + base + '.date" type="date" value="' + esc(dateInputValue(item.date)) + '"></label><label>分類<select data-bind="' + base + '.category">' + cats + "</select></label></div>" + imageField(base + ".image", item.image) + '<label>摘要<textarea data-bind="' + base + '.summary">' + esc(item.summary) + '</textarea></label><label>內文<textarea data-bind="' + base + '.body">' + esc(item.body) + '</textarea></label><label>網址<input data-bind="' + base + '.link" value="' + esc(item.link || "") + '" placeholder="https://"></label><div class="mini"><button type="button" id="newsUp">上移</button><button type="button" id="newsDown">下移</button><button type="button" id="newsByDate">依日期排序</button><button type="button" class="ghost-btn danger" id="delNews">刪除這則消息</button></div></section></div></div>';
  }

  function renderSettings() {
    const s = site.settings;
    const field = (key, label) => '<label>' + label + '<input data-bind="settings.' + key + '" value="' + esc(s[key] || "") + '"></label>';
    return '<div class="editor"><section class="panel"><h2>全站資料</h2>' + field("siteName", "網站名稱") + field("englishName", "英文名稱") + imageField("settings.logo", s.logo) + field("phone", "電話") + field("email", "信箱") + field("address", "地址") + field("addressEn", "英文地址") + field("copyright", "頁尾版權") + field("facebook", "Facebook 連結") + field("instagram", "Instagram 連結") + field("mapQuery", "地圖關鍵字") + "</section><section class=\"panel\"><h2>消息分類</h2>" + site.newsCategories.map((cat, i) => '<div class="item-head"><input data-bind="newsCategories.' + i + '.name" value="' + esc(cat.name) + '"><button type="button" data-del-cat="newsCategories.' + i + '">刪除</button></div>').join("") + '<button type="button" id="addNewsCat" class="ghost-btn">新增消息分類</button></section><section class="panel"><h2>更改密碼</h2><label>新密碼<input id="newPassword" type="password"></label><button type="button" id="savePassword" class="ghost-btn">更新密碼</button></section></div>';
  }

  let previewScroll = 0;
  let lockPreviewScroll = false;

  function rememberPreviewScroll() {
    if (lockPreviewScroll) return;
    const frame = $("#preview");
    const doc = frame && frame.contentDocument;
    const scroll = doc && doc.getElementById("ve-scroll");
    if (scroll) previewScroll = scroll.scrollTop;
  }

  function restorePreviewScroll(frame) {
    const doc = frame && frame.contentDocument;
    const scroll = doc && doc.getElementById("ve-scroll");
    if (scroll) scroll.scrollTop = previewScroll;
  }

  function render() {
    rememberPreviewScroll();
    lockPreviewScroll = false;
    $("#workspace").innerHTML = '<div class="topbar"><div><h2>' + { pages: "分頁", albums: "相簿", news: "最新消息", settings: "網站設定" }[tab] + '</h2><p class="status" id="saveStatus">' + (dirty ? "有尚未儲存的修改" : "已是最新內容") + '</p></div><div class="actions"><a href="/" target="_blank">預覽網站</a><button type="button" class="primary" id="save">儲存並更新網站</button></div></div>' +
      ({ pages: renderPages, albums: renderAlbums, news: renderNews, settings: renderSettings }[tab])();
    document.querySelectorAll(".side button[data-tab]").forEach((button) => {
      button.classList.toggle("is-on", button.dataset.tab === tab);
    });
    if (tab === "pages") loadPreview();
  }

  let previewToken = 0;
  let previewTimer = 0;

  function pageIndex() {
    return site.pages.findIndex((page) => page.id === pageId);
  }

  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => { if (tab === "pages") loadPreview(); }, 200);
  }

  async function loadPreview() {
    const frame = $("#preview");
    if (!frame) return;
    const token = ++previewToken;
    try {
      const data = await api("/api/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ site, pageId, device }) });
      const frame = $("#preview");
      if (token !== previewToken || !frame) return;
      const doc = frame.contentDocument;
      doc.open();
      doc.write(data.html);
      doc.close();
      restorePreviewScroll(frame);
      setTimeout(() => restorePreviewScroll(frame), 0);
      setTimeout(() => restorePreviewScroll(frame), 80);
    } catch (error) {
      const status = $("#saveStatus");
      if (status) status.textContent = error.message;
    }
  }

  function markDirty() {
    const status = $("#saveStatus");
    if (status) status.textContent = "有尚未儲存的修改";
  }

  function hasCell(msg) {
    return msg.cell !== undefined && msg.cell !== "";
  }

  function focusBlock(page, msg) {
    const block = page.blocks[Number(msg.index)];
    if (!block) return null;
    if (!hasCell(msg)) return block;
    const cells = block.data && block.data.cells;
    return cells ? cells[Number(msg.cell)] || null : null;
  }

  function focusPath(pageIndex, msg) {
    const base = "pages." + pageIndex + ".blocks." + msg.index;
    return hasCell(msg) ? base + ".data.cells." + msg.cell : base;
  }

  window.addEventListener("message", (event) => {
    const frame = document.querySelector("#preview");
    if (!frame || event.source !== frame.contentWindow || !event.data || event.data.source !== "ve" || !site) return;
    const msg = event.data;
    const index = pageIndex();
    const page = site.pages[index];
    if (!page) return;
    if (msg.kind === "open") {
      const slug = String(msg.href || "").split("/").pop().replace(/\.html$/, "") || "index";
      const target = site.pages.find((item) => item.slug === slug);
      if (target && target.id !== pageId) {
        lockPreviewScroll = true;
        previewScroll = 0;
        pageId = target.id;
        render();
      }
      return;
    }
    if (msg.kind === "add") {
      page.blocks.push(newBlock(msg.type));
      dirty = true;
      render();
      return;
    }
    if (msg.kind === "item") {
      const block = page.blocks[Number(msg.index)];
      if (hasCell(msg) && block && block.type === "row") {
        const cells = block.data.cells || (block.data.cells = []);
        const at = Number(msg.cell);
        if (msg.act === "cell-type") {
          const fresh = newBlock(msg.value || "text");
          if (cells[at] && cells[at].id) fresh.id = cells[at].id;
          cells[at] = fresh;
        } else if (msg.act === "up" || msg.act === "down") {
          move(cells, at, msg.act === "up" ? -1 : 1);
          return;
        } else if (msg.act === "del") {
          cells.splice(at, 1);
          block.data.count = Math.max(cells.length, 2);
          if (cells.length < 2) page.blocks.splice(Number(msg.index), 1, cells[0] || newBlock("text"));
        } else return;
        dirty = true;
        render();
        return;
      }
      if (msg.act === "up" || msg.act === "down") {
        move(page.blocks, Number(msg.index), msg.act === "up" ? -1 : 1);
        return;
      }
      if (msg.act === "del") {
        page.blocks.splice(Number(msg.index), 1);
      } else if (block && msg.act === "add-item") {
        const key = msg.itemKind === "slider" ? "images" : "items";
        block.data[key] = block.data[key] || [];
        if (msg.itemKind === "members") block.data[key].push({ role: "職稱", name: "姓名", lines: ["XXX"], src: "" });
        else if (msg.itemKind === "cards") block.data[key].push({ title: "標題", text: "說明" });
        else if (msg.itemKind === "logos") block.data[key].push({ src: "", name: "名稱" });
        else block.data[key].push({ src: "", alt: "" });
      } else if (block && msg.act === "add-line") {
        const person = (block.data.items || [])[Number(msg.item)];
        if (!person) return;
        if (!Array.isArray(person.lines)) person.lines = person.org ? [String(person.org)] : [""];
        const at = Number(msg.line);
        person.lines.splice(Number.isFinite(at) ? at + 1 : person.lines.length, 0, "");
        delete person.org;
      } else if (block && msg.act === "del-item") {
        (block.data[msg.list] || []).splice(Number(msg.item), 1);
      } else return;
      dirty = true;
      render();
      return;
    }
    if (msg.kind === "field") {
      const target = msg.scope === "page" ? null : focusBlock(page, msg);
      if (target && target.type === "row" && msg.path === "data.count") {
        const count = Math.min(6, Math.max(2, Number(msg.value) || 3));
        target.data.cells = target.data.cells || [];
        while (target.data.cells.length < count) target.data.cells.push(newBlock("text"));
        target.data.count = count;
        dirty = true;
        render();
        return;
      }
      if (device === "mobile" && msg.scope !== "page") {
        if (!target) return;
        target.mobile = target.mobile || { style: {}, data: {} };
        target.mobile.style = target.mobile.style || {};
        target.mobile.data = target.mobile.data || {};
        setPath(focusPath(index, msg) + ".mobile." + msg.path, msg.value);
      } else {
        const prefix = msg.scope === "page" ? "pages." + index : focusPath(index, msg);
        setPath(prefix + "." + msg.path, msg.value);
      }
      markDirty();
      if (msg.reload) loadPreview();
      return;
    }
    if (msg.kind === "style") {
      if (msg.scope === "header" || msg.scope === "footer") {
        const key = msg.scope === "header" ? "headerStyle" : "footerStyle";
        site.settings[key] = site.settings[key] || {};
        site.settings[key][msg.key] = msg.value;
        dirty = true;
        markDirty();
        return;
      }
      const target = msg.scope === "page" ? null : focusBlock(page, msg);
      if (device === "mobile" && msg.scope === "page") {
        page.mobileTitleStyle = page.mobileTitleStyle || {};
        page.mobileTitleStyle[msg.key] = msg.value;
      } else if (device === "mobile") {
        if (!target) return;
        target.mobile = target.mobile || { style: {}, data: {} };
        target.mobile.style = target.mobile.style || {};
        target.mobile.style[msg.key] = msg.value;
      } else {
        if (msg.scope === "page") page.titleStyle = page.titleStyle || {};
        if (target) target.style = target.style || {};
        const prefix = msg.scope === "page" ? "pages." + index + ".titleStyle" : focusPath(index, msg) + ".style";
        setPath(prefix + "." + msg.key, msg.value);
      }
      dirty = true;
      markDirty();
    }
  });

  async function upload(file) {
    const body = new FormData();
    body.append("file", file);
    const data = await api("/api/upload", { method: "POST", body });
    return data.url;
  }

  function move(list, index, dir) {
    const next = index + dir;
    if (next < 0 || next >= list.length) return;
    const item = list.splice(index, 1)[0];
    list.splice(next, 0, item);
    dirty = true;
    render();
  }

  let noticeAfter = null;

  function showNotice(message) {
    noticeAfter = null;
    $("#noticeText").textContent = message;
    $("#notice").hidden = false;
    $("#noticeOk").focus();
  }

  function showLogin() {
    $("#app").hidden = true;
    $("#login").hidden = false;
  }

  $("#noticeOk").addEventListener("click", () => {
    $("#notice").hidden = true;
    const next = noticeAfter;
    noticeAfter = null;
    if (next) next();
  });

  const cropFrame = $("#cropFrame");
  cropFrame.addEventListener("pointerdown", (event) => {
    if (!crop) return;
    crop.pointer = event.pointerId;
    crop.startX = event.clientX;
    crop.startY = event.clientY;
    crop.originX = crop.x;
    crop.originY = crop.y;
    cropFrame.setPointerCapture(event.pointerId);
  });
  cropFrame.addEventListener("pointermove", (event) => {
    if (!crop || event.pointerId !== crop.pointer) return;
    const box = cropFrame.getBoundingClientRect();
    crop.x = Math.min(100, Math.max(0, crop.originX - ((event.clientX - crop.startX) / box.width) * 100));
    crop.y = Math.min(100, Math.max(0, crop.originY - ((event.clientY - crop.startY) / box.height) * 100));
    paintCrop();
  });
  cropFrame.addEventListener("pointerup", (event) => {
    if (crop && event.pointerId === crop.pointer) crop.pointer = null;
  });
  $("#cropZoom").addEventListener("input", () => {
    if (!crop) return;
    crop.zoom = Number($("#cropZoom").value) || 1;
    paintCrop();
  });
  $("#cropCancel").addEventListener("click", () => {
    crop = null;
    $("#cropper").hidden = true;
  });
  $("#cropOk").addEventListener("click", () => {
    const album = site.albums.find((item) => item.id === albumId);
    if (!album || !crop) return;
    album.cover = crop.src;
    album.coverX = Math.round(crop.x * 10) / 10;
    album.coverY = Math.round(crop.y * 10) / 10;
    album.coverZoom = Math.round(crop.zoom * 100) / 100;
    crop = null;
    $("#cropper").hidden = true;
    dirty = true;
    render();
  });

  $("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    $("#loginError").textContent = "";
    try {
      await api("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: $("#password").value }) });
      if (site && site.pages) {
        $("#login").hidden = true;
        $("#app").hidden = false;
      } else {
        await openApp();
      }
    } catch (error) {
      $("#loginError").textContent = error.message;
    }
  });

  $("#logout").addEventListener("click", async () => {
    await api("/api/logout", { method: "POST" });
    $("#app").hidden = true;
    $("#login").hidden = false;
  });

  document.querySelector(".side").addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (!button) return;
    tab = button.dataset.tab;
    render();
  });

  $("#workspace").addEventListener("input", (event) => {
    const pick = event.target.dataset.pick;
    if (pick) {
      const field = event.target.parentElement.querySelector('[data-bind="' + pick + '"]');
      if (field) field.value = event.target.value;
      setPath(pick, event.target.value);
      $("#saveStatus").textContent = "有尚未儲存的修改";
      return;
    }
    const bind = event.target.dataset.bind;
    if (!bind) return;
    setPath(bind, fieldValue(event.target));
    $("#saveStatus").textContent = "有尚未儲存的修改";
    if (/^pages\.\d+\.(navLabel|slug|parentId|layout|showInNav)$/.test(bind)) schedulePreview();
  });

  $("#workspace").addEventListener("change", async (event) => {
    const target = event.target;
    if (target.dataset.bind) {
      setPath(target.dataset.bind, fieldValue(target));
      const status = $("#saveStatus");
      if (status) status.textContent = "有尚未儲存的修改";
      if (/^pages\.\d+\.(navLabel|slug|parentId|layout|showInNav)$/.test(target.dataset.bind)) schedulePreview();
      if (/^news\.\d+\.date$/.test(target.dataset.bind) && site.settings.newsSort !== "manual") render();
      if (/^albums\.\d+\.date$/.test(target.dataset.bind) && site.settings.albumSort !== "manual") render();
    }
    if (target.dataset.upload) {
      if (!target.files[0]) return;
      try {
        const url = await upload(target.files[0]);
        setPath(target.dataset.upload, url);
        render();
      } catch (error) {
        showNotice(error.message === "請先登入" ? "請先登入，登入後再上傳一次" : (error.message || "上傳失敗"));
        if (error.message === "請先登入") noticeAfter = showLogin;
      }
      return;
    }
    if (target.id === "photoFiles" || target.id === "coverFile" || target.dataset.replace != null) {
      const album = site.albums.find((item) => item.id === albumId);
      if (!album) return;
      album.photos = album.photos || [];
      try {
        if (target.dataset.replace != null && target.files[0]) {
          const photo = album.photos[Number(target.dataset.replace)];
          const previous = photo.src;
          photo.src = await upload(target.files[0]);
          if (album.cover === previous) {
            album.cover = photo.src;
            album.coverX = 50;
            album.coverY = 50;
            album.coverZoom = 1;
          }
        }
        if (target.id === "coverFile" && target.files[0]) {
          const src = await upload(target.files[0]);
          openCrop(src, { x: 50, y: 50, zoom: 1 });
          return;
        }
        if (target.id === "photoFiles") {
          for (const file of target.files) {
            const src = await upload(file);
            album.photos.push({ id: uid("p"), src, caption: "" });
            if (!album.cover) album.cover = src;
          }
        }
        dirty = true;
        render();
      } catch (error) {
        showNotice(error.message === "請先登入" ? "請先登入，登入後再上傳一次" : (error.message || "上傳失敗"));
        if (error.message === "請先登入") noticeAfter = showLogin;
        if (album.photos.length) render();
      }
    }
  });

  function placePage(movingId, targetId, mode) {
    const moving = site.pages.find((item) => item.id === movingId);
    const target = site.pages.find((item) => item.id === targetId);
    if (!moving || !target || moving.id === target.id) return;
    const home = (item) => item.slug === "index" || item.layout === "cover";
    const hasKids = site.pages.some((item) => item.parentId === moving.id);
    const nest = mode === "into" && !home(moving) && !home(target) && !target.parentId && !hasKids;
    site.pages.splice(site.pages.indexOf(moving), 1);
    if (nest) {
      moving.parentId = target.id;
      let at = site.pages.indexOf(target) + 1;
      while (site.pages[at] && site.pages[at].parentId === target.id) at += 1;
      site.pages.splice(at, 0, moving);
    } else {
      moving.parentId = home(moving) || !target.parentId ? "" : target.parentId;
      let at = site.pages.indexOf(target);
      if (mode !== "before") {
        at += 1;
        if (!target.parentId) {
          while (site.pages[at] && site.pages[at].parentId === target.id) at += 1;
        }
      }
      site.pages.splice(at, 0, moving);
    }
    dirty = true;
    render();
  }

  let dragPageId = "";
  $("#workspace").addEventListener("dragstart", (event) => {
    const grip = event.target.closest("[data-drag-page]");
    if (!grip) return;
    dragPageId = grip.dataset.dragPage;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", dragPageId);
    const row = grip.closest(".page-row");
    if (row) row.classList.add("is-dragging");
  });
  $("#workspace").addEventListener("dragover", (event) => {
    const row = event.target.closest(".page-row");
    if (!row || !dragPageId || row.dataset.row === dragPageId) return;
    event.preventDefault();
    document.querySelectorAll(".page-row").forEach((item) => item.classList.remove("drop-before", "drop-after", "drop-into"));
    const moving = site.pages.find((item) => item.id === dragPageId);
    const target = site.pages.find((item) => item.id === row.dataset.row);
    if (!moving || !target) return;
    const rect = row.getBoundingClientRect();
    const home = (item) => item.slug === "index" || item.layout === "cover";
    const hasKids = site.pages.some((item) => item.parentId === moving.id);
    const into = !target.parentId && !home(moving) && !home(target) && !hasKids && (event.clientX - rect.left) > rect.width * 0.55;
    if (into) row.classList.add("drop-into");
    else row.classList.add((event.clientY - rect.top) < rect.height / 2 ? "drop-before" : "drop-after");
  });
  $("#workspace").addEventListener("drop", (event) => {
    const row = event.target.closest(".page-row");
    if (!row || !dragPageId) return;
    event.preventDefault();
    const mode = row.classList.contains("drop-into") ? "into" : row.classList.contains("drop-before") ? "before" : "after";
    const movingId = dragPageId;
    const targetId = row.dataset.row;
    dragPageId = "";
    placePage(movingId, targetId, mode);
  });
  $("#workspace").addEventListener("dragend", () => {
    dragPageId = "";
    document.querySelectorAll(".page-row").forEach((item) => item.classList.remove("is-dragging", "drop-before", "drop-after", "drop-into"));
  });

  $("#workspace").addEventListener("click", async (event) => {
    const target = event.target;
    if (target.id === "save") {
      const button = target;
      if (button.disabled) return;
      button.disabled = true;
      button.textContent = "儲存中";
      try {
        await api("/api/site", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(site) });
        dirty = false;
        const status = $("#saveStatus");
        if (status) status.textContent = "已是最新內容";
        showNotice("已修改完成");
      } catch (error) {
        const status = $("#saveStatus");
        if (status) status.textContent = error.message;
        showNotice(error.message === "請先登入" ? "請先登入，登入後再按一次儲存" : (error.message || "儲存失敗"));
        if (error.message === "請先登入") noticeAfter = showLogin;
      } finally {
        button.disabled = false;
        button.textContent = "儲存並更新網站";
      }
      return;
    }
    if (target.dataset.page) {
      if (target.dataset.page !== pageId) { lockPreviewScroll = true; previewScroll = 0; }
      pageId = target.dataset.page;
      render();
      return;
    }
    if (target.dataset.album) { albumId = target.dataset.album; render(); return; }
    if (target.dataset.news) { newsId = target.dataset.news; render(); return; }
    if (target.id === "deviceDesktop" || target.id === "deviceMobile") {
      device = target.id === "deviceMobile" ? "mobile" : "desktop";
      render();
      return;
    }
    if (target.id === "deviceSync") {
      const current = site.pages.find((item) => item.id === pageId);
      if (!current) return;
      const copy = (value) => JSON.parse(JSON.stringify(value || {}));
      const syncBlock = (block) => {
        if (block.type === "row" && block.data && Array.isArray(block.data.cells)) block.data.cells.forEach(syncBlock);
        const cells = block.data && block.data.cells;
        if (device === "mobile" && block.mobile) {
          block.style = Object.assign({}, block.style, block.mobile.style || {});
          block.data = Object.assign({}, block.data, block.mobile.data || {});
          if (cells) block.data.cells = cells;
        }
        block.mobile = { style: copy(block.style), data: copy(block.data) };
      };
      current.blocks.forEach(syncBlock);
      if (device === "mobile" && current.mobileTitleStyle) current.titleStyle = Object.assign({}, current.titleStyle, current.mobileTitleStyle);
      current.mobileTitleStyle = copy(current.titleStyle);
      dirty = true;
      $("#saveStatus").textContent = "兩邊已相同，請按儲存。之後可以分別改電腦版或手機版。";
      loadPreview();
      return;
    }
    if (target.dataset.indent) {
      const moving = site.pages.find((item) => item.id === target.dataset.indent);
      const tops = site.pages.filter((item) => !item.parentId);
      const parent = tops[tops.findIndex((item) => item.id === moving.id) - 1];
      if (!moving || !parent) return;
      site.pages.splice(site.pages.indexOf(moving), 1);
      moving.parentId = parent.id;
      let at = site.pages.indexOf(parent) + 1;
      while (site.pages[at] && site.pages[at].parentId === parent.id) at += 1;
      site.pages.splice(at, 0, moving);
      dirty = true;
      render();
      return;
    }
    if (target.dataset.outdent) {
      const moving = site.pages.find((item) => item.id === target.dataset.outdent);
      const parent = site.pages.find((item) => item.id === moving.parentId);
      if (!moving) return;
      site.pages.splice(site.pages.indexOf(moving), 1);
      moving.parentId = "";
      let at = parent ? site.pages.indexOf(parent) + 1 : site.pages.length;
      while (site.pages[at] && parent && site.pages[at].parentId === parent.id) at += 1;
      site.pages.splice(at, 0, moving);
      dirty = true;
      render();
      return;
    }
    if (target.id === "addPage") {
      const id = uid("p");
      site.pages.push({ id, slug: id, title: "新分頁", navLabel: "新分頁", en: "", showInNav: true, parentId: "", layout: "inner", titleStyle: {}, blocks: [newBlock("text")] });
      pageId = id;
      dirty = true;
      lockPreviewScroll = true;
      previewScroll = 0;
      render();
      return;
    }
    if (target.id === "delPage") {
      const page = site.pages.find((item) => item.id === pageId);
      if (!page || page.slug === "index" || !confirm("確定刪除「" + page.title + "」？底下的子分頁會改成主選單。")) return;
      site.pages.forEach((item) => { if (item.parentId === pageId) item.parentId = ""; });
      site.pages = site.pages.filter((item) => item.id !== pageId);
      pageId = "index";
      dirty = true;
      lockPreviewScroll = true;
      previewScroll = 0;
      render();
      return;
    }
    if (target.id === "addBlock") {
      const page = site.pages.find((item) => item.id === pageId);
      page.blocks = page.blocks || [];
      page.blocks.push(newBlock(($("#newType") && $("#newType").value) || "text"));
      dirty = true;
      render();
      return;
    }
    if (target.dataset.delBlock != null) {
      const page = site.pages.find((item) => item.id === pageId);
      page.blocks.splice(Number(target.dataset.delBlock), 1);
      dirty = true;
      render();
      return;
    }
    if (target.dataset.moveBlock != null) {
      const page = site.pages.find((item) => item.id === pageId);
      move(page.blocks, Number(target.dataset.moveBlock), Number(target.dataset.dir));
      return;
    }
    if (target.dataset.addItem) {
      const parts = target.dataset.addItem.split(".");
      let list = site;
      parts.forEach((part) => { list = list[part]; });
      if (target.dataset.kind === "members") list.push({ role: "職稱", name: "姓名", lines: ["XXX"], src: "" });
      else if (target.dataset.kind === "cards") list.push({ title: "標題", text: "說明" });
      else if (target.dataset.kind === "logos") list.push({ src: "", name: "名稱" });
      else list.push({ src: "", alt: "" });
      dirty = true;
      render();
      return;
    }
    if (target.dataset.delItem) {
      const parts = target.dataset.delItem.split(".");
      const index = Number(parts.pop());
      let list = site;
      parts.forEach((part) => { list = list[part]; });
      list.splice(index, 1);
      dirty = true;
      render();
      return;
    }
    if (target.dataset.moveItem) {
      const parts = target.dataset.moveItem.split(".");
      const index = Number(parts.pop());
      let list = site;
      parts.forEach((part) => { list = list[part]; });
      move(list, index, Number(target.dataset.dir));
      return;
    }
    if (target.id === "albumUp") { moveAlbum(-1); return; }
    if (target.id === "albumDown") { moveAlbum(1); return; }
    if (target.id === "albumByDate") {
      site.settings.albumSort = "date";
      dirty = true;
      render();
      return;
    }
    if (target.id === "addAlbum") {
      const id = uid("a");
      site.albums.push({ id, date: new Date().toISOString().slice(0, 10).replace(/-/g, "/"), title: "新相簿", summary: "", cover: "", photos: [] });
      albumId = id;
      dirty = true;
      render();
      return;
    }
    if (target.id === "delAlbum") {
      if (!confirm("確定刪除這個相簿？")) return;
      site.albums = site.albums.filter((item) => item.id !== albumId);
      albumId = "";
      dirty = true;
      render();
      return;
    }
    if (target.id === "cropCover" || target.id === "cropCoverBtn" || target.closest("#cropCover")) {
      const album = site.albums.find((item) => item.id === albumId);
      if (!album || !album.cover) return;
      openCrop(album.cover, coverView(album));
      return;
    }
    if (target.dataset.cover != null) {
      const album = site.albums.find((item) => item.id === albumId);
      const photo = album.photos[Number(target.dataset.cover)];
      const same = album.cover === photo.src;
      openCrop(photo.src, same ? coverView(album) : { x: 50, y: 50, zoom: 1 });
      return;
    }
    if (target.dataset.delPhoto != null) {
      const album = site.albums.find((item) => item.id === albumId);
      const photo = album.photos.splice(Number(target.dataset.delPhoto), 1)[0];
      if (album.cover === photo.src) album.cover = album.photos[0] ? album.photos[0].src : "";
      dirty = true;
      render();
      return;
    }
    if (target.id === "newsUp") { moveNews(-1); return; }
    if (target.id === "newsDown") { moveNews(1); return; }
    if (target.id === "newsByDate") {
      site.settings.newsSort = "date";
      dirty = true;
      render();
      return;
    }
    if (target.id === "addNews") {
      const id = uid("n");
      site.news.unshift({ id, category: site.newsCategories[0] ? site.newsCategories[0].id : "", date: new Date().toISOString().slice(0, 10).replace(/-/g, "/"), image: "", title: "新消息", summary: "", body: "" });
      newsId = id;
      dirty = true;
      render();
      return;
    }
    if (target.id === "delNews") {
      if (!confirm("確定刪除這則消息？")) return;
      site.news = site.news.filter((item) => item.id !== newsId);
      newsId = "";
      dirty = true;
      render();
      return;
    }
    if (target.id === "addNewsCat") { site.newsCategories.push({ id: uid("c"), name: "新分類" }); dirty = true; render(); return; }
    if (target.dataset.delCat) {
      const parts = target.dataset.delCat.split(".");
      const index = Number(parts.pop());
      site[parts[0]].splice(index, 1);
      dirty = true;
      render();
      return;
    }
    if (target.id === "savePassword") {
      try {
        await api("/api/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: $("#newPassword").value }) });
        $("#saveStatus").textContent = "密碼已更新";
      } catch (error) {
        $("#saveStatus").textContent = error.message;
      }
    }
  });

  async function openApp() {
    site = await api("/api/site");
    site.pages.forEach((page) => {
      page.titleStyle = page.titleStyle || {};
      page.blocks = page.blocks || [];
      page.blocks.forEach((block) => {
        block.style = block.style || {};
        block.data = block.data || {};
      });
      if (page.layout === "cover" && !page.blocks.some((block) => block.type === "button")) {
        const cover = page.blocks.find((block) => block.type === "cover");
        const data = cover && cover.data || {};
        page.blocks.push({
          id: uid("b"),
          type: "button",
          style: {},
          data: { text: data.buttonText || "進入主頁", href: data.buttonHref || "about.html", x: 50, y: 86 }
        });
      }
    });
    pageId = site.pages[0] ? site.pages[0].id : "";
    albumId = site.albums[0] ? site.albums[0].id : "";
    newsId = site.news[0] ? site.news[0].id : "";
    $("#login").hidden = true;
    $("#app").hidden = false;
    render();
  }

  api("/api/me").then((me) => { if (me.ok) openApp(); }).catch(() => {});
  window.addEventListener("beforeunload", (event) => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });
})();
