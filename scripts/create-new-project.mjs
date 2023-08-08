'use strict'

import * as fs from 'fs'
import { execSync } from 'child_process'
import _readline from 'readline'

const readline = _readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const log = console.log

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
    setupProjectStructure(projectName)
    createPackageJson(projectName)
    createTsConfig(projectName)
    createDockerfile(projectName)
    addToGitHubCIActions(projectName)
    addToRootTsConfigReferences(projectName)
  } catch (err) {
    cleanUpOnError(projectName)
    throw err
  }

  log(chalk.green(`> Project ${projectName} created successfully!`))
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
  fs.writeFileSync(`${JOB_BASE_PATH}/${projectName}/.env`, ``)
  fs.writeFileSync(`${JOB_BASE_PATH}/${projectName}/src/index.ts`, `console.log("Hello World")`)
}

function createPackageJson(projectName) {
  const packageJson = {
    name: projectName,
    main: './dist/index.js',
    scripts: {
      build: 'rm -rf dist && tsc',
      start: 'node dist',
      test: 'vitest run',
    },
    dependencies: {
      '@interop-be-reports/commons': '1.0.0',
    },
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
        include: ['src/**/*'],
      },
      null,
      2
    )
  )
}

function createDockerfile(projectName) {
  fs.writeFileSync(
    `${JOB_BASE_PATH}/${projectName}/Dockerfile`,
    [
      'FROM node:18.15.0-alpine',
      '',
      'WORKDIR /app',
      'COPY . .',
      '',
      'RUN npm install',
      'RUN npm run build',
    ].join('\n')
  )

  fs.writeFileSync(
    `${JOB_BASE_PATH}/${projectName}/.dockerignore`,
    'dist\nnode_modules\nREADME.md\n'
  )
}

function addToGitHubCIActions(projectName) {
  const githubCIActions = fs.readFileSync('./.github/workflows/ci.yml', 'utf8')
  const fileArray = githubCIActions.split('\n')
  const index = fileArray.findIndex((line) => line.includes('jobs: ['))
  for (let i = index + 1; i < fileArray.length; i++) {
    if (fileArray[i].includes(']')) {
      fileArray.splice(i, 0, `          ${projectName},`)
      break
    }
  }
  fs.writeFileSync('./.github/workflows/ci.yml', fileArray.join('\n'))
}

function addToRootTsConfigReferences(projectName) {
  const rootTsConfig = JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8'))
  rootTsConfig.references.push({ path: `${JOB_BASE_PATH}/${projectName}` })
  fs.writeFileSync('./tsconfig.json', JSON.stringify(rootTsConfig, null, 2))
}

function cleanUpOnError(projectName) {
  execSync(`rm -rf ${JOB_BASE_PATH}/${projectName}`)
}

readline.question('Insert job name\n> ', (name) => {
  readline.close()
  validateProjectName(name)
  createNewProject(name)
})
