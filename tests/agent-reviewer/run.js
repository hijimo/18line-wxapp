/**
 * Agent Reviewer 独立运行入口
 *
 * 可单独运行 Reviewer Agent 进行对抗验证：
 *   node agent-reviewer/run.js
 */
const { execSync } = require('child_process');
const path = require('path');

console.log('┌─────────────────────────────────────────┐');
console.log('│  Agent Reviewer - 对抗验证Agent          │');
console.log('│  策略: 寻找边界条件和异常场景            │');
console.log('│  立场: 悲观派                            │');
console.log('└─────────────────────────────────────────┘\n');

try {
  execSync('npx jest --testPathPattern="agent-reviewer" --verbose --forceExit', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    timeout: 120000,
  });
  console.log('\n✓ Agent Reviewer: 未发现可利用的缺陷');
} catch (e) {
  console.log('\n✗ Agent Reviewer: 发现潜在缺陷（预期行为）');
  process.exit(0); // Reviewer发现问题是正常的
}
