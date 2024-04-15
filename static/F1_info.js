var info = {
  // (PART A) QUEUE FILES TO PROCESS
  proc : [], // process queue
  lock : false, // in progress
  allowed : ["html"], // allowed file types
  queue : files => { if (!info.lock) {
    // (A1) LOCK PROCESS QUEUE
    info.lock = true;

    // (A2) QUEUE SELECTED FILES
    for (let f of files) { if (info.allowed.includes(f.name.split(".").pop().toLowerCase())) {
      info.proc.push(f);
    }}

    // (A3) START PROCESSING
    if (info.proc.length!=0) {
      common.conmsg(); common.conmsg("Process started.");
      common.conlock(1); common.contog(1);
      info.go();
    } else { info.lock = false; }
  }},

  // (PART B) PROCESS RESIZE/CONVERT
  go : () => {
    // (B1) PLUCK OUT FIRST FILE IN QUEUE
    let file = info.proc[0];
    info.proc.shift();

    // (B2) OPEN TEMPLATE IN NEW WINDOW
    let suffix = file.name.split("_")[0],
        img = file.name.replace(".html", ".webp"),
        win = window.open(host.base + `F2?suffix=${encodeURIComponent(suffix)}&img=${encodeURIComponent(img)}`);

    // (B3) "TRANSFER" HTML INTO TEMPLATE
    common.conmsg("Processing - " + file.name);
    win.addEventListener("load", () => {
      // (B3-1) READ CURRENT HTML
      let reader = new FileReader();
      reader.onload = () => {
        // (B3-2) PARSE INTO DOM
        let doc = new DOMParser().parseFromString(reader.result, "text/html");

        // (B3-3) "TRANSFER HTML"
        for (let s of win.document.querySelectorAll("[data-section]")) {
          s.appendChild(doc.querySelector(`[data-section=${s.dataset.section}]`));
        }

        // (B3-4) SAVE SCREENSHOT
        let next = e => {
          common.conmsg(file.name + " - " + e.detail);
          win.close();
          if (info.proc.length==0) {
            info.lock = false;
            common.conmsg("Process completed.");
            common.conlock();
          } else { info.go(); }
        };
        win.addEventListener("ok", next);
        win.addEventListener("error", next);
        win.capture();
      };
      reader.readAsText(file);
    });
  }
};

// (PART C) INIT DROP ZONE
window.addEventListener("load", () => common.dropper("drop", info.queue));