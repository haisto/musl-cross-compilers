// Load tempDirectory before it gets wiped by tool-cache
let tempDirectory = process.env['RUNNER_TEMPDIRECTORY'] || '';

const core = require("@actions/core");
const tc = require("@actions/tool-cache");
const exec = require("@actions/exec");
const io = require("@actions/io");
const path = require("path");

const target = core.getInput("target", {required: true});
const version = core.getInput("version", {required: true});
const variant = core.getInput("variant", {required: true});
const escapedVariant = variant.replace("/", "_");
const toolchainName = `musl-cross-make-${target}-${escapedVariant}`;

if (!tempDirectory) {
    let baseLocation;
    if (process.platform === 'win32') {
        baseLocation = process.env['USERPROFILE'] || 'C:\\';
    } else {
        if (process.platform === 'darwin') {
            baseLocation = '/Users';
        } else {
            baseLocation = '/home';
        }
    }
    tempDirectory = path.join(baseLocation, 'actions', 'temp');
}

async function downloadMaven(version) {
    const downloadUrl = `https://github.com/haisto/musl-cross-compilers/releases/download/${version}/output-${target}-${escapedVariant}.tar.gz`;
    console.log(`downloading ${downloadUrl}`);
    try {
        const downloadPath = await tc.downloadTool(downloadUrl);
        const extractedPath = await tc.extractTar(downloadPath);
        return await tc.cacheDir(extractedPath, toolchainName, version);
    } catch (err) {
        throw err;
    }
}

async function getMuslToolchain(version) {
    console.log(`Looking for ${toolchainName} ${version} in cache...`);
    let toolPath = tc.find(toolchainName, version);

    if (!toolPath) {
        toolPath = await downloadMaven(version);
    }

    toolPath = path.join(toolPath, "output", "bin");
    core.addPath(toolPath);
}

async function run() {
    console.log(`Installing musl-cross-make for ${target}...`);
    await getMuslToolchain(version);
}

(async () => {
    try {
        await run();
    } catch (error) {
        core.setFailed(error);
    }
})();
