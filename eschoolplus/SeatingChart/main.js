

/* ================= OVERLAY ================= */
const overlay = document.createElement("div");
overlay.style.cssText = `
position:fixed;top:0;left:0;width:100vw;height:100vh;
background:#f4f4f4;z-index:999999;
display:flex;flex-direction:column;font-family:Arial;
`;
document.body.appendChild(overlay);


/*==Left Addition==*/
const style = document.createElement("style");
style.textContent = `
.left-mode-card {
  width: 100% !important;
  max-width: 208px !important;
  height: auto !important;
  aspect-ratio: 2 / 3;
}

.left-mode-card div:first-child {
  height: 80% !important;
}

.left-mode-card div:last-child {
  height: 20% !important;
  font-size: 13px !important;
  padding: 4px !important;
}

.name-only-card img {
  display:none !important;
}

.name-only-card div:last-child {
  height:100% !important;
  flex:1 !important;
  font-size:calc(18px * var(--zoom)) !important;
  padding:5px !important;
}
`;
document.head.appendChild(style);

/* ================= BAR ================= */
const bar = document.createElement("div");
bar.style.cssText = `height:40px;background:#222;color:white;display:flex;gap:10px;padding:5px;`;
overlay.appendChild(bar);
style.textContent += `

.menu{
position:relative;
display:inline-block;
}

.dropdown{
display:none;
position:absolute;
top:35px;
left:0;
background:white;
color:black;
border:1px solid #888;
z-index:1000002;
min-width:150px;
box-shadow:0 2px 8px rgba(0,0,0,.3);
}

.dropdown button{
display:block;
width:100%;
text-align:left;
padding:6px;
border:none;
background:white;
}

.dropdown button:hover{
background:#ddd;
}

`;
/* ================= MAIN ================= */
const main = document.createElement("div");
main.style.cssText = `flex:1;display:flex;overflow:hidden;`;
overlay.appendChild(main);

const left = document.createElement("div");
left.style.cssText = `width:20%;height:100%;overflow-y:auto;overflow-x:auto;background:white;padding:10px;`;
main.appendChild(left);

const right = document.createElement("div");
right.style.cssText = `
flex:1;
display:grid;
gap:10px;
padding:10px;
align-content:start;
align-items:start;
overflow:auto;
`;
main.appendChild(right);

/* ================= GRID ================= */
let cols = 8;
let rows = 7;

right.style.gridTemplateColumns = `repeat(${cols}, var(--seat-w))`;
right.style.gridAutoRows = `var(--seat-h)`;

/* ================= STATE ================= */
const state = {
  grid: Array.from({length:rows},()=>Array(cols).fill(null)),
  blocked: new Set(),
  frozen: new Set()
};

/* start blocked */
for(let r=0;r<rows;r++){
  for(let c=0;c<cols;c++){
    state.blocked.add(r+","+c);
  }
}

