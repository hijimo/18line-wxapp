/**
 * 对抗验证编排器
 *
 * 运行两个Agent的测试并生成对抗报告：
 * - Agent Builder: 验证功能正确性（乐观派）
 * - Agent Reviewer: 寻找缺陷和边界问题（悲观派）
 *
 * 对抗逻辑：
 * 1. Builder说PASS但Reviewer说FAIL → 需要人工审查的冲突
 * 2. 两者都FAIL → 确认的缺陷
 * 3. 两者都PASS → 高置信度通过
 * 4. Builder说FAIL → 基础功能缺陷
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, 'reports');
const SCREENSHOTS_DIR = path.join(REPORTS_DIR, 'screenshots');

function ensureDirs() {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function runAgent(name, testPattern) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  启动 ${name}...`);
  console.log(`${'─'.repeat(50)}\n`);

  const startTime = Date.now();
  let result;

  try {
    result = execSync(
      `npx jest --testPathPattern="${testPattern}" --json --forceExit`,
      {
        cwd: __dirname,
        encoding: 'utf-8',
        timeout: 120000,
        env: { ...process.env, FORCE_COLOR: '0' },
      }
    );
  } catch (e) {
    result = e.stdout || e.message;
  }

  const duration = Date.now() - startTime;

  try {
    const parsed = JSON.parse(result);
    return {
      agent: name,
      duration,
      success: parsed.success,
      numPassed: parsed.numPassedTests,
      numFailed: parsed.numFailedTests,
      numTotal: parsed.numTotalTests,
      testResults: parsed.testResults,
    };
  } catch {
    return {
      agent: name,
      duration,
      success: false,
      numPassed: 0,
      numFailed: 0,
      numTotal: 0,
      error: result,
    };
  }
}

function analyzeConflicts(builderResult, reviewerResult) {
  const conflicts = [];
  const confirmedBugs = [];
  const highConfidence = [];

  if (!builderResult.testResults || !reviewerResult.testResults) {
    return { conflicts, confirmedBugs, highConfidence };
  }

  const builderTests = builderResult.testResults.flatMap(
    (r) => r.assertionResults || []
  );
  const reviewerTests = reviewerResult.testResults.flatMap(
    (r) => r.assertionResults || []
  );

  // 按功能模块分组分析
  const modules = ['登录', '首页', 'TabBar', '问卷', '个人中心'];

  for (const mod of modules) {
    const bTests = builderTests.filter((t) => t.fullName?.includes(mod));
    const rTests = reviewerTests.filter((t) => t.fullName?.includes(mod));

    const bPassed = bTests.filter((t) => t.status === 'passed').length;
    const bFailed = bTests.filter((t) => t.status === 'failed').length;
    const rPassed = rTests.filter((t) => t.status === 'passed').length;
    const rFailed = rTests.filter((t) => t.status === 'failed').length;

    if (bPassed > 0 && rFailed > 0) {
      conflicts.push({
        module: mod,
        builderPassed: bPassed,
        reviewerFailed: rFailed,
        details: rTests
          .filter((t) => t.status === 'failed')
          .map((t) => ({
            test: t.fullName,
            reason: t.failureMessages?.[0]?.slice(0, 200),
          })),
      });
    }

    if (bFailed > 0 && rFailed > 0) {
      confirmedBugs.push({
        module: mod,
        builderFailures: bTests
          .filter((t) => t.status === 'failed')
          .map((t) => t.fullName),
        reviewerFailures: rTests
          .filter((t) => t.status === 'failed')
          .map((t) => t.fullName),
      });
    }

    if (bPassed > 0 && rPassed > 0 && bFailed === 0) {
      highConfidence.push({ module: mod, totalTests: bPassed + rPassed });
    }
  }

  return { conflicts, confirmedBugs, highConfidence };
}

function generateReport(builderResult, reviewerResult, analysis) {
  const report = {
    meta: {
      timestamp: new Date().toISOString(),
      project: '18line-wxapp',
      framework: 'miniprogram-automator + jest',
    },
    agents: {
      builder: {
        role: '功能验证（乐观派）',
        passed: builderResult.numPassed,
        failed: builderResult.numFailed,
        total: builderResult.numTotal,
        duration: builderResult.duration,
      },
      reviewer: {
        role: '对抗验证（悲观派）',
        passed: reviewerResult.numPassed,
        failed: reviewerResult.numFailed,
        total: reviewerResult.numTotal,
        duration: reviewerResult.duration,
      },
    },
    adversarialAnalysis: {
      conflicts: analysis.conflicts,
      confirmedBugs: analysis.confirmedBugs,
      highConfidenceModules: analysis.highConfidence,
    },
    verdict: getVerdict(builderResult, reviewerResult, analysis),
  };

  return report;
}

function getVerdict(builder, reviewer, analysis) {
  if (builder.numFailed > 0) {
    return {
      status: 'CRITICAL',
      message: '基础功能测试未通过，存在严重缺陷',
      action: '立即修复Builder发现的失败用例',
    };
  }
  if (analysis.conflicts.length > 0) {
    return {
      status: 'REVIEW_NEEDED',
      message: `存在${analysis.conflicts.length}个对抗冲突，需要人工审查`,
      action: '审查Reviewer发现的边界问题，评估是否需要修复',
    };
  }
  if (reviewer.numFailed === 0) {
    return {
      status: 'HIGH_CONFIDENCE',
      message: '两个Agent均通过，功能质量高',
      action: '可以进入下一阶段',
    };
  }
  return {
    status: 'ACCEPTABLE',
    message: '基础功能正常，存在部分边界问题',
    action: '评估Reviewer发现的问题优先级',
  };
}

function printFinalReport(report) {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          18线小程序 - 双Agent对抗验证报告               ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║                                                          ║');
  console.log(`║  Agent Builder (乐观派):                                 ║`);
  console.log(`║    通过: ${String(report.agents.builder.passed).padEnd(4)} 失败: ${String(report.agents.builder.failed).padEnd(4)} 耗时: ${report.agents.builder.duration}ms`);
  console.log('║                                                          ║');
  console.log(`║  Agent Reviewer (悲观派):                                ║`);
  console.log(`║    通过: ${String(report.agents.reviewer.passed).padEnd(4)} 失败: ${String(report.agents.reviewer.failed).padEnd(4)} 耗时: ${report.agents.reviewer.duration}ms`);
  console.log('║                                                          ║');
  console.log('╠══════════════════════════════════════════════════════════╣');

  if (report.adversarialAnalysis.conflicts.length > 0) {
    console.log('║  ⚠ 对抗冲突:                                            ║');
    report.adversarialAnalysis.conflicts.forEach((c) => {
      console.log(`║    [${c.module}] Builder通过 vs Reviewer发现${c.reviewerFailed}个问题`);
    });
  }

  if (report.adversarialAnalysis.confirmedBugs.length > 0) {
    console.log('║  ✗ 确认缺陷:                                            ║');
    report.adversarialAnalysis.confirmedBugs.forEach((b) => {
      console.log(`║    [${b.module}] 两个Agent均发现问题`);
    });
  }

  if (report.adversarialAnalysis.highConfidenceModules.length > 0) {
    console.log('║  ✓ 高置信模块:                                           ║');
    report.adversarialAnalysis.highConfidenceModules.forEach((m) => {
      console.log(`║    [${m.module}] ${m.totalTests}个测试全部通过`);
    });
  }

  console.log('║                                                          ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  最终裁定: ${report.verdict.status.padEnd(20)}                    ║`);
  console.log(`║  ${report.verdict.message}`);
  console.log(`║  建议: ${report.verdict.action}`);
  console.log('╚══════════════════════════════════════════════════════════╝');
}

// Main
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     18线小程序 - 双Agent对抗验证系统启动                ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  ensureDirs();

  // Phase 1: 运行 Agent Builder
  const builderResult = runAgent('Agent Builder (功能验证)', 'agent-builder');

  // Phase 2: 运行 Agent Reviewer
  const reviewerResult = runAgent('Agent Reviewer (对抗验证)', 'agent-reviewer');

  // Phase 3: 对抗分析
  console.log('\n  分析对抗结果...\n');
  const analysis = analyzeConflicts(builderResult, reviewerResult);

  // Phase 4: 生成报告
  const report = generateReport(builderResult, reviewerResult, analysis);
  const reportPath = path.join(REPORTS_DIR, `adversarial-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  printFinalReport(report);
  console.log(`\n  详细报告已保存: ${reportPath}\n`);
}

main().catch(console.error);
