/* eslint-disable no-restricted-syntax */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-use-before-define */
const path = require('path');
const chalk = require('chalk');
const zkasm = require('@0xpolygonhermez/zkasmcom');
const smMain = require('@0xpolygonhermez/zkevm-proverjs/src/sm/sm_main/sm_main');

const emptyInput = require('@0xpolygonhermez/zkevm-proverjs/test/inputs/empty_input.json');

const { argv } = require('yargs')
    .alias('v', 'verbose');

const { compilePil, getTestFiles } = require('./helpers/helpers');

async function main() {
    // Compile pil
    console.log(chalk.yellow('--> Compile PIL'));
    const cmPols = await compilePil();

    // Get all zkasm files
    const pathZkasm = path.join(process.cwd(), process.argv[2]);
    const files = await getTestFiles(pathZkasm);

    // Run all zkasm files
    // eslint-disable-next-line no-restricted-syntax
    console.log(chalk.yellow('--> Start running zkasm files'));
    for (const file of files) {
        if (file.includes('ignore'))
            continue;
        await runTest(file, cmPols);
    }
}

async function runTest(pathTest, cmPols) {
    // Compile rom
    const configZkasm = {
        defines: [],
        allowUndefinedLabels: true,
        allowOverwriteLabels: true,
    };

    const rom = await zkasm.compile(pathTest, null, configZkasm);
    const config = {
        debug: true,
        stepsN: 8388608,
        assertOutputs: false,
    };

    // execute zkasm tests
    try {
        const result = await smMain.execute(cmPols.Main, emptyInput, rom, config);
        console.log(chalk.green('   --> pass'), pathTest);
        if (argv.verbose) {
            console.log(chalk.blue('   --> verbose'));
            console.log(chalk.blue('        --> counters'));
            console.log(result.counters);
            console.log(chalk.blue('        --> outputs'));
            console.log(result.output);
            console.log(chalk.blue('        --> logs'));
            console.log(result.logs);
        }
    } catch (e) {
        console.log(chalk.red('   --> fail'), pathTest);
        throw new Error(e);
    }
}

main();
