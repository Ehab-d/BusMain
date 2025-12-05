(function () {
    const STORAGE_KEY = "busTableData";
    const VIEW_STORAGE_KEY = "busViewMode";

    const DEFAULT_BUSES = [
        { number: 9826, driverName: "أمير سامي", oilCounter: "", oilChangeDate: "", tires: "", repairs: "", notes: "" },
        { number: 9827, driverName: "أمير سامي", oilCounter: "", oilChangeDate: "", tires: "", repairs: "", notes: "" },
        { number: 9712, driverName: "أمير سامي", oilCounter: "", oilChangeDate: "", tires: "", repairs: "", notes: "" },
        { number: 9715, driverName: "أمير سامي", oilCounter: "", oilChangeDate: "", tires: "", repairs: "", notes: "" },
        { number: 9714, driverName: "أمير سامي", oilCounter: "", oilChangeDate: "", tires: "", repairs: "", notes: "" },
        { number: 9687, driverName: "أمير سامي", oilCounter: "", oilChangeDate: "", tires: "", repairs: "", notes: "" }
    ];

    let buses = [];
    let drivers = ["أمير سامي"]; // قائمة السائقين المتاحة
    let editingIndex = null;
    let currentView = "table"; // "table" أو "cards"

    const busTableBody = document.getElementById("busTableBody");
    const emptyState = document.getElementById("emptyState");
    const tableWrapper = document.getElementById("tableWrapper");

    const cardsWrapper = document.getElementById("cardsWrapper");
    const busCards = document.getElementById("busCards");
    const emptyStateCards = document.getElementById("emptyStateCards");

    const searchInput = document.getElementById("searchInput");
    const viewMenuBtn = document.getElementById("viewMenuBtn");
    const viewMenu = document.getElementById("viewMenu");

    const busModal = document.getElementById("busModal");
    const modalTitle = document.getElementById("modalTitle");
    const busForm = document.getElementById("busForm");

    const busNumberInput = document.getElementById("busNumber");
    const driverNameSelect = document.getElementById("driverName");
    const oilCounterInput = document.getElementById("oilCounter");
    const oilChangeDateInput = document.getElementById("oilChangeDate");
    const tiresInput = document.getElementById("tires");
    const repairsInput = document.getElementById("repairs");
    const notesInput = document.getElementById("notes");

    const addBusBtn = document.getElementById("addBusBtn");
    const dataMenuBtn = document.getElementById("dataMenuBtn");
    const dataMenu = document.getElementById("dataMenu");
    const exportBtn = document.getElementById("exportBtn");
    const importInput = document.getElementById("importInput");
    const saveBusBtn = document.getElementById("saveBusBtn");
    const clearFormBtn = document.getElementById("clearFormBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");

    function loadData() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // ضمان وجود driverName حتى لو كانت بيانات قديمة
                buses = parsed.map((b) => ({
                    number: b.number,
                    driverName: b.driverName || "أمير سامي",
                    oilCounter: b.oilCounter || "",
                    oilChangeDate: b.oilChangeDate || "",
                    tires: b.tires || "",
                    repairs: b.repairs || "",
                    notes: b.notes || "",
                }));
            } else {
                buses = DEFAULT_BUSES;
                saveData();
            }
        } catch (e) {
            buses = DEFAULT_BUSES;
        }
    }

    function ensureDriversFromBuses() {
        const names = new Set(drivers);
        buses.forEach((b) => {
            if (b.driverName) names.add(b.driverName);
        });
        drivers = Array.from(names);
    }

    function renderDriverOptions() {
        driverNameSelect.innerHTML = "";
        drivers.forEach((name) => {
            const opt = document.createElement("option");
            opt.value = name;
            opt.textContent = name;
            driverNameSelect.appendChild(opt);
        });
    }

    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(buses));
        } catch (e) {
            console.error("تعذر حفظ البيانات في التخزين المحلي", e);
        }
    }

    function filterBuses(filterValue = "") {
        const value = filterValue.trim();
        if (!value) return buses;
        return buses.filter((b) => String(b.number).includes(value));
    }

    function renderTable(filterValue = "") {
        const filtered = filterBuses(filterValue);
        busTableBody.innerHTML = "";

        if (!filtered.length) {
            emptyState.style.display = "block";
            return;
        }
        emptyState.style.display = "none";

        filtered.forEach((bus) => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${bus.number}</td>
                <td>${bus.driverName || "-"}</td>
                <td>${bus.oilCounter || "-"}</td>
                <td>${bus.oilChangeDate || "-"}</td>
                <td>${bus.tires || "-"}</td>
                <td>${bus.repairs || "-"}</td>
                <td>${bus.notes || "-"}</td>
                <td class="actions-cell">
                    <button class="btn btn-sm secondary" data-action="edit" data-id="${bus.number}">
                        <span class="icon icon-edit" aria-hidden="true"></span>
                        <span>تعديل</span>
                    </button>
                    <button class="btn btn-sm btn-danger" data-action="delete" data-id="${bus.number}">
                        <span class="icon icon-delete" aria-hidden="true"></span>
                        <span>حذف</span>
                    </button>
                </td>
            `;

            busTableBody.appendChild(tr);
        });
    }

    function renderCards(filterValue = "") {
        const filtered = filterBuses(filterValue);
        busCards.innerHTML = "";

        if (!filtered.length) {
            emptyStateCards.style.display = "block";
            return;
        }
        emptyStateCards.style.display = "none";

        filtered.forEach((bus) => {
            const card = document.createElement("article");
            card.className = "bus-card";
            card.innerHTML = `
                <header class="bus-card__header">
                    <div>
                        <span class="bus-card__label">رقم السيارة</span>
                        <span class="bus-card__number">${bus.number}</span>
                    </div>
                    <div class="bus-card__driver">${bus.driverName || "بدون سائق"}</div>
                </header>
                <div class="bus-card__body">
                    <div class="bus-card__row"><span>عداد الزيت:</span><span>${bus.oilCounter || "-"}</span></div>
                    <div class="bus-card__row"><span>ميعاد التغيير:</span><span>${bus.oilChangeDate || "-"}</span></div>
                    <div class="bus-card__row"><span>الإطارات:</span><span>${bus.tires || "-"}</span></div>
                    <div class="bus-card__row"><span>الإصلاحات:</span><span>${bus.repairs || "-"}</span></div>
                    <div class="bus-card__row bus-card__notes"><span>ملاحظات:</span><span>${bus.notes || "-"}</span></div>
                </div>
                <footer class="bus-card__footer actions-cell">
                    <button class="btn btn-sm secondary" data-action="edit" data-id="${bus.number}">
                        <span class="icon icon-edit" aria-hidden="true"></span>
                        <span>تعديل</span>
                    </button>
                    <button class="btn btn-sm btn-danger" data-action="delete" data-id="${bus.number}">
                        <span class="icon icon-delete" aria-hidden="true"></span>
                        <span>حذف</span>
                    </button>
                </footer>
            `;
            busCards.appendChild(card);
        });
    }

    function render(filterValue = "") {
        if (currentView === "table") {
            renderTable(filterValue);
        } else {
            renderCards(filterValue);
        }
    }

    function openModal(mode, bus) {
        busModal.classList.remove("hidden");
        if (mode === "edit") {
            modalTitle.textContent = "تعديل سيارة";
            fillForm(bus);
        } else {
            modalTitle.textContent = "إضافة سيارة";
            clearForm();
        }
    }

    function closeModal() {
        busModal.classList.add("hidden");
        editingIndex = null;
    }

    function clearForm() {
        busForm.reset();
    }

    function fillForm(bus) {
        busNumberInput.value = bus.number;
        driverNameSelect.value = bus.driverName || drivers[0] || "";
        oilCounterInput.value = bus.oilCounter || "";
        oilChangeDateInput.value = bus.oilChangeDate || "";
        tiresInput.value = bus.tires || "";
        repairsInput.value = bus.repairs || "";
        notesInput.value = bus.notes || "";
    }

    function handleSave() {
        if (!busNumberInput.value) {
            alert("رقم السيارة مطلوب");
            return;
        }

        const busData = {
            number: Number(busNumberInput.value),
            driverName: driverNameSelect.value || "",
            oilCounter: oilCounterInput.value || "",
            oilChangeDate: oilChangeDateInput.value || "",
            tires: tiresInput.value || "",
            repairs: repairsInput.value || "",
            notes: notesInput.value || "",
        };

        const existingIndex = buses.findIndex(
            (b, index) => b.number === busData.number && index !== editingIndex
        );
        if (existingIndex !== -1) {
            const overwrite = confirm("يوجد سجل بنفس رقم السيارة، هل تريد استبداله؟");
            if (!overwrite) return;
        }

        if (editingIndex !== null) {
            buses[editingIndex] = busData;
        } else {
            buses.push(busData);
        }

        saveData();
        render(searchInput.value);
        closeModal();
    }

    function exportData() {
        const dataStr = JSON.stringify(buses, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "buses-data.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importDataFromFile(file) {
        if (!file) return;
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (!Array.isArray(parsed)) {
                    alert("ملف غير صالح: يجب أن يحتوي على قائمة سيارات.");
                    return;
                }

                const normalized = parsed
                    .filter((item) => item && typeof item.number !== "undefined")
                    .map((item) => ({
                        number: Number(item.number),
                        driverName: item.driverName || "أمير سامي",
                        oilCounter: item.oilCounter || "",
                        oilChangeDate: item.oilChangeDate || "",
                        tires: item.tires || "",
                        repairs: item.repairs || "",
                        notes: item.notes || "",
                    }));

                if (!normalized.length) {
                    alert("الملف لا يحتوي على بيانات صالحة.");
                    return;
                }

                if (!confirm("سيتم استبدال البيانات الحالية بالبيانات المستوردة، هل أنت متأكد؟")) {
                    return;
                }

                buses = normalized;
                saveData();
                render(searchInput.value);
                alert("تم استيراد البيانات بنجاح.");
            } catch (err) {
                alert("حدث خطأ أثناء قراءة الملف، تأكد أنه ملف JSON صالح.");
            } finally {
                importInput.value = "";
            }
        };

        reader.readAsText(file, "utf-8");
    }

    function handleRowAction(e) {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;

        const action = btn.dataset.action;
        const id = Number(btn.dataset.id);
        const index = buses.findIndex((b) => b.number === id);
        if (index === -1) return;

        if (action === "edit") {
            editingIndex = index;
            openModal("edit", buses[index]);
        } else if (action === "delete") {
            const sure = confirm("هل أنت متأكد من حذف هذه السيارة؟");
            if (!sure) return;
            buses.splice(index, 1);
            saveData();
            render(searchInput.value);
        }
    }

    function handleCardAction(e) {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;

        const action = btn.dataset.action;
        const id = Number(btn.dataset.id);
        const index = buses.findIndex((b) => b.number === id);
        if (index === -1) return;

        if (action === "edit") {
            editingIndex = index;
            openModal("edit", buses[index]);
        } else if (action === "delete") {
            const sure = confirm("هل أنت متأكد من حذف هذه السيارة؟");
            if (!sure) return;
            buses.splice(index, 1);
            saveData();
            render(searchInput.value);
        }
    }

    function switchView(view) {
        currentView = view === "cards" ? "cards" : "table";

        if (currentView === "table") {
            tableWrapper.classList.remove("hidden");
            cardsWrapper.classList.add("hidden");
        } else {
            tableWrapper.classList.add("hidden");
            cardsWrapper.classList.remove("hidden");
        }

        try {
            localStorage.setItem(VIEW_STORAGE_KEY, currentView);
        } catch (e) {
            // تجاهل أخطاء التخزين
        }

        render(searchInput.value);
    }

    function initEvents() {
        addBusBtn.addEventListener("click", () => {
            editingIndex = null;
            openModal("add");
        });

        saveBusBtn.addEventListener("click", handleSave);

        clearFormBtn.addEventListener("click", (e) => {
            e.preventDefault();
            clearForm();
        });

        closeModalBtn.addEventListener("click", (e) => {
            e.preventDefault();
            closeModal();
        });

        const addDriverBtn = document.getElementById("addDriverBtn");
        addDriverBtn.addEventListener("click", () => {
            const name = prompt("أدخل اسم السائق الجديد:");
            if (!name) return;
            const trimmed = name.trim();
            if (!trimmed) return;
            if (!drivers.includes(trimmed)) {
                drivers.push(trimmed);
                renderDriverOptions();
            }
            driverNameSelect.value = trimmed;
        });

        busModal.addEventListener("click", (e) => {
            if (e.target === busModal.querySelector(".modal-backdrop")) {
                closeModal();
            }
        });

        searchInput.addEventListener("input", () => {
            render(searchInput.value);
        });

        busTableBody.addEventListener("click", handleRowAction);
        busCards.addEventListener("click", handleCardAction);

        viewMenuBtn.addEventListener("click", () => {
            viewMenu.classList.toggle("hidden");
        });

        dataMenuBtn.addEventListener("click", () => {
            dataMenu.classList.toggle("hidden");
        });

        document.addEventListener("click", (e) => {
            if (!dataMenu.contains(e.target) && !dataMenuBtn.contains(e.target)) {
                dataMenu.classList.add("hidden");
            }
            if (!viewMenu.contains(e.target) && !viewMenuBtn.contains(e.target)) {
                viewMenu.classList.add("hidden");
            }
        });

        exportBtn.addEventListener("click", () => {
            exportData();
            dataMenu.classList.add("hidden");
        });

        importInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            importDataFromFile(file);
            dataMenu.classList.add("hidden");
        });

        viewMenu.addEventListener("click", (e) => {
            const btn = e.target.closest(".data-menu-item[data-view]");
            if (!btn) return;
            const view = btn.dataset.view === "table" ? "table" : "cards";
            switchView(view);
            viewMenu.classList.add("hidden");
        });
    }

    function init() {
        loadData();
        ensureDriversFromBuses();
        renderDriverOptions();

        let savedView = "cards";
        try {
            const storedView = localStorage.getItem(VIEW_STORAGE_KEY);
            if (storedView === "table" || storedView === "cards") {
                savedView = storedView;
            }
        } catch (e) {
            savedView = "cards";
        }

        switchView(savedView);
        initEvents();
    }

    document.addEventListener("DOMContentLoaded", init);
})();
