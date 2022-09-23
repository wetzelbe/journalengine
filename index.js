const fs = require("fs")
const config = require("./config")

if (process.argv.length == 3) {
    config.input = process.argv[2]
}

console.log("Configuration is: ")
console.log(config)

function embed(template, post) {
    let toReturn = template.replace("{{post-content}}", post.content)
    toReturn = toReturn.replace("{{post-title}}", post.title)
    toReturn = toReturn.replace("{{post-url}}", post.url)
    let date = new Date(post.timestamp)
    let datestring = date.toDateString()
    toReturn = toReturn.replace("{{post-timestamp}}", datestring)
    return toReturn
}

function recursiveDirCheck(path, template) {
    let dir = fs.readdirSync(config.input + path)
    let new_template = template
    let posts = []
    let subposts = []
    if (dir.includes("template.html")) {
        new_template = fs.readFileSync(config.input + path + "/template.html").toString()
        console.log("Found Template: " + config.input + path + "/template.html")
    }
    dir.forEach(element => {
        let full_element_path = path + "/" + element
        if (fs.lstatSync(config.input + full_element_path).isDirectory()) {
            // create Directory in output directory
            console.log("Creating Directory " + config.output + full_element_path)
            fs.mkdirSync(config.output + full_element_path)
            // is Directory
            subposts = recursiveDirCheck(full_element_path, new_template)
        }
        else {
            // is File
            if (element !== "template.html" && element !== "index.html" && element !== "index_posts.html") {
                console.log("Processing file " + config.input + full_element_path)
                if (element.endsWith(".html.json")) {
                    // Embed Post in template
                    let post = fs.readFileSync(config.input + full_element_path).toString()
                    posts.push(JSON.parse(post))
                    let result = embed(template, JSON.parse(post))
                    fs.writeFileSync(config.output + full_element_path.replace(".html.json", ".html"), result)
                }
                else {
                    fs.cpSync(config.input + full_element_path, config.output + full_element_path)
                }
            }
        }
    })
    if (dir.includes("index_posts.html") && dir.includes("index.html"))
    {
        let index = fs.readFileSync(config.input + path + "/index.html").toString()
        let posts_template = fs.readFileSync(config.input + path + "/index_posts.html").toString()
        let endString = ""
        subposts.forEach(subpost => {
            endString = endString + embed(posts_template, subpost)
        })
        index = index.replace("{{posts}}", endString)
        fs.writeFileSync(config.output + path + "/index.html", index)
    }
    return posts
}

// empty output directory
fs.rmSync(config.output, {
    recursive: true,
    force: true
})

fs.mkdirSync(config.output)

recursiveDirCheck("")
