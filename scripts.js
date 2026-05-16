// clock
function updateClock() {
    const now = new Date();
    document.getElementById("clock").innerText =
        now.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
}

updateClock();
setInterval(updateClock, 1000);

// random quotes
function typeText(element, text, speed = 40) {
    return new Promise((resolve) => {
        if (!element) {
            resolve();
            return;
        }
        element.textContent = "";
        let i = 0;

        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else {
                resolve();
            }
        }

        type();
    });
}

async function loadQuote() {
    const quoteEl = document.getElementById("quote");
    const authorEl = document.getElementById("author");

    try {
        const response = await fetch(
            "https://api.api-ninjas.com/v2/randomquotes?categories=success,wisdom",
            {
                headers: {
                    "X-Api-Key":
                        "PHQukx8On1aTEcHRIPxj6KSNzhkx87IjaCkMq1P3",
                },
            }
        );

        const data = await response.json();

        const quote = `"${data[0].quote}"`;
        const author = `— ${data[0].author}`;

        await typeText(quoteEl, quote, 40);
        quoteEl?.classList.add("done");
        await typeText(authorEl, author, 30);
    } catch (error) {
        await typeText(quoteEl, "Failed to load quote.", 40);
        quoteEl?.classList.add("done");
        if (authorEl) authorEl.textContent = "";
    }
}

loadQuote();

// —— quick links (localStorage CRUD + Ctrl/Cmd+S settings)

const LINKS_STORAGE_KEY = "homepageV2_quickLinks";

const DEFAULT_LINKS = [
    { label: "Google", href: "https://google.com" },
    { label: "YouTube", href: "https://youtube.com" },
    { label: "Reddit", href: "https://www.reddit.com/" },
    { label: "ChatGPT", href: "https://chatgpt.com" },
];

function normalizeHref(raw) {
    let u = raw.trim();
    if (!u) return u;
    if (!/^https?:\/\//i.test(u)) {
        u = "https://" + u.replace(/^\/+/, "");
    }
    return u;
}

function loadLinks() {
    try {
        const raw = localStorage.getItem(LINKS_STORAGE_KEY);
        if (!raw) return DEFAULT_LINKS.map((x) => ({ ...x }));
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return DEFAULT_LINKS.map((x) => ({ ...x }));
        const cleaned = parsed
            .filter((x) => x && typeof x.label === "string" && typeof x.href === "string")
            .map((x) => ({
                label: x.label.trim(),
                href: normalizeHref(x.href.trim()),
            }))
            .filter((x) => x.label && x.href);
        return cleaned;
    } catch {
        return DEFAULT_LINKS.map((x) => ({ ...x }));
    }
}

function saveLinks(links) {
    localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(links));
}

function getLinkHost(href) {
    try {
        return new URL(href).hostname.replace(/^www\./i, "");
    } catch {
        return "";
    }
}

function getLinkInitial(label, href) {
    const source = label.trim() || getLinkHost(href);
    return (source.charAt(0) || "?").toUpperCase();
}

function renderQuickLinks() {
    const container = document.getElementById("links");
    if (!container) return;
    container.replaceChildren();
    for (const { label, href } of loadLinks()) {
        const a = document.createElement("a");
        const host = getLinkHost(href);
        const icon = document.createElement("span");
        const favicon = document.createElement("img");
        const initial = document.createElement("span");
        const text = document.createElement("span");

        a.href = href;
        a.setAttribute("aria-label", `${label}${host ? ` (${host})` : ""}`);
        a.target = "_blank";
        a.rel = "noopener noreferrer";

        icon.className = "link-icon";
        icon.setAttribute("aria-hidden", "true");

        favicon.alt = "";
        favicon.loading = "lazy";
        favicon.src =
            "https://www.google.com/s2/favicons?sz=64&domain_url=" +
            encodeURIComponent(href);
        favicon.addEventListener("error", () => {
            icon.classList.add("is-fallback");
        });

        initial.className = "link-icon__initial";
        initial.textContent = getLinkInitial(label, href);

        text.className = "link-label";
        text.textContent = label;

        icon.append(favicon, initial);
        a.append(icon, text);
        container.appendChild(a);
    }
}

