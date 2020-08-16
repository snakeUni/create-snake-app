#!/usr/bin/env node

const path = require('path')
const fs = require('fs-extra')
const argv = require('minimist')(process.argv.slice(2))
const chalk = require('chalk')
const ora = require('ora')

async function run() {
  const targetDir = argv._[0] || '.'
  const cwd = process.cwd()
  const root = path.join(cwd, targetDir)
  const renameFiles = {
    _gitignore: '.gitignore'
  }

  const spinner = ora(`Scaffolding project in ${root}...`).start()

  await fs.emptyDir(root)
  const existingDir = await fs.readdir(root)

  if (existingDir.length) {
    console.error(chalk.red(`Error: target directory is not empty.`))
    spinner.fail('Scaffolding project failed.')
    process.exit(1)
  }

  // template path
  const templateDir = path.join(
    __dirname,
    `template-${argv.t || argv.template || 'react'}`
  )

  const write = async (file, content) => {
    const renameFile = renameFiles[file]
    // if it is gitignore then rename
    const targetPath = renameFile
      ? path.join(root, renameFile)
      : path.join(root, file)

    if (content) {
      await fs.writeFile(targetPath, content)
    } else {
      await fs.copy(path.join(templateDir, file), targetPath)
    }
  }

  const files = await fs.readdir(templateDir)
  for (const file of files.filter(f => f !== 'package.json')) {
    await write(file)
  }

  const pkg = require(path.join(templateDir, 'package.json'))
  pkg.name = path.basename(root)
  await write('package.json', JSON.stringify(pkg, null, 2))

  spinner.succeed('Scaffolding project succeed.')

  console.log(`\nDone. Now run:\n`)

  if (root !== cwd) {
    console.log(`  cd ${path.relative(cwd, root)}`)
  }

  console.log(`  npm install (or \`yarn\`)`)
  console.log(`  npm run start (or \`yarn start\`)`)
  console.log()
}

run().catch(e => {
  console.error(e)
})
