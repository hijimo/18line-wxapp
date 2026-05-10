const fs = require('fs');
const path = require('path');

class AdversarialReporter {
  constructor(globalConfig, options) {
    this.outputDir = options.outputDir || './reports';
    this.results = { builder: [], reviewer: [] };
  }

  onTestResult(test, testResult) {
    const agent = test.path.includes('agent-builder') ? 'builder' : 'reviewer';
    this.results[agent].push({
      testFilePath: test.path,
      testResults: testResult.testResults.map((r) => ({
        title: r.fullName,
        status: r.status,
        duration: r.duration,
        failureMessages: r.failureMessages,
      })),
    });
  }

  onRunComplete() {
    const report = this.generateAdversarialReport();
    const outputPath = path.join(this.outputDir, `adversarial-report-${Date.now()}.json`);
    fs.mkdirSync(this.outputDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    this.printSummary(report);
  }

  generateAdversarialReport() {
    const builderTests = this.results.builder.flatMap((r) => r.testResults);
    const reviewerTests = this.results.reviewer.flatMap((r) => r.testResults);

    const conflicts = this.findConflicts(builderTests, reviewerTests);

    return {
      timestamp: new Date().toISOString(),
      summary: {
        builderTotal: builderTests.length,
        builderPassed: builderTests.filter((t) => t.status === 'passed').length,
        builderFailed: builderTests.filter((t) => t.status === 'failed').length,
        reviewerTotal: reviewerTests.length,
        reviewerPassed: reviewerTests.filter((t) => t.status === 'passed').length,
        reviewerFailed: reviewerTests.filter((t) => t.status === 'failed').length,
        conflicts: conflicts.length,
      },
      conflicts,
      builderResults: builderTests,
      reviewerResults: reviewerTests,
    };
  }

  findConflicts(builderTests, reviewerTests) {
    const conflicts = [];
    for (const bt of builderTests) {
      if (bt.status !== 'passed') continue;
      const matching = reviewerTests.find(
        (rt) => rt.title.includes(bt.title.split(' ').slice(-2).join(' '))
      );
      if (matching && matching.status === 'failed') {
        conflicts.push({
          feature: bt.title,
          builderSays: 'PASS',
          reviewerSays: 'FAIL',
          reviewerReason: matching.failureMessages,
        });
      }
    }
    return conflicts;
  }

  printSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('  ADVERSARIAL TEST REPORT');
    console.log('='.repeat(60));
    console.log(`\n  Agent Builder:  ${report.summary.builderPassed}/${report.summary.builderTotal} passed`);
    console.log(`  Agent Reviewer: ${report.summary.reviewerPassed}/${report.summary.reviewerTotal} passed`);
    console.log(`  Conflicts:      ${report.summary.conflicts}`);
    if (report.conflicts.length > 0) {
      console.log('\n  CONFLICTS DETECTED:');
      report.conflicts.forEach((c, i) => {
        console.log(`    ${i + 1}. ${c.feature}`);
        console.log(`       Builder: PASS | Reviewer: FAIL`);
        console.log(`       Reason: ${c.reviewerReason[0]?.slice(0, 100)}`);
      });
    }
    console.log('\n' + '='.repeat(60) + '\n');
  }
}

module.exports = AdversarialReporter;
