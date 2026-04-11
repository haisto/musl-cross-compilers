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

async function getMuslToolchain(version) {
    let toolPath = tc.find(toolchainName, version);

    if (!toolPath) {
        toolPath = await downloadMaven(version);
    }

    toolPath = path.join(toolPath, "output", "bin");
    core.addPath(toolPath);
}


async function downloadMaven(version) {
    const toolDirectoryName = `${toolchainName}-${version}`;
    const downloadUrl = `https://github.com/haisto/musl-cross-compilers/releases/download/${version}/output-${target}-${escapedVariant}.tar.gz`;
    console.log(`downloading ${downloadUrl}`);

    try {
        const downloadPath = await tc.downloadTool(downloadUrl);
        const extractedPath = await tc.extractTar(downloadPath);
        let toolRoot = path.join(extractedPath, toolDirectoryName);
        return await tc.cacheDir(toolRoot, toolchainName, version);
    } catch (err) {
        throw err;
    }
}

(async () => {
    try {
        if (!version) {
            await getMuslToolchain(version);
        }
    } catch (error) {
        core.setFailed(error);
    }
    // try {
    //     const versionSpec = `${version}-${escapedVariant}`
    //     console.log(`Installing ${toolchainName} ${versionSpec}`);
    //     // output-aarch64_be-linux-musl-pmmp_musl-cross-make.tar.gz
    //     const downloadUrl = `https://github.com/haisto/musl-cross-compilers/releases/download/${version}/output-${target}-${escapedVariant}.tar.gz`
    //     console.log(`Downloading ${downloadUrl}`);
    //
    //     let cachedPath;
    //     if (build) {
    //         const destDir = buildDir;
    //         await io.mkdirP(destDir);
    //         // https://stackoverflow.com/questions/11912878/gcc-error-gcc-error-trying-to-exec-cc1-execvp-no-such-file-or-directory
    //         let ret = await exec.exec("sudo", ["apt", "update"], {
    //             ignoreReturnCode: true,
    //         });
    //         if (ret != 0) {
    //             console.error(`apt update failed with code ${ret}`);
    //         }
    //
    //         ret = await exec.exec("sudo", ["apt", "install", "--reinstall", "gcc", "g++", "cpp-11", "cpp-9"], {
    //             ignoreReturnCode: true,
    //         });
    //         if (ret != 0) {
    //             console.error(`apt install failed with code ${ret}`);
    //         }
    //
    //         ret = await exec.exec("git", ["clone", `https://github.com/${variant}.git`, destDir], {
    //             ignoreReturnCode: true,
    //         });
    //         if (ret != 0) {
    //             throw new Error(`git clone failed with code ${ret}`);
    //         }
    //
    //         ret = await exec.exec("make", ["-j4"], {
    //             cwd: destDir, ignoreReturnCode: true, env: {
    //                 TARGET: target,
    //             },
    //         });
    //         if (ret != 0) {
    //             throw new Error(`make -j4 failed with code ${ret}`);
    //         }
    //
    //         ret = await exec.exec("make", ["install"], {
    //             cwd: destDir, ignoreReturnCode: true, env: {
    //                 TARGET: target,
    //             },
    //         });
    //         if (ret != 0) {
    //             throw new Error(`make install failed with code ${ret}`);
    //         }
    //         cachedPath = destDir;
    //     } else {
    //         cachedPath = tc.find(toolchainName, versionSpec);
    //     }
    //     if (cachedPath) {
    //         console.log(`Found installation at ${cachedPath}`);
    //     } else {
    //         const toolchainPath = await tc.downloadTool(downloadUrl);
    //         const toolchainExtractedFolder = await tc.extractTar(toolchainPath);
    //         cachedPath = await tc.cacheDir(toolchainExtractedFolder, toolchainPath, versionSpec);
    //         console.log(`Installed at ${cachedPath}`);
    //     }
    //     cachedPath = path.join(cachedPath, "output", "bin");
    //     console.log(`Binaries are at ${cachedPath}`);
    //     core.addPath(cachedPath);
    //     core.setOutput("path", cachedPath);
    // } catch (e) {
    //     if (build) {
    //         console.log("Build error occured and uploading build directory as artifacts");
    //         await exec.exec("tar", ["-czf", "/opt/mcm.tar.gz", buildDir]);
    //         const artifact = require("@actions/artifact");
    //         const artifactClient = artifact.create();
    //         const artifactName = `musl-cross-compiler-error-${target}-${variant.replace("/", "_")}`;
    //         const files = ["/opt/mcm.tar.gz"];
    //         const rootDirectory = "/opt/";
    //         const options = {};
    //         await artifactClient.uploadArtifact(artifactName, files, rootDirectory, options);
    //     }
    //     core.setFailed(e);
    // }
})();
