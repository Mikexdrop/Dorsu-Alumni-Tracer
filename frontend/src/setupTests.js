// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
try {
	// jest-dom adds custom jest matchers for asserting on DOM nodes.
	// It may not be installed in some environments; guard the import so tests can still run.
	// eslint-disable-next-line global-require
	require('@testing-library/jest-dom');
} catch (e) {
	// ignore if not available
}
