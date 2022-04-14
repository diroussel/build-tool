/*
 * Function to cause tests to fail when UnhandledPromiseRejectionWarning occurs,
 * ensuring the unhandledRejection event is handled.
 * Currently any async activity that is not awaited on and that consequently fails,
 * doesn't cause the unit tests to fail.
 */

process.on('unhandledRejection', (error) => {
  throw error;
});
