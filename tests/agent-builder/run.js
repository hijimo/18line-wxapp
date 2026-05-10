/**
 * Agent Builder 独立运行入口
 *
 * 可单独运行 Builder Agent 进行功能验证：
 *   node agent-builder/run.js
 */
const { execSync } = require('child_process');
const path = require('path');

console.log('┌─────────────────────────────────────────┐');
console.log('│  Agent Builder - 功能验证Agent           │');
console.log('│  策略: 验证所有功能按预期工作            │');
console.log('│  立场: 乐观派                            │');
console.log('└─────────────────────────────────────────┘\n');

try {
  execSync('npx jest --testPathPattern="agent-builder" --verbose --forceExit', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    timeout: 120000,
  });
  console.log('\n✓ Agent Builder: 所有功能验证通过');
} catch (e) {
  console.log('\n✗ Agent Builder: 存在功能缺陷');
  process.exit(1);
}
