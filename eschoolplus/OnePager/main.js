


/* The key: $("#SDD-ViewableStudentsList") .val("933216") .change(); */


let students = []; 
let currentStudent = null; 
function showStudentPicker() {

students =
[...document.querySelectorAll(".sg-student-link")]
.map(link => ({
name: link.textContent.trim(),
id: link.getAttribute("studentid"),
element: link
}))
.filter(student => student.name.length > 2 && !student.name.match(/^\d+$/)) 
.sort((a,b)=>a.name.localeCompare(b.name)); 

const picker = document.createElement("div");
picker.id = "StudentPicker";

picker.style.cssText = `
position:fixed;
inset:40px;
background:white;
z-index:999999;
border:2px solid #444;
display:flex;
flex-direction:column;
font-family:Arial;
`;

const title = document.createElement("div");
title.textContent="ChooseStudent";title.style.cssText="background:#003b70;color:white;padding:12px;font-size:20px;font-weight:bold;";

picker.appendChild(title);

const search=document.createElement("input");
search.placeholder="Search...";
search.style.cssText="margin:10px;padding:8px;font-size:16px;";

picker.appendChild(search);

const list=document.createElement("div");
list.style.cssText="flex:1;overflow:auto;";

picker.appendChild(list);


function render(filter=""){

list.innerHTML="";

students
.filter(s=>s.name.toLowerCase().includes(filter.toLowerCase()))
.forEach(student=>{

const row=document.createElement("div");

row.textContent=student.name;

row.style.cssText="padding:8px 12px;border-bottom:1px solid #ddd;cursor:pointer;";

row.onmouseenter=()=>row.style.background="#eef5ff";
row.onmouseleave=()=>row.style.background="white";

row.onclick=()=>{

picker.remove();

loadStudent(student); 
};

list.appendChild(row);

});

}

render();

search.oninput=()=>render(search.value);

document.body.appendChild(picker);

search.focus();

} 





function getText(id){

    const el = document.getElementById(id);

    return el ? el.textContent.trim() : "";

}


/*                                Generic Timer for Loading       */

function waitForElement(selector, validator = null, timeout = 10000) {

return new Promise(resolve => {

const start = Date.now();

function check() {

const elements = document.querySelectorAll(selector);

for (const element of elements) {

if (!validator || validator(element)) {
resolve(element);
return;
}

}

if (Date.now() - start > timeout) {
console.warn("Timeout waiting for:", selector);
resolve(null);
return;
}

requestAnimationFrame(check);

}

check();

});

} 




/*                    Wait for autoclick to open student drawer then run launchOnePager       */

function loadStudent(student) {

   currentStudent = student;

   student.element.click();

   waitForElement("#SDD-QV-FullScheduleLink")
   .then(() => {

       launchOnePager();

   });

}



/*                                                                 Overlay Creation                               */


function  launchOnePager() {

    if (document.getElementById("OnePagerOverlay")) {
        document.getElementById("OnePagerOverlay").remove();
        return;
    }


/* Helpers*/



function getCurrentStudentId() {
    return currentStudent?.id || null;
}





/*                                                                Formatting (inside Onepager function*/

function createPanel(title) {

    const panel = document.createElement("div");

    panel.style.display = "flex";
    panel.style.flexDirection = "column";
    panel.style.border = "1px solid #999";
    panel.style.borderRadius = "6px";
    panel.style.background = "#fff";
    panel.style.overflow = "hidden";

    const header = document.createElement("div");
    header.textContent = title;
    header.style.background = "#0b4f8a";
    header.style.color = "white";
    header.style.padding = "8px 12px";
    header.style.fontWeight = "bold";

    const body = document.createElement("div");
    body.style.flex = "1";
    body.style.padding = "10px";
    body.style.overflow = "auto";

    panel.appendChild(header);
    panel.appendChild(body);

    panel.body = body;

    return panel;

}



/*                                                      Load Panels (inside Onepager Function)   */


function loadAttendance(attendancePanel, studentId) {

const calendar = document.querySelector(".calendarsContainer");

if (!calendar) {
attendancePanel.body.textContent = "Attendance calendar not found.";
return;
}

attendancePanel.body.innerHTML = "";

const copy = calendar.cloneNode(true);

attendancePanel.body.appendChild(copy);
} 

function loadMarks(marksPanel, studentId) {

    const drawer = window.SunGard?.Tac?.StudentDetailsDrawer;

    if (!drawer) return;

    marksPanel.body.innerHTML = "";

    const temp = document.createElement("div");

    marksPanel.body.appendChild(temp);

    drawer.MarksView.Load(
        temp,
        studentId
    );

}


async function loadQuickView(quickPanel, studentId) {



    if (!studentId) {
        console.warn("No student ID for QuickView");
        return;
    }

    quickPanel.body.innerHTML = "<i>Loading quick view...</i>";

    try {

        const token =
            document.querySelector('input[name="__RequestVerificationToken"]')?.value || "";


        const response = await fetch(
            "/TAC/StudentDetailsDrawer/_QuickView",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded; charset=UTF-8",

                    "__RequestVerificationToken":
                        token
                },

                body:
                    "studentId=" + encodeURIComponent(studentId)
            }
        );


        const html = await response.text();

        console.log("QuickView HTML:", html);


        quickPanel.body.innerHTML = html;


    }
    catch(error) {

        console.error(
            "QuickView loading failed:",
            error
        );

        quickPanel.body.innerHTML =
            "<b>Error loading Quick View.</b>";

    }

}







