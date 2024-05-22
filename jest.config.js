/** @type {import('jest').Config} */
export default {
    verbose: true,
    reporters: ["default", "jest-junit"],
    // NOTE: Node needs to be run with --experimental-vm-modules flag
    // and code transforms need to be disabled in order for Jest to work with ESM.
    // https://jestjs.io/docs/ecmascript-modules
    transform: {}
};
