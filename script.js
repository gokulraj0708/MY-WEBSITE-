

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
    for (const department in deptDegreeMap) {
        if (deptDegreeMap[department].includes(degreeValue)) {
            return department;
        }
    }
    return null;
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
let unsubscribeStudents = null; // Firestore real-time listener

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

authSubmitBtn.onclick = () => {
    const email = authEmail.value.trim();
    const password = authPassword.value;

    if (!email || !password) {
        authError.textContent = "Please enter email and password.";
        return;
    }

    authError.textContent = "";
    authInfo.textContent = "";

    const action = isSignupMode
        ? auth.createUserWithEmailAndPassword(email, password)
        : auth.signInWithEmailAndPassword(email, password);

    action.catch((err) => {
        authError.textContent = getFriendlyAuthError(err.code);
    });
};

function getFriendlyAuthError(code) {
    switch (code) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
            return isSignupMode
                ? "Something went wrong. Please try again."
                : "No account found with that email and password. New here? Tap 'Sign up' below.";
        case "auth/email-already-in-use":
            return "An account with this email already exists. Please login instead.";
        case "auth/invalid-email":
            return "Please enter a valid email address.";
        case "auth/weak-password":
            return "Password should be at least 6 characters.";
        case "auth/too-many-requests":
            return "Too many attempts. Please wait a moment and try again.";
        case "auth/network-request-failed":
            return "Network error. Check your internet connection and try again.";
        default:
            return "Something went wrong. Please try again.";
    }
}

const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const authInfo = document.getElementById("authInfo");

forgotPasswordLink.onclick = (e) => {
    e.preventDefault();
    authError.textContent = "";
    authInfo.textContent = "";

    const email = authEmail.value.trim();

    if (!email) {
        authError.textContent = "Enter your email above first, then tap 'Forgot password?'.";
        authEmail.focus();
        return;
    }

    auth.sendPasswordResetEmail(email)
        .then(() => {
            authInfo.textContent = `Password reset link sent to ${email}. Check your inbox.`;
        })
        .catch((err) => {
            authError.textContent = err.code === "auth/user-not-found"
                ? "No account found with that email."
                : getFriendlyAuthError(err.code);
        });
};

const resetPasswordBtn = document.getElementById("resetPasswordBtn");

resetPasswordBtn.onclick = () => {
    teamMenu.classList.remove("show");

    if (!currentUser || !currentUser.email) return;

    const usesPassword = currentUser.providerData.some(
        (p) => p.providerId === "password"
    );

    if (!usesPassword) {
        alert("Your account signs in with Google, so there's no password to reset.");
        return;
    }

    if (!confirm(`Send a password reset link to ${currentUser.email}?`)) {
        return;
    }

    auth.sendPasswordResetEmail(currentUser.email)
        .then(() => {
            alert(`Password reset link sent to ${currentUser.email}.`);
        })
        .catch((err) => {
            alert(getFriendlyAuthError(err.code));
        });
};

logoutBtn.onclick = () => {
    teamMenu.classList.remove("show");
    logoutConfirmOverlay.classList.add("active");
};

logoutCancelBtn.onclick = () => {
    logoutConfirmOverlay.classList.remove("active");
};

logoutYesBtn.onclick = () => {
    logoutConfirmOverlay.classList.remove("active");
    auth.signOut();
};

const googleSignInBtn = document.getElementById("googleSignInBtn");
const googleProvider = new firebase.auth.GoogleAuthProvider();

googleSignInBtn.onclick = () => {
    authError.textContent = "";
    auth.signInWithPopup(googleProvider).catch((err) => {
        if (err.code !== "auth/popup-closed-by-user") {
            authError.textContent = getFriendlyAuthError(err.code);
        }
    });
};

// This runs automatically whenever login state changes,
// and on ANY device the moment that user logs in.
let authInitialized = false;