function loadClasswork(classworkPanel, studentId) {

    const drawer = window.SunGard?.Tac?.StudentDetailsDrawer;

    if (!drawer) return;

    classworkPanel.body.innerHTML = "";

    const temp = document.createElement("div");

    classworkPanel.body.appendChild(temp);

    drawer.ClassworkView.Load(
        temp,
        studentId
    );

}








async function loadContact(contactPanel, studentId) {

    const response = await fetch(
        window.SunGard.Tac.StudentDetailsDrawer.BaseDrawerURL() + "/_QuickView",
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded; charset=UTF-8"
            },
            body: "studentId=" + encodeURIComponent(studentId)
        }
    );

    const html = await response.text();

    const temp = document.createElement("div");
    temp.innerHTML = html;

    const contacts = temp.querySelectorAll(".sg-qv-contact-box");

    contactPanel.body.innerHTML = "";


    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "flex-start";
    wrapper.style.gap = "20px";


    const img = document.createElement("img");
    img.src =
        "/TAC/StudentDetailsDrawer/GetStudentPhoto?studentId=" +
        encodeURIComponent(studentId);

    img.style.width = "140px";
    img.style.height = "auto";
    img.style.flexShrink = "0";
    img.style.border = "1px solid #bbb";
    img.style.borderRadius = "6px";


    const contactColumn = document.createElement("div");
    contactColumn.style.flex = "1";

    contacts.forEach(contact => {
        contactColumn.appendChild(contact.cloneNode(true));
    });

    wrapper.appendChild(img);
    wrapper.appendChild(contactColumn);

    contactPanel.body.appendChild(wrapper);
}


async function loadSchedule(schedulePanel, studentId) {

    schedulePanel.body.innerHTML =
        "<i>Loading schedule...</i>";

    console.log("Loading schedule for:", studentId);

    try {

        const token =
            document.querySelector('input[name="__RequestVerificationToken"]')?.value || "";

        const response = await fetch(
            "/TAC/StudentDetailsDrawer/GetFullSchedule",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded; charset=UTF-8",

                    "__RequestVerificationToken":
                        token
                },

                body:
                    "studentId=" + encodeURIComponent(studentId)
            }
        );


        const data = await response.json();

        console.log("Schedule JSON:", data);


        const schedule = data.rows || [];


        if (!schedule.length) {

            schedulePanel.body.innerHTML =
                "<b>No schedule found.</b>";

            return;

        }


        const table = document.createElement("table");

        table.style.borderCollapse = "collapse";
        table.style.width = "100%";


        const headers = [
            "Period",
            "Course",
            "Room",
            "Teacher",
            "Building",
            "Cycles",
            "MPs"
        ];


        const headerRow = document.createElement("tr");


        headers.forEach(header => {

            const th = document.createElement("th");

            th.textContent = header;

            th.style.border = "1px solid #999";
            th.style.padding = "4px";
            th.style.background = "#eee";

            headerRow.appendChild(th);

        });


        table.appendChild(headerRow);



        schedule.forEach(course => {


            const row = document.createElement("tr");


            const values = [

                course.StartPeriod,

                course.CourseDescription,

                course.Room,

                course.Teacher,

                course.BuildingName,

                course.Cycles.join(", "),

                course.MarkingPeriods.join(", ")

            ];



            values.forEach(value => {


                const td = document.createElement("td");

                td.textContent = value || "";

                td.style.border =
                    "1px solid #ccc";

                td.style.padding = "4px";


                row.appendChild(td);

            });


            table.appendChild(row);


        });


        schedulePanel.body.innerHTML = "";

        schedulePanel.body.appendChild(table);



    }

    catch(error) {

        console.error(
            "Schedule loading failed:",
            error
        );

        schedulePanel.body.innerHTML =
            "<b>Error loading schedule.</b>";

    }


}

