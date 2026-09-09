
/* ================= ANIMATED ALERT / CONFIRM DIALOGS ================= */
/* Drop-in, promise-based replacements for the native window.alert() and
   window.confirm() browser popups, styled to match the app's own popups. */

const customAlertOverlay = document.getElementById("customAlertOverlay");
const customAlertIcon = document.getElementById("customAlertIcon");
const customAlertTitle = document.getElementById("customAlertTitle");
const customAlertMessage = document.getElementById("customAlertMessage");
const customAlertOkBtn = document.getElementById("customAlertOkBtn");

const customConfirmOverlay = document.getElementById("customConfirmOverlay");
const customConfirmIcon = document.getElementById("customConfirmIcon");
const customConfirmTitle = document.getElementById("customConfirmTitle");
const customConfirmMessage = document.getElementById("customConfirmMessage");
const customConfirmOkBtn = document.getElementById("customConfirmOkBtn");
const customConfirmCancelBtn = document.getElementById("customConfirmCancelBtn");

const DIALOG_ICONS = {
    info: "fa-solid fa-circle-info",
    success: "fa-solid fa-circle-check",
    warning: "fa-solid fa-triangle-exclamation",
    error: "fa-solid fa-circle-exclamation",
    question: "fa-solid fa-circle-question"
};

const DIALOG_TITLES = {
    info: "Notice",
    success: "Success",
    warning: "Heads up",
    error: "Something went wrong",
    question: "Please confirm"
};

// Replacement for window.alert(message). Returns a Promise that resolves
// once the user dismisses the popup (usually safe to ignore/not await).
function showAlert(message, type = "info", title) {
    customAlertMessage.textContent = message;
    customAlertTitle.textContent = title || DIALOG_TITLES[type] || DIALOG_TITLES.info;
    customAlertIcon.className = `${DIALOG_ICONS[type] || DIALOG_ICONS.info} dialog-icon dialog-icon-${type}`;

    customAlertOverlay.classList.add("active");

    return new Promise((resolve) => {
        function onClose() {
            customAlertOverlay.classList.remove("active");
            customAlertOkBtn.removeEventListener("click", onClose);
            customAlertOverlay.removeEventListener("click", onOverlayClick);
            resolve();
        }
        function onOverlayClick(e) {
            if (e.target === customAlertOverlay) onClose();
        }
        customAlertOkBtn.addEventListener("click", onClose);
        customAlertOverlay.addEventListener("click", onOverlayClick);
    });
}

// Replacement for window.confirm(message). Returns a Promise<boolean> —
// await it (e.g. `if (!(await showConfirm("..."))) return;`).
function showConfirm(message, { okText = "Yes", cancelText = "Cancel", type = "question", title } = {}) {
    customConfirmMessage.textContent = message;
    customConfirmTitle.textContent = title || DIALOG_TITLES[type] || DIALOG_TITLES.question;
    customConfirmIcon.className = `${DIALOG_ICONS[type] || DIALOG_ICONS.question} dialog-icon dialog-icon-${type}`;
    customConfirmOkBtn.textContent = okText;
    customConfirmCancelBtn.textContent = cancelText;

    customConfirmOverlay.classList.add("active");

    return new Promise((resolve) => {
        function cleanup(result) {
            customConfirmOverlay.classList.remove("active");
            customConfirmOkBtn.removeEventListener("click", onOk);
            customConfirmCancelBtn.removeEventListener("click", onCancel);
            customConfirmOverlay.removeEventListener("click", onOverlayClick);
            resolve(result);
        }
        function onOk() { cleanup(true); }
        function onCancel() { cleanup(false); }
        function onOverlayClick(e) { if (e.target === customConfirmOverlay) cleanup(false); }

        customConfirmOkBtn.addEventListener("click", onOk);
        customConfirmCancelBtn.addEventListener("click", onCancel);
        customConfirmOverlay.addEventListener("click", onOverlayClick);
    });
}

const popup = document.getElementById("popup");
const addBtn = document.getElementById("addBtn");
const closeBtn = document.getElementById("closeBtn");
const saveBtn = document.getElementById("saveBtn");

const nameInput = document.getElementById("name");
const deptInput = document.getElementById("dept");
const deptOtherInput = document.getElementById("deptOther");
const degreeInput = document.getElementById("degree");
const degreeOtherInput = document.getElementById("degreeOther");
const yearInput = document.getElementById("year");
const regnoInput = document.getElementById("regno");
const mobileInput = document.getElementById("mobile");
const emailInput = document.getElementById("email");
const parentMobileInput = document.getElementById("parentMobile");
const addressInput = document.getElementById("address");
const genderInput = document.getElementById("gender");

// Department -> list of degrees offered under it. "Others" (when present)
// lets the user type a custom degree; departments without "Others" only
// offer the degrees listed.
const deptDegreeMap = {
    "COMPUTER SCIENCE": ["B.Sc.cs.Ai", "B.Sc.cs", "Others"],
    "COMPUTER APPLICATIONS": ["BCA", "Others"],
    "COMMERCE": ["B.Com(General)", "B.com.cs", "Others"],
    "MATHEMATICS": ["B.Sc Mathematics", "Others"],
    "BUSINESS ADMINISTRATION": ["BBA", "Others"],
    "தமிழ்": ["B.a.Tamil", "Others"],
    "ENGLISH": ["B.a.English"]
};

function populateDegreeOptions(department) {
    const degrees = deptDegreeMap[department] || [];

    degreeInput.innerHTML = `<option value="" disabled selected>Select Degree</option>` +
        degrees.map((d) => `<option value="${d}">${d}</option>`).join("");

    degreeInput.style.display = degrees.length ? "block" : "none";
    degreeOtherInput.style.display = "none";
    degreeOtherInput.value = "";
}

function findDepartmentForDegree(degreeValue) {
    const key = normalizeDeptKey(degreeValue);
    if (!key) return null;

    for (const department in deptDegreeMap) {
        const match = deptDegreeMap[department].some(
            (d) => normalizeDeptKey(d) === key
        );
        if (match) return department;
    }
    return null;
}

// Old data (before the Department -> Degree dropdown existed) was typed
// freehand, so the same degree can be stored with different spacing,
// punctuation, or capitalization (e.g. "B.Sc.cs.Ai" vs "Bsc.cs.Ai").
// This normalizes a degree string into a comparison key so those variants
// are treated as the same degree everywhere (grouping, sorting, counts,
// export, filtering) without ever changing the student's stored text.
function normalizeDeptKey(dept) {
    return (dept || "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]/gu, "");
}

// Groups a list of students by normalized degree key. Each group keeps
// the first-seen exact spelling as its display label.
function groupByNormalizedDept(list) {
    const groups = new Map();

    list.forEach((s) => {
        const raw = (s.dept || "").trim();
        const key = normalizeDeptKey(raw);

        if (!groups.has(key)) {
            groups.set(key, { label: raw || "Unknown Degree", items: [] });
        }

        groups.get(key).items.push(s);
    });

    return groups;
}

// The department dropdown's own order (Computer Science, Computer
// Applications, Commerce, Mathematics, Business Administration, தமிழ்,
// English). Everywhere students/degrees are listed, they're grouped by
// this department order first, then alphabetically by degree within it.
// Anything that doesn't match a known department (custom "Others" entries,
// or legacy data) sorts to the very end under "Other".
const departmentOrder = Object.keys(deptDegreeMap);

function departmentForStudent(dept) {
    return findDepartmentForDegree(dept) || "Other";
}

function departmentRank(dept) {
    const idx = departmentOrder.indexOf(departmentForStudent(dept));
    return idx === -1 ? departmentOrder.length : idx;
}

// Year order used everywhere years are grouped or sorted: I -> II -> III,
// with anything unset/unrecognized sorting last.
const yearOrder = ["I", "II", "III"];

function yearRank(year) {
    const idx = yearOrder.indexOf(year);
    return idx === -1 ? yearOrder.length : idx;
}

// Sorts by: department (dropdown order) -> degree (alphabetical within
// that department) -> gender (boys first) -> name.
function compareByDeptDegree(a, b) {
    const deptRankCompare = departmentRank(a) - departmentRank(b);
    if (deptRankCompare !== 0) return deptRankCompare;
    return normalizeDeptKey(a).localeCompare(normalizeDeptKey(b));
}

// Sorts by: department -> degree -> year (I, II, III) -> gender (boys
// first) -> name. Year is sorted ahead of gender so that, within a
// degree, 1st year and 2nd year students form separate blocks instead of
// being mixed together.
function compareByDeptDegreeGenderName(a, b) {
    const degreeCompare = compareByDeptDegree(a.dept, b.dept);
    if (degreeCompare !== 0) return degreeCompare;

    const yearCompare = yearRank(a.year) - yearRank(b.year);
    if (yearCompare !== 0) return yearCompare;

    if (a.gender !== b.gender) return a.gender === "Male" ? -1 : 1;

    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

deptInput.addEventListener("change", () => {
    if (deptInput.value === "Others") {
        deptOtherInput.style.display = "block";
        deptOtherInput.focus();

        degreeInput.style.display = "none";
        degreeInput.innerHTML = `<option value="" disabled selected>Select Degree</option>`;
        degreeOtherInput.style.display = "none";
        degreeOtherInput.value = "";
    } else {
        deptOtherInput.style.display = "none";
        deptOtherInput.value = "";
        populateDegreeOptions(deptInput.value);
    }
});

degreeInput.addEventListener("change", () => {
    if (degreeInput.value === "Others") {
        degreeOtherInput.style.display = "block";
        degreeOtherInput.focus();
    } else {
        degreeOtherInput.style.display = "none";
        degreeOtherInput.value = "";
    }
});

regnoInput.addEventListener("input", () => {
    regnoInput.value = regnoInput.value.replace(/\D/g, "").slice(0, 20);
});

parentMobileInput.addEventListener("input", () => {
    parentMobileInput.value = parentMobileInput.value.replace(/\D/g, "").slice(0, 10);
});

const table = document.getElementById("studentTable");
const search = document.getElementById("search");

const totalStudents = document.getElementById("totalStudents");
const maleCount = document.getElementById("maleCount");
const femaleCount = document.getElementById("femaleCount");
const deptCount = document.getElementById("deptCount");

const themeBtn = document.getElementById("themeBtn");

let students = [];
let currentVisibleList = students;
let editId = null;
let currentUser = null;
let studentsChannel = null; // Supabase real-time channel

// Current table filter state. `currentFilter` tracks the search/degree
// filter (from the search box or a dashboard drill-down), while
// `selectedDepartment`, `selectedDegree`, and `selectedYear` are the
// independent Department → Degree → Year dropdown filters — they all combine.
let selectedDepartment = "";
let selectedDegree = "";
let selectedYear = "";
let currentFilter = { type: "all", value: "" }; // type: "all" | "search" | "dept"

function computeFilteredList() {
    let list = students;

    if (currentFilter.type === "search") {
        const value = currentFilter.value.toLowerCase();
        list = list.filter(student =>
            student.name.toLowerCase().includes(value) ||
            student.dept.toLowerCase().includes(value)
        );
    } else if (currentFilter.type === "dept") {
        const key = normalizeDeptKey(currentFilter.value);
        list = list.filter(student => normalizeDeptKey(student.dept) === key);
    }

    if (selectedDepartment) {
        list = list.filter(student => departmentForStudent(student.dept) === selectedDepartment);
    }

    if (selectedDegree) {
        const degreeKey = normalizeDeptKey(selectedDegree);
        list = list.filter(student => normalizeDeptKey(student.dept) === degreeKey);
    }

    if (selectedYear) {
        list = list.filter(student => (student.year || "") === selectedYear);
    }

    return list;
}

function buildBreadcrumbLabel() {
    let label = null;

    if (currentFilter.type === "search") {
        label = `Search: "${currentFilter.value}"`;
    } else if (currentFilter.type === "dept") {
        label = currentFilter.value;
    }

    const extras = [];
    if (selectedDepartment) extras.push(selectedDepartment);
    if (selectedDegree) extras.push(selectedDegree);
    if (selectedYear) extras.push(`Year ${selectedYear}`);

    if (extras.length) {
        const extraText = extras.join(" • ");
        label = label ? `${label} • ${extraText}` : extraText;
    }

    return label;
}

function applyFilters() {
    renderStudents(computeFilteredList());
    updateBreadcrumb(buildBreadcrumbLabel());
}

/* ================= AUTH ================= */

const authScreen = document.getElementById("authScreen");
const appContent = document.getElementById("appContent");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authError = document.getElementById("authError");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authTitle = document.getElementById("authTitle");
const authSwitchText = document.getElementById("authSwitchText");
const authSwitchLink = document.getElementById("authSwitchLink");
const logoutBtn = document.getElementById("logoutBtn");
const logoutConfirmOverlay = document.getElementById("logoutConfirmOverlay");
const logoutYesBtn = document.getElementById("logoutYesBtn");
const logoutCancelBtn = document.getElementById("logoutCancelBtn");

let isSignupMode = false;

authSwitchLink.onclick = (e) => {
    e.preventDefault();
    isSignupMode = !isSignupMode;
    authError.textContent = "";
    authInfo.textContent = "";
    if (isSignupMode) {
        authTitle.textContent = "Create an account";
        authSubmitBtn.textContent = "Sign Up";
        authSwitchText.textContent = "Already have an account?";
        authSwitchLink.textContent = "Login";
    } else {
        authTitle.textContent = "Login to continue";
        authSubmitBtn.textContent = "Login";
        authSwitchText.textContent = "Don't have an account?";
        authSwitchLink.textContent = "Sign up";
    }
};

authSubmitBtn.onclick = async () => {
    const email = authEmail.value.trim();
    const password = authPassword.value;

    if (!email || !password) {
        authError.textContent = "Please enter email and password.";
        return;
    }

    authError.textContent = "";
    authInfo.textContent = "";
    authSubmitBtn.disabled = true;

    try {
        if (isSignupMode) {
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            // If email confirmation is ON in Supabase, there is no session yet —
            // tell them to verify, then switch back to login mode.
            if (data.user && !data.session) {
                authInfo.textContent = `Account created for ${email}. Check your inbox to confirm your email, then log in.`;
                isSignupMode = false;
                authTitle.textContent = "Login to continue";
                authSubmitBtn.textContent = "Login";
                authSwitchText.textContent = "Don't have an account?";
                authSwitchLink.textContent = "Sign up";
                authPassword.value = "";
            }
            // Otherwise onAuthStateChange fires and the app opens automatically.
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        }
    } catch (err) {
        authError.textContent = getFriendlyAuthError(err);
    } finally {
        authSubmitBtn.disabled = false;
    }
};

function getFriendlyAuthError(err) {
    const msg = (err && err.message ? err.message : String(err || "")).toLowerCase();

    if (msg.includes("invalid login credentials") || msg.includes("invalid_grant") || msg.includes("user not found")) {
        return isSignupMode
            ? "Something went wrong. Please try again."
            : "No account found with that email and password. New here? Tap 'Sign up' below.";
    }
    if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("user already registered")) {
        return "An account with this email already exists. Please login instead.";
    }
    if (msg.includes("invalid") && msg.includes("email")) {
        return "Please enter a valid email address.";
    }
    if (msg.includes("password") && (msg.includes("6") || msg.includes("short") || msg.includes("weak") || msg.includes("least"))) {
        return "Password should be at least 6 characters.";
    }
    if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
        return "Please confirm your email first — check your inbox for the confirmation link, then log in.";
    }
    if (msg.includes("too many") || msg.includes("rate limit") || msg.includes("over request")) {
        return "Too many attempts. Please wait a moment and try again.";
    }
    if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch")) {
        return "Network error. Check your internet connection and try again.";
    }
    return (err && err.message) || "Something went wrong. Please try again.";
}

