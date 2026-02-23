const API_BASE = "http://localhost:5093/api";


function setTitle(title) {
    document.getElementById("sectionTitle").textContent = title;
}

function setCount(n) {
    document.getElementById("rowCount").textContent = n != null ? `${n} record${n !== 1 ? "s" : ""}` : "";
}

function setActive(btn) {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
}

function showLoading() {
    document.getElementById("rowCount").textContent = "";
    document.getElementById("content").innerHTML = `
        <div class="state-box">
            <div class="spinner"></div>
            <span>Loading…</span>
        </div>`;
}

function renderTable(headers, rows) {
    if (!rows.length) {
        document.getElementById("content").innerHTML = `
            <div class="state-box">No records found.</div>`;
        setCount(0);
        return;
    }

    let html = `<div style="overflow-x:auto"><table><thead><tr>`;
    headers.forEach(h => html += `<th>${h}</th>`);
    html += `</tr></thead><tbody>`;
    rows.forEach(row => {
        html += `<tr>`;
        row.forEach(cell => html += `<td>${cell ?? "—"}</td>`);
        html += `</tr>`;
    });
    html += `</tbody></table></div>`;

    document.getElementById("content").innerHTML = html;
    setCount(rows.length);
}

function showToast(message, isError = false) {
    let toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = "toast" + (isError ? " toast-error" : "");
    toast.classList.add("toast-show");
    setTimeout(() => toast.classList.remove("toast-show"), 3000);
}

// Devices 

async function loadDevices(btn) {
    setActive(btn);
    setTitle("Devices");
    showLoading();

    const [devices, firmware] = await Promise.all([
        fetch(`${API_BASE}/devices`).then(r => r.json()),
        fetch(`${API_BASE}/firmware`).then(r => r.json())
    ]);

    if (!devices.length) {
        document.getElementById("content").innerHTML = `<div class="state-box">No records found.</div>`;
        setCount(0);
        return;
    }

    let html = `<div style="overflow-x:auto"><table><thead><tr>
        <th>ID</th><th>Name</th><th>Serial Number</th><th>Type</th><th>Firmware</th><th></th>
    </tr></thead><tbody>`;

    devices.forEach(d => {
        const compatible = firmware.filter(f => f.deviceTypeID === d.deviceTypeID);
        const options = compatible.map(f =>
            `<option value="${f.firmwareID}" ${f.firmwareID === d.firmwareID ? "selected" : ""}>${f.version}</option>`
        ).join("");

        html += `<tr>
            <td>${d.deviceID}</td>
            <td><strong>${d.name}</strong></td>
            <td><span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#71717a">${d.serialNumber}</span></td>
            <td><span class="badge badge-blue">${d.deviceTypeID}</span></td>
            <td><span class="badge badge-gray">${d.firmwareID != null ? d.firmwareID : "None"}</span></td>
            <td class="row-actions">
                <select class="firmware-select" id="fw-select-${d.deviceID}">${options}</select>
                <button class="btn btn-ghost btn-sm" onclick="assignFirmware(${d.deviceID})">Assign</button>
            </td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    document.getElementById("content").innerHTML = html;
    setCount(devices.length);
}

async function assignFirmware(deviceID) {
    const select = document.getElementById(`fw-select-${deviceID}`);
    const firmwareID = parseInt(select.value);

    const res = await fetch(`${API_BASE}/devices/${deviceID}/firmware`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firmwareID })
    });

    if (res.ok) {
        showToast("Firmware assigned.");
        await loadDevices(document.querySelector(".nav-btn.active"));
    } else {
        showToast("Failed to assign firmware.", true);
    }
}

// Firmware

let _firmwareEditingId = null;

async function loadFirmware(btn) {
    setActive(btn);
    setTitle("Firmware");
    _firmwareEditingId = null;

    document.getElementById("content").innerHTML = `
        <div class="crud-form" id="firmwareForm">
            <div class="form-row">
                <div class="form-field">
                    <label>Device Type ID</label>
                    <input id="fw-deviceTypeID" type="number" min="1" placeholder="e.g. 1">
                </div>
                <div class="form-field">
                    <label>Version</label>
                    <input id="fw-version" type="text" placeholder="e.g. 1.2.0">
                </div>
                <div class="form-field">
                    <label>Release Date</label>
                    <input id="fw-releaseDate" type="date">
                </div>
                <div class="form-field form-field--grow">
                    <label>Description</label>
                    <input id="fw-description" type="text" placeholder="Optional">
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
        <div class="state-box"><div class="spinner"></div><span>Loading…</span></div>`;

    setCount(null);
    await refreshFirmwareTable();
}

async function refreshFirmwareTable() {
    const data = await fetch(`${API_BASE}/firmware`).then(r => r.json());

    const existing = document.getElementById("fw-table-wrap");
    if (existing) existing.remove();

    const wrap = document.createElement("div");
    wrap.id = "fw-table-wrap";

    if (!data.length) {
        wrap.innerHTML = `<div class="state-box">No firmware records found.</div>`;
    } else {
        let html = `<div style="overflow-x:auto"><table><thead><tr>
            <th>ID</th><th>Device Type</th><th>Version</th>
            <th>Release Date</th><th>Description</th><th></th>
        </tr></thead><tbody>`;

        data.forEach(f => {
            const date = f.releaseDate
                ? new Date(f.releaseDate).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
                : "—";
            const desc = (f.description ?? "").replace(/'/g, "\\'");
            const ver  = (f.version ?? "").replace(/'/g, "\\'");
            const rd   = f.releaseDate ? f.releaseDate.split("T")[0] : "";

            html += `<tr>
                <td>${f.firmwareID}</td>
                <td><span class="badge badge-blue">${f.deviceTypeID}</span></td>
                <td><strong>${f.version}</strong></td>
                <td>${date}</td>
                <td>${f.description || '<span style="color:#a1a1aa">—</span>'}</td>
                <td class="row-actions">
                    <button class="btn btn-ghost btn-sm"
                        onclick="editFirmware(${f.firmwareID},${f.deviceTypeID},'${ver}','${rd}','${desc}')">
                        Edit
                    </button>
                    <button class="btn btn-danger btn-sm"
                        onclick="deleteFirmware(${f.firmwareID})">
                        Delete
                    </button>
                </td>
            </tr>`;
        });

        html += `</tbody></table></div>`;
        wrap.innerHTML = html;
    }

    const spinner = document.querySelector("#content .state-box");
    if (spinner) spinner.replaceWith(wrap);
    else document.getElementById("content").appendChild(wrap);

    setCount(data.length);
}

async function saveFirmware() {
    const deviceTypeID = parseInt(document.getElementById("fw-deviceTypeID").value);
    const version      = document.getElementById("fw-version").value.trim();
    const releaseDate  = document.getElementById("fw-releaseDate").value;
    const description  = document.getElementById("fw-description").value.trim();

    if (!deviceTypeID || !version || !releaseDate) {
        showToast("Device Type ID, Version and Release Date are required.", true);
        return;
    }

    const body = { deviceTypeID, version, releaseDate, description: description || null };

    if (_firmwareEditingId) {
        await fetch(`${API_BASE}/firmware/${_firmwareEditingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firmwareID: _firmwareEditingId, ...body })
        });
        showToast("Firmware updated.");
    } else {
        await fetch(`${API_BASE}/firmware`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        showToast("Firmware added.");
    }

    cancelFirmwareEdit();
    await refreshFirmwareTable();
}