/*                              End of launchOnePager Function*/






    const overlay = document.createElement("div");
    overlay.id = "OnePagerOverlay";

    overlay.style.position = "fixed";
    overlay.style.left = "20px";
    overlay.style.top = "20px";
    overlay.style.right = "20px";
    overlay.style.bottom = "20px";
    overlay.style.background = "#f4f4f4";
    overlay.style.border = "2px solid #444";
    overlay.style.boxShadow = "0 0 20px rgba(0,0,0,.4)";
    overlay.style.zIndex = "999999";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";

    const titleBar = document.createElement("div");

    titleBar.style.display = "flex";
    titleBar.style.justifyContent = "space-between";
    titleBar.style.alignItems = "center";
    titleBar.style.background = "#003b70";
    titleBar.style.color = "white";
    titleBar.style.padding = "12px";

    const title = document.createElement("div");
    title.textContent = "Student One Pager";
    title.style.fontSize = "20px";
    title.style.fontWeight = "bold";
const prevButton = document.createElement("button");
prevButton.textContent = "◀ Previous";

const nextButton = document.createElement("button");
nextButton.textContent = "Next ▶"; 

const studentSelect = document.createElement("select");

prevButton.style.cssText = `
margin-left:auto;
padding:5px 10px;
cursor:pointer;
`;

studentSelect.style.cssText = `
margin:0 10px;
padding:5px 10px;
min-width:220px;
font-size:14px;
`;

nextButton.style.cssText = `
padding:5px 10px;
margin-right:15px;
cursor:pointer;
`; 




/*                                               Dropdown List                */

students.forEach(student => {

    const option = document.createElement("option");

    option.value = student.id;
    option.textContent = student.name;

    studentSelect.appendChild(option);

}); 

studentSelect.value = getCurrentStudentId();


/* Info Bar                 */

function getCurrentStudentInfo() {

const rows = $("#classRosterResultsGrid").jqGrid("getRowData"); 

return rows.find(r =>
String(r.StudentId).trim() === String(currentStudent.id).trim()
);

} 

function updateInfoBar() {

const info = getCurrentStudentInfo();

if (!info) return;

let age = "—";

if (info.BirthDate) {

const dob = new Date(info.BirthDate);
const today = new Date();

age = today.getFullYear() - dob.getFullYear();

if (
today.getMonth() < dob.getMonth() ||
(today.getMonth() === dob.getMonth() &&
today.getDate() < dob.getDate())
) {
age--;
}
}

infoBar.innerHTML = `
<b>${currentStudent.name}</b>
&nbsp; | &nbsp;
Nickname: ${info.Nickname || "—"}
&nbsp; | &nbsp;
Student ID: ${currentStudent.id}
&nbsp; | &nbsp;
Grade: ${info.Grade}
&nbsp; | &nbsp;
Age: ${age}
&nbsp; | &nbsp;
Birthday: ${info.BirthDate || "—"}
`;

} 






/* Previous & Next Buttons*/

function getCurrentIndex() {
    return students.findIndex(s => s.id === currentStudent.id);
}


prevButton.onclick = () => {

    let index = getCurrentIndex();

    if (index <= 0) {
        index = students.length - 1; 
    } else {
        index--;
    }

    switchStudent(students[index]);
updateInfoBar(); 
};


nextButton.onclick = () => {

    let index = getCurrentIndex();

    if (index >= students.length - 1) {
        index = 0;    
    } else {
        index++;
    }

    switchStudent(students[index]);
updateInfoBar(); 
};

/*                                                      Get ID change from dropdown, switch to new student*/




function switchStudent(student) {

currentStudent = student;

studentSelect.value = student.id;

$("#SDD-ViewableStudentsList")
.val(student.id)
.change();

waitForElement(
"#SDD-StudentId",
() => getText("SDD-StudentId") == currentStudent.id
).then(() => {
refreshStudent();
}); 

}


/*                                   Change overlay to match dropdown student change*/

function refreshStudent() {






updateInfoBar(); 




loadQuickView(quickPanel, getCurrentStudentId());
loadSchedule(schedulePanel, getCurrentStudentId()); 
loadClasswork(classworkPanel, getCurrentStudentId());
loadMarks(marksPanel, getCurrentStudentId()); 
loadAttendance(attendancePanel, getCurrentStudentId()); 
loadContact(contactPanel, getCurrentStudentId());



}





