const API_BASE = "http://localhost:5093/api";

// ── STATE MANAGEMENT ──────────────────────────────────────────
let _firmwareEditingId = null;
let _groupEditingId = null;

// ── CORE UTILITIES ────────────────────────────────────────────

async function api(endpoint, options = {}) {
    const defaultHeaders = { "Content-Type": "application/json" };
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: { ...defaultHeaders, ...options.headers }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw error;
    }
    return response.status === 204 ? null : response.json();
}

const UI = {
    setMain: (html) => document.getElementById("content").innerHTML = html,
    setTitle: (title) => document.getElementById("sectionTitle").textContent = title,
    setCount: (n) => document.getElementById("rowCount").textContent = n != null ? `${n} record${n !== 1 ? "s" : ""}` : "",
    setActiveNav: (btn) => {
        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        if (btn) btn.classList.add("active");
    },
    showLoading: () => {
        UI.setCount(null);
        UI.setMain(`<div class="state-box"><div class="spinner"></div><span>Loading...</span></div>`);
    },
    showToast: (msg, isError = false) => {
        let t = document.getElementById("toast") || document.createElement("div");
        t.id = "toast";
        if (!t.parentElement) document.body.appendChild(t);
        t.textContent = msg;
        t.className = `toast ${isError ? "toast-error" : ""} toast-show`;
        setTimeout(() => t.classList.remove("toast-show"), 4000);
    }
};

// ── DEVICES ───────────────────────────────────────────────────

async function loadDevices(btn) {
    UI.setActiveNav(btn);
    UI.setTitle("Device Inventory");
    UI.showLoading();

    try {
        const [devices, firmware] = await Promise.all([
            api("/devices"),
            api("/firmware")
        ]);

        let html = `
            <div style="overflow-x:auto">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th><th>Name</th><th>Serial</th><th>Type</th><th>Current FW</th><th>Action</th>
                        </tr>
                    </thead>
                    <tbody>`;

        devices.forEach(d => {
            const compatible = firmware.filter(f => f.deviceTypeID === d.deviceTypeID);
            const options = compatible.map(f =>
                `<option value="${f.firmwareID}" ${f.firmwareID === d.firmwareID ? "selected" : ""}>${f.version}</option>`
            ).join("");

            html += `
                <tr>
                    <td>${d.deviceID}</td>
                    <td><strong>${d.name}</strong></td>
                    <td><code>${d.serialNumber}</code></td>
                    <td><span class="badge badge-blue">${d.deviceType?.name || d.deviceTypeID}</span></td>
                    <td><span class="badge badge-gray">${d.firmware?.version || "None"}</span></td>
                    <td class="row-actions">
                        <select class="firmware-select" id="fw-select-${d.deviceID}">
                            <option value="">-- Assign --</option>
                            ${options}
                        </select>
                        <button class="btn btn-ghost btn-sm" onclick="assignFirmware(${d.deviceID})">Update</button>
                    </td>
                </tr>`;
        });

        UI.setMain(html + `</tbody></table></div>`);
        UI.setCount(devices.length);
    } catch (err) {
        UI.showToast("Failed to load devices", true);
    }
}

async function assignFirmware(id) {
    const fwId = parseInt(document.getElementById(`fw-select-${id}`).value);
    if (!fwId) return UI.showToast("Select a version first", true);

    try {
        await api(`/devices/${id}/firmware`, { method: "PUT", body: JSON.stringify({ FirmwareID: fwId }) });
        UI.showToast("Firmware updated successfully");
        loadDevices(document.querySelector(".nav-btn.active"));
    } catch (err) {
        UI.showToast(err.message || "Compatibility error", true);
    }
}

// ── FIRMWARE ──────────────────────────────────────────────────