/* ================= NAME FIX ================= */
function decodeName(str){
  return (str || "")
    .replace(/&#39;|&apos;|&#x27;/g, "'")
    .trim();
}


/* ================= drag ================= */

function applySeatPaint(r,c){

  const key = r+","+c;

  if(state.grid[r][c] !== null) return;

  if(dragMode === "open"){
    state.blocked.delete(key);
  }

  if(dragMode === "close"){
    state.blocked.add(key);
  }

}
/* ================= STUDENTS ================= */

const cardsById = new Map();
let fitMode = false;
let seatScale = 1;
let textScale = 1;

const students =
[...document.querySelectorAll(".sg-student-link")]
.map(link => ({
    id: link.getAttribute("studentid"),
    name: link.textContent.trim()
}))
.filter(s => s.id)
.sort((a,b)=>a.name.localeCompare(b.name));

students.forEach(student => {

    const {id, name} = student;

    const card = document.createElement("div");
    card.style.cssText = `
        width:100%;
        height:100%;
        border:1px solid #ccc;
        background:white;
        display:flex;
        flex-direction:column;
        cursor:grab;
        overflow:hidden;
    `;

    const img = document.createElement("img");

    img.src =
        "/TAC/StudentDetailsDrawer/GetStudentPhoto?studentId=" +
        encodeURIComponent(id);

    img.style.cssText = `
        width:100%;
        height:80%;
        object-fit:cover;
        display:block;
    `;

    const label = document.createElement("div");

    label.textContent = name;

    label.style.cssText = `
        height:20%;
         font-size:calc(11px * var(--textZoom));      
        display:flex;
        align-items:center;
        justify-content:center;
        text-align:center;
        padding:2px;
        overflow:hidden;
    `;

    card.appendChild(img);
    card.appendChild(label);

    card.draggable = true;

    card.ondragstart = e => {
        e.dataTransfer.setData("text/plain", id);
    };

card.onclick = e => {
    e.stopPropagation();

    for(let r=0;r<rows;r++){
        for(let c=0;c<cols;c++){
            if(state.grid[r][c] === id){
                 const key = r + "," + c;
                state.frozen.delete(key);
                state.grid[r][c] = null;
                render();
                return;
            }
        }
    }

    for(let r=0;r<rows;r++){
        for(let c=0;c<cols;c++){

            const key = r+","+c;

            if(state.blocked.has(key)) continue;

            if(state.grid[r][c] !== null) continue;

            state.grid[r][c] = id;
            render();
            return;
        }
    }

};

    cardsById.set(id, card);

});

/* ================= SEAT SIZE ================= */
function updateSeatSize(){
  const rect = right.getBoundingClientRect();

  const cellW = rect.width / cols;
  const cellH = rect.height / rows;

  const size = Math.floor(Math.min(cellW, cellH));

  const MAX = 260;
  const cappedSize = Math.min(size, MAX);

const scaled = cappedSize * seatScale;
textScale = Math.max(.75, Math.min(2, scaled / 100));

document.documentElement.style.setProperty("--seat-w", scaled + "px");
document.documentElement.style.setProperty("--seat-h", (scaled * 1.5) + "px");
document.documentElement.style.setProperty("--zoom", seatScale);
document.documentElement.style.setProperty("--textZoom", textScale);
}

window.addEventListener("resize", ()=>{
  updateSeatSize();
  render();
});

/* ================= LEFT ================= */
function renderLeft(){
  left.innerHTML = "";

  const placed = new Set(state.grid.flat().filter(Boolean));

  const available = [...cardsById.entries()]
    .filter(([id]) => !placed.has(id))
    .sort((a,b)=>a[1].innerText.localeCompare(b[1].innerText));

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "1fr 1fr";
  grid.style.gap = "8px";
  grid.style.alignItems = "start";

  available.forEach(([id, card])=>{
    card.classList.add("left-mode-card");
    grid.appendChild(card);
  });

  left.appendChild(grid);
}

/* ================= GRID ================= */

let nameOnlyMode = false;
let seatDragging = false;
let dragMode = null;
let dragMoved = false;
let mouseDown = false;
let firstDragCell = null;


function renderSeats(){
  right.innerHTML = "";

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const key = r+","+c;

      const seat = document.createElement("div");
      seat.oncontextmenu = e => {e.preventDefault();};
      const isBlocked = state.blocked.has(key);

      seat.style.cssText = `
        width:var(--seat-w);
        height:var(--seat-h);
        border:2px dashed #aaa;
        display:flex;
        align-items:center;
        justify-content:center;
        background:${isBlocked?"#444":"white"};
      `;

const isFrozen = state.frozen.has(key);

if (isFrozen) {
    seat.style.boxShadow = "0 0 0 4px dodgerblue";
}

seat.onclick = ()=>{

  if(dragMoved){
    dragMoved = false;
    return;
  }

  if(state.grid[r][c] !== null) return;

  if(state.blocked.has(key)){
    state.blocked.delete(key);
  } else {
    state.blocked.add(key);
  }

  render();

};


seat.onmousedown = e => {
if(e.button === 2 && state.grid[r][c] !== null){

        e.preventDefault();

        const key = r + "," + c;

        if(state.frozen.has(key)){
            state.frozen.delete(key);
        }else{
            state.frozen.add(key);
        }

        render();
        return;
    }
  if(state.grid[r][c] !== null) return;

  mouseDown = true;
  dragMoved = false;
  firstDragCell = [r,c];


  if(e.button === 0){
    dragMode = "open";
  }

  if(e.button === 2){
    dragMode = "close";
  }

};


seat.onmouseenter = ()=>{

  if(!mouseDown) return;

  dragMoved = true;
  seatDragging = true;
if(firstDragCell){
    applySeatPaint(firstDragCell[0], firstDragCell[1]);
    firstDragCell = null;
  }
  applySeatPaint(r,c);

};


window.onmouseup = ()=>{

  if(seatDragging){
    render();
  }

  mouseDown = false;
  seatDragging = false;
  dragMode = null;
  firstDragCell = null;


};


      seat.ondragover = e=>{
        if(isBlocked) return;
        e.preventDefault();
      };

      seat.ondrop = e => {

    e.preventDefault();

    if (isBlocked) return;

    const id = e.dataTransfer.getData("text/plain");

    let sr = -1;
    let sc = -1;

    outer:
    for (let rr = 0; rr < rows; rr++) {
        for (let cc = 0; cc < cols; cc++) {

            if (state.grid[rr][cc] === id) {
                sr = rr;
                sc = cc;
                break outer;
            }

        }
    }

    const target = state.grid[r][c];

if (sr !== -1) {

    const sourceKey = sr + "," + sc;
    const targetKey = r + "," + c;

    const sourceFrozen = state.frozen.has(sourceKey);
    const targetFrozen = state.frozen.has(targetKey);

    state.grid[sr][sc] = target;
    state.grid[r][c] = id;

    state.frozen.delete(sourceKey);
    state.frozen.delete(targetKey);

    if (sourceFrozen) state.frozen.add(targetKey);
    if (targetFrozen) state.frozen.add(sourceKey);

} else {
    state.grid[r][c] = id;
}

    render();

};

      const id = state.grid[r][c];
if(id){
  const card = cardsById.get(id);

  if(card){
    card.classList.remove("left-mode-card");
    seat.appendChild(card);
  }
}

      right.appendChild(seat);
    }
  }
}

