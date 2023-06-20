'use strict'

const fs = require('fs')
const { execSync } = require('child_process')

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
})

const log = console.log

const REGEX_PROJECT_NAME = /^[a-z0-9-]+$/
const MAX_PROJECT_NAME_LENGTH = 50
const MIN_PROJECT_NAME_LENGTH = 5
const DEPENDENCIES = ['chalk', 'dotenv', 'lodash', 'zod']
const DEV_DEPENDENCIES = [
  '@types/node',
  '@types/lodash',
  '@typescript-eslint/eslint-plugin',
  '@typescript-eslint/parser',
  'typescript',
  'eslint',
]

const chalk = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
}

function createNewProject(projectName) {
  log(`Creating new job named ${chalk.blue(projectName)}...\n`)

  try {
    setupProjectStructure(projectName)
    createPackageJson(projectName)
    createTsConfig(projectName)
    createESLintConfig(projectName)
    createDockerfile(projectName)
    appendNewProjectWorkspaceInPackageJson(projectName)
    installDefaultDependencies(projectName)
    addToGitHubCIActions(projectName)
  } catch (err) {
    log(chalk.red(`\nError: ${err.message}`))
    cleanUpOnError(projectName)
    process.exit(1)
  }

  log(chalk.green(`Project ${projectName} created successfully!\n`))
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
  fs.mkdirSync(`./${projectName}/src`, { recursive: true })
  fs.writeFileSync(`./${projectName}/src/index.ts`, `console.log("Hello World")`)
}

function createPackageJson(projectName) {
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    description: '',
    type: 'module',
    main: './dist/index.js',
    scripts: {
      build: 'rm -rf dist && tsc',
      start: 'node dist',
    },
    keywords: [],
    author: '',
    license: 'ISC',
  }
  fs.writeFileSync(`./${projectName}/package.json`, JSON.stringify(packageJson, null, 2))
}

function createTsConfig(projectName) {
  fs.writeFileSync(
    `./${projectName}/tsconfig.json`,
    JSON.stringify(
      {
        extends: '../tsconfig.base.json',
        include: ['src/**/*'],
        compilerOptions: {
          outDir: 'dist',
        },
      },
      null,
      2
    )
  )
}

function createESLintConfig(projectName) {
  fs.writeFileSync(
    `./${projectName}/.eslintrc`,
    JSON.stringify(
      {
        root: true,
        parser: '@typescript-eslint/parser',
        plugins: ['@typescript-eslint'],
        env: {
          node: true,
        },
        extends: [
          'eslint:recommended',
          'plugin:@typescript-eslint/eslint-recommended',
          'plugin:@typescript-eslint/recommended',
        ],
        rules: {
          '@typescript-eslint/no-unused-vars': [
            'warn',
            {
              argsIgnorePattern: '^_',
              varsIgnorePattern: '^_',
            },
          ],
        },
      },
      null,
      2
    )
  )
}

function createDockerfile(projectName) {
  fs.writeFileSync(
    `./${projectName}/Dockerfile`,
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

  fs.writeFileSync(`./${projectName}/.dockerignore`, 'dist\nnode_modules\nREADME.md\n')
}

function appendNewProjectWorkspaceInPackageJson(projectName) {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
  packageJson.workspaces.push(projectName)
  fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2))
}

function installDefaultDependencies(projectName) {
  log(chalk.yellow('Installing default dependencies...'))
  execSync(
    `cd ./${projectName} && npm install --package-lock-only --no-package-lock${DEPENDENCIES.join(
      ' '
    )}`
  )
  execSync(
    `cd ./${projectName} && npm install -D --package-lock-only --no-package-lock ${DEV_DEPENDENCIES.join(
      ' '
    )}`
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

function cleanUpOnError(projectName) {
  execSync(`rm -rf ./${projectName}`)
}

readline.question('Insert job name\n> ', (name) => {
  readline.close()
  validateProjectName(name)
  createNewProject(name)
})