function populateOverlay() {

    loadQuickView(quickPanel, getCurrentStudentId());
    loadSchedule(schedulePanel, getCurrentStudentId()); 
    loadMarks(marksPanel, getCurrentStudentId());
    loadAttendance(attendancePanel, getCurrentStudentId());
    loadClasswork(classworkPanel, getCurrentStudentId());
    loadContact(contactPanel, getCurrentStudentId());


    infoBar.innerHTML =
        "<b>" + currentStudent.name + "</b>" +
        " | Nickname: " + getText("SDD-NickName") +
        " | Student ID: " + getText("SDD-StudentId") +
        " | Grade: " + getText("SDD-Grade") +
        " | Age: " + getText("SDD-Age") +
        " | Birthday: " + getText("SDD-BirthDate");
}
/*Change Dropdown*/
studentSelect.onchange = () => {

const student = students.find(
s => s.id === studentSelect.value
);

if (!student) return;

switchStudent(student);

}; 

    const close = document.createElement("button");
    close.textContent = "✕";
    close.style.fontSize = "18px";
    close.style.cursor = "pointer";

 close.onclick = function () {

overlay.remove();

document.querySelectorAll(".ui-dialog-titlebar-close")
.forEach(btn => btn.click());

document.dispatchEvent(new KeyboardEvent("keydown", {
key: "Escape",
code: "Escape",
keyCode: 27,
which: 27,
bubbles: true
})); 

};

titleBar.appendChild(title);
titleBar.appendChild(prevButton);
titleBar.appendChild(studentSelect);
titleBar.appendChild(nextButton);
titleBar.appendChild(close); 

    overlay.appendChild(titleBar);

    const infoBar = document.createElement("div");

    infoBar.style.padding = "10px";
    infoBar.style.background = "#e8eef5";
    infoBar.style.borderBottom = "1px solid #bbb";

infoBar.innerHTML ="<b>Nickname:</b> " + getText("SDD-NickName") + "&nbsp;&nbsp;&nbsp;<b>Student ID:</b> " + getText("SDD-StudentId") + "&nbsp;&nbsp;&nbsp;<b>Grade:</b> " + getText("SDD-Grade") + "&nbsp;&nbsp;&nbsp;<b>Age:</b> " + getText("SDD-Age") + "&nbsp;&nbsp;&nbsp;<b>DOB:</b> " + getText("SDD-BirthDate"); 

    overlay.appendChild(infoBar);

    const layout = document.createElement("div");

layout.style.display = "flex";
layout.style.flexDirection = "column";
layout.style.flex = "1";
layout.style.gap = "15px";
layout.style.padding = "15px";
layout.style.overflowX = "hidden"; 
layout.style.overflowY = "auto";


    const left = document.createElement("div");

    left.style.display = "flex";
    left.style.flexDirection = "column";
    left.style.gap = "15px";
    left.style.overflow = "hidden";

    const quickPanel = createPanel("Quick View");
    quickPanel.style.flex = "0 0 220px";
const schedulePanel = createPanel("Full Schedule");
const marksPanel = createPanel("Report Cards / Marks");
const attendancePanel = createPanel("Attendance");
const classworkPanel = createPanel("Classwork");
const contactPanel = createPanel("Primary Contact");


layout.appendChild(contactPanel);
/* layout.appendChild(quickPanel); */
console.log("5. Finished parsing", performance.now()); 
layout.appendChild(schedulePanel);
layout.appendChild(marksPanel); 
layout.appendChild(attendancePanel); 
layout.appendChild(classworkPanel);



classworkPanel.style.flex = "0 0 auto"; 
schedulePanel.style.flex = "0 0 auto"; 
marksPanel.style.flex = "0 0 auto";  
attendancePanel.style.flex = "0 0 auto"; 
contactPanel.style.flex = "0 0 auto"; 

    overlay.appendChild(layout);

    document.body.appendChild(overlay);



/* Call Panels*/

loadQuickView(quickPanel, getCurrentStudentId());
loadSchedule(schedulePanel, getCurrentStudentId()); 
loadClasswork(classworkPanel, getCurrentStudentId());
loadMarks(marksPanel, getCurrentStudentId()); 
loadAttendance(attendancePanel, getCurrentStudentId()); 
loadContact(contactPanel, getCurrentStudentId()); 

waitForElement(
    "#StudentDrawer",
    drawer => {

        return (
            getText("SDD-StudentId") !== "" &&
            getText("SDD-Grade") !== ""
        );

    }
)
.then(() => {


updateInfoBar(); 


});



}

showStudentPicker(); 