/* ================= RENDER ================= */
function render(){
  updateSeatSize();
  renderLeft();
  renderSeats();
}

/* ================= BUTTONS ================= */
bar.innerHTML = `
<button id="shuffle">Shuffle</button>
<button id="shuffleSeated">Shuffle Seated</button>
<button id="open">Open All</button>
<button id="closeAll">Close All</button>
<button id="clear">Clear</button>
<button id="names">Names Only</button>
<button id="printSeats">Print Seats</button>
<button id="fit">Fit to Screen</button>
<button id="resize">Resize Grid</button>
<div class="menu">
<button id="chartMenuButton">Charts ▾</button>
<div id="chartMenu" class="dropdown">
<button id="save">Save Chart</button>
<button id="load">Load Chart</button>
<button id="manage">Manage Charts</button>
</div>
</div>
<button id="close">Close</button>
`;

bar.querySelectorAll("button").forEach(btn=>{
    btn.style.height = "100%";
});

const chartMenuButton =
bar.querySelector("#chartMenuButton");

const chartMenu =
bar.querySelector("#chartMenu");



chartMenuButton.onclick = e=>{
    e.stopPropagation();

    chartMenu.style.display =
        chartMenu.style.display==="block"
        ? "none"
        : "block";
};


document.addEventListener("click",()=>{
    chartMenu.style.display="none";
});

bar.querySelector("#shuffle").onclick = ()=>{

const frozenStudents = [];

for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
        const key = r + "," + c;

        if(state.frozen.has(key) && state.grid[r][c] !== null){
            frozenStudents.push(state.grid[r][c]);
        }
    }
}

  const pool = [...cardsById.keys()].filter(id => !frozenStudents.includes(id));

  for(let i = pool.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  let index = 0;

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){

      const key = r+","+c;

      if(state.blocked.has(key)){
        state.grid[r][c] = null;
        continue;
      }
      if(state.frozen.has(key)){
            continue;          
        }
      state.grid[r][c] = pool[index++] || null;
    }
  }

  render();
};

bar.querySelector("#shuffleSeated").onclick = ()=>{

  const seats = [];

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){

      if(state.grid[r][c] !== null && !state.frozen.has(r + "," + c)){
        seats.push([r,c]);
      }

    }
  }

  const seated = seats.map(([r,c]) => state.grid[r][c]);

  for(let i = seated.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [seated[i], seated[j]] = [seated[j], seated[i]];
  }

  seats.forEach(([r,c], index)=>{
    state.grid[r][c] = seated[index];
  });

  render();
};

bar.querySelector("#names").onclick = ()=>{

  nameOnlyMode = !nameOnlyMode;

  cardsById.forEach(card=>{
    card.classList.toggle("name-only-card", nameOnlyMode);
  });

  bar.querySelector("#names").textContent = 
    nameOnlyMode ? "Pictures" : "Names Only";

};

