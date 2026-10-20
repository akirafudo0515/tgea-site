(function () {
  function post(message) {
    parent.postMessage(Object.assign({ source: "ve" }, message), "*");
  }

  function plain(el) {
    if (el.dataset.mode === "value") return el.value;
    if (el.dataset.mode === "line") return el.textContent.replace(/\s+/g, " ").trim();
    return el.innerText.replace(/\u00a0/g, " ").replace(/\r/g, "");
  }

  function blockOf(el) {
    const bar = el.closest(".ve-bar");
    if (bar && bar.dataset.dock) return document.getElementById(bar.dataset.dock);
    return el.closest(".ve-block");
  }

  let docked = null;
  function scrollBox() {
    return document.getElementById("ve-scroll");
  }
  function ensureFrame() {
    if (scrollBox()) return;
    const scroll = document.createElement("div");
    scroll.id = "ve-scroll";
    const dock = document.createElement("div");
    dock.id = "ve-dock";
    while (document.body.firstChild) scroll.appendChild(document.body.firstChild);
    document.body.appendChild(scroll);
    document.body.appendChild(dock);
    document.documentElement.classList.add("ve-frame");
    const add = scroll.querySelector(".ve-add");
    if (add) dock.appendChild(add);
  }
  function keepClear(block, anchor) {
    const scroll = scrollBox();
    if (!scroll || !block) return;
    const focus = anchor || block.querySelector("[contenteditable]:focus, input:focus, textarea:focus") || block;
    const rect = focus.getBoundingClientRect();
    const box = scroll.getBoundingClientRect();
    if (rect.bottom > box.bottom - 16) scroll.scrollTop += rect.bottom - (box.bottom - 16);
    if (rect.top < box.top + 12) scroll.scrollTop -= (box.top + 12) - rect.top;
  }
  function undock() {
    if (!docked) return;
    const item = docked;
    docked = null;
    delete item.bar.dataset.dock;
    if (item.next && item.next.parentNode === item.block) item.block.insertBefore(item.bar, item.next);
    else item.block.insertBefore(item.bar, item.block.firstChild);
    item.block.classList.remove("is-picked");
    const add = document.querySelector(".ve-add");
    if (add) add.hidden = false;
  }
  function dockBar(block, anchor) {
    if (!block) return;
    ensureFrame();
    if (docked && docked.block === block) {
      keepClear(block, anchor);
      return;
    }
    undock();
    const bar = block.querySelector(":scope > .ve-bar");
    if (!bar) return;
    if (!block.id) block.id = "ve-" + Math.random().toString(36).slice(2, 8);
    docked = { block, bar, next: bar.nextSibling };
    bar.dataset.dock = block.id;
    document.getElementById("ve-dock").appendChild(bar);
    block.classList.add("is-picked");
    const add = document.querySelector(".ve-add");
    if (add) add.hidden = true;
    requestAnimationFrame(() => keepClear(block, anchor));
  }

  function sendField(el) {
    const block = blockOf(el);
    const message = {
      kind: "field",
      scope: el.dataset.scope || (block && block.dataset.scope) || "block",
      index: block ? block.dataset.index : "",
      path: el.dataset.path,
      value: plain(el),
      reload: el.dataset.reload === "1"
    };
    if (block && block.dataset.cell !== undefined) message.cell = block.dataset.cell;
    post(message);
  }

  function cssColor(value) {
    const probe = document.createElement("span");
    probe.style.color = value;
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    probe.remove();
    const parts = computed.match(/\d+/g) || [51, 51, 51];
    return "#" + parts.slice(0, 3).map((part) => Number(part).toString(16).padStart(2, "0")).join("");
  }

  function nearestWeight(value) {
    const number = value === "bold" ? 700 : value === "normal" ? 400 : parseInt(value, 10) || 400;
    return ["400", "600", "700", "900"].reduce((best, item) => Math.abs(item - number) < Math.abs(best - number) ? item : best);
  }

  try {
  ensureFrame();
  document.querySelectorAll(".ve-block").forEach((block) => {
    let saved = {};
    try { saved = JSON.parse(block.dataset.style || "{}"); } catch (error) { saved = {}; }
    const sample = block.querySelector("[data-styled]") || block;
    const box = block.matches("[data-box]") ? block : (block.querySelector("[data-box]") || sample);
    const computed = getComputedStyle(sample);
    const boxComputed = getComputedStyle(box);
    const font = block.querySelector('[data-style-key="fontFamily"]');
    const size = block.querySelector('[data-style-key="fontSize"]');
    const weight = block.querySelector('[data-style-key="fontWeight"]');
    const color = block.querySelector('[data-style-key="color"]');
    if (font) {
      const family = saved.fontFamily || "";
      const match = Array.from(font.options).find((option) => family ? option.value === family : computed.fontFamily.toLowerCase().includes(option.value.split(",")[0].replace(/["']/g, "").trim().toLowerCase()));
      if (match) font.value = match.value;
    }
    if (size) size.value = saved.fontSize || Math.round(parseFloat(computed.fontSize)) || 16;
    if (weight) weight.value = saved.fontWeight || nearestWeight(computed.fontWeight);
    if (color) color.value = cssColor(saved.color || computed.color);
    const background = block.querySelector('[data-style-key="background"]');
    if (background) background.value = cssColor(saved.background || computed.backgroundColor);
    const align = block.querySelector('[data-style-key="textAlign"]');
    if (align) {
      const probe = block.querySelector(".block-pic, .section-head, [data-styled]") || sample;
      const current = saved.textAlign || getComputedStyle(probe).textAlign;
      const value = current === "start" ? "left" : current === "end" ? "right" : current;
      align.value = ["left", "center", "right"].includes(value) ? value : "left";
    }
    ["marginTop", "marginBottom", "marginLeft", "marginRight", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight"].forEach((key) => {
      const input = block.querySelector('[data-style-key="' + key + '"]');
      if (!input) return;
      const stored = saved[key];
      input.value = stored !== undefined && String(stored).trim() !== "" ? Math.round(parseFloat(stored)) : Math.round(parseFloat(boxComputed[key]) || 0);
    });
  });
  } catch (error) {}

  let drag = null;
  let resize = null;
  document.addEventListener("pointerdown", (event) => {
    const handle = event.target.closest("[data-resize]");
    if (handle) {
      const cell = handle.closest(".block-cell");
      const row = handle.closest(".block-row");
      if (!cell || !row) return;
      resize = {
        row,
        pointer: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        width: cell.offsetWidth,
        height: cell.offsetHeight,
        moved: false
      };
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const moveHandle = event.target.closest("[data-drag-handle]");
    const direct = !moveHandle && event.target.closest("[data-drag][data-type='button']") && !event.target.closest(".ve-bar, .ve-add, input, select, button")
      ? event.target.closest("[data-drag]")
      : null;
    const box = moveHandle ? moveHandle.closest("[data-drag]") : direct;
    if (!box) return;
    drag = { box, pointer: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    event.preventDefault();
  }, { passive: false });
  document.addEventListener("pointermove", (event) => {
    if (resize && event.pointerId === resize.pointer) {
      if (!resize.moved && Math.abs(event.clientX - resize.x) + Math.abs(event.clientY - resize.y) < 4) return;
      resize.moved = true;
      event.preventDefault();
      const row = resize.row;
      const cells = row.querySelectorAll(":scope > .block-cell");
      const count = cells.length || 1;
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const limit = row.parentElement.getBoundingClientRect().width;
      const maxWidth = Math.max(80, Math.floor((limit - gap * (count - 1)) / count));
      const width = Math.max(80, Math.min(maxWidth, Math.round(resize.width + event.clientX - resize.x)));
      const height = Math.max(60, Math.round(resize.height + event.clientY - resize.y));
      row.classList.add("has-cell-size");
      row.style.setProperty("--cell-w", width + "px");
      row.style.setProperty("--cell-h", height + "px");
      resize.widthNow = width;
      resize.heightNow = height;
      return;
    }
    if (!drag || event.pointerId !== drag.pointer) return;
    if (!drag.moved && Math.abs(event.clientX - drag.x) + Math.abs(event.clientY - drag.y) < 6) return;
    drag.moved = true;
    event.preventDefault();
    const host = (drag.box.closest(".cover-art") || document.body).getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - host.left) / host.width) * 100));
    const y = Math.max(-20, Math.min(140, ((event.clientY - host.top) / host.height) * 100));
    drag.box.style.left = x + "%";
    drag.box.style.top = y + "%";
    drag.left = Math.round(x * 10) / 10;
    drag.top = Math.round(y * 10) / 10;
  }, { passive: false });
  document.addEventListener("pointerup", (event) => {
    if (resize && event.pointerId === resize.pointer) {
      const done = resize;
      resize = null;
      if (!done.moved) return;
      const section = done.row.closest(".ve-block");
      post({ kind: "field", scope: "block", index: section ? section.dataset.index : "", path: "data.boxWidth", value: done.widthNow });
      post({ kind: "field", scope: "block", index: section ? section.dataset.index : "", path: "data.boxHeight", value: done.heightNow });
      return;
    }
    if (!drag || event.pointerId !== drag.pointer) return;
    const done = drag;
    drag = null;
    if (!done.moved) return;
    post({ kind: "field", scope: "block", index: done.box.dataset.index, path: "data.x", value: done.left });
    post({ kind: "field", scope: "block", index: done.box.dataset.index, path: "data.y", value: done.top });
  });

  document.addEventListener("input", (event) => {
    const target = event.target;
    if (target.dataset.path === "data.gap") {
      const block = blockOf(target);
      const row = block && block.querySelector(".block-row");
      if (row) row.style.setProperty("--row-gap", (target.value === "" ? 0 : target.value) + "px");
    }
    if (target.dataset.path && target.closest(".member-edit")) {
      const card = target.closest(".member");
      const parts = target.dataset.path.split(".");
      if (parts[parts.length - 2] === "lines") {
        const node = card && card.querySelector('[data-member-line="' + parts[parts.length - 1] + '"]');
        if (node) node.textContent = target.value;
      } else {
        const key = parts.pop();
        const node = card && card.querySelector('[data-member="' + key + '"]');
        if (node) node.textContent = target.value;
      }
    }
    if (target.dataset.path && target.dataset.reload !== "1") sendField(target);
    if (target.dataset.styleKey) sendStyle(target);
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.dataset.cellType === "1") {
      const block = blockOf(target);
      if (!block) return;
      post({ kind: "item", act: "cell-type", index: block.dataset.index || "", cell: block.dataset.cell || "", value: target.value });
      return;
    }
    if (target.dataset.path) sendField(target);
    if (target.dataset.styleKey) sendStyle(target);
  });

  function sendStyle(input) {
    const block = blockOf(input);
    if (!block) return;
    const key = input.dataset.styleKey;
    const value = input.value;
    const spacing = ["marginTop", "marginBottom", "marginLeft", "marginRight", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight"];
    if (key === "textAlign") {
      const justify = { left: "flex-start", center: "center", right: "flex-end" }[value] || "";
      const nodes = [...block.querySelectorAll("[data-styled], [data-box], .block-pic, .section-head")];
      if (block.matches("[data-styled], [data-box]")) nodes.unshift(block);
      nodes.forEach((el) => {
        el.style.textAlign = value;
        if (el.classList.contains("section-head") || el.classList.contains("member-grid")) el.style.justifyContent = justify;
      });
    } else if (spacing.includes(key)) {
      const box = block.matches("[data-box]") ? block : block.querySelector("[data-box]");
      if (box) box.style[key] = value === "" ? "" : value + "px";
    } else {
      const nodes = [...block.querySelectorAll("[data-styled]")];
      if (block.matches("[data-styled]")) nodes.unshift(block);
      nodes.forEach((el) => {
        if (key === "fontFamily") el.style.fontFamily = value;
        if (key === "fontSize") el.style.fontSize = value ? value + "px" : "";
        if (key === "fontWeight") el.style.fontWeight = value;
        if (key === "color") el.style.color = value;
        if (key === "background") el.style.background = value;
      });
    }
    const message = {
      kind: "style",
      scope: block.dataset.scope || "block",
      index: block.dataset.index || "",
      key,
      value
    };
    if (block.dataset.cell !== undefined) message.cell = block.dataset.cell;
    post(message);
  }

  async function uploadFile(file) {
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body, credentials: "same-origin" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "上傳失敗");
    return data.url;
  }

  function chooseImage(path, block) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", async () => {
      if (!input.files[0]) return;
      const url = await uploadFile(input.files[0]);
      const message = {
        kind: "field",
        scope: "block",
        index: block ? block.dataset.index : "",
        path,
        value: url,
        reload: true
      };
      if (block && block.dataset.cell !== undefined) message.cell = block.dataset.cell;
      post(message);
    });
    input.click();
  }

  document.addEventListener("click", (event) => {
    const upload = event.target.closest("[data-upload], [data-upload-btn]");
    if (upload) {
      event.preventDefault();
      event.stopPropagation();
      chooseImage(upload.dataset.upload || upload.dataset.uploadBtn, blockOf(upload));
      return;
    }
    const center = event.target.closest("[data-center]");
    if (center) {
      event.preventDefault();
      event.stopPropagation();
      const box = center.closest("[data-drag]") || blockOf(center);
      if (!box || !box.hasAttribute("data-drag")) return;
      box.style.left = "50%";
      post({ kind: "field", scope: "block", index: box.dataset.index, path: "data.x", value: 50 });
      return;
    }
    const action = event.target.closest("[data-act]");
    if (action) {
      event.preventDefault();
      event.stopPropagation();
      const block = blockOf(action);
      if (action.dataset.act === "del" && !confirm("確定刪除這個區塊？")) return;
      if (action.dataset.act === "del-slide") {
        const visible = block.querySelector(".hero-slider img:not([hidden])") || block.querySelector(".hero-slider img");
        const match = visible && (visible.dataset.upload || "").match(/data\.images\.(\d+)\.src/);
        if (!match) return;
        post({ kind: "item", act: "del-item", index: block.dataset.index, list: "images", item: Number(match[1]) });
        return;
      }
      const message = {
        kind: "item",
        act: action.dataset.act,
        index: block ? block.dataset.index : "",
        list: action.dataset.list || "",
        item: action.dataset.item || "",
        line: action.dataset.line || "",
        itemKind: action.dataset.kind || ""
      };
      if (block && block.dataset.cell !== undefined) message.cell = block.dataset.cell;
      post(message);
      return;
    }
    if (event.target.closest("#veAdd")) {
      event.preventDefault();
      post({ kind: "add", type: document.querySelector("#veType").value });
      return;
    }
    const link = event.target.closest("a");
    if (link && !link.closest(".ve-bar") && link.getAttribute("href")) {
      event.preventDefault();
      if (link.getAttribute("contenteditable") === "true" && event.detail !== 2) return;
      post({ kind: "open", href: link.getAttribute("href") });
    }
  });

  const form = document.querySelector("#contactForm");
  if (form) form.addEventListener("submit", (event) => event.preventDefault());

  document.addEventListener("focusin", (event) => {
    if (event.target.closest(".ve-bar")) return;
    dockBar(event.target.closest(".ve-block"), event.target);
  });
  document.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".ve-bar")) return;
    const block = event.target.closest(".ve-block");
    if (block) dockBar(block, event.target);
    else undock();
  });
})();
