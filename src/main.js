const shellPid = +env.get("shell_pid");
const { proc } = await load("process.js");

runAppDirect(proc, $METADATA, shellPid);