bar.querySelector("#printSeats").onclick = ()=>{

  const compactPrint = cols > 12 || rows > 8;

  const imgHeight = compactPrint ? "60%" : "75%";
  const labelHeight = compactPrint ? "40%" : "25%";


  const printArea = document.createElement("div");

  printArea.className = "print-seat-chart";

  printArea.style.cssText = `
    position:fixed;
    left:0;
    top:0;
    width:100vw;
    height:100vh;
    background:white;
    z-index:1000000;
    display:grid;
    grid-template-columns:repeat(${cols}, 1fr);
    grid-template-rows:repeat(${rows}, 1fr);
    gap:4px;
    padding:10px;
    box-sizing:border-box;
  `;


  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){

      const key = r+","+c;

      const seat = document.createElement("div");

      seat.style.cssText = `
        border:1px solid #555;
        display:flex;
        align-items:center;
        justify-content:center;
        overflow:hidden;
        min-height:0;
        min-width:0;
        container-type:size;

      `;


      const id = state.grid[r][c];

      if(id){

        const card = cardsById.get(id);

        if(card){
  const clone = card.cloneNode(true);

clone.className = "print-card" + (nameOnlyMode ? " name-only-card" : "");
  seat.appendChild(clone);
}

      }

      else if(state.blocked.has(key)){
        seat.style.background="#444";
      }


      printArea.appendChild(seat);
    }
  }


  const printStyle = document.createElement("style");

printStyle.textContent = `

@media print {

  @page {
    size: portrait;
    margin: .25in;
  }

  body > *:not(.print-seat-chart) {
    display:none !important;
  }

  .print-seat-chart {
    display:grid !important;
    width:100vw !important;
    height:100vh !important;
  }

  .print-card {
    width:100% !important;
    height:100% !important;
    display:flex !important;
    flex-direction:column !important;
    overflow:hidden !important;
  }

  .print-card img {
    width:100% !important;
    height:${imgHeight} !important;
    object-fit:cover !important;
    object-position:top center !important;
  }

  .print-card > div {
    width:100% !important;
    height:${labelHeight} !important;
    display:flex !important;
    align-items:center !important;
    justify-content:center !important;
    text-align:center !important;
    overflow:hidden !important;
    font-size:clamp(6px,1vw,14px) !important;
  }

  .print-card.name-only-card img {
    display:none !important;
  }

  .print-card.name-only-card > div {
    height:100% !important;
    flex:1 !important;
    line-height:1.1 !important;
    padding:2px !important;
    font-size:20px !important;
    overflow-wrap:break-word !important;
    word-break:break-word !important;
}

@container (min-width: 50px) {
  .print-card.name-only-card > div {
    font-size:18cqw !important;
  }
}

}

`;


  document.body.appendChild(printArea);
  document.head.appendChild(printStyle);


  window.print();


  printArea.remove();
  printStyle.remove();

};

bar.querySelector("#clear").onclick = ()=>{
  state.grid = state.grid.map(r=>r.map(()=>null));
   state.frozen.clear();
  render();
};

bar.querySelector("#open").onclick = ()=>{
  state.blocked.clear();
 
    render();
};

bar.querySelector("#closeAll").onclick = ()=>{
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      if(state.grid[r][c] === null){
            state.blocked.add(r+","+c);
        }
    }
  }
  render();
};

bar.querySelector("#fit").onclick = ()=>{

    fitMode = !fitMode;

    if(fitMode){

        const rect = right.getBoundingClientRect();

        const gap = 10;      
        const padding = 20;  

       const availableW = rect.width - padding - (cols - 1) * gap;
const availableH = rect.height - padding - (rows - 1) * gap;

const baseWidth = availableW / cols;
const baseHeight = availableH / rows / 1.5;

const baseSize = Math.min(baseWidth, baseHeight);

        const normalSize = Math.min(
            Math.min(rect.width / cols, rect.height / rows),
            260
        );

        seatScale = baseSize / normalSize;

        bar.querySelector("#fit").textContent = "Large View";

    }else{

        seatScale = 1;

        bar.querySelector("#fit").textContent = "Fit to Screen";

    }

    render();

};