async function loadFirmware(btn) {
    UI.setActiveNav(btn);
    UI.setTitle("Firmware Management");
    _firmwareEditingId = null;
    UI.showLoading();

    try {
        const types = await api("/devicetypes");
        const typeOptions = types.map(t => `<option value="${t.deviceTypeID}">${t.name}</option>`).join("");

        UI.setMain(`
            <div class="crud-form" id="firmwareForm">
                <div class="form-row">
                    <div class="form-field">
                        <label>Device Type</label>
                        <select id="fw-deviceTypeID"><option value="">-- Select Type --</option>${typeOptions}</select>
                    </div>
                    <div class="form-field">
                        <label>Version</label>
                        <input id="fw-version" type="text" placeholder="1.0.0">
                    </div>
                    <div class="form-field">
                        <label>Release Date</label>
                        <input id="fw-releaseDate" type="date">
                    </div>
                    <div class="form-field form-field--grow">
                        <label>Description</label>
                        <input id="fw-description" type="text">
                    </div>
                    <div class="form-field form-field--actions">
                        <label>&nbsp;</label>
                        <div style="display:flex;gap:6px">
                            <button class="btn btn-primary" onclick="saveFirmware()">Add</button>
                            <button class="btn btn-ghost" id="fw-cancel" onclick="cancelFirmwareEdit()" style="display:none">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
            <div id="fw-table-wrap"></div>`);

        await refreshFirmwareTable();
    } catch (e) { UI.showToast("Error initializing form", true); }
}

async function refreshFirmwareTable() {
    const data = await api("/firmware");
    let html = `
        <div style="overflow-x:auto; margin-top:20px;">
            <table>
                <thead><tr><th>ID</th><th>Type</th><th>Version</th><th>Date</th><th>Description</th><th>Actions</th></tr></thead>
                <tbody>`;

    data.forEach(f => {
        const date = f.releaseDate ? f.releaseDate.split("T")[0] : "";
        const args = [f.firmwareID, f.deviceTypeID, `'${f.version}'`, `'${date}'`, `'${f.description || ""}'`].join(",");

        html += `
            <tr>
                <td>${f.firmwareID}</td>
                <td><span class="badge badge-blue">${f.deviceType?.name || f.deviceTypeID}</span></td>
                <td><strong>${f.version}</strong></td>
                <td>${date}</td>
                <td><small>${f.description || "—"}</small></td>
                <td class="row-actions">
                    <button class="btn btn-ghost btn-sm" onclick="editFirmware(${args})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteFirmware(${f.firmwareID})">Delete</button>
                </td>
            </tr>`;
    });
    document.getElementById("fw-table-wrap").innerHTML = html + `</tbody></table></div>`;
    UI.setCount(data.length);
}

async function saveFirmware() {
    const body = {
        DeviceTypeID: parseInt(document.getElementById("fw-deviceTypeID").value),
        Version: document.getElementById("fw-version").value.trim(),
        ReleaseDate: document.getElementById("fw-releaseDate").value,
        Description: document.getElementById("fw-description").value.trim() || null
    };

    if (!body.DeviceTypeID || !body.Version || !body.ReleaseDate) return UI.showToast("Missing required fields", true);

    try {
        const method = _firmwareEditingId ? "PUT" : "POST";
        const path = _firmwareEditingId ? `/firmware/${_firmwareEditingId}` : "/firmware";
        if (_firmwareEditingId) body.FirmwareID = _firmwareEditingId;

        await api(path, { method, body: JSON.stringify(body) });
        UI.showToast("Firmware saved");
        cancelFirmwareEdit();
        refreshFirmwareTable();
    } catch (err) {
        console.error(err);
        UI.showToast("Save failed", true);
    }
}

function editFirmware(id, type, ver, date, desc) {
    _firmwareEditingId = id;
    document.getElementById("fw-deviceTypeID").value = type;
    document.getElementById("fw-version").value = ver;
    document.getElementById("fw-releaseDate").value = date;
    document.getElementById("fw-description").value = desc;
    document.querySelector("#firmwareForm .btn-primary").textContent = "Update";
    document.getElementById("fw-cancel").style.display = "inline-flex";
}

function cancelFirmwareEdit() {
    _firmwareEditingId = null;
    ["fw-deviceTypeID", "fw-version", "fw-releaseDate", "fw-description"].forEach(id => document.getElementById(id).value = "");
    document.querySelector("#firmwareForm .btn-primary").textContent = "Add";
    document.getElementById("fw-cancel").style.display = "none";
}

async function deleteFirmware(id) {
    if (!confirm("Delete this firmware?")) return;
    try {
        await api(`/firmware/${id}`, { method: "DELETE" });
        UI.showToast("Deleted");
        refreshFirmwareTable();
    } catch (e) { UI.showToast("Cannot delete: In use", true); }
}

// ── GROUPS ────────────────────────────────────────────────────