const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const authInfo = document.getElementById("authInfo");

forgotPasswordLink.onclick = async (e) => {
    e.preventDefault();
    authError.textContent = "";
    authInfo.textContent = "";

    const email = authEmail.value.trim();

    if (!email) {
        authError.textContent = "Enter your email above first, then tap 'Forgot password?'.";
        authEmail.focus();
        return;
    }

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.href,
        });
        if (error) throw error;
        authInfo.textContent = `If an account exists for ${email}, a password reset link was sent. Check your inbox (and spam/junk folder).`;
    } catch (err) {
        authError.textContent = getFriendlyAuthError(err);
    }
};

const resetPasswordBtn = document.getElementById("resetPasswordBtn");

function usesPasswordAuth(user) {
    if (!user) return false;
    // Email+password accounts have provider 'email'; Google OAuth has 'google'.
    if (user.app_metadata && user.app_metadata.provider === "email") return true;
    if (Array.isArray(user.identities)) {
        return user.identities.some((i) => i.provider === "email" || i.provider === "password");
    }
    return true; // assume password if we can't tell
}

resetPasswordBtn.onclick = async () => {
    teamMenu.classList.remove("show");

    if (!currentUser || !currentUser.email) return;

    if (!usesPasswordAuth(currentUser)) {
        showAlert("Your account signs in with Google, so there's no password to reset.", "info");
        return;
    }

    const confirmed = await showConfirm(`Send a password reset link to ${currentUser.email}?`, { okText: "Send" });
    if (!confirmed) {
        return;
    }

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(currentUser.email, {
            redirectTo: window.location.href,
        });
        if (error) throw error;
        showAlert(`Password reset link sent to ${currentUser.email}. If you don't get the mail, please check your Gmail spam/junk folder.`, "success");
    } catch (err) {
        showAlert(getFriendlyAuthError(err), "error");
    }
};

/* ================= MANAGE USERS (roles) ================= */

const manageUsersBtn = document.getElementById("manageUsersBtn");
const manageUsersPopup = document.getElementById("manageUsersPopup");
const membersListContent = document.getElementById("membersListContent");
const addMemberEmail = document.getElementById("addMemberEmail");
const addMemberRole = document.getElementById("addMemberRole");
const addMemberBtn = document.getElementById("addMemberBtn");
const addMemberError = document.getElementById("addMemberError");

let membersChannel = null;

function roleLabel(role) {
    if (role === "staff") return "Staff";
    if (role === "viewer") return "Viewer";
    return role;
}

