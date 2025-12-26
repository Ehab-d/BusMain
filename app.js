(function () {
    // -------------------------------------------------------------------------
    // 1. إعدادات SUPABASE
    // -------------------------------------------------------------------------
    // استبدل القيم التالية ببيانات مشروعك الحقيقية من لوحة تحكم Supabase
    const SUPABASE_URL = "https://zvqcseapqtfptsvjmsor.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2cWNzZWFwcXRmcHRzdmptc29yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEzNzA1MywiZXhwIjoyMDgxNzEzMDUzfQ._V6o5wEfPjvKFp2olyzg2icilLdWHhSKFZM6Dde_9jA";
    
    // تهيئة العميل
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const TABLE_NAME = "buses"; // اسم الجدول في Supabase

    // -------------------------------------------------------------------------
    // 2. المتغيرات العامة
    // -------------------------------------------------------------------------
    const VIEW_STORAGE_KEY = "busViewMode"; // سنحتفظ فقط بنمط العرض في التخزين المحلي لتحسين تجربة المستخدم

    let buses = [];
    let drivers = ["أمير سامي"]; 
    let editingId = null; // سنعتمد على ID الخاص بقاعدة البيانات بدلاً من Index المصفوفة
    let currentView = "table"; 

    // عناصر DOM
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

    // -------------------------------------------------------------------------
    // 3. دوال التعامل مع البيانات (Supabase)
    // -------------------------------------------------------------------------

    // دالة لتحويل بيانات Supabase (snake_case) إلى كائنات التطبيق (camelCase)
    function mapFromSupabase(record) {
        return {
            id: record.id, // Primary Key
            number: record.number,
            driverName: record.driver_name,
            oilCounter: record.oil_counter,
            oilChangeDate: record.oil_change_date,
            tires: record.tires,
            repairs: record.repairs,
            notes: record.notes
        };
    }

    // دالة لتحويل كائنات التطبيق إلى بيانات Supabase
    function mapToSupabase(bus) {
        return {
            number: bus.number,
            driver_name: bus.driverName,
            oil_counter: bus.oilCounter,
            oil_change_date: bus.oilChangeDate,
            tires: bus.tires,
            repairs: bus.repairs,
            notes: bus.notes
        };
    }

    async function loadData() {
        try {
            // إظهار حالة التحميل (اختياري)
            // busTableBody.innerHTML = '<tr><td colspan="8">جاري التحميل...</td></tr>';

            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select('*')
                .order('number', { ascending: true });

            if (error) throw error;

            if (data) {
                buses = data.map(mapFromSupabase);
                ensureDriversFromBuses();
                renderDriverOptions();
                render(searchInput.value);
            }
        } catch (error) {
            console.error("خطأ في جلب البيانات:", error.message);
            alert("حدث خطأ أثناء الاتصال بقاعدة البيانات.");
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
        // حفظ القيمة المختارة حالياً لإعادة تعيينها إذا لم تتغير
        const currentSelection = driverNameSelect.value;
        
        driverNameSelect.innerHTML = "";
        drivers.forEach((name) => {
            const opt = document.createElement("option");
            opt.value = name;
            opt.textContent = name;
            driverNameSelect.appendChild(opt);
        });

        if (currentSelection) driverNameSelect.value = currentSelection;
    }

    function filterBuses(filterValue = "") {
        const value = filterValue.trim();
        if (!value) return buses;
        return buses.filter((b) => String(b.number).includes(value));
    }

    // -------------------------------------------------------------------------
    // 4. دوال العرض (Rendering)
    // -------------------------------------------------------------------------

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
            // نستخدم bus.id للتعريف بدلاً من الرقم فقط لضمان الدقة
            tr.innerHTML = `
                <td>${bus.number}</td>
                <td>${bus.driverName || "-"}</td>
                <td>${bus.oilCounter || "-"}</td>
                <td>${bus.oilChangeDate || "-"}</td>
                <td>${bus.tires || "-"}</td>
                <td>${bus.repairs || "-"}</td>
                <td>${bus.notes || "-"}</td>
                <td class="actions-cell">
                    <button class="btn btn-sm secondary" data-action="edit" data-id="${bus.id}">
                        <span class="icon icon-edit" aria-hidden="true"></span>
                        <span>تعديل</span>
                    </button>
                    <button class="btn btn-sm btn-danger" data-action="delete" data-id="${bus.id}">
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
                    <button class="btn btn-sm secondary" data-action="edit" data-id="${bus.id}">
                        <span class="icon icon-edit" aria-hidden="true"></span>
                        <span>تعديل</span>
                    </button>
                    <button class="btn btn-sm btn-danger" data-action="delete" data-id="${bus.id}">
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

    // -------------------------------------------------------------------------
    // 5. إدارة المودال والنموذج
    // -------------------------------------------------------------------------

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
        editingId = null;
    }

    function clearForm() {
        busForm.reset();
        // إعادة تعيين السائق الافتراضي إذا وجد
        if (drivers.length > 0) driverNameSelect.value = drivers[0];
    }

    function fillForm(bus) {
        busNumberInput.value = bus.number;
        driverNameSelect.value = bus.driverName || (drivers[0] || "");
        oilCounterInput.value = bus.oilCounter || "";
        oilChangeDateInput.value = bus.oilChangeDate || "";
        tiresInput.value = bus.tires || "";
        repairsInput.value = bus.repairs || "";
        notesInput.value = bus.notes || "";
    }

    // -------------------------------------------------------------------------
    // 6. التعامل مع الحفظ (Insert/Update)
    // -------------------------------------------------------------------------

    async function handleSave() {
        if (!busNumberInput.value) {
            alert("رقم السيارة مطلوب");
            return;
        }

        saveBusBtn.disabled = true;
        saveBusBtn.textContent = "جاري الحفظ...";

        // تجهيز الكائن (JS format)
        const busDataJS = {
            number: Number(busNumberInput.value),
            driverName: driverNameSelect.value || "",
            oilCounter: oilCounterInput.value || "",
            oilChangeDate: oilChangeDateInput.value || "",
            tires: tiresInput.value || "",
            repairs: repairsInput.value || "",
            notes: notesInput.value || "",
        };

        // تحويله لـ Supabase format
        const payload = mapToSupabase(busDataJS);

        try {
            if (editingId) {
                // --- تحديث (Update) ---
                const { error } = await supabase
                    .from(TABLE_NAME)
                    .update(payload)
                    .eq('id', editingId);

                if (error) throw error;

            } else {
                // --- إضافة جديد (Insert) ---
                // تحقق اختياري: هل الرقم موجود مسبقاً؟
                // (يمكنك الاعتماد على Supabase unique constraint إذا قمت بضبطها)
                const existing = buses.find(b => b.number === busDataJS.number);
                if (existing) {
                    const confirmOverwrite = confirm("يوجد سيارة بنفس الرقم، هل تريد المتابعة وإضافة سجل جديد بنفس الرقم؟");
                    if (!confirmOverwrite) {
                         saveBusBtn.disabled = false;
                         saveBusBtn.textContent = "حفظ";
                         return;
                    }
                }

                const { error } = await supabase
                    .from(TABLE_NAME)
                    .insert([payload]);

                if (error) throw error;
            }

            // إعادة تحميل البيانات وتحديث الواجهة
            await loadData();
            closeModal();

        } catch (err) {
            console.error(err);
            alert("حدث خطأ أثناء حفظ البيانات: " + err.message);
        } finally {
            saveBusBtn.disabled = false;
            saveBusBtn.textContent = "حفظ";
        }
    }

    // -------------------------------------------------------------------------
    // 7. الاستيراد والتصدير
    // -------------------------------------------------------------------------

    function exportData() {
        // التصدير يعتمد على البيانات المحملة محلياً في buses
        const dataStr = JSON.stringify(buses, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "buses-data-supabase.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importDataFromFile(file) {
        if (!file) return;
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (!Array.isArray(parsed)) {
                    alert("ملف غير صالح: يجب أن يحتوي على قائمة سيارات.");
                    return;
                }

                if (!confirm("سيتم إضافة البيانات المستوردة إلى قاعدة البيانات. هل أنت متأكد؟")) {
                    importInput.value = "";
                    return;
                }

                // تجهيز البيانات للإرسال
                const rowsToInsert = parsed
                    .filter((item) => item && typeof item.number !== "undefined")
                    .map((item) => ({
                        // Mapping from JS Import Format -> Supabase Column Format
                        number: Number(item.number),
                        driver_name: item.driverName || "أمير سامي",
                        oil_counter: item.oilCounter || "",
                        oil_change_date: item.oilChangeDate || "",
                        tires: item.tires || "",
                        repairs: item.repairs || "",
                        notes: item.notes || ""
                    }));

                if (!rowsToInsert.length) {
                    alert("لا توجد بيانات صالحة للاستيراد.");
                    return;
                }

                // إرسال البيانات دفعة واحدة (Bulk Insert)
                const { error } = await supabase
                    .from(TABLE_NAME)
                    .insert(rowsToInsert);

                if (error) throw error;

                alert("تم استيراد البيانات بنجاح.");
                await loadData();

            } catch (err) {
                console.error(err);
                alert("حدث خطأ أثناء الاستيراد: " + err.message);
            } finally {
                importInput.value = "";
            }
        };

        reader.readAsText(file, "utf-8");
    }

    // -------------------------------------------------------------------------
    // 8. التعامل مع الأزرار داخل الجدول/البطاقات
    // -------------------------------------------------------------------------

    async function handleAction(e) {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;

        const action = btn.dataset.action;
        // هنا الـ id هو المعرف الحقيقي من قاعدة البيانات (int8)
        const id = Number(btn.dataset.id); 
        
        // البحث عن السيارة في المصفوفة المحلية للتأكد والتحضير
        const bus = buses.find((b) => b.id === id);
        if (!bus) return;

        if (action === "edit") {
            editingId = id; // تخزين الـ ID للتعديل
            openModal("edit", bus);
        } else if (action === "delete") {
            const sure = confirm(`هل أنت متأكد من حذف السيارة رقم ${bus.number}؟`);
            if (!sure) return;

            try {
                const { error } = await supabase
                    .from(TABLE_NAME)
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                
                await loadData(); // تحديث القائمة

            } catch (err) {
                alert("فشل الحذف: " + err.message);
            }
        }
    }

    // -------------------------------------------------------------------------
    // 9. تبديل العرض (View Switching)
    // -------------------------------------------------------------------------

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
            // سنبقي تفضيل العرض محلياً لأنه يخص واجهة المستخدم وليس البيانات
            localStorage.setItem(VIEW_STORAGE_KEY, currentView);
        } catch (e) {}

        render(searchInput.value);
    }

    // -------------------------------------------------------------------------
    // 10. تهيئة الأحداث (Event Listeners)
    // -------------------------------------------------------------------------

    function initEvents() {
        addBusBtn.addEventListener("click", () => {
            editingId = null;
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
        if(addDriverBtn) { // التأكد من وجود الزر
            addDriverBtn.addEventListener("click", () => {
                const name = prompt("أدخل اسم السائق الجديد:");
                if (!name) return;
                const trimmed = name.trim();
                if (!trimmed) return;
                
                // إضافة للقائمة المحلية والواجهة فقط (سيتم حفظها مع السيارة في DB)
                if (!drivers.includes(trimmed)) {
                    drivers.push(trimmed);
                    renderDriverOptions();
                }
                driverNameSelect.value = trimmed;
            });
        }

        busModal.addEventListener("click", (e) => {
            if (e.target === busModal.querySelector(".modal-backdrop")) {
                closeModal();
            }
        });

        searchInput.addEventListener("input", () => {
            render(searchInput.value);
        });

        // دمج معالج الجدول والبطاقات لأنهما يستخدمان نفس المنطق والـ ID
        busTableBody.addEventListener("click", handleAction);
        busCards.addEventListener("click", handleAction);

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

    // -------------------------------------------------------------------------
    // 11. التشغيل المبدئي
    // -------------------------------------------------------------------------

    function init() {
        // استعادة وضع العرض المفضل
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
        
        // جلب البيانات من السيرفر
        loadData();
    }

    document.addEventListener("DOMContentLoaded", init);
})();
