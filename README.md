# Gitlab Filter app [STILL UNDER PROGRESS]
- [x] Data table to select repos
- [ ] Search for repos
- [ ] Search for commits for each repo
- [ ] ! Search feature
- [ ] Code cleanup
## File Structure
    |-config
        |-config.js
    |-site
    |-package.json
    |-server.js

## Description
This app accesses the GitLab API to filter repos and commits. The current version of  GitLab (v10.4.2) does not have a feature to filter repo commits by author. I needed to filter commits by author on my GitLab so I've cooked up a NodeJS app to filter repos and commits based on commit message and author. Some extra functions would be to have a `!` search.
#### Site Folder
Contains the web application's source codes. Consists of js, css and views folder
#### Config Folder
Contains all the configuration variables (filenames, etc.) for your web application
#### package.json
Node module dependencies
#### server.js
NodeJS server

## Installation
1. Install nodejs
    - Windows/Mac - https://nodejs.org/en/download/
    - Linux - https://www.ostechnix.com/install-node-js-linux/
2. Clone repo

       git clone https://github.com/ajimal1992/gitlab-filter.git
3. Go to repo directory

       cd gitlab-filter
4. Install dependencies

       npm install
5. Start server

       node server.js
6. Browse to - http://localhost:55555/