function renderMembersList(members) {
    if (members.length === 0) {
        membersListContent.innerHTML = `<p class="members-empty">No one added yet. Add someone below.</p>`;
        return;
    }

    membersListContent.innerHTML = members.map((m) => `
        <div class="member-row">
            <div class="member-row-info">
                <div class="member-row-name">${m.name || m.email || m.uid}</div>
                ${m.name ? `<div class="member-row-email">${m.email || ""}</div>` : ""}
            </div>
            <select onchange="changeMemberRole('${m.uid}', this.value)">
                <option value="staff" ${m.role === "staff" ? "selected" : ""}>Staff</option>
                <option value="viewer" ${m.role === "viewer" ? "selected" : ""}>Viewer</option>
            </select>
            <button type="button" class="member-row-remove" title="Remove" onclick="removeMember('${m.uid}')">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join("");
}

async function changeMemberRole(uid, newRole) {
    if (currentRole !== "admin") return;
    try {
        const { error } = await supabase
            .from("members")
            .update({ role: newRole })
            .eq("owner_id", workspaceOwnerUid)
            .eq("uid", uid);
        if (error) throw error;
        await loadMembersList();
    } catch (err) {
        console.error(err);
        showAlert("Could not update role. Please check your connection and try again.", "error");
    }
}

async function removeMember(uid) {
    if (currentRole !== "admin") return;
    const confirmed = await showConfirm("Remove this person's access?", { okText: "Remove", type: "warning" });
    if (!confirmed) return;

    try {
        const { error } = await supabase
            .from("members")
            .delete()
            .eq("owner_id", workspaceOwnerUid)
            .eq("uid", uid);
        if (error) throw error;
        await loadMembersList();
    } catch (err) {
        console.error(err);
        showAlert("Could not remove access. Please check your connection and try again.", "error");
    }
}

async function loadMembersList() {
    try {
        const { data, error } = await supabase
            .from("members")
            .select("*")
            .eq("owner_id", workspaceOwnerUid)
            .order("added_at", { ascending: true });
        if (error) throw error;
        renderMembersList(data || []);
    } catch (err) {
        console.error(err);
        membersListContent.innerHTML = `<p class="members-empty">Could not load users.</p>`;
    }
}

function subscribeMembers() {
    if (membersChannel) {
        supabase.removeChannel(membersChannel);
        membersChannel = null;
    }
    membersChannel = supabase
        .channel(`members-${workspaceOwnerUid}`)
        .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "members",
            filter: `owner_id=eq.${workspaceOwnerUid}`,
        }, () => {
            loadMembersList();
        })
        .subscribe();
}

if (manageUsersBtn) {
    manageUsersBtn.onclick = () => {
        if (currentRole !== "admin") return;
        teamMenu.classList.remove("show");

        addMemberEmail.value = "";
        addMemberError.textContent = "";
        membersListContent.innerHTML = `<p class="members-empty">Loading...</p>`;

        loadMembersList();
        subscribeMembers();

        manageUsersPopup.classList.add("active");
    };
}

document.getElementById("closeManageUsers").onclick = function () {
    manageUsersPopup.classList.remove("active");
    if (membersChannel) {
        supabase.removeChannel(membersChannel);
        membersChannel = null;
    }
};

addMemberBtn.onclick = async () => {
    if (currentRole !== "admin") return;

    const email = addMemberEmail.value.trim().toLowerCase();
    const role = addMemberRole.value;
    addMemberError.textContent = "";

    if (!email) {
        addMemberError.textContent = "Enter their email address.";
        return;
    }

    if (currentUser && email === currentUser.email.toLowerCase()) {
        addMemberError.textContent = "That's your own account.";
        return;
    }

    addMemberBtn.disabled = true;
    addMemberBtn.textContent = "Adding...";

    try {
        const { data, error } = await supabase
            .from("users")
            .select("id, name")
            .ilike("email", email)
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            addMemberError.textContent = "No account with that email yet. Ask them to sign up first, then add them.";
            return;
        }

        const { error: upsertError } = await supabase
            .from("members")
            .upsert({
                owner_id: workspaceOwnerUid,
                uid: data.id,
                email: email,
                name: data.name || "",
                role: role,
            }, { onConflict: "owner_id,uid" });

        if (upsertError) throw upsertError;

        addMemberEmail.value = "";
        await loadMembersList();
    } catch (err) {
        addMemberError.textContent = "Something went wrong. Please try again.";
        console.error(err);
    } finally {
        addMemberBtn.disabled = false;
        addMemberBtn.innerHTML = `<i class="fa-solid fa-user-plus"></i> Add`;
    }
};

logoutBtn.onclick = () => {
    teamMenu.classList.remove("show");
    logoutConfirmOverlay.classList.add("active");
};

logoutCancelBtn.onclick = () => {
    logoutConfirmOverlay.classList.remove("active");
};

logoutYesBtn.onclick = async () => {
    logoutConfirmOverlay.classList.remove("active");
    await supabase.auth.signOut();
};

const googleSignInBtn = document.getElementById("googleSignInBtn");

googleSignInBtn.onclick = async () => {
    authError.textContent = "";
    authInfo.textContent = "";
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: window.location.href },
        });
        if (error) throw error;
    } catch (err) {
        authError.textContent = getFriendlyAuthError(err);
    }
};

// This runs automatically whenever login state changes,
// and on ANY device the moment that user logs in.
let authInitialized = false;

let workspaceOwnerUid = null;   // whose students/attendance data we're viewing
let currentRole = "admin";      // 'admin' | 'staff' | 'viewer'
let membershipChannel = null;

// ---- Supabase row <-> app object mapping ----
// DB uses snake_case (parent_mobile, owner_id); the app uses camelCase
// (parentMobile). These two helpers translate at the boundary so the
// rest of the app code never has to care about column names.
function rowToStudent(row) {
    return {
        id: row.id,
        name: row.name,
        dept: row.dept,
        year: row.year || "",
        regno: row.regno || "",
        mobile: row.mobile,
        email: row.email || "",
        parentMobile: row.parent_mobile || "",
        address: row.address || "",
        gender: row.gender,
    };
}

function studentToRow(student, ownerId) {
    return {
        owner_id: ownerId,
        name: student.name,
        dept: student.dept,
        year: student.year || "",
        regno: student.regno || "",
        mobile: student.mobile,
        email: student.email || "",
        parent_mobile: student.parentMobile || "",
        address: student.address || "",
        gender: student.gender,
    };
}

// So an admin can add someone by typing their email, every account gets
// a small public-ish lookup entry (email -> uid) written on every login.
async function ensureUserDirectoryEntry(user) {
    if (!user || !user.email) return;
    try {
        await supabase.from("users").upsert({
            id: user.id,
            email: user.email,
            name: getUserDisplayName(user),
        }, { onConflict: "id" });
    } catch (err) {
        console.warn("Directory entry error:", err);
    }
}

// Figures out which workspace this login should see: their own (they're
// the Admin) or someone else's, if an admin has added them as Staff/Viewer.
async function resolveWorkspace(uid) {
    try {
        const { data, error } = await supabase
            .from("members")
            .select("owner_id, role")
            .eq("uid", uid)
            .limit(1)
            .maybeSingle();
        if (error) throw error;
        if (!data) {
            workspaceOwnerUid = uid;
            currentRole = "admin";
        } else {
            workspaceOwnerUid = data.owner_id;
            currentRole = data.role || "viewer";
        }
    } catch (err) {
        console.error("Workspace resolve error:", err);
        workspaceOwnerUid = uid;
        currentRole = "admin";
    }
}

function watchOwnMembership(uid) {
    if (membershipChannel) {
        supabase.removeChannel(membershipChannel);
        membershipChannel = null;
    }

    if (workspaceOwnerUid === uid) return; // owner/admin of own data, nothing to watch

    membershipChannel = supabase
        .channel(`membership-${uid}`)
        .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "members",
            filter: `uid=eq.${uid}`,
        }, (payload) => {
            if (payload.eventType === "DELETE") {
                const oldRow = payload.old || {};
                if (oldRow.owner_id && oldRow.owner_id !== workspaceOwnerUid) return;
                // Access was removed — send them back to their own workspace.
                location.reload();
                return;
            }
            const row = payload.new || {};
            if (row.owner_id && row.owner_id !== workspaceOwnerUid) return;
            currentRole = row.role || "viewer";
            applyRolePermissions();
            renderStudents();
        })
        .subscribe();
}

// ---- Students data (fetch + realtime) ----

async function fetchStudents() {
    const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("owner_id", workspaceOwnerUid)
        .order("created_at", { ascending: true });
    if (error) throw error;
    return (data || []).map(rowToStudent);
}

async function reloadStudents() {
    try {
        students = await fetchStudents();
        refreshTableFilterOptions();
        applyFilters();
    } catch (err) {
        console.error("Sync error:", err);
        renderLoadError(err);
    }
}

function subscribeStudents() {
    if (studentsChannel) {
        supabase.removeChannel(studentsChannel);
        studentsChannel = null;
    }
    studentsChannel = supabase
        .channel(`students-${workspaceOwnerUid}`)
        .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "students",
            filter: `owner_id=eq.${workspaceOwnerUid}`,
        }, () => {
            reloadStudents();
        })
        .subscribe();
}

function cleanupRealtime() {
    if (studentsChannel) {
        supabase.removeChannel(studentsChannel);
        studentsChannel = null;
    }
    if (membershipChannel) {
        supabase.removeChannel(membershipChannel);
        membershipChannel = null;
    }
    if (membersChannel) {
        supabase.removeChannel(membersChannel);
        membersChannel = null;
    }
}

async function handleAuthUser(user) {
    const wasLoggedOut = !currentUser;
    currentUser = user;

    cleanupRealtime();
    updateCurrentUserDisplay(user);

    if (user) {
        authScreen.style.display = "none";
        appContent.style.display = "block";
        authEmail.value = "";
        authPassword.value = "";

        // Only pop up the welcome message for an actual sign-in action,
        // not when a previously logged-in session is restored on page load.
        if (authInitialized && wasLoggedOut) {
            showLoginWelcome(user);
        }

        // Show placeholders while Supabase fetches this user's data.
        renderSkeleton();

        await ensureUserDirectoryEntry(user);
        await resolveWorkspace(user.id);
        applyRolePermissions();
        watchOwnMembership(user.id);

        // Initial load + real-time listener: keeps this workspace's data
        // in sync across every device/member, live, no manual refresh needed.
        await reloadStudents();
        subscribeStudents();
    } else {
        appContent.style.display = "none";
        authScreen.style.display = "flex";
        students = [];
        workspaceOwnerUid = null;
        currentRole = "admin";
        selectedDepartment = "";
        selectedDegree = "";
        selectedYear = "";
        currentFilter = { type: "all", value: "" };
        if (typeof filterDepartmentSelect !== "undefined" && filterDepartmentSelect) filterDepartmentSelect.innerHTML = `<option value="">All Departments</option>`;
        if (typeof filterDegreeSelect !== "undefined" && filterDegreeSelect) filterDegreeSelect.innerHTML = `<option value="">All Degrees</option>`;
        if (typeof filterYearSelect !== "undefined" && filterYearSelect) filterYearSelect.value = "";
        if (search) search.value = "";
        renderStudents();
    }

    // Now that we know whether the user is already logged in, reveal the
    // right screen. This keeps an already-logged-in user from ever seeing
    // the login screen flash — they go straight to the app.
    const loader = document.getElementById("loader");
    if (loader) {
        loader.classList.add("hide");
    }

    authInitialized = true;
}

supabase.auth.onAuthStateChange((_event, session) => {
    handleAuthUser(session && session.user ? session.user : null);
});

// Shows/hides everything that depends on the current user's role. Called
// once the workspace/role is known, and again any time the role changes.
function applyRolePermissions() {
    const isAdmin = currentRole === "admin";
    const isViewer = currentRole === "viewer";

    if (addBtn) addBtn.style.display = isViewer ? "none" : "";
    if (importBtn) importBtn.style.display = isAdmin ? "" : "none";
    if (exportTabStudents) exportTabStudents.style.display = isAdmin ? "" : "none";
    if (attendanceBtn) attendanceBtn.style.display = isViewer ? "none" : "";
    if (manageUsersBtn) manageUsersBtn.style.display = isAdmin ? "" : "none";

    const badge = document.getElementById("currentRoleBadge");
    if (badge) {
        if (isAdmin) {
            badge.style.display = "none";
        } else {
            badge.textContent = currentRole === "staff" ? "Staff" : "Viewer";
            badge.className = `role-badge role-badge-${currentRole}`;
            badge.style.display = "inline-block";
        }
    }
}

function getUserDisplayName(user) {
    if (!user) return "User";
    const meta = user.user_metadata || {};
    return meta.full_name || meta.name || meta.display_name
        || (user.email ? user.email.split("@")[0] : "User");
}

function updateCurrentUserDisplay(user) {
    const nameEl = document.getElementById("currentUserName");
    if (!nameEl) return;
    nameEl.textContent = getUserDisplayName(user);
}

function showLoginWelcome(user) {
    const popup = document.getElementById("loginWelcomePopup");
    const nameEl = document.getElementById("loginWelcomeName");

    nameEl.textContent = `Welcome, ${getUserDisplayName(user)}!`;
    popup.classList.add("active");

    setTimeout(() => {
        popup.classList.remove("active");
    }, 3000);
}

document.getElementById("closeLoginWelcome").onclick = function () {
    document.getElementById("loginWelcomePopup").classList.remove("active");
};

// ---- Student CRUD (Supabase) ----
// NOTE: the old Firebase one-time migration (array-field -> subcollection)
// is intentionally gone — Supabase starts fresh with real tables.

async function createStudentRow(student) {
    const { error } = await supabase
        .from("students")
        .insert(studentToRow(student, workspaceOwnerUid));
    if (error) throw error;
    await reloadStudents();
}

async function updateStudentRow(id, student) {
    const row = studentToRow(student, workspaceOwnerUid);
    delete row.owner_id; // never move a student to another workspace
    const { error } = await supabase
        .from("students")
        .update(row)
        .eq("id", id)
        .eq("owner_id", workspaceOwnerUid);
    if (error) throw error;
    await reloadStudents();
}

async function deleteStudentRow(id) {
    const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", id)
        .eq("owner_id", workspaceOwnerUid);
    if (error) throw error;
    await reloadStudents();
}



let lastDept = "";
let lastDeptOther = "";
let lastDegree = "";
let lastDegreeOther = "";

addBtn.onclick = () => {
    if (currentRole === "viewer") return;
    editId = null;
    clearForm(true);
    popup.classList.add("active");
};

closeBtn.onclick = () => {
    popup.classList.remove("active");
    clearForm();
};


saveBtn.onclick = async () => {

    let dept = "";
    if (deptInput.value === "Others") {
        dept = deptOtherInput.value.trim();
    } else if (degreeInput.value === "Others") {
        dept = degreeOtherInput.value.trim();
    } else {
        dept = degreeInput.value || "";
    }

    const regno = regnoInput.value.trim();
    const email = emailInput.value.trim();
    const parentMobile = parentMobileInput.value.trim();
    const address = addressInput.value.trim();

    const student = {
        name: nameInput.value.trim(),
        dept: dept,
        year: yearInput.value,
        regno: regno,
        mobile: mobileInput.value.trim(),
        email: email,
        parentMobile: parentMobile,
        address: address,
        gender: genderInput.value
    };

    if (
        student.name === "" ||
        student.dept === "" ||
        student.year === "" ||
        student.mobile === "" ||
        parentMobile === ""
    ) {
        showAlert("Please fill all fields.", "warning");
        return;
    }

    if (!/^\d{10}$/.test(student.mobile)) {
        showAlert("Please enter a valid 10-digit mobile number.", "warning");
        return;
    }

    const duplicateMobile = students.some(
        (s) => s.id !== editId && (s.mobile || "").trim() === student.mobile
    );

    if (duplicateMobile) {
        showAlert("This mobile number is already registered.", "warning");
        return;
    }

    if (regno !== "" && !/^\d{1,20}$/.test(regno)) {
        showAlert("Reg. No. must contain only numbers (1 to 20 digits).", "warning");
        return;
    }

    if (email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showAlert("Please enter a valid email address.", "warning");
        return;
    }

    if (!/^\d{10}$/.test(parentMobile)) {
        showAlert("Please enter a valid 10-digit parent's mobile number.", "warning");
        return;
    }

    if (parentMobile === student.mobile) {
        showAlert("Parent's mobile number must be different from the student's mobile number.", "warning");
        return;
    }

    const savingId = editId;
    saveBtn.disabled = true;
    try {
        if (savingId === null) {
            await createStudentRow(student);
        } else {
            await updateStudentRow(savingId, student);
        }
    } catch (err) {
        console.error("Save error:", err);
        if (err && (err.code === "23505" || (err.message && err.message.toLowerCase().includes("duplicate")))) {
            showAlert("This mobile number is already registered.", "warning");
        } else {
            showAlert("Could not save. Please check your connection and try again.", "error");
        }
        saveBtn.disabled = false;
        return;
    }
    saveBtn.disabled = false;

    editId = null;

    lastDept = deptInput.value;
    lastDeptOther = deptOtherInput.value.trim();
    lastDegree = degreeInput.value;
    lastDegreeOther = degreeOtherInput.value.trim();

    popup.classList.remove("active");
    clearForm();
};



function clearForm(prefillDept = false) {
    nameInput.value = "";
    deptOtherInput.value = "";
    deptOtherInput.style.display = "none";
    degreeOtherInput.value = "";
    degreeOtherInput.style.display = "none";
    degreeInput.innerHTML = `<option value="" disabled selected>Select Degree</option>`;
    degreeInput.style.display = "none";
    yearInput.value = "";
    regnoInput.value = "";
    mobileInput.value = "";
    emailInput.value = "";
    parentMobileInput.value = "";
    addressInput.value = "";
    genderInput.value = "Male";

    if (prefillDept && lastDept) {
        deptInput.value = lastDept;

        if (lastDept === "Others") {
            deptOtherInput.style.display = "block";
            deptOtherInput.value = lastDeptOther;
        } else {
            populateDegreeOptions(lastDept);

            if (lastDegree) {
                degreeInput.value = lastDegree;

                if (lastDegree === "Others") {
                    degreeOtherInput.style.display = "block";
                    degreeOtherInput.value = lastDegreeOther;
                }
            }
        }
    } else {
        deptInput.value = "";
    }
}

function renderSkeleton(rows = 4) {

    table.innerHTML = Array.from({ length: rows }).map(() => `
        <tr class="skeleton-row">
            <td><div class="skeleton-bar" style="width:70%"></div></td>
            <td><div class="skeleton-bar" style="width:60%"></div></td>
            <td><div class="skeleton-bar" style="width:30%;margin:0 auto"></div></td>
            <td><div class="skeleton-bar" style="width:55%"></div></td>
            <td><div class="skeleton-bar" style="width:40%;margin:0 auto"></div></td>
            <td><div class="skeleton-bar skeleton-bar-actions"></div></td>
        </tr>
    `).join("");

    [totalStudents, maleCount, femaleCount, deptCount].forEach((el) => {
        el.classList.add("skeleton-num");
        el.innerHTML = "";
    });

}

function renderLoadError(err) {

    const message = err && (err.code === "42501" || (err.message && err.message.toLowerCase().includes("policy")))
        ? "Access denied. Your Supabase security policies may need updating for this account (did you run supabase-schema.sql?)."
        : "Couldn't load your students. Check your connection and try again.";

    table.innerHTML = `
        <tr>
            <td colspan="6" class="table-error">
                <i class="fa-solid fa-triangle-exclamation"></i>
                ${message}
            </td>
        </tr>
    `;

    [totalStudents, maleCount, femaleCount, deptCount].forEach((el) => {
        el.classList.remove("skeleton-num");
        el.innerText = "–";
    });

}

function renderStudents(list = students) {

    currentVisibleList = list;

    table.innerHTML = "";

    [totalStudents, maleCount, femaleCount, deptCount].forEach((el) => {
        el.classList.remove("skeleton-num");
    });

    let male = 0;
    let female = 0;

    // Sort by department (dropdown order), then degree, then gender, then name
    const sortedList = [...list].sort(compareByDeptDegreeGenderName);

    // Group by department (dropdown order), then by degree, then by year within it
    let currentDeptCategory = null;
    let currentDegreeKey = null;
    let currentYearValue = null;
    let maleHeader = false;
    let femaleHeader = false;

    sortedList.forEach((student) => {

        if(student.gender === "Male"){
            male++;
        }else{
            female++;
        }

        const studentDeptCategory = departmentForStudent(student.dept);
        const studentDegreeKey = normalizeDeptKey(student.dept);
        const studentYearValue = student.year || "";

        // Add a department header row whenever the department changes
        if (currentDeptCategory !== studentDeptCategory) {
            currentDeptCategory = studentDeptCategory;
            currentDegreeKey = null; // force the degree header to re-print too

            table.innerHTML += `
            <tr class="dept-category-header-row">
                <td colspan="6" style="background: #6a11cb; color: white; font-weight: bold; padding: 14px 12px; text-align: left; font-size: 15px;">
                    🏛️ ${studentDeptCategory}
                </td>
            </tr>
            `;
        }

        // Add a degree header row whenever the degree changes (comparing
        // normalized keys, so "B.Sc.cs.Ai" and "Bsc.cs.Ai" stay together)
        if (currentDegreeKey !== studentDegreeKey) {
            currentDegreeKey = studentDegreeKey;
            currentYearValue = null; // force the year header to re-print too

            table.innerHTML += `
            <tr class="dept-header-row">
                <td colspan="6" style="background: #2575fc; color: white; font-weight: bold; padding: 12px; text-align: left; font-size: 14px;">
                    📚 ${student.dept || "Unknown Degree"}
                </td>
            </tr>
            `;
        }

        // Add a year subheader whenever the year changes, so 1st year and
        // 2nd year (etc.) students under the same degree appear as
        // separate blocks instead of being mixed together.
        if (currentYearValue !== studentYearValue) {
            currentYearValue = studentYearValue;
            maleHeader = false;
            femaleHeader = false;

            table.innerHTML += `
            <tr class="year-header-row">
                <td colspan="6" style="background: #00b894; color: white; font-weight: bold; padding: 10px 12px; text-align: left; font-size: 13px;">
                    🎓 ${studentYearValue ? `Year ${studentYearValue}` : "Year Not Set"}
                </td>
            </tr>
            `;
        }

        // Add gender subheader if gender changed
        if (student.gender === "Male" && !maleHeader) {
            maleHeader = true;
            table.innerHTML += `
            <tr class="gender-header-row">
                <td colspan="6" style="background: #e8f0ff; color: #2575fc; font-weight: bold; padding: 8px 12px; text-align: left; font-size: 12px;">
                    👦 Boys
                </td>
            </tr>
            `;
        } else if (student.gender === "Female" && !femaleHeader && maleHeader) {
            femaleHeader = true;
            table.innerHTML += `
            <tr class="gender-header-row">
                <td colspan="6" style="background: #ffe8f0; color: #e74c3c; font-weight: bold; padding: 8px 12px; text-align: left; font-size: 12px;">
                    👧 Girls
                </td>
            </tr>
            `;
        }

        const canManage = currentRole === "admin" || currentRole === "staff";
        const actionButtonsHtml = canManage ? `
                <button class="action-btn edit-btn"
                onclick="editStudent('${student.id}')">
                <i class="fa-solid fa-pen"></i>
                </button>

                ${currentRole === "admin" ? `
                <button class="action-btn delete-btn"
                onclick="deleteStudent('${student.id}')">
                <i class="fa-solid fa-trash"></i>
                </button>
                ` : ""}
        ` : `<span class="no-actions">—</span>`;

        table.innerHTML += `
        <tr class="fade-row">
            <td><a href="#" class="name-link" onclick="showStudentInfo('${student.id}'); return false;">${student.name}</a></td>
            <td>${student.dept}</td>
            <td>${student.year || "-"}</td>
            <td><a href="tel:${student.mobile}" class="call-link">${student.mobile}</a></td>
            <td>${student.gender}</td>

            <td>
                ${actionButtonsHtml}
            </td>

        </tr>
        `;
    });

    totalStudents.innerText = sortedList.length;
    maleCount.innerText = male;
    femaleCount.innerText = female;

    const uniqueDepts = new Set(
        sortedList
            .map((s) => normalizeDeptKey(s.dept))
            .filter((d) => d !== "")
    );
    deptCount.innerText = uniqueDepts.size;

}


function editStudent(id){

    if (currentRole === "viewer") return;

    const student = students.find((s) => s.id === id);
    if (!student) return;

    popup.classList.add("active");

    nameInput.value = student.name;

    const matchedDept = findDepartmentForDegree(student.dept);

    if (matchedDept) {
        deptInput.value = matchedDept;
        deptOtherInput.style.display = "none";
        deptOtherInput.value = "";

        populateDegreeOptions(matchedDept);
        degreeInput.value = student.dept;
        degreeOtherInput.style.display = "none";
        degreeOtherInput.value = "";
    } else {
        deptInput.value = "Others";
        deptOtherInput.style.display = "block";
        deptOtherInput.value = student.dept;

        degreeInput.style.display = "none";
        degreeInput.innerHTML = `<option value="" disabled selected>Select Degree</option>`;
        degreeOtherInput.style.display = "none";
        degreeOtherInput.value = "";
    }

    yearInput.value = student.year || "";
    regnoInput.value = student.regno || "";
    mobileInput.value = student.mobile;
    emailInput.value = student.email || "";
    parentMobileInput.value = student.parentMobile || "";
    addressInput.value = student.address || "";
    genderInput.value = student.gender;

    editId = id;

}


async function deleteStudent(id){

    if (currentRole !== "admin") return;

    const confirmed = await showConfirm("Delete this student?", { okText: "Delete", type: "warning" });

    if(confirmed){

        try {
            await deleteStudentRow(id);
        } catch (err) {
            console.error("Delete error:", err);
            showAlert("Could not delete. Please check your connection and try again.", "error");
        }

    }

}


const filterDepartmentSelect = document.getElementById("filterDepartment");
const filterDegreeSelect = document.getElementById("filterDegree");
const filterYearSelect = document.getElementById("filterYear");

// Departments (dropdown order, "Other" last) that currently have students —
// shared logic for both the table filter bar and the export popup.
function getPresentDepartmentOptions() {
    const present = new Set(
        students
            .filter((s) => (s.dept || "").trim() !== "")
            .map((s) => departmentForStudent(s.dept))
    );

    const ordered = departmentOrder.filter((d) => present.has(d));
    if (present.has("Other")) ordered.push("Other");
    return ordered;
}

// Degrees that currently have students, optionally narrowed to one
// department category — shared by the table filter bar and export popup.
function getPresentDegreeOptions(department) {
    const groups = groupByNormalizedDept(students.filter((s) => (s.dept || "").trim() !== ""));
    let labels = [...groups.values()].map((g) => g.label);

    if (department) {
        labels = labels.filter((label) => departmentForStudent(label) === department);
    }

    return labels.sort(compareByDeptDegree);
}

// Rebuilds the Degree dropdown for the current Department selection,
// keeping the previous Degree selected if it's still a valid option.
function refreshTableDegreeOptions() {
    if (!filterDegreeSelect) return;

    const degreeOptions = getPresentDegreeOptions(selectedDepartment);
    const prevDegree = selectedDegree;

    filterDegreeSelect.innerHTML = `<option value="">All Degrees</option>` +
        degreeOptions
            .map((d) => `<option value="${d.replace(/"/g, "&quot;")}">${d}</option>`)
            .join("");

    if (degreeOptions.includes(prevDegree)) {
        filterDegreeSelect.value = prevDegree;
    } else {
        selectedDegree = "";
        filterDegreeSelect.value = "";
    }
}