function editFirmware(id, deviceTypeID, version, releaseDate, description) {
    _firmwareEditingId = id;

    document.getElementById("fw-deviceTypeID").value = deviceTypeID;
    document.getElementById("fw-version").value      = version;
    document.getElementById("fw-releaseDate").value  = releaseDate;
    document.getElementById("fw-description").value  = description;

    document.querySelector("#firmwareForm .btn-primary").textContent = "Update";
    document.getElementById("fw-cancel").style.display = "inline-flex";
    document.getElementById("fw-deviceTypeID").focus();
}

function cancelFirmwareEdit() {
    _firmwareEditingId = null;

    document.getElementById("fw-deviceTypeID").value = "";
    document.getElementById("fw-version").value      = "";
    document.getElementById("fw-releaseDate").value  = "";
    document.getElementById("fw-description").value  = "";

    document.querySelector("#firmwareForm .btn-primary").textContent = "Add";
    document.getElementById("fw-cancel").style.display = "none";
}

async function deleteFirmware(id) {
    if (!confirm("Delete this firmware version? This cannot be undone.")) return;

    const res = await fetch(`${API_BASE}/firmware/${id}`, { method: "DELETE" });

    if (res.ok) {
        showToast("Firmware deleted.");
        await refreshFirmwareTable();
    } else {
        showToast("Could not delete — it may still be assigned to a device.", true);
    }
}

// Device Types 

async function loadDeviceTypes(btn) {
    setActive(btn);
    setTitle("Device Types");
    showLoading();

    const data = await fetch(`${API_BASE}/devicetypes`).then(r => r.json());

    const rows = data.map(dt => [
        dt.deviceTypeID,
        `<strong>${dt.name}</strong>`,
        dt.description || `<span style="color:#a1a1aa">—</span>`
    ]);

    renderTable(["ID", "Name", "Description"], rows);
}

