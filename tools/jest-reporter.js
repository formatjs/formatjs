class BazelReporter {
  onRunComplete(_, results) {
    if (results.numFailedTests && results.snapshot.failure) {
      console.log(`================================================================================
      
      Snapshot failed, you can update the snapshot by running
      bazel run ${process.env['TEST_TARGET'].replace(/_bin$/, '')}.update
      `);
    }
  }
}

module.exports = BazelReporter;
