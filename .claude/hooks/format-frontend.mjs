// PostToolUse hook: runs the frontend Prettier on a file Claude just edited/wrote,
// only when that file lives under frontend/. Reads the hook payload from stdin.
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const frontendDir = path.join(projectRoot, 'frontend')

let raw = ''
for await (const chunk of process.stdin) raw += chunk

const payload = JSON.parse(raw || '{}')
const filePath = payload.tool_response?.filePath ?? payload.tool_input?.file_path
if (!filePath) process.exit(0)

const relative = path.relative(frontendDir, path.resolve(filePath))
if (relative.startsWith('..') || path.isAbsolute(relative)) process.exit(0)

const prettierBin = path.join(frontendDir, 'node_modules', 'prettier', 'bin', 'prettier.cjs')
execFileSync(process.execPath, [prettierBin, '--write', '--ignore-unknown', relative], {
  cwd: frontendDir,
  stdio: 'inherit',
})