// Groups

let _groupEditingId = null;

async function loadGroups(btn) {
    setActive(btn);
    setTitle("Groups");
    _groupEditingId = null;

    document.getElementById("content").innerHTML = `
        <div class="crud-form" id="groupForm">
            <div class="form-row">
                <div class="form-field">
                    <label>Group Name</label>
                    <input id="grp-name" type="text" placeholder="e.g. Warehouse">
                </div>
                <div class="form-field">
                    <label>Parent Group ID <span style="font-weight:400;text-transform:none">(optional)</span></label>
                    <input id="grp-parentGroupID" type="number" min="1" placeholder="Leave blank for root">
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
        <div class="state-box"><div class="spinner"></div><span>Loading…</span></div>`;

    setCount(null);
    await refreshGroupsTable();
}

async function refreshGroupsTable() {
    const data = await fetch(`${API_BASE}/groups`).then(r => r.json());

    const existing = document.getElementById("grp-table-wrap");
    if (existing) existing.remove();

    const wrap = document.createElement("div");
    wrap.id = "grp-table-wrap";

    if (!data.length) {
        wrap.innerHTML = `<div class="state-box">No groups found.</div>`;
    } else {
        let html = `<div style="overflow-x:auto"><table><thead><tr>
            <th>ID</th><th>Name</th><th>Parent Group</th><th></th>
        </tr></thead><tbody>`;

        data.forEach(g => {
            const name = (g.name ?? "").replace(/'/g, "\\'");
            const parentID = g.parentGroupID ?? "";
            html += `<tr>
                <td>${g.groupID}</td>
                <td><strong>${g.name}</strong></td>
                <td>${g.parentGroupID != null
                    ? `<span class="badge badge-gray">ID ${g.parentGroupID}</span>`
                    : `<span class="badge badge-root">Root</span>`}
                </td>
                <td class="row-actions">
                    <button class="btn btn-ghost btn-sm"
                        onclick="editGroup(${g.groupID},'${name}',${g.parentGroupID ?? "null"})">
                        Edit
                    </button>
                    <button class="btn btn-danger btn-sm"
                        onclick="deleteGroup(${g.groupID})">
                        Delete
                    </button>
                </td>
            </tr>`;
        });

        html += `</tbody></table></div>`;
        wrap.innerHTML = html;
    }

    const spinner = document.querySelector("#content .state-box");
    if (spinner) spinner.replaceWith(wrap);
    else document.getElementById("content").appendChild(wrap);

    setCount(data.length);
}

async function saveGroup() {
    const name          = document.getElementById("grp-name").value.trim();
    const parentRaw     = document.getElementById("grp-parentGroupID").value.trim();
    const parentGroupID = parentRaw ? parseInt(parentRaw) : null;

    if (!name) {
        showToast("Group name is required.", true);
        return;
    }

    const body = { name, parentGroupID };

    if (_groupEditingId) {
        await fetch(`${API_BASE}/groups/${_groupEditingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupID: _groupEditingId, ...body })
        });
        showToast("Group updated.");
    } else {
        await fetch(`${API_BASE}/groups`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        showToast("Group added.");
    }

    cancelGroupEdit();
    await refreshGroupsTable();
}

function editGroup(id, name, parentGroupID) {
    _groupEditingId = id;

    document.getElementById("grp-name").value          = name;
    document.getElementById("grp-parentGroupID").value = parentGroupID ?? "";

    document.querySelector("#groupForm .btn-primary").textContent = "Update";
    document.getElementById("grp-cancel").style.display = "inline-flex";
    document.getElementById("grp-name").focus();
}

function cancelGroupEdit() {
    _groupEditingId = null;

    document.getElementById("grp-name").value          = "";
    document.getElementById("grp-parentGroupID").value = "";

    document.querySelector("#groupForm .btn-primary").textContent = "Add";
    document.getElementById("grp-cancel").style.display = "none";
}

async function deleteGroup(id) {
    if (!confirm("Delete this group? This cannot be undone.")) return;

    const res = await fetch(`${API_BASE}/groups/${id}`, { method: "DELETE" });

    if (res.ok) {
        showToast("Group deleted.");
        await refreshGroupsTable();
    } else {
        const msg = await res.text();
        showToast(msg || "Could not delete — group may have children or linked devices.", true);
    }
}

// Init
loadDevices(document.querySelector(".nav-btn.active"));