function openResizeDialog(){

    const dialog = document.createElement("div");

dialog.style.cssText = `
    position:fixed;
    top:45px;
    left:50%;
    transform:translateX(-50%);
    background:#f4f4f4;
    border:1px solid #888;
    padding:12px;
    z-index:1000001;
    font-family:Arial;
    box-shadow:0 2px 8px rgba(0,0,0,.35);
`;

dialog.innerHTML = `
<div style="margin-bottom:10px;">
    <span style="display:inline-block;width:70px;">Columns:</span>
    <input id="newCols" value="${cols}" style="width:50px;">
</div>

<div style="margin-bottom:12px;">
    <span style="display:inline-block;width:70px;">Rows:</span>
    <input id="newRows" value="${rows}" style="width:50px;">
</div>

<div style="text-align:right;">
    <button id="applyResize">OK</button>
    <button id="cancelResize">Cancel</button>
</div>
`;

document.body.appendChild(dialog);

const colsBox = dialog.querySelector("#newCols");
const rowsBox = dialog.querySelector("#newRows");

colsBox.focus();
colsBox.select();

colsBox.onkeydown = e=>{
    if(e.key==="Enter"){ rowsBox.focus();rowsBox.select(); }
};

rowsBox.onkeydown = e=>{
    if(e.key==="Enter")
        dialog.querySelector("#applyResize").click();
};


    dialog.querySelector("#cancelResize").onclick = ()=>{
        dialog.remove();
    };


    dialog.querySelector("#applyResize").onclick = ()=>{

        const newCols = parseInt(
            dialog.querySelector("#newCols").value
        );

        const newRows = parseInt(
            dialog.querySelector("#newRows").value
        );


        if(!newCols || !newRows) return;


        dialog.remove();


        /*
          Clear student placement first
        */
        state.grid = state.grid.map(r=>r.map(()=>null));


        /*
          Change dimensions
        */
        cols = newCols;
        rows = newRows;


        /*
          Rebuild grid
        */
        state.grid = Array.from(
            {length:rows},
            ()=>Array(cols).fill(null)
        );


        /*
          Reset blocked seats
        */
        state.blocked.clear();
        state.frozen.clear();

        for(let r=0;r<rows;r++){
            for(let c=0;c<cols;c++){
                state.blocked.add(r+","+c);
            }
        }


        /*
          Update CSS grid
        */
        right.style.gridTemplateColumns =
            `repeat(${cols}, var(--seat-w))`;

        right.style.gridAutoRows =
            "var(--seat-h)";


        /*
          Recalculate size using current mode
        */
        if(fitMode){

            const rect = right.getBoundingClientRect();

            const gap = 10;
            const padding = 20;

            const availableW =
                rect.width - padding - (cols-1)*gap;

            const availableH =
                rect.height - padding - (rows-1)*gap;


            const size = Math.floor(
                Math.min(
                    availableW / cols,
                    availableH / rows / 1.5
                )
            );

            seatScale = size / 100; 
        }
        else {

            seatScale = 1;

        }


        render();

    };

};

bar.querySelector("#resize").onclick = openResizeDialog;

bar.querySelector("#save").onclick = ()=>{


const params =
new URLSearchParams(window.location.search);


const key =
"seatingCharts_" +
(params.get("SectionKey")||"unknown") +
"_P" +
(params.get("Periods")||"unknown").trim();


const name = prompt(
"Name this seating chart:",
"Chart " + new Date().toLocaleDateString()
);


if(!name) return;


const chart={

name:name,

className:
decodeURIComponent(
params.get("Description")||"Unknown Class"
),

period:
(params.get("Periods")||"unknown").trim(),

cols:cols,
rows:rows,

grid:state.grid,
blocked:[...state.blocked],
frozen:[...state.frozen],

saved:new Date().toISOString()

};


let charts =
JSON.parse(
localStorage.getItem(key)||"[]"
);


charts.push(chart);


localStorage.setItem(
key,
JSON.stringify(charts)
);





};