// Rebuilds both the Department and (cascading) Degree dropdowns to match
// whatever data currently exists — called on login and on every realtime
// data update, since new departments/degrees can appear or disappear.
function refreshTableFilterOptions() {
    if (!filterDepartmentSelect) return;

    const deptOptions = getPresentDepartmentOptions();
    const prevDept = selectedDepartment;

    filterDepartmentSelect.innerHTML = `<option value="">All Departments</option>` +
        deptOptions
            .map((d) => `<option value="${d.replace(/"/g, "&quot;")}">${d}</option>`)
            .join("");

    if (deptOptions.includes(prevDept)) {
        filterDepartmentSelect.value = prevDept;
    } else {
        selectedDepartment = "";
        filterDepartmentSelect.value = "";
    }

    refreshTableDegreeOptions();
}

if (filterDepartmentSelect) {
    filterDepartmentSelect.addEventListener("change", () => {
        selectedDepartment = filterDepartmentSelect.value;
        refreshTableDegreeOptions();
        applyFilters();
    });
}

if (filterDegreeSelect) {
    filterDegreeSelect.addEventListener("change", () => {
        selectedDegree = filterDegreeSelect.value;
        applyFilters();
    });
}

if (filterYearSelect) {
    filterYearSelect.addEventListener("change", () => {
        selectedYear = filterYearSelect.value;
        applyFilters();
    });
}

