// Load tempDirectory before it gets wiped by tool-cache
let tempDirectory = process.env['RUNNER_TEMPDIRECTORY'] || '';

const core = require("@actions/core");
const tc = require("@actions/tool-cache");
const exec = require("@actions/exec");
const io = require("@actions/io");
const path = require("path");

const toolchainName = "musl-cross-make";
const target = core.getInput("target", {required: true});
const version = core.getInput("version", {required: true});
const variant = core.getInput("variant", {required: true});
const escapedVariant = variant.replace("/", "_");

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

// async function getMuslToolchain(version) {
//     let toolPath = tc.find(toolchainName, version);
//
//     if (!toolPath) {
//         toolPath = await downloadMaven(version);
//     }
//
//     toolPath = path.join(toolPath, "output", "bin");
//     console.log(toolPath)
//     core.addPath(toolPath);
// }
//
//
// async function downloadMaven(version) {
//     const toolDirectoryName = `${toolchainName}-${version}`;
//     const downloadUrl = `https://github.com/haisto/musl-cross-compilers/releases/download/${version}/output-${target}-${escapedVariant}.tar.gz`;
//     console.log(`downloading ${downloadUrl}`);
//
//     try {
//         const downloadPath = await tc.downloadTool(downloadUrl);
//         const extractedPath = await tc.extractTar(downloadPath);
//         let toolRoot = path.join(extractedPath, toolDirectoryName);
//         return await tc.cacheDir(toolRoot, toolchainName, version);
//     } catch (err) {
//         throw err;
//     }
// }

// (async () => {
//     try {
//         if (!version) {
//             await getMuslToolchain(version);
//         }
//     } catch (error) {
//         core.setFailed(error);
//     }
// })();

async function run() {
    console.log(`Installing musl-cross-make for ${target}...`);
}

run();
