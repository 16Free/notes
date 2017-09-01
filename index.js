const fs = require('fs')
const axios = require('axios')

const config = {
  owner: '16free',
  repository: 'notes',
  readmeFile: './README.md',
  readmeTemplate: './template.md'
}

const GITHUB_HOME = 'https://github.com'
const GITHUB_API = 'https://api.github.com'


function fetchIssues(owner, repository) {
  const url = [GITHUB_API, 'repos', owner, repository, `issues?creator=${owner}`].join('/')

  return axios.get(url)
    .then((res) => {
      return res.data.map((issue) => {
        return {
          number: issue.number,
          url: issue.url,
          title: issue.title,
          createdAt: issue.created_at,
          updatedAt: issue.updated_at,
          labels: issue.labels,
          milestone: issue.milestone
        }
      })
    })
}

function format(str, pairs) {
  const props = Object.keys(pairs)
  return props.reduce((str, prop) => {
    return str.replace(new RegExp('\\{\\{' + prop + '\\}\\}'), pairs[prop])
  }, str)
}

function checkCategory(categories, category) {
  let i, t
  for (i = 0; i < categories.length; i++) {
    t = categories[i]
    if (category.name === t.name)
      return 1
  }
  return 0
}

function pushCategories(categories, category) {
  category.forEach((t) => {
    if (!checkCategory(categories, t))
      categories.push(t)
  }, this);
}

fetchIssues(config.owner, config.repository).then((issues) => {
  let catalog = ''
  let now = new Date()
  let updatedAt = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
  let issueHome = `https://github.com/${config.owner}/${config.repository}/issues?q=is%3Aissue+is%3Aopen+label%3A`

  let categoryArr = []

  issues.forEach((issue) => {
    const date = issue.createdAt.slice(0, 10)
    const tags = issue.labels.map((label) => ` | [${label.name}](${issueHome}${label.name})`).join(' ')
    const url = [GITHUB_HOME, config.owner, config.repository, 'issues', issue.number].join('/')
    catalog += `[${date}] [${issue.title}](${url})${tags}\n\n`

    pushCategories(categoryArr, issue.labels)
  })

  const categories = categoryArr.map((label) => `[${label.name}](${issueHome}${label.name})`).join(' - ')

  const template = fs.readFileSync(config.readmeTemplate, 'utf-8')
  const readmeText = format(template, {
    catalog,
    updatedAt,
    categories
  })

  fs.writeFileSync(config.readmeFile, readmeText, 'utf-8')

  console.log('Finished!')
})