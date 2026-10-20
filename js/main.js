(function () {
  var page = document.body.getAttribute("data-page") || "";
  var items = [
    {
      href: "about.html",
      id: "about",
      label: "認識本會",
      en: "About TGNA",
      children: [
        { href: "charter.html", id: "charter", label: "協會組織章程", en: "ORG Articles" },
        { href: "chairman.html", id: "chairman", label: "現任理事長" }
      ]
    },
    { href: "service.html", id: "service", label: "服務項目", en: "Service" },
    { href: "news.html", id: "news", label: "最新消息", en: "News" },
    { href: "events.html", id: "events", label: "活動花絮", en: "Event Photos" },
    { href: "partners.html", id: "partners", label: "全球夥伴", en: "Global Partners" },
    { href: "contact.html", id: "contact", label: "聯絡我們", en: "Contact us" }
  ];

  function isCurrent(item) {
    if (item.id === page) return true;
    return (item.children || []).some(function (child) { return child.id === page; });
  }

  function anchor(item) {
    var current = item.id === page ? ' aria-current="page"' : "";
    return '<a href="' + item.href + '"' + current + ">" + item.label + (item.en ? "<b>" + item.en + "</b>" : "") + "</a>";
  }

  var menu = items.map(function (item) {
    var sub = "";
    if (item.children) {
      sub = '<ul class="sub">' + item.children.map(function (child) {
        return "<li>" + anchor(child) + "</li>";
      }).join("") + "</ul>";
    }
    var parent = item.children
      ? '<a href="' + item.href + '"' + (isCurrent(item) ? ' aria-current="page"' : "") + ">" + item.label + "<b>" + item.en + "</b></a>"
      : anchor(item);
    return '<li class="' + (item.children ? "has-sub" : "") + '">' + parent + sub + "</li>";
  }).join("");

  var headerMount = document.querySelector("#site-header");
  if (headerMount) {
    headerMount.outerHTML =
      '<header class="site-header"><div class="header-inner">' +
      '<a class="brand" href="index.html"><img src="images/logo.png" alt="台北市綠能協會"></a>' +
      '<button class="nav-toggle" type="button" aria-label="開啟選單" aria-expanded="false"><span></span><span></span><span></span></button>' +
      '<nav class="main-nav"><ul>' + menu + "</ul></nav></div></header>";
  }

  var footerMount = document.querySelector("#site-footer");
  if (footerMount) {
    footerMount.outerHTML =
      '<footer class="site-footer"><div class="footer-inner">' +
      '<div class="qr" aria-hidden="true"></div>' +
      '<ul class="footer-info">' +
      "<li>臺北市綠能協會</li>" +
      "<li>TAIPEI GREEN ENERGY ASSOCIATION</li>" +
      "<li>台北市萬華區和平西路三段70號2樓</li>" +
      "<li>2F., No.70, Sec. 3, Heping W. Rd., Wanhua Dist., Taipei City 108020, Taiwan (R.O.C.)</li>" +
      "<li>+886 2 2718 1688</li>" +
      "<li>tge-service@gmail.com</li>" +
      "</ul>" +
      '<div class="footer-side"><ul class="social">' +
      '<li><a href="contact.html" aria-label="Email"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/></svg></a></li>' +
      '<li><a href="https://maps.google.com/?q=台北市萬華區和平西路三段70號" target="_blank" rel="noopener" aria-label="地圖"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg></a></li>' +
      '<li><a href="#" aria-label="Facebook">f</a></li>' +
      '<li><a href="#" aria-label="Instagram"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/></svg></a></li>' +
      '</ul><p class="copyright">Copyright © 臺北市綠能協會 All Rights Reserved.</p></div></div></footer>';
  }

  var toggle = document.querySelector(".nav-toggle");
  function closeNav() {
    document.body.classList.remove("nav-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  document.addEventListener("click", function (event) {
    if (!document.body.classList.contains("nav-open")) return;
    if (event.target.closest(".nav-toggle")) return;
    if (event.target.closest(".main-nav") && !event.target.closest("a")) return;
    closeNav();
  });

  document.querySelectorAll("[data-news-open]").forEach(function (button) {
    button.addEventListener("click", function () {
      var card = button.closest(".news-card");
      if (!card) return;
      var open = card.classList.toggle("open");
      button.textContent = open ? "收合內文" : "查看內文";
    });
  });

  document.querySelectorAll("[data-filter]").forEach(function (bar) {
    var target = document.querySelector(bar.getAttribute("data-filter"));
    if (!target) return;
    bar.addEventListener("click", function (event) {
      var button = event.target.closest("button");
      if (!button) return;
      bar.querySelectorAll("button").forEach(function (item) {
        item.classList.remove("is-on");
      });
      button.classList.add("is-on");
      var cat = button.getAttribute("data-cat");
      target.querySelectorAll("[data-cat]").forEach(function (card) {
        card.hidden = !(cat === "all" || card.getAttribute("data-cat") === cat);
      });
    });
  });

  document.querySelectorAll(".js-photo").forEach(function (link) {
    link.addEventListener("click", function (event) {
      var box = document.querySelector(".lightbox");
      if (!box) return;
      event.preventDefault();
      box.querySelector("img").src = link.getAttribute("href");
      box.querySelector("img").alt = link.querySelector("h3") ? link.querySelector("h3").textContent : "";
      box.classList.add("show");
    });
  });

  var lightbox = document.querySelector(".lightbox");
  if (lightbox) {
    lightbox.addEventListener("click", function () {
      lightbox.classList.remove("show");
    });
  }

  document.querySelectorAll("[data-slider]").forEach(function (slider) {
    var slides = slider.querySelectorAll("img");
    var index = 0;
    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (img, i) { img.hidden = i !== index; });
    }
    show(0);
    var prev = slider.querySelector(".prev");
    var next = slider.querySelector(".next");
    if (prev) prev.addEventListener("click", function () { show(index - 1); });
    if (next) next.addEventListener("click", function () { show(index + 1); });
    setInterval(function () { show(index + 1); }, 5000);
  });

  var form = document.querySelector("#contactForm");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var note = document.querySelector(".form-note");
      var required = ["name", "email", "tel", "subject", "message"];
      var missing = required.some(function (name) {
        return !form.elements[name].value.trim();
      });
      if (missing) {
        note.textContent = "必填欄位資料不完整，請重新確認。";
        return;
      }
      var subject = form.elements.subject.value.trim();
      var body = [
        "姓名：" + form.elements.name.value.trim(),
        "公司：" + form.elements.company.value.trim(),
        "信箱：" + form.elements.email.value.trim(),
        "電話：" + form.elements.tel.value.trim(),
        "地址：" + form.elements.address.value.trim(),
        "",
        form.elements.message.value.trim()
      ].join("\n");
      note.textContent = "已開啟郵件程式，請按寄出即可送到協會信箱。";
      var to = form.getAttribute("data-email") || "tge-service@gmail.com";
      window.location.href = "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  }

  var top = document.querySelector(".to-top");
  if (top) {
    window.addEventListener("scroll", function () {
      top.classList.toggle("show", window.scrollY > 280);
    });
    top.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();
