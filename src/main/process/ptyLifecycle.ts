function killPtyProcess(proc, execSync) {
  try {
    const pid = proc.pid;
    proc.kill();
    if (process.platform === 'win32' && pid) {
      try {
        execSync(`taskkill /pid ${pid} /T /F`, {
          stdio: 'ignore',
          timeout: 5000,
        });
      } catch (_) {}
    } else if (pid) {
      // node-pty makes the shell a session leader, so its pid is also the process group of everything
      // started inside it; signal the group so CLIs running in the tab exit with it.
      try {
        process.kill(-pid, 'SIGHUP');
      } catch (_) {}
    }
  } catch (_) {}
}

function installPtyShutdownLifecycle(app, ptyProcesses, execSync) {
  function killAllPtyProcesses() {
    for (const [, proc] of ptyProcesses) {
      killPtyProcess(proc, execSync);
    }
    ptyProcesses.clear();
  }

  app.on('before-quit', () => {
    killAllPtyProcesses();
  });

  app.on('window-all-closed', () => {
    killAllPtyProcesses();
    app.quit();
  });
}

module.exports = {
  installPtyShutdownLifecycle,
  killPtyProcess,
};
