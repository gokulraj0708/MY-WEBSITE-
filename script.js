

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

let students = JSON.parse(localStorage.getItem("students")) || [];
let editIndex = -1;



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

    localStorage.setItem(
        "students",
        JSON.stringify(students)
    );

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

        localStorage.setItem(
            "students",
            JSON.stringify(students)
        );

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
            <p><b>Role:</b> Web Developer </p>
            <p><b>Project:</b> Student Management System</p>
        `;
    } else {
        info.innerHTML = `
            <h2>GOKUL RAJ</h2>
            <p><b>Class:</b> B.Sc. Computer Science with Artificial Intelligence</p>
            <p><b>Role:</b>ARTIST</p>
            <p><b>Contribution:</b> Project Head</p>
        `;
    }

    popup.classList.add("active");
}
document.getElementById("closeProfile").onclick = function () {
    document.getElementById("profilePopup").classList.remove("active");
};