const linkSettingsRoot = document.getElementById("link-settings");
const linkSettingsRows = document.getElementById("link-settings-rows");
const linkSettingsBackdrop = linkSettingsRoot?.querySelector(".link-settings__backdrop");
const linkSettingsAdd = document.getElementById("link-settings-add");
const linkSettingsSave = document.getElementById("link-settings-save");
const linkSettingsCancel = document.getElementById("link-settings-cancel");
const linkSettingsToggle = document.getElementById("link-settings-toggle");

function isLinkSettingsOpen() {
    return linkSettingsRoot?.classList.contains("is-open") ?? false;
}

let linkSettingsScrollY = 0;

function lockScrollForLinkSettings() {
    linkSettingsScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.style.position = "fixed";
    document.body.style.top = `-${linkSettingsScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
}

function unlockScrollForLinkSettings() {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    window.scrollTo(0, linkSettingsScrollY);
}

function createLinkRow(label = "", href = "") {
    const row = document.createElement("div");
    row.className = "link-settings__card";

    const inpLabel = document.createElement("input");
    inpLabel.type = "text";
    inpLabel.className = "link-settings__input link-settings__input--label";
    inpLabel.placeholder = "Name";
    inpLabel.autocomplete = "off";
    inpLabel.value = label;

    const inpHref = document.createElement("input");
    inpHref.type = "text";
    inpHref.className = "link-settings__input link-settings__input--url";
    inpHref.placeholder = "https://…";
    inpHref.value = href;
    inpHref.spellcheck = false;
    inpHref.autocomplete = "off";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "link-settings__remove";
    removeBtn.setAttribute("aria-label", "Remove this link");
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => row.remove());

    row.append(inpLabel, inpHref, removeBtn);
    return row;
}

function fillLinkSettingsEditor() {
    if (!linkSettingsRows) return;
    linkSettingsRows.replaceChildren();
    const links = loadLinks();
    if (links.length === 0) {
        linkSettingsRows.appendChild(createLinkRow());
    } else {
        for (const { label, href } of links) {
            linkSettingsRows.appendChild(createLinkRow(label, href));
        }
    }
}

function collectLinksFromEditor() {
    if (!linkSettingsRows) return [];
    const rows = linkSettingsRows.querySelectorAll(".link-settings__card");
    const out = [];
    for (const row of rows) {
        const inputs = row.querySelectorAll("input");
        const label = inputs[0]?.value.trim() ?? "";
        const hrefRaw = inputs[1]?.value.trim() ?? "";
        if (!label && !hrefRaw) continue;
        if (!label || !hrefRaw) {
            inputs[0]?.focus();
            throw new Error("Each row needs both a label and a URL (or clear the row).");
        }
        const href = normalizeHref(hrefRaw);
        try {
            new URL(href);
        } catch {
            inputs[1]?.focus();
            throw new Error("Invalid URL.");
        }
        out.push({ label, href });
    }
    return out;
}

function openLinkSettings() {
    if (!linkSettingsRoot) return;
    closeSearchSuggest();
    fillLinkSettingsEditor();
    linkSettingsRoot.classList.add("is-open");
    linkSettingsRoot.setAttribute("aria-hidden", "false");
    document.body.classList.add("link-settings-active");
    lockScrollForLinkSettings();
    linkSettingsToggle?.setAttribute("aria-expanded", "true");
    const first = linkSettingsRows?.querySelector("input");
    first?.focus();
}

function closeLinkSettings() {
    if (!linkSettingsRoot) return;
    linkSettingsRoot.classList.remove("is-open");
    linkSettingsRoot.setAttribute("aria-hidden", "true");
    document.body.classList.remove("link-settings-active");
    unlockScrollForLinkSettings();
    linkSettingsToggle?.setAttribute("aria-expanded", "false");
}

function saveLinkSettings() {
    try {
        const links = collectLinksFromEditor();
        saveLinks(links);
        renderQuickLinks();
        closeLinkSettings();
    } catch (err) {
        window.alert(err.message || "Could not save links.");
    }
}

function handleLinkSettingsShortcut() {
    if (isLinkSettingsOpen()) {
        saveLinkSettings();
    } else {
        openLinkSettings();
    }
}

linkSettingsAdd?.addEventListener("click", () => {
    linkSettingsRows?.appendChild(createLinkRow());
    linkSettingsRows?.lastElementChild?.querySelector("input")?.focus();
});

linkSettingsSave?.addEventListener("click", saveLinkSettings);

linkSettingsCancel?.addEventListener("click", closeLinkSettings);

linkSettingsBackdrop?.addEventListener("click", closeLinkSettings);

linkSettingsBackdrop?.addEventListener(
    "touchmove",
    (e) => e.preventDefault(),
    { passive: false }
);

linkSettingsToggle?.addEventListener("click", openLinkSettings);

renderQuickLinks();

// focus shortcut for searchbar + settings (Ctrl/Cmd+S)

const searchInput = document.getElementById("search-q");
const searchForm = document.querySelector(".search-box");
const searchSuggestEl = document.getElementById("search-suggest");
const RECENT_SEARCH_KEY = "homepageV2_recentSearches";
const RECENT_SEARCH_MAX = 12;

let suggestToken = 0;
let suggestDebounceTimer = null;
let suggestActiveIndex = -1;
let lastSuggestItems = [];

function loadRecentSearches() {
    try {
        const raw = localStorage.getItem(RECENT_SEARCH_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((x) => typeof x === "string")
            .map((x) => x.trim())
            .filter(Boolean)
            .slice(0, RECENT_SEARCH_MAX);
    } catch {
        return [];
    }
}

function rememberSearchQuery(query) {
    const q = query.trim();
    if (!q) return;
    const lower = q.toLowerCase();
    const next = [
        q,
        ...loadRecentSearches().filter((x) => x.toLowerCase() !== lower),
    ].slice(0, RECENT_SEARCH_MAX);
    localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
}

function parseGoogleSuggestPayload(data) {
    if (!Array.isArray(data) || data.length < 2) return [];
    const list = data[1];
    if (!Array.isArray(list)) return [];
    return list
        .map((row) =>
            Array.isArray(row) ? row[0] : typeof row === "string" ? row : ""
        )
        .filter((s) => typeof s === "string" && s.length > 0)
        .slice(0, 10);
}

function fetchGoogleSuggestJSONP(query, onDone) {
    const cbName =
        "_gSb_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 10);
    const script = document.createElement("script");
    let settled = false;

    const settle = (items) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        if (script.parentNode) script.parentNode.removeChild(script);
        try {
            delete window[cbName];
        } catch {
            /* ignore */
        }
        onDone(items);
    };

    const timer = window.setTimeout(() => settle([]), 4500);

    window[cbName] = (payload) => {
        try {
            settle(parseGoogleSuggestPayload(payload));
        } catch {
            settle([]);
        }
    };

    script.onerror = () => settle([]);
    script.src =
        "https://suggestqueries.google.com/complete/search?client=chrome&hl=en&q=" +
        encodeURIComponent(query) +
        "&jsonp=" +
        encodeURIComponent(cbName);
    document.head.appendChild(script);
}

function isSearchSuggestOpen() {
    return Boolean(searchSuggestEl && !searchSuggestEl.hidden);
}

function setSuggestAriaOpen(open) {
    searchInput?.setAttribute("aria-expanded", open ? "true" : "false");
}

function closeSearchSuggest() {
    if (!searchSuggestEl) return;
    searchSuggestEl.hidden = true;
    searchSuggestEl.replaceChildren();
    suggestActiveIndex = -1;
    lastSuggestItems = [];
    setSuggestAriaOpen(false);
}

function updateSuggestHighlight() {
    if (!searchSuggestEl) return;
    const opts = searchSuggestEl.querySelectorAll(".search-suggest__item");
    opts.forEach((el, i) => {
        el.setAttribute("aria-selected", i === suggestActiveIndex ? "true" : "false");
        el.classList.toggle("is-active", i === suggestActiveIndex);
    });
    const active = opts[suggestActiveIndex];
    active?.scrollIntoView({ block: "nearest" });
}

function renderSuggestItems(items, headerText) {
    if (!searchSuggestEl) return;
    searchSuggestEl.replaceChildren();
    lastSuggestItems = items.slice();
    suggestActiveIndex = items.length ? 0 : -1;

    if (headerText) {
        const meta = document.createElement("div");
        meta.className = "search-suggest__meta";
        meta.textContent = headerText;
        searchSuggestEl.appendChild(meta);
    }

    items.forEach((text, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "search-suggest__item";
        btn.setAttribute("role", "option");
        btn.id = `search-suggest-opt-${i}`;
        btn.textContent = text;
        btn.setAttribute("aria-selected", i === 0 ? "true" : "false");
        btn.addEventListener("mousedown", (e) => {
            e.preventDefault();
            applySuggestion(text);
        });
        searchSuggestEl.appendChild(btn);
    });

    const has = items.length > 0;
    searchSuggestEl.hidden = !has;
    setSuggestAriaOpen(has);
    updateSuggestHighlight();
}

function submitSearchForm() {
    if (!searchForm) return;
    if (typeof searchForm.requestSubmit === "function") {
        searchForm.requestSubmit();
        return;
    }
    const tmp = document.createElement("button");
    tmp.type = "submit";
    tmp.tabIndex = -1;
    tmp.setAttribute("aria-hidden", "true");
    tmp.style.cssText =
        "position:absolute;width:0;height:0;opacity:0;pointer-events:none;";
    searchForm.appendChild(tmp);
    tmp.click();
    searchForm.removeChild(tmp);
}

function applySuggestion(text) {
    if (searchInput) searchInput.value = text;
    closeSearchSuggest();
    submitSearchForm();
}

function showRecentSuggestions() {
    const recent = loadRecentSearches();
    if (!recent.length) {
        closeSearchSuggest();
        return;
    }
    renderSuggestItems(recent, "Recent searches");
}

function queueSuggestFetch() {
    const q = (searchInput?.value ?? "").trim();
    suggestToken += 1;
    const myToken = suggestToken;
    window.clearTimeout(suggestDebounceTimer);
    if (!q) {
        closeSearchSuggest();
        return;
    }
    suggestDebounceTimer = window.setTimeout(() => {
        fetchGoogleSuggestJSONP(q, (items) => {
            if (myToken !== suggestToken) return;
            if ((searchInput?.value ?? "").trim() !== q) return;
            if (!items.length) {
                closeSearchSuggest();
                return;
            }
            renderSuggestItems(items);
        });
    }, 200);
}

searchForm?.addEventListener("submit", () => {
    rememberSearchQuery(searchInput?.value ?? "");
});

searchInput?.addEventListener("input", queueSuggestFetch);

searchInput?.addEventListener("focus", () => {
    const q = (searchInput?.value ?? "").trim();
    if (q) queueSuggestFetch();
    else showRecentSuggestions();
});

searchInput?.addEventListener("blur", () => {
    window.setTimeout(() => {
        if (!searchSuggestEl?.contains(document.activeElement)) {
            closeSearchSuggest();
        }
    }, 150);
});

searchInput?.addEventListener("keydown", (e) => {
    if (!isSearchSuggestOpen() || lastSuggestItems.length === 0) {
        if (
            e.key === "ArrowDown" &&
            searchInput === document.activeElement &&
            !(searchInput?.value ?? "").trim()
        ) {
            showRecentSuggestions();
            e.preventDefault();
        }
        return;
    }

    const n = lastSuggestItems.length;
    if (e.key === "ArrowDown") {
        e.preventDefault();
        suggestActiveIndex = (suggestActiveIndex + 1) % n;
        updateSuggestHighlight();
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        suggestActiveIndex = (suggestActiveIndex - 1 + n) % n;
        updateSuggestHighlight();
    } else if (e.key === "Enter") {
        if (suggestActiveIndex >= 0 && suggestActiveIndex < n) {
            e.preventDefault();
            applySuggestion(lastSuggestItems[suggestActiveIndex]);
        }
    } else if (e.key === "Escape") {
        e.preventDefault();
        closeSearchSuggest();
    }
});

document.addEventListener("keydown", (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        handleLinkSettingsShortcut();
        return;
    }

    if (e.key === "Escape" && isSearchSuggestOpen()) {
        e.preventDefault();
        closeSearchSuggest();
        return;
    }

    if (e.key === "Escape" && isLinkSettingsOpen()) {
        e.preventDefault();
        closeLinkSettings();
        return;
    }

    if (e.key === "/") {
        const t = e.target;
        if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) {
            return;
        }
        e.preventDefault();
        searchInput?.focus();
    }
});