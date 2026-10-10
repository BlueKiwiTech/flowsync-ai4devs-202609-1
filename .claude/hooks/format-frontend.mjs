// PostToolUse hook: runs the frontend Prettier on a file Claude just edited/wrote,
// only when that file lives under frontend/. Reads the hook payload from stdin.
// Never fails the tool call: anything unexpected is a silent no-op or a one-line note.
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const frontendDir = path.join(projectRoot, 'frontend')
const prettierBin = path.join(frontendDir, 'node_modules', 'prettier', 'bin', 'prettier.cjs')

let raw = ''
for await (const chunk of process.stdin) raw += chunk

let payload
try {
  payload = JSON.parse(raw)
} catch {
  process.exit(0)
}

const filePath = payload?.tool_response?.filePath ?? payload?.tool_input?.file_path
if (!filePath) process.exit(0)

const absolute = path.resolve(filePath)
const relative = path.relative(frontendDir, absolute)
if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) process.exit(0)
if (!existsSync(absolute)) process.exit(0)

if (!existsSync(prettierBin)) {
  console.error('format-frontend hook: Prettier not installed, run `npm install` in frontend/')
  process.exit(0)
}

// Ignored files (.prettierignore) make Prettier exit 2 with "No files matching";
// --ignore-unknown only covers unknown file types, so status 2 is treated as a no-op.
const result = spawnSync(process.execPath, [prettierBin, '--write', '--ignore-unknown', relative], {
  cwd: frontendDir,
  encoding: 'utf8',
})
if (result.status !== 0 && result.status !== 2) {
  console.error(`format-frontend hook: Prettier failed on ${relative}\n${result.stderr}`.trim())
}
process.exit(0)