auth.onAuthStateChanged((user) => {
    const wasLoggedOut = !currentUser;
    currentUser = user;

    if (unsubscribeStudents) {
        unsubscribeStudents();
        unsubscribeStudents = null;
    }

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

        // Show placeholders while Firestore fetches this user's data.
        renderSkeleton();

        // One-time migration: older accounts stored every student as a
        // single array field. Copy those into individual documents (once)
        // so simultaneous logins can never overwrite each other's edits.
        migrateOldStudentsIfNeeded(user.uid).finally(() => {

            // Real-time listener: keeps this user's data in sync
            // across every device, live, no manual refresh needed.
            unsubscribeStudents = db.collection("students")
                .doc(user.uid)
                .collection("list")
                .onSnapshot((snapshot) => {
                    students = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                    renderStudents();
                }, (err) => {
                    console.error("Sync error:", err);
                    renderLoadError(err);
                });

        });
    } else {
        appContent.style.display = "none";
        authScreen.style.display = "flex";
        students = [];
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
});

function getUserDisplayName(user) {
    if (!user) return "User";
    return user.displayName || (user.email ? user.email.split("@")[0] : "User");
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

function migrateOldStudentsIfNeeded(uid) {
    const oldDocRef = db.collection("students").doc(uid);
    const listRef = oldDocRef.collection("list");

    return oldDocRef.get().then((oldDoc) => {
        if (!oldDoc.exists) return;

        const oldList = oldDoc.data().list;
        if (!Array.isArray(oldList) || oldList.length === 0) return;

        // Only migrate if the new subcollection is still empty, so this
        // never runs twice or duplicates anyone's students.
        return listRef.limit(1).get().then((existing) => {
            if (!existing.empty) return;

            const batch = db.batch();
            oldList.forEach((student) => {
                batch.set(listRef.doc(), student);
            });

            return batch.commit().then(() =>
                oldDocRef.update({ list: firebase.firestore.FieldValue.delete() })
            );
        });
    }).catch((err) => {
        console.error("Migration error:", err);
    });
}

function studentsCollection() {
    return db.collection("students").doc(currentUser.uid).collection("list");
}



let lastDept = "";
let lastDeptOther = "";
let lastDegree = "";
let lastDegreeOther = "";

addBtn.onclick = () => {
    editId = null;
    clearForm(true);
    popup.classList.add("active");
};

closeBtn.onclick = () => {
    popup.classList.remove("active");
    clearForm();
};


saveBtn.onclick = () => {

    let dept = "";
    if (deptInput.value === "Others") {
        dept = deptOtherInput.value.trim();
    } else if (degreeInput.value === "Others") {
        dept = degreeOtherInput.value.trim();
    } else {
        dept = degreeInput.value || "";
    }

    const regno = regnoInput.value.trim();

    const student = {
        name: nameInput.value.trim(),
        dept: dept,
        year: yearInput.value,
        regno: regno,
        mobile: mobileInput.value.trim(),
        gender: genderInput.value
    };

    if (
        student.name === "" ||
        student.dept === "" ||
        student.year === "" ||
        student.mobile === ""
    ) {
        alert("Please fill all fields.");
        return;
    }

    if (!/^\d{10}$/.test(student.mobile)) {
        alert("Please enter a valid 10-digit mobile number.");
        return;
    }

    if (regno !== "" && !/^\d{1,20}$/.test(regno)) {
        alert("Reg. No. must contain only numbers (1 to 20 digits).");
        return;
    }

    const savePromise = editId === null
        ? studentsCollection().add(student)
        : studentsCollection().doc(editId).update(student);

    savePromise.catch(() => {
        alert("Could not save. Please check your connection and try again.");
    });

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

    const message = err && err.code === "permission-denied"
        ? "Access denied. Your Firestore security rules may need updating for this account."
        : "Couldn't load your students. Check your connection and try again.";

    table.innerHTML = `
        <tr>
            <td colspan="5" class="table-error">
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

    const sortedList = [...list].sort((a, b) => {
        if (a.gender !== b.gender) {
            return a.gender === "Female" ? -1 : 1;
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

    sortedList.forEach((student) => {

        if(student.gender === "Male"){
            male++;
        }else{
            female++;
        }

        table.innerHTML += `
        <tr class="fade-row">
            <td><a href="#" class="name-link" onclick="showStudentInfo('${student.id}'); return false;">${student.name}</a></td>
            <td>${student.dept}</td>
            <td><a href="tel:${student.mobile}" class="call-link">${student.mobile}</a></td>
            <td>${student.gender}</td>

            <td>
                <button class="action-btn edit-btn"
                onclick="editStudent('${student.id}')">
                <i class="fa-solid fa-pen"></i>
                </button>

                <button class="action-btn delete-btn"
                onclick="deleteStudent('${student.id}')">
                <i class="fa-solid fa-trash"></i>
                </button>
            </td>

        </tr>
        `;
    });

    totalStudents.innerText = sortedList.length;
    maleCount.innerText = male;
    femaleCount.innerText = female;

    const uniqueDepts = new Set(
        sortedList
            .map((s) => (s.dept || "").trim())
            .filter((d) => d !== "")
    );
    deptCount.innerText = uniqueDepts.size;

}


function editStudent(id){

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
    genderInput.value = student.gender;

    editId = id;

}


function deleteStudent(id){

    if(confirm("Delete this student?")){

        studentsCollection().doc(id).delete().catch(() => {
            alert("Could not delete. Please check your connection and try again.");
        });

    }

}


const searchSuggestions = document.getElementById("searchSuggestions");

search.addEventListener("keyup", () => {

    const rawValue = search.value.trim();
    const value = rawValue.toLowerCase();

    const filtered = students.filter(student =>

        student.name.toLowerCase().includes(value) ||
        student.dept.toLowerCase().includes(value)

    );

    renderStudents(filtered);
    updateBreadcrumb(rawValue ? `Search: "${rawValue}"` : null);

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

        const deptMap = {};
        students.forEach((s) => {
            const d = (s.dept || "").trim();
            if (d === "") return;
            deptMap[d] = (deptMap[d] || 0) + 1;
        });

        const deptNames = Object.keys(deptMap).sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: "base" })
        );

        content.innerHTML = deptNames.length === 0
            ? `<p class="stat-list-empty">No degrees yet.</p>`
            : deptNames.map((d) => `
                <div class="stat-list-item" onclick="filterByDept('${d.replace(/'/g, "\\'")}')">
                    <i class="fa-solid fa-building"></i>
                    <span>${d}</span>
                    <b>${deptMap[d]} student${deptMap[d] === 1 ? "" : "s"}</b>
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

        const sorted = [...list].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
        );

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
    const filtered = students.filter((student) => student.dept === dept);
    renderStudents(filtered);
    updateBreadcrumb(dept);
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
    renderStudents();
    updateBreadcrumb(null);
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
const exportDeptSelect = document.getElementById("exportDept");
const exportSummary = document.getElementById("exportSummary");
const exportCancelBtn = document.getElementById("exportCancelBtn");
const exportShareBtn = document.getElementById("exportShareBtn");
const exportDownloadBtn = document.getElementById("exportDownloadBtn");

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

