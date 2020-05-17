#!/usr/bin/env node

const fs = require('fs')
const chalk = require('chalk')
const inquirer = require('inquirer')
const shell = require('shelljs')
const path = require('path')

//Gettinf dirs
const TEMPLATES = fs.readdirSync(path.join(__dirname, 'templates'))
const render = require('./utils/templates').render

const QUESTIONS = [
	{
		name: 'template',
		type: 'list',
		message: 'what template do you want?',
		choices: TEMPLATES,
	},
	{
		name: 'project',
		type: 'input',
		message: `what's the project's name?`,
		validate: (input) => {
			if (/^([a-z@]{1}[a-z\-\.\\\/0-9]{0,213})+$/.test(input)) {
				return true
			}
			return `project's name only can have 213 characteres and start with @ or a-z`
		},
	},
]
const CURRENT_DIR = process.cwd()
inquirer.prompt(QUESTIONS).then((responses) => {
	const template = responses['template'],
		project = responses['project']
	const templatePath = path.join(__dirname, 'templates', template)
	const projectPath = path.join(CURRENT_DIR, project)
	createProject(projectPath)
	//
	createContent(templatePath, project)
	postProcess(templatePath, projectPath, project)
})

const createProject = (projectPath) => {
	if (fs.existsSync(projectPath)) {
		console.log(`there's already a folder with that name, please use another`)
		return false
	}
	return fs.mkdirSync(projectPath)
}

const createContent = (templatePath, projectName) => {
	const allFiles = fs.readdirSync(templatePath)

	allFiles.forEach((item) => {
		const originalPath = path.join(templatePath, item),
			stats = fs.statSync(originalPath),
			writePath = path.join(CURRENT_DIR, projectName, item)
		if (stats.isFile()) {
			let content = fs.readFileSync(originalPath, 'utf-8')
			content = render(content, { projectName })
			fs.writeFileSync(writePath, content, 'utf-8')
			//Info
			console.log(chalk.cyan(`create ${originalPath} (${stats.size} bytes)`))
		} else if (stats.isDirectory()) {
			fs.mkdirSync(writePath)
			createContent(path.join(templatePath, item), path.join(projectName, item))
		}
	})
}

const postProcess = async (templatePath, targetPath, projectName) => {
	const isNode = fs.existsSync(path.join(templatePath, 'package.json'))
	if (isNode) {
		shell.cd(targetPath)
		console.log(chalk.green(`...Installing dependencies in ${targetPath}`))
		const result = shell.exec('npm install')
		if (!result.code) {
			console.log(chalk.blue(`cd ${projectName} and happy coding`))
			return false
		}
	}
}
