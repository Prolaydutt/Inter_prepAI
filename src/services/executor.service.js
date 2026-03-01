// src/services/executor.service.js
const Docker = require("dockerode");
const fs = require("fs");
const path = require("path");
const os = require("os");

const docker = new Docker();

// Language configs — image, filename, run command
const LANGUAGE_CONFIG = {
  python: {
    image: "python:3.11-slim",
    filename: "solution.py",
    cmd: ["python", "solution.py"],
  },
  javascript: {
    image: "node:20-slim",
    filename: "solution.js",
    cmd: ["node", "solution.js"],
  },
};

/**
 * Execute user code inside a secure Docker container.
 * Returns { stdout, stderr, exitCode, runtime }
 */
const executeCode = async (code, language, stdin = "", timeLimit = 5000) => {
  const config = LANGUAGE_CONFIG[language];
  if (!config) throw new Error(`Unsupported language: ${language}`);

  // Create temp directory for this execution
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "exec-"));
  const codeFile = path.join(tempDir, config.filename);

  // Write user code to temp file
  if (stdin) {
    // Append stdin reading code based on language
    const stdinCode =
      language === "python"
        ? `\nimport sys\ninput_data = """${stdin}"""\nimport io\nsys.stdin = io.StringIO(input_data)\n`
        : `\nprocess.stdin.push("${stdin}");\nprocess.stdin.end();\n`;
    fs.writeFileSync(codeFile, stdinCode + "\n" + code);
  } else {
    fs.writeFileSync(codeFile, code);
  }

  const startTime = Date.now();
  let container;

  try {
    // Create container with strict security limits
    container = await docker.createContainer({
      Image: config.image,
      Cmd: config.cmd,
      WorkingDir: "/code",
      HostConfig: {
        Binds: [`${tempDir}:/code:ro`], // Mount as READ ONLY
        Memory: 128 * 1024 * 1024, // 128MB RAM limit
        CpuPeriod: 100000,
        CpuQuota: 50000, // 50% CPU limit
        NetworkMode: "none", // NO internet access
        AutoRemove: true, // Auto delete when done
        ReadonlyRootfs: true, // Read-only filesystem
      },
    });

    // Start container
    await container.start();

    // Set timeout to kill container if it runs too long
    const timeoutHandle = setTimeout(async () => {
      try {
        await container.kill();
      } catch (e) {}
    }, timeLimit);

    // Capture output
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      follow: true,
    });

    let stdout = "";
    let stderr = "";

    await new Promise((resolve) => {
      docker.modem.demuxStream(
        logs,
        { write: (chunk) => (stdout += chunk.toString()) },
        { write: (chunk) => (stderr += chunk.toString()) },
      );
      logs.on("end", resolve);
    });

    clearTimeout(timeoutHandle);

    // Wait for container to finish
    const result = await container.wait();
    const runtime = Date.now() - startTime;

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: result.StatusCode,
      runtime,
      timedOut: false,
    };
  } catch (err) {
    const runtime = Date.now() - startTime;
    const timedOut = runtime >= timeLimit;
    return {
      stdout: "",
      stderr: timedOut ? "Time Limit Exceeded" : err.message,
      exitCode: 1,
      runtime,
      timedOut,
    };
  } finally {
    // ALWAYS clean up temp files regardless of success/failure
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {}
  }
};

module.exports = { executeCode };