const searchSuggestions = document.getElementById("searchSuggestions");

search.addEventListener("keyup", () => {

    const rawValue = search.value.trim();
    const value = rawValue.toLowerCase();

    currentFilter = rawValue ? { type: "search", value: rawValue } : { type: "all", value: "" };
    applyFilters();

    if (value === "") {
        searchSuggestions.innerHTML = "";
        searchSuggestions.classList.remove("active");
        return;
    }

    const nameMatches = students.filter(student =>
        student.name.toLowerCase().includes(value)
    );

    if (nameMatches.length === 0) {
        searchSuggestions.innerHTML = "";
        searchSuggestions.classList.remove("active");
        return;
    }

    searchSuggestions.innerHTML = nameMatches.map(student => {
        return `<div class="suggestion-item" onclick="showStudentInfo('${student.id}')">
                    <i class="fa-solid fa-user"></i> ${student.name}
                </div>`;
    }).join("");

    searchSuggestions.classList.add("active");

});

document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrapper")) {
        searchSuggestions.classList.remove("active");
    }
});

function showStudentInfo(id) {

    const student = students.find((s) => s.id === id);
    if (!student) return;

    const popup = document.getElementById("studentInfoPopup");
    const info = document.getElementById("studentInfoContent");

    info.innerHTML = `
        <h2>${student.name}</h2>
        <p><b>Degree:</b> ${student.dept}</p>
        <p><b>Year:</b> ${student.year || "-"}</p>
        <p><b>Reg. No.:</b> ${student.regno || "Not added"}</p>
        <p><b>Mobile No.:</b> <a href="tel:${student.mobile}" class="call-link">${student.mobile}</a></p>
        <p><b>Gender:</b> ${student.gender}</p>
        <p><b>Email:</b> ${student.email ? `<a href="mailto:${student.email}" class="call-link">${student.email}</a>` : "Not added"}</p>
        <p><b>Parent's Mobile No.:</b> ${student.parentMobile ? `<a href="tel:${student.parentMobile}" class="call-link">${student.parentMobile}</a>` : "Not added"}</p>
        <p><b>Address:</b> ${student.address || "Not added"}</p>
    `;

    popup.classList.add("active");

    searchSuggestions.classList.remove("active");
    search.value = "";
    updateBreadcrumb(null);
    renderStudents();
}

document.getElementById("closeStudentInfo").onclick = function () {
    document.getElementById("studentInfoPopup").classList.remove("active");
};

function showStatPopup(type) {

    const statPopup = document.getElementById("statListPopup");
    const title = document.getElementById("statListTitle");
    const content = document.getElementById("statListContent");

    if (type === "dept") {

        title.textContent = "Degrees";

        const deptGroups = groupByNormalizedDept(students.filter((s) => (s.dept || "").trim() !== ""));

        const sortedGroups = [...deptGroups.values()].sort((a, b) =>
            compareByDeptDegree(a.label, b.label)
        );

        content.innerHTML = sortedGroups.length === 0
            ? `<p class="stat-list-empty">No degrees yet.</p>`
            : sortedGroups.map((g) => `
                <div class="stat-list-item" onclick="filterByDept('${g.label.replace(/'/g, "\\'")}')">
                    <i class="fa-solid fa-building"></i>
                    <span>${g.label}</span>
                    <b>${g.items.length} student${g.items.length === 1 ? "" : "s"}</b>
                </div>
            `).join("");

    } else {

        let list = currentVisibleList;
        title.textContent = "All Students";

        if (type === "male") {
            list = currentVisibleList.filter((s) => s.gender === "Male");
            title.textContent = "Boys";
        } else if (type === "female") {
            list = currentVisibleList.filter((s) => s.gender === "Female");
            title.textContent = "Girls";
        }

        // Sort by department (dropdown order), then degree, then name
        const sorted = [...list].sort((a, b) => {
            const degreeCompare = compareByDeptDegree(a.dept, b.dept);
            if (degreeCompare !== 0) {
                return degreeCompare;
            }
            return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        });

        content.innerHTML = sorted.length === 0
            ? `<p class="stat-list-empty">No students yet.</p>`
            : sorted.map((s) => {
                return `
                <div class="stat-list-item" onclick="openStudentFromStatList('${s.id}')">
                    <i class="fa-solid fa-user"></i>
                    <span>${s.name}</span>
                    <b>${s.dept}</b>
                </div>`;
            }).join("");
    }

    statPopup.classList.add("active");

}

function openStudentFromStatList(id) {
    document.getElementById("statListPopup").classList.remove("active");
    showStudentInfo(id);
}

function filterByDept(dept) {
    document.getElementById("statListPopup").classList.remove("active");
    search.value = dept;
    currentFilter = { type: "dept", value: dept };
    applyFilters();
}

document.getElementById("closeStatList").onclick = function () {
    document.getElementById("statListPopup").classList.remove("active");
};

function updateBreadcrumb(label) {
    const current = document.getElementById("breadcrumbCurrent");
    if (!current) return;
    current.textContent = label || "All Students";
}

function resetBreadcrumb() {
    search.value = "";
    searchSuggestions.classList.remove("active");
    selectedDepartment = "";
    selectedDegree = "";
    selectedYear = "";
    if (filterDepartmentSelect) filterDepartmentSelect.value = "";
    refreshTableDegreeOptions();
    if (filterYearSelect) filterYearSelect.value = "";
    currentFilter = { type: "all", value: "" };
    applyFilters();
}


themeBtn.onclick = ()=>{

    document.body.classList.toggle("dark");

    if(document.body.classList.contains("dark")){

        localStorage.setItem("theme","dark");

        themeBtn.innerHTML =
        '<i class="fa-solid fa-sun"></i>';

    }else{

        localStorage.setItem("theme","light");

        themeBtn.innerHTML =
        '<i class="fa-solid fa-moon"></i>';

    }

};


if(localStorage.getItem("theme")==="dark"){

    document.body.classList.add("dark");

    themeBtn.innerHTML =
    '<i class="fa-solid fa-sun"></i>';

}


window.onclick = (e)=>{

    if(e.target===popup){

        popup.classList.remove("active");
        clearForm();

    }

    if(e.target===document.getElementById("statListPopup")){
        e.target.classList.remove("active");
    }

    if(e.target===document.getElementById("exportPopup")){
        e.target.classList.remove("active");
    }

    if(e.target===document.getElementById("importPopup")){
        e.target.classList.remove("active");
    }

};


renderStudents();
window.addEventListener("load", () => {

    const splash = document.getElementById("welcomeScreen");

    setTimeout(() => {

        splash.style.opacity = "0";
        splash.style.transform = "scale(1.08)";

        setTimeout(() => {
            splash.style.visibility = "hidden";
        },1000);

    },3000);

});
const profileBtn = document.getElementById("profileBtn");
const teamMenu = document.getElementById("teamMenu");

profileBtn.addEventListener("click", () => {
    teamMenu.classList.toggle("show");
});

document.addEventListener("click", (e) => {
    if (!e.target.closest(".profile-wrapper") && !e.target.closest("#profilePopup")) {
        teamMenu.classList.remove("show");
    }
});

/* ===== Install App (browser only, hidden inside the installed app) ===== */

const installAppBtn = document.getElementById("installAppBtn");
let deferredInstallPrompt = null;

function isRunningAsInstalledApp() {
    return window.matchMedia("(display-mode: standalone)").matches
        || window.navigator.standalone === true; // iOS home-screen apps
}

if (!isRunningAsInstalledApp()) {
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        installAppBtn.style.display = "flex";
    });
}

installAppBtn.addEventListener("click", () => {
    teamMenu.classList.remove("show");

    if (!deferredInstallPrompt) return;

    deferredInstallPrompt.prompt();

    deferredInstallPrompt.userChoice.finally(() => {
        deferredInstallPrompt = null;
        installAppBtn.style.display = "none";
    });
});

window.addEventListener("appinstalled", () => {
    installAppBtn.style.display = "none";
    deferredInstallPrompt = null;
});



function showProfile(person) {

    const popup = document.getElementById("profilePopup");
    const info = document.getElementById("profileInfo");

    if (person === "hari") {
        info.innerHTML = `
            <h2>Harish Raghavendar B</h2>
            <p><b>Class:</b> B.Sc. Computer Science with Artificial Intelligence</p>
            <p><b>Role:</b> Web Developer & AI Enthusiast</p>
            <p><b>Project:</b> Student Management System</p>
        `;
    } else {
        info.innerHTML = `
            <h2>Gokul Raj</h2>
            <p><b>Class:</b> B.Sc. Computer Science with Artificial Intelligence</p>
            <p><b>Role:</b> UI Designer</p>
            <p><b>Contribution:</b> Project Support</p>
        `;
    }

    popup.classList.add("active");
}
document.getElementById("closeProfile").onclick = function () {
    document.getElementById("profilePopup").classList.remove("active");
};

/* ============================================================
   EXPORT / IMPORT — Student data as a shareable PDF
   ------------------------------------------------------------
   The PDF shown to the user is a clean, formatted report.
   Hidden on an extra page (white text, tiny font — invisible
   when viewed or printed) is the exact structured student data,
   base64-encoded and wrapped in marker tags. When that same PDF
   is chosen via "Import" — on this device or any other account —
   we read the hidden block back out with pdf.js and recreate the
   students exactly, no fragile "guess it from the layout" text
   parsing involved.
   ============================================================ */

const DATA_MARKER_START = "###SMS-STUDENT-DATA-START###";
const DATA_MARKER_END   = "###SMS-STUDENT-DATA-END###";

const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFileInput = document.getElementById("importFileInput");

const exportPopup = document.getElementById("exportPopup");
const exportDepartmentSelect = document.getElementById("exportDepartment");
const exportDeptSelect = document.getElementById("exportDept");
const exportYearSelect = document.getElementById("exportYear");
const exportSummary = document.getElementById("exportSummary");
const exportCancelBtn = document.getElementById("exportCancelBtn");
const exportShareBtn = document.getElementById("exportShareBtn");
const exportDownloadBtn = document.getElementById("exportDownloadBtn");
const exportTabStudents = document.getElementById("exportTabStudents");
const exportTabAttendance = document.getElementById("exportTabAttendance");
const exportAttendanceDates = document.getElementById("exportAttendanceDates");
const exportAttendanceFromDate = document.getElementById("exportAttendanceFromDate");
const exportAttendanceToDate = document.getElementById("exportAttendanceToDate");
const exportStudentButtons = document.getElementById("exportStudentButtons");
const exportAttendanceButtons = document.getElementById("exportAttendanceButtons");
const exportStudentHint = document.getElementById("exportStudentHint");
const exportAttendanceHint = document.getElementById("exportAttendanceHint");
const exportAttendanceCancelBtn = document.getElementById("exportAttendanceCancelBtn");
const exportAttendanceShareBtn = document.getElementById("exportAttendanceShareBtn");
const exportAttendanceDownloadBtn = document.getElementById("exportAttendanceDownloadBtn");

