

const popup = document.getElementById("popup");
const addBtn = document.getElementById("addBtn");
const closeBtn = document.getElementById("closeBtn");
const saveBtn = document.getElementById("saveBtn");

const nameInput = document.getElementById("name");
const deptInput = document.getElementById("dept");
const deptOtherInput = document.getElementById("deptOther");
const yearInput = document.getElementById("year");
const regnoInput = document.getElementById("regno");
const mobileInput = document.getElementById("mobile");
const genderInput = document.getElementById("gender");

const knownDepts = ["Bsc.cs.Ai", "Bsc.cs", "B.com", "Ba.English", "Ba.Tamil"];

deptInput.addEventListener("change", () => {
    if (deptInput.value === "Others") {
        deptOtherInput.style.display = "block";
        deptOtherInput.focus();
    } else {
        deptOtherInput.style.display = "none";
        deptOtherInput.value = "";
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

    const dept = deptInput.value === "Others"
        ? deptOtherInput.value.trim()
        : deptInput.value;

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

    popup.classList.remove("active");
    clearForm();
};



function clearForm(prefillDept = false) {
    nameInput.value = "";
    deptOtherInput.value = "";
    deptOtherInput.style.display = "none";
    yearInput.value = "";
    regnoInput.value = "";
    mobileInput.value = "";
    genderInput.value = "Male";

    if (prefillDept && lastDept) {
        deptInput.value = lastDept;
        if (lastDept === "Others") {
            deptOtherInput.style.display = "block";
            deptOtherInput.value = lastDeptOther;
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

    if (knownDepts.includes(student.dept)) {
        deptInput.value = student.dept;
        deptOtherInput.style.display = "none";
        deptOtherInput.value = "";
    } else {
        deptInput.value = "Others";
        deptOtherInput.style.display = "block";
        deptOtherInput.value = student.dept;
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
        <p><b>Department:</b> ${student.dept}</p>
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

        title.textContent = "Departments";

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
            ? `<p class="stat-list-empty">No departments yet.</p>`
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