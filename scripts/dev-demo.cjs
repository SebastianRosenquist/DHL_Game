// Dev helper: runs the app against an ISOLATED demo database (./data-demo)
// so screenshots/verification never touch real data. Safe to delete.
process.env.DATABASE_URL = "file:./data-demo/db/app.db";
process.env.UPLOAD_DIR = "./data-demo/uploads";
process.env.ADMIN_PASSCODE = "demo";
process.env.SESSION_SECRET = "demo-secret-only";
require("child_process").spawn("npx", ["next", "dev", "-p", "3002"], {
  stdio: "inherit",
  shell: true,
});