function todayDateStr() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dateStrToDate(dateStr) {
    return new Date(dateStr + "T00:00:00");
}

// Every date string from fromStr to toStr (inclusive), both ends included.
// Capped at 62 days so a huge accidental range can't trigger a giant
// Supabase query at once.
const MAX_ATTENDANCE_RANGE_DAYS = 62;

function getDateRange(fromStr, toStr) {
    const dates = [];
    const current = dateStrToDate(fromStr);
    const end = dateStrToDate(toStr);
    const pad = (n) => String(n).padStart(2, "0");

    while (current <= end && dates.length < MAX_ATTENDANCE_RANGE_DAYS) {
        dates.push(`${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`);
        current.setDate(current.getDate() + 1);
    }

    return dates;
}

if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

/* ---------- unicode-safe base64 helpers ---------- */

function base64EncodeUnicode(str) {
    return btoa(
        encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, hex) =>
            String.fromCharCode(parseInt(hex, 16))
        )
    );
}

function base64DecodeUnicode(b64) {
    return decodeURIComponent(
        atob(b64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
    );
}

/* ---------- export ---------- */

// Sorts students by department (dropdown order), then degree, then
// gender (boys first), then name.
function sortStudentsByDeptAndGender(studentList) {
    return [...studentList].sort(compareByDeptDegreeGenderName);
}

// Department/Degree options are shared with the table filter bar —
// see getPresentDepartmentOptions() / getPresentDegreeOptions() above.

function populateExportDegreeSelect(department) {
    exportDeptSelect.innerHTML = `<option value="">All Degrees</option>` +
        getPresentDegreeOptions(department)
            .map((d) => `<option value="${d.replace(/"/g, "&quot;")}">${d}</option>`)
            .join("");
    exportDeptSelect.value = "";
}

function getFilteredExportList() {
    const department = exportDepartmentSelect ? exportDepartmentSelect.value : "";
    const dept = exportDeptSelect.value;
    const key = normalizeDeptKey(dept);

    let filtered = students;

    if (department) {
        filtered = filtered.filter((s) => departmentForStudent(s.dept) === department);
    }

    if (dept) {
        filtered = filtered.filter((s) => normalizeDeptKey(s.dept) === key);
    }

    const year = exportYearSelect ? exportYearSelect.value : "";
    if (year) {
        filtered = filtered.filter((s) => (s.year || "") === year);
    }

    // Apply sorting by department, gender, and name
    return sortStudentsByDeptAndGender(filtered);
}

// The label shown at the top of the PDF / used for the filename — reflects
// whichever of Department / Degree the user actually narrowed down to.
function buildExportScopeLabel() {
    const department = exportDepartmentSelect ? exportDepartmentSelect.value : "";
    const degree = exportDeptSelect.value;

    if (degree) return degree;
    if (department) return `${department} (All Degrees)`;
    return "All Departments";
}

function updateExportSummary() {
    const list = getFilteredExportList();

    if (exportMode === "attendance") {
        const fromStr = exportAttendanceFromDate.value || todayDateStr();
        const toStr = exportAttendanceToDate.value || fromStr;
        const rangeLabel = fromStr === toStr ? `on ${fromStr}` : `from ${fromStr} to ${toStr}`;
        exportSummary.textContent = `Attendance for ${list.length} student${list.length === 1 ? "" : "s"} ${rangeLabel}`;
    } else {
        exportSummary.textContent = `${list.length} student${list.length === 1 ? "" : "s"} will be exported`;
    }
}

let exportMode = "students"; // "students" | "attendance"

function setExportMode(mode) {
    exportMode = mode;
    const isAttendance = mode === "attendance";

    exportTabStudents.classList.toggle("active", !isAttendance);
    exportTabAttendance.classList.toggle("active", isAttendance);

    exportAttendanceDates.style.display = isAttendance ? "grid" : "none";
    exportStudentButtons.style.display = isAttendance ? "none" : "flex";
    exportAttendanceButtons.style.display = isAttendance ? "flex" : "none";
    exportStudentHint.style.display = isAttendance ? "none" : "block";
    exportAttendanceHint.style.display = isAttendance ? "block" : "none";

    updateExportSummary();
}

if (exportTabStudents) {
    exportTabStudents.onclick = () => {
        if (currentRole !== "admin") return;
        setExportMode("students");
    };
}

if (exportTabAttendance) {
    exportTabAttendance.onclick = () => setExportMode("attendance");
}

// Keep From <= To at all times, and neither can be in the future
if (exportAttendanceFromDate && exportAttendanceToDate) {
    exportAttendanceFromDate.addEventListener("change", () => {
        exportAttendanceToDate.min = exportAttendanceFromDate.value;
        if (exportAttendanceToDate.value && exportAttendanceToDate.value < exportAttendanceFromDate.value) {
            exportAttendanceToDate.value = exportAttendanceFromDate.value;
        }
        updateExportSummary();
    });

    exportAttendanceToDate.addEventListener("change", () => {
        exportAttendanceFromDate.max = exportAttendanceToDate.value;
        if (exportAttendanceFromDate.value && exportAttendanceFromDate.value > exportAttendanceToDate.value) {
            exportAttendanceFromDate.value = exportAttendanceToDate.value;
        }
        updateExportSummary();
    });
}

if (exportBtn) {
    exportBtn.onclick = () => {
        teamMenu.classList.remove("show");

        if (exportDepartmentSelect) {
            exportDepartmentSelect.innerHTML = `<option value="">All Departments</option>` +
                getPresentDepartmentOptions()
                    .map((d) => `<option value="${d.replace(/"/g, "&quot;")}">${d}</option>`)
                    .join("");
            exportDepartmentSelect.value = "";
        }

        populateExportDegreeSelect("");

        if (exportYearSelect) exportYearSelect.value = "";

        if (exportAttendanceFromDate && exportAttendanceToDate) {
            const today = todayDateStr();
            exportAttendanceFromDate.max = today;
            exportAttendanceToDate.max = today;
            exportAttendanceFromDate.value = today;
            exportAttendanceToDate.value = today;
            exportAttendanceToDate.min = today;
        }

        setExportMode(currentRole === "admin" ? "students" : "attendance");
        exportPopup.classList.add("active");
    };
}

if (exportDepartmentSelect) {
    exportDepartmentSelect.addEventListener("change", () => {
        // Degree filter narrows to whatever department is now selected
        populateExportDegreeSelect(exportDepartmentSelect.value);
        updateExportSummary();
    });
}

if (exportDeptSelect) {
    exportDeptSelect.addEventListener("change", updateExportSummary);
}

if (exportYearSelect) {
    exportYearSelect.addEventListener("change", updateExportSummary);
}

if (exportCancelBtn) {
    exportCancelBtn.onclick = () => {
        exportPopup.classList.remove("active");
    };
}

function embedStudentData(doc, list) {
    const payload = {
        app: "SMS-EXPORT",
        version: 1,
        exportedAt: new Date().toISOString(),
        students: list.map((s) => ({
            name: s.name,
            dept: s.dept,
            year: s.year || "",
            regno: s.regno || "",
            mobile: s.mobile,
            email: s.email || "",
            parentMobile: s.parentMobile || "",
            address: s.address || "",
            gender: s.gender
        }))
    };

    const encoded = base64EncodeUnicode(JSON.stringify(payload));
    const marker = DATA_MARKER_START + encoded + DATA_MARKER_END;

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const lineHeight = 1.7;

    doc.addPage();
    doc.setFont("courier", "normal");
    doc.setFontSize(4);
    doc.setTextColor(255, 255, 255); // white on white = invisible, but still present as real text

    const lines = doc.splitTextToSize(marker, pageWidth - margin * 2);

    let y = margin;
    lines.forEach((line) => {
        if (y > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
    });
}

// Splits an already department/degree-sorted list into year blocks (I,
// II, III, then unset), preserving encounter order. Used so the PDF
// mirrors the on-screen table, where 1st year and 2nd year students under
// the same degree are shown as separate sections instead of one mixed list.
function groupByYear(items) {
    const order = [];
    const map = new Map();

    items.forEach((s) => {
        const y = s.year || "";
        if (!map.has(y)) {
            map.set(y, []);
            order.push(y);
        }
        map.get(y).push(s);
    });

    return order.map((y) => ({ year: y, items: map.get(y) }));
}

function yearSectionLabel(year) {
    return year ? `Year ${year}` : "Year Not Set";
}

// Draws one degree's students as a sequence of small "Year X" titles, each
// followed by its own table — instead of one table mixing every year
// together. Adds a page break first if there isn't room for a new section.
function drawYearSections(doc, items, startY) {
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = startY;

    groupByYear(items).forEach((yearGroup) => {
        if (y > pageHeight - 40) {
            doc.addPage();
            y = 14;
        }

        doc.setFontSize(10);
        doc.setTextColor(0, 150, 100);
        doc.setFont("helvetica", "bold");
        doc.text(yearSectionLabel(yearGroup.year), 14, y);

        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(0);

        const rows = yearGroup.items.map((s) => [
            s.name,
            s.dept,
            s.year || "-",
            s.regno || "-",
            s.mobile,
            s.gender
        ]);

        doc.autoTable({
            startY: y,
            head: [["Name", "Degree", "Year", "Reg. No.", "Mobile", "Gender"]],
            body: rows,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [37, 117, 252] },
            alternateRowStyles: { fillColor: [245, 247, 255] },
            didDrawPage: function (data) {
                y = data.cursor.y + 10;
            }
        });

        y = doc.lastAutoTable.finalY + 12;
    });

    return y;
}

function generateStudentsPDF(list, deptLabel, yearLabel) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Sort students: Department → Degree → Year → Gender (Boys first) → Name
    const sortedList = sortStudentsByDeptAndGender(list);

    // Header
    doc.setFontSize(18);
    doc.setTextColor(30, 30, 30);
    doc.text("Student Management System", 14, 18);

    doc.setFontSize(11);
    doc.setTextColor(100);

    // Check if single department or all
    const isSingleDept = exportDeptSelect.value && exportDeptSelect.value !== "";
    const yearSuffix = yearLabel ? ` — ${yearLabel}` : "";

    if (isSingleDept) {
        // Single department export
        doc.text(`${deptLabel}${yearSuffix} — ${list.length} student${list.length === 1 ? "" : "s"}`, 14, 26);
        doc.text(`Exported on ${new Date().toLocaleDateString()}`, 14, 32);

        // Broken into year sections so year I and year II (etc.) don't mix
        drawYearSections(doc, sortedList, 40);
    } else {
        // Multiple degrees export (either "All Departments", or one
        // department with several degrees under it) - show each degree
        // separately, grouped under a shared scope label
        doc.text(`${deptLabel}${yearSuffix} — ${sortedList.length} student${sortedList.length === 1 ? "" : "s"}`, 14, 26);
        doc.text(`Exported on ${new Date().toLocaleDateString()}`, 14, 32);

        // Group by department (already sorted department-first, degree
        // second by sortStudentsByDeptAndGender above), merging variant
        // spellings of the same degree into one section
        const deptGroupMap = groupByNormalizedDept(sortedList);

        // Map preserves insertion order, so these labels are already in
        // department-dropdown order, then degree order — no re-sort needed
        const deptNames = [...deptGroupMap.values()].map((g) => g.label);

        const deptGroups = {};
        deptGroupMap.forEach((g) => {
            deptGroups[g.label] = g.items;
        });

        let currentYPosition = 38;

        // Add each department as a section
        deptNames.forEach((deptName, index) => {
            // Add new page if needed (but not for first department)
            if (index > 0) {
                doc.addPage();
                currentYPosition = 14;
            }

            // Department title
            doc.setFontSize(13);
            doc.setTextColor(37, 117, 252);
            doc.setFont("helvetica", "bold");
            doc.text(`${deptName}`, 14, currentYPosition);

            currentYPosition += 10;

            // Students for this department, broken into year sections
            // (already sorted: year, then boys before girls, alphabetically)
            currentYPosition = drawYearSections(doc, deptGroups[deptName], currentYPosition);
        });
    }

    embedStudentData(doc, list);
    return doc;
}

