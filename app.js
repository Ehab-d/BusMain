(function () {
    const STORAGE_KEY = "busTableData";
    const VIEW_STORAGE_KEY = "busViewMode";

    const DEFAULT_BUSES = [
        { number: 9826, oilCounter: "", oilChangeDate: "", tires: "", repairs: "", notes: "" },
        { number: 9827, oilCounter: "", oilChangeDate: "", tires: "", repairs: "", notes: "" },
        { number: 9712, oilCounter: "", oilChangeDate: "", tires: "", repairs: "", notes: "" },
        { number: 9715, oilCounter: "", oilChangeDate: "", tires: "", repairs: "", notes: "" },
        { number: 9714, oilCounter: "", oilChangeDate: "", tires: "", repairs: "", notes: "" },
        { number: 9687, oilCounter: "", oilChangeDate: "", tires: "", repairs: "", notes: "" }
    ];

    let buses = [];
    let editingIndex = null;
    let currentView = "table"; // "table" أو "cards"

    const busTableBody = document.getElementById("busTableBody");
    const emptyState = document.getElementById("emptyState");
    const tableWrapper = document.getElementById("tableWrapper");

    const cardsWrapper = document.getElementById("cardsWrapper");
    const busCards = document.getElementById("busCards");
    const emptyStateCards = document.getElementById("emptyStateCards");

    const searchInput = document.getElementById("searchInput");
    const viewSelect = document.getElementById("viewSelect");

    const busModal = document.getElementById("busModal");
    const modalTitle = document.getElementById("modalTitle");
    const busForm = document.getElementById("busForm");

    const busNumberInput = document.getElementById("busNumber");
    const oilCounterInput = document.getElementById("oilCounter");
    const oilChangeDateInput = document.getElementById("oilChangeDate");
    const tiresInput = document.getElementById("tires");
    const repairsInput = document.getElementById("repairs");
    const notesInput = document.getElementById("notes");

    const addBusBtn = document.getElementById("addBusBtn");
    const saveBusBtn = document.getElementById("saveBusBtn");
    const clearFormBtn = document.getElementById("clearFormBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");

    function loadData() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                buses = JSON.parse(stored);
            } else {
                buses = DEFAULT_BUSES;
                saveData();
            }
        } catch (e) {
            buses = DEFAULT_BUSES;
        }
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
                <td>${bus.oilCounter || "-"}</td>
                <td>${bus.oilChangeDate || "-"}</td>
                <td>${bus.tires || "-"}</td>
                <td>${bus.repairs || "-"}</td>
                <td>${bus.notes || "-"}</td>
                <td class="actions-cell">
                    <button class="btn btn-sm secondary" data-action="edit" data-id="${bus.number}">تعديل</button>
                    <button class="btn btn-sm btn-danger" data-action="delete" data-id="${bus.number}">حذف</button>
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
                    <span class="bus-card__label">رقم السيارة</span>
                    <span class="bus-card__number">${bus.number}</span>
                </header>
                <div class="bus-card__body">
                    <div class="bus-card__row"><span>عداد الزيت:</span><span>${bus.oilCounter || "-"}</span></div>
                    <div class="bus-card__row"><span>ميعاد التغيير:</span><span>${bus.oilChangeDate || "-"}</span></div>
                    <div class="bus-card__row"><span>الإطارات:</span><span>${bus.tires || "-"}</span></div>
                    <div class="bus-card__row"><span>الإصلاحات:</span><span>${bus.repairs || "-"}</span></div>
                    <div class="bus-card__row bus-card__notes"><span>ملاحظات:</span><span>${bus.notes || "-"}</span></div>
                </div>
                <footer class="bus-card__footer actions-cell">
                    <button class="btn btn-sm secondary" data-action="edit" data-id="${bus.number}">تعديل</button>
                    <button class="btn btn-sm btn-danger" data-action="delete" data-id="${bus.number}">حذف</button>
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

        viewSelect.addEventListener("change", () => {
            switchView(viewSelect.value === "cards" ? "cards" : "table");
        });
    }

    function init() {
        loadData();

        let savedView = "cards";
        try {
            const storedView = localStorage.getItem(VIEW_STORAGE_KEY);
            if (storedView === "table" || storedView === "cards") {
                savedView = storedView;
            }
        } catch (e) {
            savedView = "cards";
        }

        if (viewSelect) {
            viewSelect.value = savedView;
        }

        switchView(savedView);
        initEvents();
    }

    document.addEventListener("DOMContentLoaded", init);
})();