async function loadGroups(btn) {
    UI.setActiveNav(btn);
    UI.setTitle("Asset Groups");
    _groupEditingId = null;
    UI.showLoading();

    try {
        const groups = await api("/groups");
        const parentOptions = groups.map(g => `<option value="${g.groupID}">${g.name}</option>`).join("");

        UI.setMain(`
            <div class="crud-form" id="groupForm">
                <div class="form-row">
                    <div class="form-field">
                        <label>Group Name</label>
                        <input id="grp-name" type="text">
                    </div>
                    <div class="form-field">
                        <label>Parent Group</label>
                        <select id="grp-parentGroupID"><option value="">-- None (Root) --</option>${parentOptions}</select>
                    </div>
                    <div class="form-field form-field--actions">
                        <label>&nbsp;</label>
                        <div style="display:flex;gap:6px">
                            <button class="btn btn-primary" onclick="saveGroup()">Add</button>
                            <button class="btn btn-ghost" id="grp-cancel" onclick="cancelGroupEdit()" style="display:none">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
            <div id="grp-table-wrap"></div>`);

        await refreshGroupsTable();
    } catch (e) { UI.showToast("Error loading groups", true); }
}

async function refreshGroupsTable() {
    const data = await api("/groups");
    let html = `
        <div style="overflow-x:auto; margin-top:20px;">
            <table>
                <thead><tr><th>ID</th><th>Name</th><th>Parent</th><th>Actions</th></tr></thead>
                <tbody>`;

    data.forEach(g => {
        const name = g.name.replace(/'/g, "\\'");
        html += `
            <tr>
                <td>${g.groupID}</td>
                <td><strong>${g.name}</strong></td>
                <td>${g.parentGroup ? g.parentGroup.name : "<em>None</em>"}</td>
                <td class="row-actions">
                    <button class="btn btn-ghost btn-sm" onclick="editGroup(${g.groupID}, '${name}', ${g.parentGroupID})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteGroup(${g.groupID})">Delete</button>
                </td>
            </tr>`;
    });
    document.getElementById("grp-table-wrap").innerHTML = html + `</tbody></table></div>`;
    UI.setCount(data.length);
}

async function saveGroup() {
    const name = document.getElementById("grp-name").value.trim();
    const parentId = document.getElementById("grp-parentGroupID").value;
    if (!name) return UI.showToast("Name is required", true);

    const body = { Name: name, ParentGroupID: parentId ? parseInt(parentId) : null };
    if (_groupEditingId) body.GroupID = _groupEditingId;

    try {
        const method = _groupEditingId ? "PUT" : "POST";
        const path = _groupEditingId ? `/groups/${_groupEditingId}` : "/groups";
        await api(path, { method, body: JSON.stringify(body) });
        UI.showToast("Group saved");
        loadGroups(document.querySelector(".nav-btn.active"));
    } catch (e) { UI.showToast("Save error", true); }
}

function editGroup(id, name, parentId) {
    _groupEditingId = id;
    document.getElementById("grp-name").value = name;
    document.getElementById("grp-parentGroupID").value = parentId || "";
    document.querySelector("#groupForm .btn-primary").textContent = "Update";
    document.getElementById("grp-cancel").style.display = "inline-flex";
}

function cancelGroupEdit() {
    _groupEditingId = null;
    document.getElementById("grp-name").value = "";
    document.getElementById("grp-parentGroupID").value = "";
    document.querySelector("#groupForm .btn-primary").textContent = "Add";
    document.getElementById("grp-cancel").style.display = "none";
}

async function deleteGroup(id) {
    if (!confirm("Delete group?")) return;
    try {
        await api(`/groups/${id}`, { method: "DELETE" });
        UI.showToast("Deleted");
        refreshGroupsTable();
    } catch (e) { UI.showToast("Cannot delete: contains assets", true); }
}

// ── DEVICE TYPES ──────────────────────────────────────────────

async function loadDeviceTypes(btn) {
    UI.setActiveNav(btn);
    UI.setTitle("Hardware Classifications");
    UI.showLoading();
    try {
        const data = await api("/devicetypes");
        let html = `<table><thead><tr><th>ID</th><th>Name</th><th>Description</th></tr></thead><tbody>`;
        data.forEach(dt => {
            html += `<tr><td>${dt.deviceTypeID}</td><td><strong>${dt.name}</strong></td><td>${dt.description || "—"}</td></tr>`;
        });
        UI.setMain(html + `</tbody></table>`);
        UI.setCount(data.length);
    } catch (e) { UI.showToast("Load error", true); }
}

// ── INITIALIZATION ────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    loadDevices(document.querySelector(".nav-btn.active"));
});