function exportFileName(deptLabel, yearLabel) {
    const safeDept = deptLabel.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
    const safeYear = yearLabel ? `_${yearLabel.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "")}` : "";
    return `students_${safeDept || "all"}${safeYear}.pdf`;
}

if (exportDownloadBtn) {
    exportDownloadBtn.onclick = () => {
        const list = getFilteredExportList();
        if (list.length === 0) {
            showAlert("No students to export for this selection.", "warning");
            return;
        }
        const deptLabel = buildExportScopeLabel();
        const yearLabel = exportYearSelect && exportYearSelect.value ? `Year ${exportYearSelect.value}` : "";
        const doc = generateStudentsPDF(list, deptLabel, yearLabel);
        doc.save(exportFileName(deptLabel, yearLabel));
        exportPopup.classList.remove("active");
    };
}

if (exportShareBtn) {
    exportShareBtn.onclick = async () => {
        const list = getFilteredExportList();
        if (list.length === 0) {
            showAlert("No students to export for this selection.", "warning");
            return;
        }
        const deptLabel = buildExportScopeLabel();
        const yearLabel = exportYearSelect && exportYearSelect.value ? `Year ${exportYearSelect.value}` : "";
        const doc = generateStudentsPDF(list, deptLabel, yearLabel);
        const fileName = exportFileName(deptLabel, yearLabel);
        const blob = doc.output("blob");
        const file = new File([blob], fileName, { type: "application/pdf" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: "Student List",
                    text: `${deptLabel}${yearLabel ? " — " + yearLabel : ""} — ${list.length} student${list.length === 1 ? "" : "s"}`
                });
            } catch (err) {
                if (err.name !== "AbortError") {
                    showAlert("Couldn't share the file. Try Download instead.", "error");
                }
            }
        } else {
            showAlert("Sharing isn't supported on this device/browser. Use Download instead, then share the PDF yourself.", "warning");
            return;
        }

        exportPopup.classList.remove("active");
    };
}

/* ---------- import ---------- */

const importPopup = document.getElementById("importPopup");
const importCancelBtn = document.getElementById("importCancelBtn");
const openFileManagerBtn = document.getElementById("openFileManagerBtn");

if (importBtn) {
    importBtn.onclick = () => {
        if (currentRole !== "admin") return;
        teamMenu.classList.remove("show");
        importPopup.classList.add("active");
    };
}

if (importCancelBtn) {
    importCancelBtn.onclick = () => {
        importPopup.classList.remove("active");
    };
}

if (openFileManagerBtn) {
    openFileManagerBtn.onclick = () => {
        importPopup.classList.remove("active");
        importFileInput.value = "";
        importFileInput.click();
    };
}

async function extractPdfText(arrayBuffer) {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map((item) => item.str).join("") + "\n";
    }

    return fullText;
}

function parseEmbeddedStudentData(fullText) {
    const startIdx = fullText.indexOf(DATA_MARKER_START);
    const endIdx = fullText.indexOf(DATA_MARKER_END);

    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
        return null;
    }

    const encoded = fullText.slice(startIdx + DATA_MARKER_START.length, endIdx);

    try {
        const json = base64DecodeUnicode(encoded);
        const payload = JSON.parse(json);
        if (!payload || payload.app !== "SMS-EXPORT" || !Array.isArray(payload.students)) {
            return null;
        }
        return payload.students;
    } catch (err) {
        return null;
    }
}

async function importStudentsFromList(importedStudents) {
    const existingMobiles = new Set(students.map((s) => (s.mobile || "").trim()));

    let added = 0;
    let skipped = 0;
    let invalid = 0;

    const rowsToInsert = [];

    for (const raw of importedStudents) {
        const student = {
            name: (raw.name || "").trim(),
            dept: (raw.dept || "").trim(),
            year: (raw.year || "").trim(),
            regno: (raw.regno || "").trim(),
            mobile: (raw.mobile || "").trim(),
            email: (raw.email || "").trim(),
            parentMobile: (raw.parentMobile || "").trim(),
            address: (raw.address || "").trim(),
            gender: raw.gender === "Female" ? "Female" : "Male"
        };

        if (!student.name || !student.dept || !student.mobile || !/^\d{10}$/.test(student.mobile)) {
            invalid++;
            continue;
        }

        if (existingMobiles.has(student.mobile)) {
            skipped++;
            continue;
        }

        existingMobiles.add(student.mobile);
        rowsToInsert.push(studentToRow(student, workspaceOwnerUid));
    }

    // Insert in one batch (chunked to stay safe with large imports).
    const CHUNK = 100;
    for (let i = 0; i < rowsToInsert.length; i += CHUNK) {
        const chunk = rowsToInsert.slice(i, i + CHUNK);
        try {
            const { error } = await supabase.from("students").insert(chunk);
            if (error) throw error;
            added += chunk.length;
        } catch (err) {
            console.error("Import chunk error:", err);
            // Fall back to one-by-one so a single bad row can't fail the batch.
            for (const row of chunk) {
                try {
                    const { error } = await supabase.from("students").insert(row);
                    if (error) throw error;
                    added++;
                } catch (e) {
                    invalid++;
                }
            }
        }
    }

    if (added > 0) await reloadStudents();

    return { added, skipped, invalid };
}

if (importFileInput) {
    importFileInput.addEventListener("change", async () => {
        const file = importFileInput.files[0];
        if (!file) return;

        if (!currentUser) {
            showAlert("Please log in first.", "warning");
            return;
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const fullText = await extractPdfText(arrayBuffer);
            const importedStudents = parseEmbeddedStudentData(fullText);

            if (!importedStudents) {
                showAlert("This PDF doesn't contain importable student data. Make sure it was exported from this app's Export button.", "error");
                return;
            }

            if (importedStudents.length === 0) {
                showAlert("This file has no students to import.", "warning");
                return;
            }

            const { added, skipped, invalid } = await importStudentsFromList(importedStudents);

            let message = `Imported ${added} student${added === 1 ? "" : "s"}.`;
            if (skipped > 0) message += ` Skipped ${skipped} already in your list.`;
            if (invalid > 0) message += ` ${invalid} had invalid data and were skipped.`;
            showAlert(message, "success");

        } catch (err) {
            console.error("Import error:", err);
            showAlert("Couldn't read that PDF. Please make sure it's a valid file exported from this app.", "error");
        } finally {
            importFileInput.value = "";
        }
    });
}

/* ================= ATTENDANCE ================= */

// Each day's attendance is stored as one small row per student in the
// attendance_records table (owner_id + date + student_id) — never one big
// shared row — so two staff marking different classes on the same day (or
// fixing a mistake later) can never overwrite each other.
async function fetchAttendanceForDate(dateStr) {
    const { data, error } = await supabase
        .from("attendance_records")
        .select("student_id, hours")
        .eq("owner_id", workspaceOwnerUid)
        .eq("date", dateStr);
    if (error) throw error;
    return data || [];
}

const attendanceBtn = document.getElementById("attendanceBtn");
const attendancePopup = document.getElementById("attendancePopup");
const attendanceDateInput = document.getElementById("attendanceDate");
const attendanceDepartmentSelect = document.getElementById("attendanceDepartment");
const attendanceDegreeSelect = document.getElementById("attendanceDegree");
const attendanceYearSelect = document.getElementById("attendanceYear");
const attendanceListEl = document.getElementById("attendanceList");
const attendanceCancelBtn = document.getElementById("attendanceCancelBtn");
const attendanceSaveBtn = document.getElementById("attendanceSaveBtn");

// studentId -> [hour1..hour5] booleans (true = present), for whatever
// date/filter is currently loaded in the popup
let attendanceState = {};

function populateAttendanceDegreeSelect(department) {
    attendanceDegreeSelect.innerHTML = `<option value="">All Degrees</option>` +
        getPresentDegreeOptions(department)
            .map((d) => `<option value="${d.replace(/"/g, "&quot;")}">${d}</option>`)
            .join("");
    attendanceDegreeSelect.value = "";
}

function getAttendanceFilteredStudents() {
    const department = attendanceDepartmentSelect.value;
    const degree = attendanceDegreeSelect.value;
    const year = attendanceYearSelect.value;

    let filtered = students;

    if (department) {
        filtered = filtered.filter((s) => departmentForStudent(s.dept) === department);
    }

    if (degree) {
        const key = normalizeDeptKey(degree);
        filtered = filtered.filter((s) => normalizeDeptKey(s.dept) === key);
    }

    if (year) {
        filtered = filtered.filter((s) => (s.year || "") === year);
    }

    return sortStudentsByDeptAndGender(filtered);
}

function renderAttendanceList() {
    const list = getAttendanceFilteredStudents();

    if (list.length === 0) {
        attendanceListEl.innerHTML = `<p class="attendance-empty">No students match this selection.</p>`;
        return;
    }

    attendanceListEl.innerHTML = list.map((s) => {
        const hours = attendanceState[s.id] || [true, true, true, true, true];

        const hourBtns = hours.map((present, i) => `
            <button type="button"
                class="attendance-hour-btn ${present ? "" : "absent"}"
                onclick="toggleAttendanceHour('${s.id}', ${i})">${present ? "P" : "A"}</button>
        `).join("");

        return `
        <div class="attendance-row">
            <a href="#" class="name-link attendance-student-name" onclick="showStudentInfo('${s.id}'); return false;">${s.name}</a>
            <div class="attendance-hours">${hourBtns}</div>
        </div>`;
    }).join("");
}

function toggleAttendanceHour(studentId, hourIndex) {
    if (!attendanceState[studentId]) return;
    attendanceState[studentId][hourIndex] = !attendanceState[studentId][hourIndex];
    renderAttendanceList();
}

async function loadAttendanceForCurrentSelection() {
    const dateStr = attendanceDateInput.value;
    if (!dateStr) return;

    const list = getAttendanceFilteredStudents();

    if (list.length === 0) {
        attendanceState = {};
        attendanceListEl.innerHTML = `<p class="attendance-empty">No students match this selection.</p>`;
        return;
    }

    attendanceListEl.innerHTML = `<p class="attendance-empty">Loading…</p>`;

    // Default everyone to Present — staff only need to tap the hours a
    // student actually missed, which is the fast/common case.
    const freshState = {};
    list.forEach((s) => {
        freshState[s.id] = [true, true, true, true, true];
    });

    try {
        const rows = await fetchAttendanceForDate(dateStr);
        rows.forEach((row) => {
            const hours = row.hours;
            if (freshState[row.student_id] && Array.isArray(hours) && hours.length === 5) {
                freshState[row.student_id] = hours;
            }
        });
    } catch (err) {
        console.error("Attendance load error:", err);
        attendanceListEl.innerHTML = `<p class="attendance-empty">Couldn't load saved attendance for this date. Check your connection.</p>`;
        attendanceState = {};
        return;
    }

    attendanceState = freshState;
    renderAttendanceList();
}

if (attendanceBtn) {
    attendanceBtn.onclick = () => {
        if (currentRole === "viewer") return;
        teamMenu.classList.remove("show");

        attendanceDateInput.max = todayDateStr();
        if (!attendanceDateInput.value) attendanceDateInput.value = todayDateStr();

        attendanceDepartmentSelect.innerHTML = `<option value="">All Departments</option>` +
            getPresentDepartmentOptions()
                .map((d) => `<option value="${d.replace(/"/g, "&quot;")}">${d}</option>`)
                .join("");
        attendanceDepartmentSelect.value = "";

        populateAttendanceDegreeSelect("");
        attendanceYearSelect.value = "";

        attendancePopup.classList.add("active");
        loadAttendanceForCurrentSelection();
    };
}

