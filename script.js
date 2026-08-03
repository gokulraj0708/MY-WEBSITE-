

const popup = document.getElementById("popup");
const addBtn = document.getElementById("addBtn");
const closeBtn = document.getElementById("closeBtn");
const saveBtn = document.getElementById("saveBtn");

const nameInput = document.getElementById("name");
const ageInput = document.getElementById("age");
const deptInput = document.getElementById("dept");
const genderInput = document.getElementById("gender");

const table = document.getElementById("studentTable");
const search = document.getElementById("search");

const totalStudents = document.getElementById("totalStudents");
const maleCount = document.getElementById("maleCount");
const femaleCount = document.getElementById("femaleCount");

const themeBtn = document.getElementById("themeBtn");

let students = [];
let editIndex = -1;
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
const loggedInAs = document.getElementById("loggedInAs");

let isSignupMode = false;

authSwitchLink.onclick = (e) => {
    e.preventDefault();
    isSignupMode = !isSignupMode;
    authError.textContent = "";
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

    const action = isSignupMode
        ? auth.createUserWithEmailAndPassword(email, password)
        : auth.signInWithEmailAndPassword(email, password);

    action.catch((err) => {
        authError.textContent = err.message;
    });
};

logoutBtn.onclick = () => {
    auth.signOut();
};

const googleSignInBtn = document.getElementById("googleSignInBtn");
const googleProvider = new firebase.auth.GoogleAuthProvider();

googleSignInBtn.onclick = () => {
    authError.textContent = "";
    auth.signInWithPopup(googleProvider).catch((err) => {
        authError.textContent = err.message;
    });
};

// This runs automatically whenever login state changes,
// and on ANY device the moment that user logs in.
auth.onAuthStateChanged((user) => {
    currentUser = user;

    if (unsubscribeStudents) {
        unsubscribeStudents();
        unsubscribeStudents = null;
    }

    if (user) {
        authScreen.style.display = "none";
        appContent.style.display = "block";
        loggedInAs.textContent = user.email;
        authEmail.value = "";
        authPassword.value = "";

        // Real-time listener: keeps this user's data in sync
        // across every device, live, no manual refresh needed.
        unsubscribeStudents = db.collection("students")
            .doc(user.uid)
            .onSnapshot((doc) => {
                students = doc.exists ? (doc.data().list || []) : [];
                renderStudents();
            }, (err) => {
                console.error("Sync error:", err);
            });
    } else {
        appContent.style.display = "none";
        authScreen.style.display = "flex";
        students = [];
        renderStudents();
    }
});

function saveStudentsToCloud() {
    if (!currentUser) return;
    db.collection("students").doc(currentUser.uid).set({
        list: students
    });
}



addBtn.onclick = () => {
    popup.classList.add("active");
};

closeBtn.onclick = () => {
    popup.classList.remove("active");
    clearForm();
};


saveBtn.onclick = () => {

    const student = {
        name: nameInput.value.trim(),
        age: ageInput.value.trim(),
        dept: deptInput.value.trim(),
        gender: genderInput.value
    };

    if (
        student.name === "" ||
        student.age === "" ||
        student.dept === ""
    ) {
        alert("Please fill all fields.");
        return;
    }

    if (editIndex === -1) {
        students.push(student);
    } else {
        students[editIndex] = student;
        editIndex = -1;
    }

    saveStudentsToCloud();

    popup.classList.remove("active");
    clearForm();
    renderStudents();
};



function clearForm() {
    nameInput.value = "";
    ageInput.value = "";
    deptInput.value = "";
    genderInput.value = "Male";
}

function renderStudents(list = students) {

    table.innerHTML = "";

    let male = 0;
    let female = 0;

    list.forEach((student, index) => {

        if(student.gender === "Male"){
            male++;
        }else{
            female++;
        }

        table.innerHTML += `
        <tr class="fade-row">
            <td>${student.name}</td>
            <td>${student.age}</td>
            <td>${student.dept}</td>
            <td>${student.gender}</td>

            <td>
                <button class="action-btn edit-btn"
                onclick="editStudent(${index})">
                <i class="fa-solid fa-pen"></i>
                </button>

                <button class="action-btn delete-btn"
                onclick="deleteStudent(${index})">
                <i class="fa-solid fa-trash"></i>
                </button>
            </td>

        </tr>
        `;
    });

    totalStudents.innerText = list.length;
    maleCount.innerText = male;
    femaleCount.innerText = female;

}


function editStudent(index){

    popup.classList.add("active");

    nameInput.value = students[index].name;
    ageInput.value = students[index].age;
    deptInput.value = students[index].dept;
    genderInput.value = students[index].gender;

    editIndex = index;

}


function deleteStudent(index){

    if(confirm("Delete this student?")){

        students.splice(index,1);

        saveStudentsToCloud();

        renderStudents();

    }

}


search.addEventListener("keyup",()=>{

    const value = search.value.toLowerCase();

    const filtered = students.filter(student=>

        student.name.toLowerCase().includes(value) ||
        student.dept.toLowerCase().includes(value)

    );

    renderStudents(filtered);

});


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
            <h2>Your Friend's Name</h2>
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