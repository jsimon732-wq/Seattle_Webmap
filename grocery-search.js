/* --------------------------------------------------
   Seattle grocery search helper
   loads seattle_groceries.json
   exposes window.SEATTLE_GROCERY_DATA
   provides local autocomplete helpers
-------------------------------------------------- */

async function loadSeattleGroceries(jsonUrl = "./seattle_groceries.json") {
    const response = await fetch(jsonUrl);
    if (!response.ok) {
        throw new Error("Could not load grocery dataset");
    }

    const data = await response.json();
    window.SEATTLE_GROCERY_DATA = data.stores || [];
    return window.SEATTLE_GROCERY_DATA;
}

function normalizeGroceryText(value) {
    return (value || "")
        .toLowerCase()
        .trim()
        .replace(/\bmarket\b/g, "")
        .replace(/\bcommunity\b/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function filterGroceries(query, groceries, limit = 8) {
    const q = normalizeGroceryText(query);
    if (!q) return [];

    const scored = groceries
        .map(store => {
            const name = normalizeGroceryText(store.name);
            const address = normalizeGroceryText(store.address);
            const category = normalizeGroceryText(store.category);

            let score = -1;

            if (name === q) {
                score = 100;
            } else if (name.startsWith(q)) {
                score = 80;
            } else if (name.includes(q)) {
                score = 60;
            } else if (address.includes(q)) {
                score = 40;
            } else if (category.includes(q)) {
                score = 20;
            }

            return { store, score };
        })
        .filter(item => item.score >= 0)
        .sort((a, b) => b.score - a.score || a.store.name.localeCompare(b.store.name))
        .slice(0, limit)
        .map(item => item.store);

    return scored;
}

function populateDatalist(results, datalistElement) {
    if (!datalistElement) return;

    datalistElement.innerHTML = "";

    results.forEach(store => {
        const option = document.createElement("option");
        option.value = store.name;
        option.label = store.address
            ? `${store.name} — ${store.category || "Grocery"} — ${store.address}`
            : `${store.name} — ${store.category || "Grocery"}`;
        datalistElement.appendChild(option);
    });
}

function updateLocalGrocerySuggestions(query, datalistId = "searchSuggestions") {
    const datalist = document.getElementById(datalistId);
    if (!datalist) return;

    datalist.innerHTML = "";

    if (!window.SEATTLE_GROCERY_DATA || !window.SEATTLE_GROCERY_DATA.length) {
        return;
    }

    const results = filterGroceries(query, window.SEATTLE_GROCERY_DATA, 8);
    populateDatalist(results, datalist);
}

function findLocalGroceryMatch(query) {
    if (!window.SEATTLE_GROCERY_DATA || !window.SEATTLE_GROCERY_DATA.length) {
        return null;
    }

    const q = normalizeGroceryText(query);
    if (!q) return null;

    let match = window.SEATTLE_GROCERY_DATA.find(store =>
        normalizeGroceryText(store.name) === q
    );
    if (match) return match;

    match = window.SEATTLE_GROCERY_DATA.find(store =>
        normalizeGroceryText(store.name).startsWith(q)
    );
    if (match) return match;

    match = window.SEATTLE_GROCERY_DATA.find(store =>
        normalizeGroceryText(store.name).includes(q)
    );
    if (match) return match;

    match = window.SEATTLE_GROCERY_DATA.find(store =>
        normalizeGroceryText(store.address).includes(q)
    );
    if (match) return match;

    return null;
}
