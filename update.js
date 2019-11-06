/**
 * @file 自动生成目录
 * @author doomliu
 */
const fs = require('fs');
const path = require('path');

const asyncFs = {
    readdir: asyncify(fs.readdir),
    stat: asyncify(fs.stat)
};

const ARTICLE_NAME = './article';

update()
    .then(
        data => data,
        e => console.error(e)
    );

// 更新README.md中的目录
async function update() {
    const files = [ ];
    const tree = await buildDirTree(ARTICLE_NAME);
    traversalDirTree(tree, files);
    fs.writeFileSync('./README.md', `${getTitle(files)}${getContent(files)}`, );
}

// 构建目录树
async function buildDirTree(dir) {
    const stat = await asyncFs.stat(dir);
    // 如果是文件，直接返回
    if (stat.isFile()) {
        return {
            name: path.basename(dir, '.md'),
            type: 'file',
            dir: dir,
            children: null
        };
    }
    // 如果是目录，遍历其中文件
    const list = await asyncFs.readdir(dir);
    let children = [ ];
    for (let index in list) {
        const node = await buildDirTree(path.join(dir, list[index]));
        children.push(node);
    }
    children = sortByType(children);
    return {
        name: path.basename(dir),
        dir: dir,
        type: 'dir',
        children: children
    };
}

// 遍历目录树，将目录及文章按序放进list
function traversalDirTree(root, list) {
    const children = root.children;
    if (root.dir !== ARTICLE_NAME
        && (!(root.type === 'file') || path.extname(root.dir) === '.md')
    ) {
        list.push({
            ...root,
            deepLength: root.dir.split('/').length
        });
    }
    if (!children) {
        return;
    }
    for (let index in children) {
        traversalDirTree(children[index], list);
    }
}

// 目录放在前面，文件放后面
function sortByType(list) {
    const dirList = [];
    const fileList = [];
    list.forEach(item => {
        if (item.type === 'file') {
            fileList.push(item);
        }
        else {
            dirList.push(item);
        }
    });
    return [...dirList, ...fileList];
}

function getTitle(files) {
    const count = files.filter(file => file.type === 'file').length;
    return `## 博客\n目录（${count}）\n\n`;
}

function getContent(articles) {
    return articles
        .map(article => getContentItem(article))
        .join(`\n`)
        .toString()

    function getContentItem(article) {
        const tabCount = article.deepLength - 2;
        const prefix = new Array(Number(tabCount)).fill('\t').join('');
        return `${prefix}- [${article.name}](${article.dir})`;
    }
}

function asyncify(fn) {
    return function() {
        const args = arguments;
        return new Promise((resolve, reject) => {
            fn(...args, (err, data) => {
                if (err) {
                    reject(err)
                }
                else {
                    resolve(data)
                }
            })
        });
    }
}