attendanceDateInput.addEventListener("change", loadAttendanceForCurrentSelection);

attendanceDepartmentSelect.addEventListener("change", () => {
    populateAttendanceDegreeSelect(attendanceDepartmentSelect.value);
    loadAttendanceForCurrentSelection();
});

attendanceDegreeSelect.addEventListener("change", loadAttendanceForCurrentSelection);
attendanceYearSelect.addEventListener("change", loadAttendanceForCurrentSelection);

attendanceCancelBtn.onclick = () => {
    attendancePopup.classList.remove("active");
};

attendanceSaveBtn.onclick = async () => {
    if (currentRole === "viewer") return;

    const dateStr = attendanceDateInput.value;

    if (!dateStr) {
        showAlert("Please pick a date.", "warning");
        return;
    }

    const list = getAttendanceFilteredStudents();

    if (list.length === 0) {
        showAlert("No students to save attendance for.", "warning");
        return;
    }

    const originalLabel = attendanceSaveBtn.innerHTML;
    attendanceSaveBtn.disabled = true;
    attendanceSaveBtn.textContent = "Saving...";

    const markerName = getUserDisplayName(currentUser);
    const now = new Date();

    try {
        const rows = list.map((s) => ({
            owner_id: workspaceOwnerUid,
            date: dateStr,
            student_id: s.id,
            hours: attendanceState[s.id] || [true, true, true, true, true],
            marked_by: markerName,
            marked_by_uid: currentUser.id,
        }));

        const { error } = await supabase
            .from("attendance_records")
            .upsert(rows, { onConflict: "owner_id,date,student_id" });
        if (error) throw error;

        attendancePopup.classList.remove("active");
        showAttendanceRecordReceipt(dateStr, list, markerName, now);

    } catch (err) {
        console.error("Attendance save error:", err);
        showAlert("Couldn't save attendance. Please check your connection and try again.", "error");
    } finally {
        attendanceSaveBtn.disabled = false;
        attendanceSaveBtn.innerHTML = originalLabel;
    }
};

/* ---------- attendance record receipt ---------- */

function formatDateDMY(dateStr) {
    const parts = dateStr.split("-");
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function formatTimeStamp(date) {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    let hours = date.getHours();
    const mins = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${d}-${m}-${y} ${hours}:${mins} ${ampm}`;
}

let lastAttendanceRecordText = "";

function showAttendanceRecordReceipt(dateStr, list, markerName, now) {
    const popup = document.getElementById("attendanceRecordPopup");
    const content = document.getElementById("attendanceRecordContent");
    if (!popup || !content) return;

    const dateLabel = formatDateDMY(dateStr);
    const timeLabel = formatTimeStamp(now);

    let html = `Date: ${dateLabel}\n<span class="record-divider">--------------------------------</span>\n`;
    let plain = `Attendance Record\n--------------------------------\nDate: ${dateLabel}\n`;

    list.forEach((s) => {
        const hours = attendanceState[s.id] || [true, true, true, true, true];
        html += `\n<span class="record-student">Student: ${s.name}</span>\n`;
        plain += `\nStudent: ${s.name}\n`;
        hours.forEach((present, i) => {
            const label = present ? "Present" : "Absent";
            const cls = present ? "record-present" : "record-absent";
            html += `Hour ${i + 1}: <span class="${cls}">${label}</span>\n`;
            plain += `Hour ${i + 1}: ${label}\n`;
        });
    });

    html += `\n<div class="record-footer">Marked by: ${markerName}\nLast modified: ${timeLabel}</div>`;
    plain += `\nMarked by: ${markerName}\nLast modified: ${timeLabel}`;

    content.innerHTML = html;
    lastAttendanceRecordText = plain;

    popup.classList.add("active");
}

document.getElementById("closeAttendanceRecord").onclick = function () {
    document.getElementById("attendanceRecordPopup").classList.remove("active");
};

document.getElementById("attendanceRecordOkBtn").onclick = function () {
    document.getElementById("attendanceRecordPopup").classList.remove("active");
};

document.getElementById("copyAttendanceRecordBtn").onclick = function () {
    const btn = this;
    navigator.clipboard.writeText(lastAttendanceRecordText).then(() => {
        const original = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-check"></i> Copied`;
        setTimeout(() => { btn.innerHTML = original; }, 1500);
    }).catch(() => {
        showAlert("Could not copy. Please select and copy the text manually.", "error");
    });
};

/* ---------- attendance PDF report ---------- */

async function buildAttendanceRecordsMap(dateStr) {
    const rows = await fetchAttendanceForDate(dateStr);
    const map = {};
    rows.forEach((row) => {
        const hours = row.hours;
        map[row.student_id] = Array.isArray(hours) && hours.length === 5
            ? hours
            : [true, true, true, true, true];
    });
    return map;
}

// Fetches the whole range in ONE query: { dateStr: { studentId: hours[] } }
async function buildAttendanceRecordsMapForRange(dateList) {
    const combined = {};
    dateList.forEach((d) => { combined[d] = {}; });

    const { data, error } = await supabase
        .from("attendance_records")
        .select("date, student_id, hours")
        .eq("owner_id", workspaceOwnerUid)
        .in("date", dateList);
    if (error) throw error;

    (data || []).forEach((row) => {
        const hours = row.hours;
        // PostgREST may return date as "YYYY-MM-DD" already; normalize just in case.
        const key = typeof row.date === "string" ? row.date.slice(0, 10) : row.date;
        if (!combined[key]) combined[key] = {};
        combined[key][row.student_id] = Array.isArray(hours) && hours.length === 5
            ? hours
            : [true, true, true, true, true];
    });

    return combined;
}

function formatDateShort(dateStr) {
    const parts = dateStr.split("-");
    return `${parts[1]}/${parts[2]}`;
}

function generateAttendancePDF(list, dateList, recordsByDate, scopeLabel) {
    const { jsPDF } = window.jspdf;
    const singleDay = dateList.length === 1;
    const shortRange = dateList.length > 1 && dateList.length <= 14;

    const doc = new jsPDF({
        orientation: shortRange && dateList.length > 5 ? "landscape" : "portrait"
    });

    const dateRangeLabel = singleDay
        ? dateList[0]
        : `${dateList[0]} to ${dateList[dateList.length - 1]}`;

    doc.setFontSize(18);
    doc.setTextColor(30, 30, 30);
    doc.text("Student Management System", 14, 18);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Attendance Report - ${scopeLabel}`, 14, 26);
    doc.text(`Date${singleDay ? "" : "s"}: ${dateRangeLabel}`, 14, 32);

    let head, body, columnStyles;

    if (singleDay) {
        // Full hour-by-hour detail for a single day
        const recordsMap = recordsByDate[dateList[0]];

        head = [["Name", "Degree", "Year", "1", "2", "3", "4", "5", "Present", "%"]];
        body = list.map((s) => {
            const hours = recordsMap[s.id] || [true, true, true, true, true];
            const presentCount = hours.filter(Boolean).length;
            const pct = Math.round((presentCount / 5) * 100);

            return [
                s.name, s.dept, s.year || "-",
                ...hours.map((h) => (h ? "P" : "A")),
                `${presentCount}/5`, `${pct}%`
            ];
        });
        columnStyles = { 0: { halign: "left" }, 1: { halign: "left" } };

    } else if (shortRange) {
        // One column per day, showing that day's present-hours count.
        // A day with no saved record at all shows "-" and isn't counted
        // toward the Overall % (so an un-marked holiday can't drag a
        // student's attendance down).
        head = [["Name", "Degree", "Year", ...dateList.map(formatDateShort), "Overall %"]];

        body = list.map((s) => {
            let markedDays = 0;
            let presentHours = 0;

            const dayCells = dateList.map((d) => {
                const hours = recordsByDate[d][s.id];
                if (!hours) return "-";
                markedDays++;
                const count = hours.filter(Boolean).length;
                presentHours += count;
                return `${count}/5`;
            });

            const overall = markedDays === 0
                ? "No data"
                : `${Math.round((presentHours / (markedDays * 5)) * 100)}%`;

            return [s.name, s.dept, s.year || "-", ...dayCells, overall];
        });
        columnStyles = { 0: { halign: "left" }, 1: { halign: "left" } };

    } else {
        // Long range: per-day columns would be unreadable, so show one
        // aggregate row per student instead.
        head = [["Name", "Degree", "Year", "Days Marked", "Present Hours", "Overall %"]];

        body = list.map((s) => {
            let markedDays = 0;
            let presentHours = 0;

            dateList.forEach((d) => {
                const hours = recordsByDate[d][s.id];
                if (!hours) return;
                markedDays++;
                presentHours += hours.filter(Boolean).length;
            });

            const overall = markedDays === 0
                ? "No data"
                : `${Math.round((presentHours / (markedDays * 5)) * 100)}%`;

            return [
                s.name, s.dept, s.year || "-",
                markedDays,
                `${presentHours}/${markedDays * 5}`,
                overall
            ];
        });
        columnStyles = { 0: { halign: "left" }, 1: { halign: "left" } };
    }

    doc.autoTable({
        startY: 38,
        head: head,
        body: body,
        styles: { fontSize: shortRange && dateList.length > 8 ? 7.5 : 8.5, halign: "center" },
        columnStyles: columnStyles,
        headStyles: { fillColor: [0, 184, 148] },
        alternateRowStyles: { fillColor: [235, 253, 248] }
    });

    return doc;
}

async function runAttendanceExport(action) {
    const list = getFilteredExportList();

    if (list.length === 0) {
        showAlert("No students to export for this selection.", "warning");
        return;
    }

    const fromStr = exportAttendanceFromDate.value || todayDateStr();
    const toStr = exportAttendanceToDate.value || fromStr;

    if (toStr < fromStr) {
        showAlert("The 'To' date can't be earlier than the 'From' date.", "warning");
        return;
    }

    const dateList = getDateRange(fromStr, toStr);

    if (dateList.length === 0) {
        showAlert("Please pick a valid date range.", "warning");
        return;
    }

    const scopeLabel = buildExportScopeLabel();
    const rangeForFilename = fromStr === toStr ? fromStr : `${fromStr}_to_${toStr}`;
    const fileName = `attendance_${rangeForFilename}_${scopeLabel.replace(/[^a-z0-9]+/gi, "_")}.pdf`;

    try {
        const recordsByDate = await buildAttendanceRecordsMapForRange(dateList);
        const doc = generateAttendancePDF(list, dateList, recordsByDate, scopeLabel);

        if (action === "download") {
            doc.save(fileName);
            exportPopup.classList.remove("active");
            return;
        }

        const blob = doc.output("blob");
        const file = new File([blob], fileName, { type: "application/pdf" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: "Attendance Report",
                text: `Attendance - ${scopeLabel} - ${fromStr === toStr ? fromStr : `${fromStr} to ${toStr}`}`
            });
            exportPopup.classList.remove("active");
        } else {
            showAlert("Sharing isn't supported on this device/browser. Use Download instead.", "warning");
        }

    } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Attendance export error:", err);
        showAlert("Couldn't generate the attendance report. Please check your connection and try again.", "error");
    }
}

if (exportAttendanceDownloadBtn) {
    exportAttendanceDownloadBtn.onclick = () => runAttendanceExport("download");
}

if (exportAttendanceShareBtn) {
    exportAttendanceShareBtn.onclick = () => runAttendanceExport("share");
}

if (exportAttendanceCancelBtn) {
    exportAttendanceCancelBtn.onclick = () => {
        exportPopup.classList.remove("active");
    };
}