function getExportDeptOptions() {
    const depts = new Set(
        students.map((s) => (s.dept || "").trim()).filter((d) => d !== "")
    );
    return [...depts].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function getFilteredExportList() {
    const dept = exportDeptSelect.value;
    return dept ? students.filter((s) => s.dept === dept) : students;
}

function updateExportSummary() {
    const list = getFilteredExportList();
    exportSummary.textContent = `${list.length} student${list.length === 1 ? "" : "s"} will be exported`;
}

if (exportBtn) {
    exportBtn.onclick = () => {
        teamMenu.classList.remove("show");

        exportDeptSelect.innerHTML = `<option value="">All Degrees</option>` +
            getExportDeptOptions()
                .map((d) => `<option value="${d.replace(/"/g, "&quot;")}">${d}</option>`)
                .join("");

        updateExportSummary();
        exportPopup.classList.add("active");
    };
}

if (exportDeptSelect) {
    exportDeptSelect.addEventListener("change", updateExportSummary);
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

function generateStudentsPDF(list, deptLabel) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(30, 30, 30);
    doc.text("Student Management System", 14, 18);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${deptLabel} — ${list.length} student${list.length === 1 ? "" : "s"}`, 14, 26);
    doc.text(`Exported on ${new Date().toLocaleDateString()}`, 14, 32);

    doc.autoTable({
        startY: 38,
        head: [["Name", "Degree", "Year", "Reg. No.", "Mobile", "Gender"]],
        body: [...list]
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
            .map((s) => [s.name, s.dept, s.year || "-", s.regno || "-", s.mobile, s.gender]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 117, 252] },
        alternateRowStyles: { fillColor: [245, 247, 255] }
    });

    embedStudentData(doc, list);

    return doc;
}

function exportFileName(deptLabel) {
    const safe = deptLabel.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
    return `students_${safe || "all"}.pdf`;
}

if (exportDownloadBtn) {
    exportDownloadBtn.onclick = () => {
        const list = getFilteredExportList();
        if (list.length === 0) {
            alert("No students to export for this selection.");
            return;
        }
        const deptLabel = exportDeptSelect.value || "All Degrees";
        const doc = generateStudentsPDF(list, deptLabel);
        doc.save(exportFileName(deptLabel));
        exportPopup.classList.remove("active");
    };
}

if (exportShareBtn) {
    exportShareBtn.onclick = async () => {
        const list = getFilteredExportList();
        if (list.length === 0) {
            alert("No students to export for this selection.");
            return;
        }
        const deptLabel = exportDeptSelect.value || "All Degrees";
        const doc = generateStudentsPDF(list, deptLabel);
        const fileName = exportFileName(deptLabel);
        const blob = doc.output("blob");
        const file = new File([blob], fileName, { type: "application/pdf" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: "Student List",
                    text: `${deptLabel} — ${list.length} student${list.length === 1 ? "" : "s"}`
                });
            } catch (err) {
                if (err.name !== "AbortError") {
                    alert("Couldn't share the file. Try Download instead.");
                }
            }
        } else {
            alert("Sharing isn't supported on this device/browser. Use Download instead, then share the PDF yourself.");
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

    for (const raw of importedStudents) {
        const student = {
            name: (raw.name || "").trim(),
            dept: (raw.dept || "").trim(),
            year: (raw.year || "").trim(),
            regno: (raw.regno || "").trim(),
            mobile: (raw.mobile || "").trim(),
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

        try {
            await studentsCollection().add(student);
            existingMobiles.add(student.mobile);
            added++;
        } catch (err) {
            invalid++;
        }
    }

    return { added, skipped, invalid };
}

if (importFileInput) {
    importFileInput.addEventListener("change", async () => {
        const file = importFileInput.files[0];
        if (!file) return;

        if (!currentUser) {
            alert("Please log in first.");
            return;
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const fullText = await extractPdfText(arrayBuffer);
            const importedStudents = parseEmbeddedStudentData(fullText);

            if (!importedStudents) {
                alert("This PDF doesn't contain importable student data. Make sure it was exported from this app's Export button.");
                return;
            }

            if (importedStudents.length === 0) {
                alert("This file has no students to import.");
                return;
            }

            const { added, skipped, invalid } = await importStudentsFromList(importedStudents);

            let message = `Imported ${added} student${added === 1 ? "" : "s"}.`;
            if (skipped > 0) message += ` Skipped ${skipped} already in your list.`;
            if (invalid > 0) message += ` ${invalid} had invalid data and were skipped.`;
            alert(message);

        } catch (err) {
            console.error("Import error:", err);
            alert("Couldn't read that PDF. Please make sure it's a valid file exported from this app.");
        } finally {
            importFileInput.value = "";
        }
    });
}
