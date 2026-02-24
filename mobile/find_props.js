const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    let list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = dir + '/' + file;
        let stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');
const booleanProps = ['transparent', 'visible', 'horizontal', 'refreshing', 'autoFocus', 'secureTextEntry', 'editable', 'multiline', 'disabled', 'showsHorizontalScrollIndicator', 'showsVerticalScrollIndicator', 'pagingEnabled', 'scrollEnabled', 'nestedScrollEnabled'];
let outputLines = [];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    booleanProps.forEach(prop => {
        const matches = content.match(new RegExp(`\\b${prop}\\b`, 'g'));
        const equalsMatches = content.match(new RegExp(`\\b${prop}\\s*=`, 'g'));
        if (matches && (!equalsMatches || matches.length > equalsMatches.length)) {
            outputLines.push(`Possible shorthand for ${prop} in ${file}`);
        }
    });

    booleanProps.forEach(prop => {
        if (content.match(new RegExp(`\\b${prop}\\s*=\\s*["'](?:true|false)["']`, 'i'))) {
            outputLines.push(`String boolean for ${prop} in ${file}`);
        }
    });
});

fs.writeFileSync('node_results.txt', outputLines.join('\n'));
