import fs from "node:fs";
const css = fs.readFileSync("src/odo.css", "utf8"), js = fs.readFileSync("src/odo.js", "utf8");
fs.mkdirSync("compositions/frames", { recursive: true });
for (const f of fs.readdirSync("src").filter(f => /^\d\d-.*\.html$/.test(f))) {
  const out = fs.readFileSync("src/" + f, "utf8").replace("/*ODO_CSS*/", css).replace("/*ODO_JS*/", js);
  fs.writeFileSync("compositions/frames/" + f, out);
  console.log("built", f);
}