bar.querySelector("#load").onclick = ()=>{

    const params =
    new URLSearchParams(window.location.search);


    const key =
    "seatingCharts_" +
    (params.get("SectionKey")||"unknown") +
    "_P" +
    (params.get("Periods")||"unknown").trim();


    const charts =
    JSON.parse(
        localStorage.getItem(key)||"[]"
    );


    if(charts.length===0){

        alert("No saved charts found");
        return;

    }


    const picker = document.createElement("div");

    picker.style.cssText=`
        position:fixed;
        top:50%;
        left:50%;
        transform:translate(-50%,-50%);
        background:white;
        border:1px solid #888;
        padding:15px;
        z-index:1000005;
        min-width:260px;
        max-height:400px;
        overflow:auto;
        font-family:Arial;
        box-shadow:0 4px 12px rgba(0,0,0,.4);
    `;


    const title=document.createElement("div");

    title.textContent =
        "Load Seating Chart";

    title.style.cssText=`
        font-weight:bold;
        margin-bottom:10px;
    `;


    picker.appendChild(title);



    charts.forEach((chart,index)=>{


        const button=document.createElement("button");


        button.style.cssText=`
            display:block;
            width:100%;
            margin:5px 0;
            padding:8px;
            text-align:left;
            cursor:pointer;
        `;


        button.textContent =
            chart.name +
            "  (" +
            new Date(chart.saved)
            .toLocaleDateString() +
            ")";


        button.onclick=()=>{


            cols = chart.cols;
            rows = chart.rows;


            state.grid = chart.grid;

            state.blocked =
                new Set(chart.blocked);

            state.frozen =
                new Set(chart.frozen);


            right.style.gridTemplateColumns =
                `repeat(${cols}, var(--seat-w))`;

            right.style.gridAutoRows =
                "var(--seat-h)";


            picker.remove();


            render();


           

        };


        picker.appendChild(button);


    });



    const cancel=document.createElement("button");

    cancel.textContent="Cancel";

    cancel.style.cssText=`
        margin-top:10px;
        width:100%;
    `;


    cancel.onclick=()=>{

        picker.remove();

    };


    picker.appendChild(cancel);


    document.body.appendChild(picker);


};

bar.querySelector("#manage").onclick = ()=>{

const params = new URLSearchParams(window.location.search);

const key =
"seatingCharts_" +
(params.get("SectionKey")||"unknown") +
"_P" +
(params.get("Periods")||"unknown").trim();


let charts =
JSON.parse(localStorage.getItem(key)||"[]");


if(!charts.length){

    alert("No saved charts");
    return;

}



const picker = document.createElement("div");


picker.style.cssText=`
position:fixed;
top:50%;
left:50%;
transform:translate(-50%,-50%);
background:white;
border:1px solid #888;
padding:15px;
z-index:1000005;
min-width:300px;
max-height:500px;
overflow:auto;
font-family:Arial;
box-shadow:0 4px 12px rgba(0,0,0,.4);
`;



picker.innerHTML=`

<div style="
font-weight:bold;
margin-bottom:10px;">
Manage Seating Charts
</div>

<div id="chartList"></div>

<button id="closeManage"
style="margin-top:10px;width:100%;">
Close
</button>

`;



document.body.appendChild(picker);



const list =
picker.querySelector("#chartList");



charts.forEach((chart,index)=>{


const button=document.createElement("button");


button.style.cssText=`
display:block;
width:100%;
margin:5px 0;
padding:8px;
text-align:left;
cursor:pointer;
`;



button.innerHTML=
`
<b>${chart.name}</b>
<br>
<small>
${new Date(chart.saved).toLocaleString()}
</small>
`;



button.onclick=()=>{


const actionBox=document.createElement("div");


actionBox.style.cssText=`
position:fixed;
top:50%;
left:50%;
transform:translate(-50%,-50%);
background:white;
border:1px solid #888;
padding:15px;
z-index:1000006;
font-family:Arial;
box-shadow:0 4px 12px rgba(0,0,0,.4);
`;



actionBox.innerHTML=`

<div style="font-weight:bold;margin-bottom:10px;">
${chart.name}
</div>

<button id="rename">
Rename
</button>

<button id="delete">
Delete
</button>

<button id="cancel">
Cancel
</button>

`;



document.body.appendChild(actionBox);



actionBox.querySelector("#rename").onclick=()=>{


const newName =
prompt(
"New chart name:",
chart.name
);


if(newName){

    chart.name=newName;

    localStorage.setItem(
        key,
        JSON.stringify(charts)
    );

    picker.remove();
    actionBox.remove();

    bar.querySelector("#manage").click();

}

};



actionBox.querySelector("#delete").onclick=()=>{


if(confirm(
"Delete \""+
chart.name+
"\"?"
)){


    charts.splice(index,1);


    localStorage.setItem(
        key,
        JSON.stringify(charts)
    );


    picker.remove();
    actionBox.remove();

    bar.querySelector("#manage").click();

}


};



actionBox.querySelector("#cancel").onclick=()=>{

    actionBox.remove();

};



};



list.appendChild(button);


});



picker.querySelector("#closeManage")
.onclick=()=>{

    picker.remove();

};


};

bar.querySelector("#close").onclick = ()=>{
  style.remove();
  overlay.remove();
};

/* ================= INIT ================= */
updateSeatSize();
render();


