const execSync = require('child_process').execSync;

/**
 * All the helpers for process management.
 *
 * We need to cleanly die without leaving orphans or zombies.
 * This is important on a system running multiple copies of
 * the PDF generation process. And we really don't want to
 * mess our resources and build a time bomb.
 *
 * With this class we provide some simple helpers for process
 * management of all our children.
 */
class Processes {
  /**
   * @typedef {Object} Process
   * @property {number} ppid The parent process id
   * @property {number} pid The process id
   * @property {string} command The Y The full command
   * @property {string[]} arguments An array of arguments
   */

  /**
   * Collect all process ids of children of the given
   * process id. This method travesties down the process
   * tree and collects all children and grand children.
   *
   * @param {number} ppid The root process id
   * @return {number[]} The whole tree in a flattened form
   */
  tree(ppid) {
    try {
      // Build the command to run (we search for
      // processes of the current parent pid)
      let cmd = `ps -o ppid= -o pid= -A \
        | awk '$1 == ${ppid}{print $2}'`;
      // Fetch the output and perform some cleanups
      let output = execSync(cmd, { timeout: 2500 }).toString().trim();
      // Split the pids and remove empty elements
      let pids = output.split('\n').filter((pid) => pid);

      // Leaf of the tree
      if (!pids.length) { return parseInt(ppid); }

      // Nodes of the tree
      return [].concat.apply([], pids.map((pid) => this.tree(pid)));
    } catch (e) { return []; }
  }

  /**
   * List all child processes of our current `process.pid`.
   *
   * @returns {Process[]}
   */
  children() {
    // Get the details for each process in the tree
    let output = this.tree(process.pid).map((pid) => {
      // Setup the command for searching the details
      let cmd = `ps -o pid= -o ppid= -o command= -A \
        | awk '$1 == ${pid}{print $0}' \
        | sed 's/^\\s\\+//g' \
        | sed 's/\\s\\s*/ /g' \
        | grep -v '<defunct>'`;

      // Search details for the given pid
      try { return execSync(cmd, { timeout: 2500 }).toString().trim(); }
      catch (e) { return ''; }
    });

    // Strip off empty elements
    output = output.filter((out) => out);

    // Build process objects
    return output.map((line) => {
      let parts = line.split(' ');
      return {
        pid: parseInt(parts.shift()),
        ppid: parseInt(parts.shift()),
        command: parts.shift(),
        arguments: parts
      }
    });
  }

  /**
   * Search for a specific child process by command.
   *
   * @param {RegExp} commandRegex The command regex
   * @param {boolean} backoff Add sleep backoff on checks
   * @returns {Process[]}
   */
  grepChildren(commandRegex, backoff) {
    let cmd = `sleep 0`;
    let children = [];

    // Retry and wait up to 5s
    for (let i = 1; i <= 10; i++) {
      if (backoff) {
        // Exponential backoff (0.1, 0.2, 0.3 ..)
        if (i > 1) { cmd += '; sleep 0.1' }
        try { execSync(cmd, { timeout: 2500 }).toString(); }
        catch (e) {}
      }

      // Search for the matching process(es)
      children = this.
        children()
        .filter((child) => commandRegex.test(child.command));

      // If not empty we stop searching
      if (children.length) { break; }
    }

    return children;
  }

  /**
   * Send a kill signal to a list of processes.
   *
   * @param {number} signal The UNIX signal id
   * @param {Process[]} processes The processes to kill
   * @param {boolean} backoff Add sleep backoff on checks
   */
  kill(signal, processes, backoff = false) {
    // Early exit on empty processes list
    if (!processes.length) { return; }

    processes.forEach((proc) => {
      let cmd = `kill -${signal} ${proc.pid}`

      // Retry and wait up to 5s
      for (let i = 1; i <= 10; i++) {
        // Exponential backoff (0.1, 0.2, 0.3 ..)
        if (i > 1 && backoff) { cmd += ' && sleep 0.1' }
        try { execSync(cmd, { timeout: 1250, stdio: 'ignore' }); }
        catch (e) {
          // On the first error we know the process is gone
          break;
        }
      }
    });
  }
};

module.exports = Processes;
