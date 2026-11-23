(() => {
  const ID = "eschoolplus-toolkit";
  const BASE = "https://raw.githubusercontent.com/cedarparkjacob/work/main/eschoolplus/";
  const existing = document.getElementById(ID);
  if (existing) { existing.remove(); return; }

  const tools = [
    { name: "Seating Chart", file: "SeatingChart/main.js", description: "Build, arrange, save, and print seating charts." },
    { name: "One Pager", file: "OnePager/main.js", description: "Open the student one-pager tool." },
    { name: "Rosters", file: "Rosters/main.js", description: "Open roster tools." },
    { name: "Flashcards", file: "Flashcards/main.js", description: "Study names with flashcards, quizzes, and matching." }
  ];

  const root = document.createElement("div");
  root.id = ID;
  root.style.cssText = "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;background:rgba(5,10,22,.76);font-family:Arial,sans-serif";
  const panel = document.createElement("div");
  panel.style.cssText = "width:min(560px,100%);max-height:90vh;overflow:auto;background:#111827;color:#f8fafc;border:1px solid #334155;border-radius:18px;box-shadow:0 24px 80px rgba(0,0,0,.5);padding:22px;box-sizing:border-box";
  const header = document.createElement("div");
  header.style.cssText = "display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px";
  const heading = document.createElement("div");
  heading.innerHTML = '<div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#93c5fd;font-weight:700">eSchoolPLUS</div><div style="font-size:25px;font-weight:700;margin-top:4px">Toolkit</div><div style="font-size:13px;color:#cbd5e1;margin-top:5px">Choose a tool to launch on this page.</div>';
  const close = document.createElement("button");
  close.type = "button"; close.textContent = "×"; close.title = "Close toolkit";
  close.style.cssText = "border:0;border-radius:9px;background:#263449;color:white;font-size:24px;width:36px;height:36px;cursor:pointer;flex:none";
  close.onclick = () => root.remove();
  header.append(heading, close); panel.appendChild(header);

  const status = document.createElement("div");
  status.style.cssText = "display:none;padding:10px 12px;margin:0 0 12px;border-radius:9px;background:#1e293b;color:#bfdbfe;font-size:13px";
  panel.appendChild(status);

  tools.forEach(tool => {
    const button = document.createElement("button");
    button.type = "button";
    button.style.cssText = "display:flex;flex-direction:column;gap:5px;text-align:left;width:100%;padding:14px 15px;margin:9px 0;border:1px solid #334155;border-radius:12px;background:#1e293b;color:#f8fafc;cursor:pointer";
    button.innerHTML = '<span style="font-size:16px;font-weight:700"></span><span style="font-size:12px;color:#cbd5e1"></span>';
    button.children[0].textContent = tool.name;
    button.children[1].textContent = tool.description;
    button.onmouseenter = () => button.style.background = "#29384e";
    button.onmouseleave = () => button.style.background = "#1e293b";
    button.onclick = async () => {
      status.style.display = "block"; status.textContent = "Loading " + tool.name + "…";
      panel.querySelectorAll("button").forEach(b => b.disabled = true);
      try {
        const response = await fetch(BASE + tool.file + "?t=" + Date.now(), { cache: "no-store" });
        if (!response.ok) throw new Error("HTTP " + response.status);
        const source = await response.text();
        root.remove();
        new Function(source + "\n//# sourceURL=" + BASE + tool.file)();
      } catch (error) {
        panel.querySelectorAll("button").forEach(b => b.disabled = false);
        status.textContent = "Could not load " + tool.name + ": " + error.message + ". The page may be blocking access to raw.githubusercontent.com.";
        console.error("[eSchoolPLUS Toolkit]", error);
      }
    };
    panel.appendChild(button);
  });

  const footer = document.createElement("div");
  footer.style.cssText = "border-top:1px solid #334155;margin-top:18px;padding-top:12px;color:#94a3b8;font-size:11px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap";
  footer.innerHTML = '<span>eSchoolPLUS Toolkit · cedarparkjacob</span><span>Click the bookmarklet again to reopen</span>';
  panel.appendChild(footer);
  root.appendChild(panel);
  root.addEventListener("click", event => { if (event.target === root) root.remove(); });
  document.body.appendChild(root);
})();