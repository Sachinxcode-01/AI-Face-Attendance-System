const pendingPromises = new Set();

function trackJob(promise) {
  if (promise && typeof promise.then === 'function') {
    pendingPromises.add(promise);
    promise.then(
      () => pendingPromises.delete(promise),
      () => pendingPromises.delete(promise)
    );
  }
  return promise;
}

async function awaitPendingJobs() {
  const promises = Array.from(pendingPromises);
  if (promises.length > 0) {
    await Promise.allSettled(promises);
  }
}

module.exports = {
  trackJob,
  awaitPendingJobs
};
