// PostToolUse hook: formats files under frontend/ with Prettier after Claude edits them.
import { execFileSync } from 'node:child_process'
import path from 'node:path'

let input = ''
for await (const chunk of process.stdin) input += chunk

const { tool_input: toolInput = {}, cwd } = JSON.parse(input)
const filePath = toolInput.file_path
if (!filePath) process.exit(0)

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? cwd
const frontendDir = path.join(projectDir, 'frontend')
const absolute = path.resolve(cwd, filePath)
const relative = path.relative(frontendDir, absolute)

if (relative.startsWith('..') || path.isAbsolute(relative)) process.exit(0)
if (!/\.(c|m)?[jt]sx?$|\.(json|css|scss|html|md)$/.test(absolute)) process.exit(0)

try {
  execFileSync(
    process.execPath,
    [
      path.join(frontendDir, 'node_modules/prettier/bin/prettier.cjs'),
      '--write',
      '--ignore-unknown',
      relative,
    ],
    { cwd: frontendDir, stdio: ['ignore', 'ignore', 'pipe'] }
  )
} catch (error) {
  process.stderr.write(`Prettier failed on ${relative}:\n${error.stderr ?? error.message}`)
  process.exit(2)
}
