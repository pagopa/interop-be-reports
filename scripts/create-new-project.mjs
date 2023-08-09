/**
 * This script handles all the boilerplate code needed to create a new job.
 * It does the following:
 * - Asks and then validates the project name;
 * - Creates the project structure, with the src folder and index.ts file;
 * - Creates the package.json with default dependencies;
 * - Creates the tsconfig.json;
 * - Creates the Dockerfile;
 * - Adds the new job to the root package.json scripts, ex: "start:my-new-job": "turbo start --filter my-new-job"
 * - Adds the new job to the CI/CD, meaning adding it to the .github/workflows/ci.yml file, in the matrix action that publishes the jobs;
 * - Installs dependencies with pnpm;
 */

'use strict'

import * as fs from 'fs'
import { execSync } from 'child_process'
import _readline from 'readline'

const readline = _readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const log = console.log

const DEV_DEPENDENCIES = {
  '@types/lodash': '4.14.196',
  '@types/node': '20.4.9',
  '@typescript-eslint/eslint-plugin': '6.3.0',
  '@typescript-eslint/parser': '6.3.0',
  eslint: '8.46.0',
  prettier: '^3.0.1',
  'ts-node': '^10.9.1',
  typescript: '5.1.6',
  vitest: '0.34.1',
}

const DEPENDENCIES = {
  '@aws-sdk/client-s3': '^3.387.0',
  axios: '^1.4.0',
  chalk: '^5.3.0',
  dotenv: '^16.3.1',
  lodash: '^4.17.21',
  mongodb: '^5.7.0',
  zod: '^3.21.4',
  '@interop-be-reports/commons': 'workspace:*',
}

const REGEX_PROJECT_NAME = /^[a-z0-9-]+$/
const MAX_PROJECT_NAME_LENGTH = 50
const MIN_PROJECT_NAME_LENGTH = 5
const JOB_BASE_PATH = './jobs'

const chalk = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
}

function createNewProject(projectName) {
  log(`\n> Creating new job named ${chalk.blue(projectName)}...`)

  try {
    log('> Creating project structure...')
    setupProjectStructure(projectName)
    log(`> Creating ${chalk.blue('package.json')} with default deps...`)
    createPackageJson(projectName)
    log(`> Creating ${chalk.blue('tsconfig.json')}...`)
    createTsConfig(projectName)
    log(`> Creating ${chalk.blue('Dockerfile')}...`)
    createDockerfile(projectName)
    log(`> Adding new job to root package.json scripts...`)
    addToRootPackageJsonScripts(projectName)
    log(`> Adding new job to ci/cd...`)
    addToGitHubCIActions(projectName)
    log('> Installing dependencies...')
    execSync(`pnpm i`)
  } catch (err) {
    cleanUpOnError(projectName)
    throw err
  }

  log(chalk.green(`\n> Project ${projectName} created successfully!`))
}

function validateProjectName(projectName) {
  if (!projectName) {
    log(chalk.red('Project name is required, please provide it as an argument.'))
    log(chalk.blue("Example: 'node create-new-job my-new-job'\n"))
    process.exit(1)
  }

  if (fs.existsSync(`./${projectName}`)) {
    log(chalk.red(`Project ${projectName} already exists.\n`))
    process.exit(1)
  }

  if (projectName.length > MAX_PROJECT_NAME_LENGTH) {
    log(chalk.red(`Project name must be less than ${MAX_PROJECT_NAME_LENGTH} characters.\n`))
    process.exit(1)
  }

  if (projectName.length < MIN_PROJECT_NAME_LENGTH) {
    log(chalk.red(`Project name must be at least ${MIN_PROJECT_NAME_LENGTH} characters.\n`))
    process.exit(1)
  }

  if (!REGEX_PROJECT_NAME.test(projectName)) {
    log(chalk.red('Project name must be lowercase, alphanumeric and can contain dashes.\n'))
    process.exit(1)
  }
}

function setupProjectStructure(projectName) {
  fs.mkdirSync(`${JOB_BASE_PATH}/${projectName}/src`, { recursive: true })
  fs.writeFileSync(`${JOB_BASE_PATH}/${projectName}/src/index.ts`, `console.log("Hello World")`)
}

function createPackageJson(projectName) {
  const packageJson = {
    name: projectName,
    main: './dist/index.js',
    type: 'module',
    scripts: {
      test: 'vitest run',
      lint: 'eslint . --ext .ts,.tsx',
      'lint:autofix': 'eslint . --ext .ts,.tsx --fix',
      'format:check': 'prettier --check src',
      'format:write': 'prettier --write src',
      start: 'node --watch --no-warnings --loader ts-node/esm ./src/index.ts',
      build: 'tsc',
    },
    devDependencies: DEV_DEPENDENCIES,
    dependencies: DEPENDENCIES,
  }

  fs.writeFileSync(
    `${JOB_BASE_PATH}/${projectName}/package.json`,
    JSON.stringify(packageJson, null, 2)
  )
}

function createTsConfig(projectName) {
  fs.writeFileSync(
    `${JOB_BASE_PATH}/${projectName}/tsconfig.json`,
    JSON.stringify(
      {
        extends: '../../tsconfig.json',
        compilerOptions: {
          outDir: 'dist',
        },
        include: ['src'],
      },
      null,
      2
    )
  )
}

function createDockerfile(projectName) {
  fs.writeFileSync(
    `${JOB_BASE_PATH}/${projectName}/Dockerfile`,
    ['FROM node:18.15.0-alpine', '', 'WORKDIR /app', 'COPY . .', ''].join('\n')
  )
}

function addToGitHubCIActions(projectName) {
  const githubCIActions = fs.readFileSync('./.github/workflows/ci.yml', 'utf8')
  const fileArray = githubCIActions.split('\n')
  const index = fileArray.findIndex((line) => line.includes('include:'))
  for (let i = index + 1; i < fileArray.length; i++) {
    if (!fileArray[i].includes('image_name:') && !fileArray[i].includes('package_path:')) {
      fileArray.splice(
        i,
        0,
        `          - image_name: ${projectName}
            package_path: ./jobs/${projectName}`
      )
      break
    }
  }
  fs.writeFileSync('./.github/workflows/ci.yml', fileArray.join('\n'))
}

function addToRootPackageJsonScripts(projectName) {
  const packageJson = fs.readFileSync('./package.json', 'utf8')
  const fileArray = packageJson.split('\n')
  const startLineIndex = fileArray.findIndex((line) => line.includes('"start:'))

  for (let i = startLineIndex + 1; i < fileArray.length; i++) {
    if (!fileArray[i].includes('start:')) {
      fileArray.splice(i, 0, `    "start:${projectName}": "turbo start --filter ${projectName}",`)
      break
    }
  }

  const buildLineIndex = fileArray.findIndex((line) => line.includes('"build:'))

  for (let i = buildLineIndex + 1; i < fileArray.length; i++) {
    if (!fileArray[i].includes('build:')) {
      fileArray.splice(i, 0, `    "build:${projectName}": "turbo build --filter ${projectName}",`)
      break
    }
  }

  fs.writeFileSync('./package.json', fileArray.join('\n'))
}

function cleanUpOnError(projectName) {
  execSync(`rm -rf ${JOB_BASE_PATH}/${projectName}`)
}

readline.question('Insert job name\n> ', (name) => {
  readline.close()
  validateProjectName(name)
  createNewProject(name)
})
