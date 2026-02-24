const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default || require('@babel/traverse');

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
    try {
        const content = fs.readFileSync(file, 'utf8');
        const ast = parser.parse(content, {
            sourceType: "module",
            plugins: ["jsx", "typescript", "classProperties"]
        });

        traverse(ast, {
            JSXAttribute(pathNode) {
                const node = pathNode.node;
                const propName = node.name.name;
                if (!propName) return;

                // Check shorthand (value === null)
                if (node.value === null) {
                    outputLines.push(`SHORTHAND: <${pathNode.parent.name.name} ${propName}> in ${file} : line ${node.loc.start.line}`);
                }

                // Check StringLiteral value for known boolean props
                if (booleanProps.includes(propName)) {
                    if (node.value && node.value.type === 'StringLiteral') {
                        outputLines.push(`STRING_VALUE: <${pathNode.parent.name.name} ${propName}="${node.value.value}"> in ${file} : line ${node.loc.start.line}`);
                    }
                }
            }
        });
    } catch (err) {
        outputLines.push(`ERROR parsing ${file}: ${err.message}`);
    }
});

fs.writeFileSync('ast_results.txt', outputLines.join('\n'));
console.log('Done');
