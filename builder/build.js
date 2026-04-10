// obtain list of targets at http://pkg.musl.cc/db/
const fs = require("fs");
const yaml = require("js-yaml");

const targets = fs
  .readFileSync("targets.txt")
  .toString()
  .trim()
  .split(/[\r\n]+/);
//console.log(targets);
const repositories = ["richfelker/musl-cross-make", "pmmp/musl-cross-make"];

const data = {
  name: "Build cross compilers",
  on: {
    // builds must be invoked by hand as number of jobs reaches 95,
    // causing Actions queue being filled for an hour
    workflow_dispatch: {
      inputs: {
        do_release: {
          description: 'Create a release and upload files? (type "yes" to create)',
          required: true,
          default: "no",
        },
        release: {
          description: "Release tag and name",
          required: true,
        },
      },
    },
  },
  permissions: {
    contents: "write",
  },
  jobs: {
    prepare: {
      "runs-on": "ubuntu-latest",
      outputs: {
        upload_url: "${{ steps.create_release.outputs.upload_url }}",
      },
      steps: [
        {
          name: "Create release",
          uses: "softprops/action-gh-release@v2",
          id: "create_release",
          if: "${{ github.event.inputs.do_release == 'yes' }}",
          with: {
            tag_name: "${{ github.event.inputs.release }}",
            draft: false,
            prerelease: false,
            token: "${{ secrets.GITHUB_TOKEN }}",
          }
        },
      ],
    },
    compile: {
      needs: "prepare",
      "runs-on": "ubuntu-latest",
      "continue-on-error": true,
      strategy: {
        matrix: {
          target: targets,
          repo: repositories,
        },
      },
      env: {
        TARGET: "${{ matrix.target }}",
        REPO: "${{ matrix.repo }}",
      },
      steps: [
        { uses: "actions/checkout@v4" },
        {
          name: "Clone ${{ matrix.repo }}",
          run: "git clone https://github.com/${{ matrix.repo }} mcm",
        },
        {
          name: "Build ${{ matrix.target }}",
          run: ["make -j4", "make install", "ls output"].join("\n"),
          "working-directory": "mcm",
        },
        {
            name: "Build ${{ matrix.target }} zlib",
            run: [
                "git clone --branch master --single-branch https://github.com/madler/zlib.git",
                "cd zlib",
                "./configure --prefix=../output --static",
                "make install",
                "cd ..",
                "ls output/lib"
            ].join("\n"),
            "working-directory": "mcm",
        },
        {
          name: "Package ${{ matrix.target }}",
          id: "package",
          run: [
              "tar -czvf ../output-${{ matrix.target }}.tar.gz output/",
              "SOURCE_ESCAPED=${REPO%%/*}_${REPO##*/}",
              "echo \"source_escaped=$SOURCE_ESCAPED\" >> $GITHUB_OUTPUT",
              "mv ../output-${{ matrix.target }}.tar.gz ../output-${{ matrix.target }}-$SOURCE_ESCAPED.tar.gz"
          ].join("\n"),
          "working-directory": "mcm",
        },
      ],
    },
  },
};

const uploadSteps = [
  {
    id: `upload-artifacts`,
    name: `Upload artifacts`,
    if: `\${{ success() }}`,
    uses: "actions/upload-artifact@v4",
    with: {
      path: "output-${{ matrix.target }}-${{ steps.package.outputs.source_escaped }}.tar.gz",
      name: "${{ matrix.target }}-${{ steps.package.outputs.source_escaped }}",
    },
  },
  {
    id: `upload-releases`,
    name: `Upload to releases`,
    uses: "softprops/action-gh-release@v2",
    if: `\${{ github.event.inputs.do_release == 'yes' }}`,
    with: {
      files: "output-${{ matrix.target }}-${{ steps.package.outputs.source_escaped }}.tar.gz",
      tag_name: "${{ github.event.inputs.release }}",
      token: "${{ secrets.GITHUB_TOKEN }}",
    },
  },
];

data.jobs.compile.steps.push(...uploadSteps);

console.log(yaml.dump(data));
