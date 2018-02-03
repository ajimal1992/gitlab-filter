# Minimal NodeJS MVC stucture
## File Structure
    |-config
        |-config.js
    |-site
        |-js
            |-custom.js
            |-jquery-ui.min.js
            |-jquery.min.js
        |-css
            |-jquery-ui.css
            |-custom.css
        |-views
            |-home
                |-home.html
            |-error
                |-error_404.html
                |-error_failure.html
    |-package.json
    |-server.js

## Description
You could use this if you want to start a fresh NodeJS web application with MVC structure. There's minimal content in the web app. As such, add your own controllers on `server.js` and views on `views folder`. I have implemented error routing when an exception is thrown or unspecified route is requested. Send me a merge request if you want to add an improvement feature. However, do keep the feature at its minimal. Thank you.
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

       git clone https://github.com/ajimal1992/minimal-nodejs-mvc.git
3. Go to repo directory

       cd minimal-nodejs-mvc
4. Install dependencies

       npm install
5. Start server

       node server.js
6. Browse to - http://localhost:55555/

